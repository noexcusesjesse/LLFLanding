/**
 * Printable plan. Layout of the disclaimer goes through layoutFlow so the
 * acknowledgment box cannot sit on top of the disclaimer text.
 */

import {
  DISCLAIMER,
  METRICS_READ,
  NEXT_STEP,
  PDF_ACK,
  PLATE_COLUMNS,
  PLATE_TITLE,
  SCREENING_LINE,
} from './plan-builder-copy.js';
import { layoutFlow } from './plan-builder-engine.js';

const NAVY = [11, 47, 99];
const GREEN = [22, 163, 74];
const GREEN_INK = [21, 128, 61];
const GRAY = [71, 85, 105];
const INK = [15, 23, 42];
const LIGHT = [243, 246, 250];
const WHITE = [255, 255, 255];
const PALE_GREEN = [220, 252, 231];
const PALE_AMBER = [255, 243, 205];
const LABEL_GRAY = [225, 232, 242];

const TONE = {
  walk: [22, 163, 74],
  meal: [180, 83, 9],
  recover: [37, 99, 235],
  work: [71, 85, 105],
};

function text(doc, value, x, y, size, bold, color, options) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(value, x, y, options);
}

function fill(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, h, 5, 5, 'F');
}

function header(doc, title, subtitle, logo) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 612, 86, 'F');
  text(doc, title, 30, 40, 22, true, WHITE);
  text(doc, subtitle, 30, 62, 10, false, GREEN);
  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', 430, 22, 152, 42);
      return;
    } catch {
      // The logo is optional. The wordmark below still identifies the plan.
    }
  }
  text(doc, 'LOADLINE', 582, 36, 14, true, WHITE, { align: 'right' });
  text(doc, 'FITNESS', 582, 52, 8, false, GREEN, { align: 'right' });
  text(doc, 'LOAD THE STANDARD. LIVE THE LIFE.', 582, 66, 7, false, [200, 210, 225], { align: 'right' });
}

function stampFooters(doc, disclaimerPage) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `Educational information only, not medical advice. Consult your physician before starting. See the disclaimer on page ${disclaimerPage}.`,
      306,
      780,
      { align: 'center' },
    );
    doc.text(`Page ${page} of ${total}`, 582, 780, { align: 'right' });
  }
}

function chipRow(doc, items, y, fillColor) {
  const width = Math.min(128, Math.floor(552 / items.length) - 8);
  const gap = (552 - width * items.length) / Math.max(items.length - 1, 1);
  items.forEach((item, index) => {
    const x = 30 + index * (width + gap);
    fill(doc, x, y, width, 52, fillColor);
    const value = doc.splitTextToSize(String(item.value), width - 12);
    const caption = doc.splitTextToSize(String(item.label), width - 12);
    text(doc, value[0], x + width / 2, y + 22, 12, true, NAVY, { align: 'center' });
    text(doc, caption.slice(0, 2), x + width / 2, y + 36, 7, false, GRAY, { align: 'center' });
  });
}

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawRoutine(doc, plan, name, planDate, logo) {
  header(doc, 'DAILY WELLNESS ROUTINE', `Prepared for ${name}  |  Goal: ${plan.goal}  |  ${planDate.label}`, logo);
  chipRow(doc, [
    { value: `${plan.stepLabel} steps`, label: 'Daily goal' },
    { value: `${plan.dayCount} days`, label: 'Strength per week' },
    { value: plan.waterLabel, label: plan.waterCaption },
    { value: `${plan.sleepHours} hrs`, label: `Lights out ${plan.lightsOut}` },
  ], 98, PALE_GREEN);
  plan.schedule.forEach((row, index) => {
    const y = 176 + index * 32;
    doc.setFillColor(...(index % 2 ? WHITE : LIGHT));
    doc.rect(30, y, 552, 32, 'F');
    doc.setFillColor(...TONE[row.tone]);
    doc.rect(30, y, 86, 32, 'F');
    text(doc, row.time, 73, y + 20, 9, true, WHITE, { align: 'center' });
    text(doc, row.title, 126, y + 13, 9, true, NAVY);
    text(doc, doc.splitTextToSize(row.detail, 440)[0], 126, y + 25, 8, false, GRAY);
  });
  const nutritionY = 176 + plan.schedule.length * 32 + 8;
  text(doc, 'NUTRITION FOCUS', 30, nutritionY, 10, true, NAVY);
  plan.nutrition.forEach((item, index) => {
    const x = 30 + (index % 3) * 188;
    const y = nutritionY + 8 + Math.floor(index / 3) * 28;
    fill(doc, x, y, 176, 24, PALE_GREEN);
    text(doc, doc.splitTextToSize(item, 164), x + 88, y + 15, 7.5, true, NAVY, { align: 'center' });
  });
}

function drawMetrics(doc, plan, name, logo) {
  doc.addPage();
  header(doc, 'BODY METRICS', `${SCREENING_LINE} Prepared for ${name}.`, logo);
  text(doc, plan.screening, 30, 104, 11, true, GREEN_INK);
  plan.metrics.forEach((metric, index) => {
    const y = 118 + index * 120;
    fill(doc, 30, y, 552, 108, LIGHT);
    doc.setFillColor(...hexToRgb(metric.color));
    doc.rect(30, y, 8, 108, 'F');
    text(doc, metric.key, 52, y + 22, 9, true, GRAY);
    text(doc, metric.value, 52, y + 58, 26, true, NAVY);
    text(doc, doc.splitTextToSize(metric.label, 300), 230, y + 28, 12, true, hexToRgb(metric.color));
    text(doc, metric.statusText, 230, y + 58, 9, true, INK);
    text(doc, doc.splitTextToSize(metric.note, 330), 230, y + 74, 8, false, INK);
  });
  const readY = 118 + plan.metrics.length * 120 + 12;
  fill(doc, 30, readY, 552, 150, PALE_AMBER);
  text(doc, 'HOW TO READ THESE NUMBERS', 42, readY + 20, 10, true, NAVY);
  text(doc, doc.splitTextToSize(METRICS_READ, 520), 42, readY + 38, 8.5, false, NAVY);
  if (plan.sex) text(doc, `Sex entered for this plan: ${plan.sex}`, 42, readY + 136, 9, false, INK);
}

function drawWalking(doc, plan, logo) {
  doc.addPage();
  header(doc, 'WALKING ROUTINE', `${plan.stepLabel} steps per day  |  Break it up. Short walks add up.`, logo);
  chipRow(doc, [
    { value: plan.stepLabel, label: 'Daily steps' },
    { value: `${plan.walkMinutes} min`, label: 'Total walking time' },
    { value: `${plan.distance} mi`, label: 'Approx distance' },
    { value: 'Easy', label: 'Conversational pace' },
  ], 98, [225, 240, 252]);
  text(doc, 'YOUR WALKING DAY', 30, 168, 10, true, NAVY);
  plan.walks.forEach((walk, index) => {
    const y = 176 + index * 42;
    doc.setFillColor(...(index % 2 ? WHITE : LIGHT));
    doc.rect(30, y, 552, 42, 'F');
    doc.setFillColor(...TONE.walk);
    doc.rect(30, y, 86, 42, 'F');
    text(doc, walk.time, 73, y + 25, 9, true, WHITE, { align: 'center' });
    doc.setFillColor(...LABEL_GRAY);
    doc.rect(124, y + 6, 52, 30, 'F');
    text(doc, 'WALK', 150, y + 25, 8, true, GRAY, { align: 'center' });
    text(doc, walk.name, 188, y + 18, 10, true, NAVY);
    text(doc, `${walk.stepLabel} steps  |  about ${walk.duration} min`, 188, y + 32, 8.5, false, GRAY);
  });
  text(doc, 'PROGRESSION LADDER (stay 2-4 weeks at each level)', 30, 400, 10, true, NAVY);
  plan.ladder.forEach((level, index) => {
    const y = 408 + index * 28;
    fill(doc, 30, y, 552, 24, level.current ? [187, 247, 208] : LIGHT);
    const steps = `${level.steps.toLocaleString('en-US')}${index === 3 ? '+' : ''} steps per day`;
    text(doc, `LEVEL ${index + 1}:  ${steps}`, 40, y + 16, 9, true, NAVY);
    text(doc, `${level.label}${level.current ? '   (your level)' : ''}`, 572, y + 16, 8, false, GRAY, { align: 'right' });
  });
  text(doc, PLATE_TITLE, 30, 532, 10, true, NAVY);
  PLATE_COLUMNS.forEach((column, index) => {
    const x = 30 + index * 188;
    const tone = index === 0 ? [220, 252, 231] : index === 1 ? [255, 237, 213] : [254, 249, 195];
    fill(doc, x, 544, 176, 150, tone);
    text(doc, column.title, x + 10, 564, 9, true, NAVY);
    column.items.forEach((item, itemIndex) => {
      text(doc, `${itemIndex ? '- ' : ''}${item}`, x + 10, 584 + itemIndex * 18, 8.5, itemIndex === 0, itemIndex ? GRAY : NAVY);
    });
  });
  text(doc, PLATE_TITLE, 306, 714, 9, true, NAVY, { align: 'center' });
}

function drawWorkout(doc, plan, day, index, logo) {
  doc.addPage();
  header(doc, `DAY ${index + 1}: ${day.name.toUpperCase()}`, `${day.focus}  |  ${plan.dayCount}-day plan`, logo);
  fill(doc, 30, 98, 552, 40, [254, 249, 195]);
  text(doc, '5 MIN WARM UP (before each workout)', 40, 114, 9.5, true, NAVY);
  text(doc, 'March in place, arm circles, bodyweight squats, torso twists, side steps: 1 minute each', 40, 128, 8, false, NAVY);
  day.exercises.forEach((exercise, exerciseIndex) => {
    const y = 148 + exerciseIndex * 86;
    doc.setFillColor(...(exerciseIndex % 2 ? WHITE : LIGHT));
    doc.rect(30, y, 552, 86, 'F');
    const visual = exercise.visual;
    if (visual.type === 'photo') {
      doc.addImage(visual.src, 'JPEG', 36, y + 8, 150, 70);
    } else {
      doc.setFillColor(...LABEL_GRAY);
      doc.rect(36, y + 8, 150, 70, 'F');
      const lines = doc.splitTextToSize(visual.text.toUpperCase(), 130);
      text(doc, lines, 111, y + 40, 9, true, GRAY, { align: 'center' });
    }
    doc.setFillColor(...day.color);
    doc.circle(208, y + 43, 12, 'F');
    text(doc, String(exerciseIndex + 1), 208, y + 47, 11, true, WHITE, { align: 'center' });
    text(doc, exercise.name, 232, y + 32, 12, true, NAVY);
    text(doc, exercise.prescription, 232, y + 50, 11, false, NAVY);
    text(doc, exercise.equipment, 232, y + 66, 9, false, GRAY);
  });
  const notes = [
    ['REST', '30-60 seconds between sets.', [254, 226, 226]],
    ['PROGRESSION', 'Add weight, reps, or sets over time.', [237, 231, 246]],
    ['SCHEDULE', `Train ${plan.dayCount} days per week, for example ${plan.scheduleExample}.`, [209, 250, 229]],
    ['EQUIPMENT', plan.equipmentLabel, PALE_AMBER],
  ];
  notes.forEach((note, noteIndex) => {
    const x = 30 + noteIndex * 140;
    fill(doc, x, 670, 132, 64, note[2]);
    text(doc, note[0], x + 8, 686, 8, true, NAVY);
    text(doc, doc.splitTextToSize(note[1], 116).slice(0, 3), x + 8, 700, 7.5, false, NAVY);
  });
}

function drawTracker(doc, plan, subtitle, blank, logo) {
  doc.addPage();
  header(doc, '4 WEEK TRACKER', subtitle, logo);
  const startLine = blank
    ? 'Start date: ________   Start weight: ______   Start waist: ______   End weight: ______   End waist: ______'
    : 'Start date: ________   Start weight: ______   Start waist: ______   End weight: ______   End waist: ______';
  text(doc, startLine, 30, 108, 9, false, NAVY);
  text(doc, 'Water targets are a general guideline.', 30, 122, 8, false, GRAY);
  const rows = blank
    ? ['Steps goal (______)', 'Workout done', 'Water goal (____ oz, general guideline)', plan.trackerRows[3]]
    : plan.trackerRows;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let week = 0; week < 4; week += 1) {
    const y0 = 132 + week * 150;
    doc.setFillColor(...NAVY);
    doc.rect(30, y0, 552, 20, 'F');
    text(doc, blank ? 'WEEK ____' : `WEEK ${week + 1}`, 38, y0 + 14, 9, true, WHITE);
    days.forEach((day, index) => text(doc, day, 250 + index * 46, y0 + 14, 8, true, WHITE, { align: 'center' }));
    rows.forEach((row, rowIndex) => {
      const y = y0 + 24 + rowIndex * 30;
      doc.setFillColor(...(rowIndex % 2 ? WHITE : LIGHT));
      doc.rect(30, y, 552, 30, 'F');
      text(doc, doc.splitTextToSize(row, 190)[0], 38, y + 19, 8, true, NAVY);
      days.forEach((day, index) => {
        doc.setDrawColor(...NAVY);
        doc.setLineWidth(1);
        doc.rect(238 + index * 46, y + 7, 14, 14, 'S');
      });
    });
  }
}

function disclaimerItems(doc) {
  const maxHeight = 746 - 112;
  const items = [];
  DISCLAIMER.forEach((section) => {
    const lines = doc.splitTextToSize(section.body, 552);
    const lineHeight = 10;
    let offset = 0;
    let first = true;
    while (offset < lines.length) {
      const titleHeight = 16;
      const capacity = Math.max(1, Math.floor((maxHeight - titleHeight - 10) / lineHeight));
      const slice = lines.slice(offset, offset + capacity);
      items.push({
        kind: 'section',
        title: first ? section.title : `${section.title} (continued)`,
        lines: slice,
        height: titleHeight + slice.length * lineHeight + 10,
      });
      offset += capacity;
      first = false;
    }
  });
  const ackLines = doc.splitTextToSize(PDF_ACK, 520);
  items.push({
    kind: 'ack',
    lines: ackLines,
    height: 28 + ackLines.length * 11 + 12,
  });
  const nextLines = doc.splitTextToSize(NEXT_STEP.body, 520);
  items.push({
    kind: 'next',
    lines: nextLines,
    height: 28 + nextLines.length * 11 + 12,
  });
  return items;
}

function drawDisclaimer(doc, logo) {
  const items = disclaimerItems(doc);
  const pages = layoutFlow(items, { startY: 112, bottom: 746 });
  pages.forEach((page) => {
    doc.addPage();
    header(doc, 'IMPORTANT DISCLAIMER', 'Educational information and important health notices. Please read before you begin.', logo);
    page.forEach((item) => {
      if (item.kind === 'section') {
        text(doc, item.title.toUpperCase(), 30, item.y, 9.5, true, NAVY);
        text(doc, item.lines, 30, item.y + 14, 8.3, false, INK);
        return;
      }
      const fillColor = item.kind === 'ack' ? PALE_AMBER : PALE_GREEN;
      fill(doc, 30, item.y, 552, item.height - 8, fillColor);
      text(doc, item.kind === 'ack' ? 'ACKNOWLEDGMENT' : 'NEXT STEP', 42, item.y + 16, 9.5, true, NAVY);
      text(doc, item.lines, 42, item.y + 32, 8.5, false, NAVY);
    });
  });
  return doc.getNumberOfPages() - pages.length + 1;
}

export function renderPlanPdf(plan, { name, planDate, logo, jsPDF, compress = true } = {}) {
  const ctor = jsPDF || globalThis.jspdf?.jsPDF;
  if (!ctor) throw new Error('PDF library is not loaded.');
  const doc = new ctor({ unit: 'pt', format: 'letter', compress });
  const safeName = String(name || 'You').replace(/\s+/g, ' ').trim().slice(0, 80) || 'You';
  drawRoutine(doc, plan, safeName, planDate, logo);
  if (plan.metrics.length) drawMetrics(doc, plan, safeName, logo);
  drawWalking(doc, plan, logo);
  plan.days.forEach((day, index) => drawWorkout(doc, plan, day, index, logo));
  for (let month = 0; month < 12; month += 1) {
    drawTracker(
      doc,
      plan,
      `Tracker ${month + 1} of 12  |  Weeks ${month * 4 + 1} to ${month * 4 + 4}  |  Check off each day`,
      false,
      logo,
    );
  }
  drawTracker(doc, plan, 'Blank copy: print or photocopy as many as you need', true, logo);
  const disclaimerPage = drawDisclaimer(doc, logo);
  stampFooters(doc, disclaimerPage);
  return doc;
}
