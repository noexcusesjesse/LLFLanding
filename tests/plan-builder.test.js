import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import vm from 'node:vm';
import { DISCLAIMER, NEXT_STEP, PDF_ACK, PLATE_TITLE, SCREENING_LINE, WALK_BREAK } from '../plan-builder-copy.js';
import {
  bmiCategory,
  buildPlan,
  downloadBlockReason,
  eatingWindow,
  exercisesForDay,
  flowsOverlap,
  layoutFlow,
  leadPayload,
  leadPayloadKeys,
  localDateISO,
  localTimestamp,
  pickExercise,
  planSubtitle,
  primaryEquipment,
  todayLabel,
  waterOunces,
  waistCategory,
  WORKOUT_DAYS,
} from '../plan-builder-engine.js';
import { renderPlanPdf } from '../plan-builder-pdf.js';
import { PLAN_BUILDER_LEAD_KEYS, planBuilderLeadError, planBuilderLeadRecord } from '../lib/plan-builder-lead.js';

const root = new URL('..', import.meta.url);

function read(name) {
  return readFileSync(new URL(name, root), 'utf8');
}

function decode(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function sample(overrides = {}) {
  return {
    age18: true,
    age: 35,
    goal: 'tone',
    level: 'b',
    days: 3,
    steps: 10000,
    weight: 180,
    sex: 'f',
    heightFt: 5,
    heightIn: 6,
    waist: 32,
    wake: '06:00',
    workStart: '08:00',
    workEnd: '16:30',
    bed: '22:00',
    eatStart: '08:00',
    equipment: ['d', 'k', 'b', 'w'],
    ...overrides,
  };
}

function plan(overrides) {
  const result = buildPlan(sample(overrides));
  assert.equal(result.ok, true, result.error);
  return result.plan;
}

const ackTime = '2026-10-15T21:15:00-07:00';

function validLead(overrides = {}) {
  return {
    name: 'Ada',
    email: 'ada@example.com',
    marketingConsent: false,
    disclaimerAcknowledgedAt: ackTime,
    age18Confirmed: true,
    source: 'plan-builder',
    ...overrides,
  };
}

describe('plan builder copy and age gate', () => {
  test('header day count follows the selection', () => {
    assert.equal(planSubtitle(3), 'Your daily wellness routine and 3-day workout plan, ready to download as a PDF.');
    assert.equal(planSubtitle(4), 'Your daily wellness routine and 4-day workout plan, ready to download as a PDF.');
    assert.equal(plan({ days: 4 }).dayCount, 4);
    assert.match(plan({ days: 4 }).subtitle, /4-day/);
  });

  test('today uses a local calendar day, not the UTC date', () => {
    const date = new Date('2026-10-16T03:30:00.000Z');
    assert.equal(date.toISOString().slice(0, 10), '2026-10-16');
    assert.equal(localDateISO(date, 'America/Phoenix'), '2026-10-15');
    assert.equal(todayLabel(date, 'America/Phoenix').label, 'Today: October 15, 2026');
    const local = new Date(2026, 9, 15, 23, 30, 45);
    assert.equal(localTimestamp(local).slice(0, 19), '2026-10-15T23:30:45');
    assert.match(localTimestamp(local), /[+-]\d{2}:\d{2}$/);
  });

  test('ages under 18 are blocked and there is no teen BMI branch', () => {
    const blocked = buildPlan(sample({ age: 16 }));
    assert.equal(blocked.ok, false);
    assert.match(blocked.error, /18 and over/);
    assert.equal(buildPlan(sample({ age18: false, age: 40 })).ok, false);
    assert.doesNotMatch(blocked.error, /pediatric|percentile|teen/i);
  });

  test('reed copy replacements are in the plan', () => {
    const built = plan();
    const text = JSON.stringify(built);
    assert.equal(built.ladder[2].label, 'Build more daily movement.');
    assert.equal(built.plateTitle, PLATE_TITLE);
    assert.equal(WALK_BREAK, 'Walk, stretch or take the stairs to break up sitting and reset your energy.');
    assert.ok(built.schedule.some((row) => row.detail === WALK_BREAK));
    assert.equal(built.eatingWindowLabel, 'Eating window: 8:00 AM-6:00 PM (14:10)');
    assert.match(built.schedule.find((row) => row.title === 'Healthy dinner').detail, /Eating window: 8:00 AM-6:00 PM \(14:10\)/);
    assert.equal(built.nutrition[3], 'Less added sugar.');
    assert.match(built.waterCaption, /general guideline/);
    assert.equal(built.trackerRows[3], 'Ate within my window.');
    assert.equal(built.screening, SCREENING_LINE);
    assert.doesNotMatch(text, /fasting|kitchen|blood sugar and energy|Obese range|Gallagher|DEXA|visceral|\$\d|Solo/i);
  });

  test('eating window is optional and ends 10 hours after the start', () => {
    assert.equal(eatingWindow(''), null);
    assert.equal(plan({ eatStart: '' }).eatingWindowLabel, 'Eating window: optional');
    assert.equal(eatingWindow('20:00').label, 'Eating window: 8:00 PM-6:00 AM (14:10)');
    assert.doesNotMatch(plan({ eatStart: '' }).schedule.find((row) => row.title === 'Healthy dinner').detail, /Kitchen|closes/i);
  });
});

describe('metrics', () => {
  test('BMI uses the CDC labels, orange outside 18.5-24.9, and no red', () => {
    assert.equal(bmiCategory(18.4).label, 'BMI category: Underweight (under 18.5)');
    assert.equal(bmiCategory(18.5).label, 'BMI category: Healthy (18.5-24.9)');
    assert.equal(bmiCategory(24.9).label, 'BMI category: Healthy (18.5-24.9)');
    assert.equal(bmiCategory(25).label, 'BMI category: Overweight (25-29.9)');
    assert.equal(bmiCategory(29.9).label, 'BMI category: Overweight (25-29.9)');
    assert.equal(bmiCategory(30).label, 'BMI category: Obesity (30+)');
    assert.equal(bmiCategory(18.4).color, '#fbbf24');
    assert.equal(bmiCategory(22).color, '#22c55e');
    assert.equal(bmiCategory(31).tone, 'outside');
    assert.notEqual(bmiCategory(31).color.toLowerCase(), '#c62828');
    const built = plan();
    const bmi = built.metrics.find((metric) => metric.key === 'BMI');
    assert.equal(bmi.label, 'BMI category: Overweight (25-29.9)');
    assert.equal(bmi.tone, 'outside');
    assert.match(bmi.statusText, /Outside/);
  });

  test('waist-to-height ratio has no sex cutoff', () => {
    assert.equal(waistCategory(0.49).label, 'Under 0.50');
    assert.equal(waistCategory(0.5).label, '0.50 or higher, worth discussing with your doctor.');
    const high = plan({ waist: 34 }).metrics.find((metric) => metric.key === 'Waist-to-height ratio');
    assert.equal(high.label, '0.50 or higher, worth discussing with your doctor.');
    assert.equal(high.tone, 'outside');
    assert.doesNotMatch(high.note, /40 in|35 in|men|women/);
    const low = plan().metrics.find((metric) => metric.key === 'Waist-to-height ratio');
    assert.equal(low.label, 'Under 0.50');
    assert.equal(plan().screening, SCREENING_LINE);
  });

  test('water target stays inside 64 to 120 oz and is a general guideline', () => {
    assert.equal(waterOunces(100), 64);
    assert.equal(waterOunces(400), 120);
    assert.equal(waterOunces(''), 96);
    assert.match(plan().waterCaption, /general guideline/);
  });
});

describe('workouts', () => {
  test('each day keeps one primary equipment type', () => {
    const days = plan().days;
    assert.deepEqual(days.map((day) => day.primary), ['d', 'k', 'b']);
    days.forEach((day) => {
      assert.ok(day.exercises.every((exercise) => exercise.equipmentId === day.primary));
    });
    const four = plan({ days: 4, equipment: ['k', 'w'] }).days;
    assert.deepEqual(four.map((day) => day.primary), ['k', 'w', 'k', 'w']);
    four.forEach((day) => {
      assert.ok(day.exercises.every((exercise) => exercise.equipmentId === day.primary));
    });
  });

  test('a missing equipment name falls back to bodyweight for that exercise', () => {
    const picked = pickExercise(['', 'Kettlebell Row', 'Band Row', 'Superman Pulls'], 'd');
    assert.deepEqual(picked, { name: 'Superman Pulls', equipment: 'w' });
    const day = exercisesForDay({
      slots: [['', 'Kettlebell Row', 'Band Row', 'Superman Pulls']],
    }, 'd', 'tone', 'b');
    assert.equal(day[0].equipmentId, 'w');
    assert.equal(day[0].visual.type, 'label');
    assert.equal(day[0].visual.text, 'Bodyweight');
    assert.equal(primaryEquipment([], 2), 'w');
  });

  test('real exercises without photos use the gray equipment label', () => {
    const visual = plan().days[0].exercises[0].visual;
    assert.equal(visual.type, 'label');
    assert.equal(visual.text, 'Dumbbells');
    assert.equal(WORKOUT_DAYS[0].slots.length, 6);
  });
});

describe('lead capture', () => {
  test('the payload is only the six allowed fields and marketing is optional', () => {
    assert.deepEqual(leadPayloadKeys(), PLAN_BUILDER_LEAD_KEYS);
    const payload = leadPayload({
      name: ' Ada ',
      email: 'ada@example.com',
      marketingConsent: false,
      disclaimerAcknowledgedAt: ackTime,
      weight: 180,
      height: 66,
      age: 35,
      sex: 'f',
      waist: 32,
      schedule: 'secret',
    });
    assert.deepEqual(payload, validLead());
    assert.equal(JSON.stringify(payload).includes('180'), false);
    assert.equal(downloadBlockReason({
      age18: true,
      age: 35,
      plan: { dayCount: 3 },
      name: 'Ada',
      email: 'ada@example.com',
      ack: true,
      disclaimerAcknowledgedAt: ackTime,
      marketingConsent: false,
    }), null);
    assert.match(downloadBlockReason({
      age18: true,
      age: 35,
      plan: { dayCount: 3 },
      name: 'Ada',
      email: 'ada@example.com',
      ack: false,
      disclaimerAcknowledgedAt: '',
    }), /disclaimer/i);
  });

  test('the server rejects body metrics and stores the timestamp', () => {
    assert.equal(planBuilderLeadError(validLead()), null);
    assert.match(planBuilderLeadError(validLead({ weight: 180 })), /name, email, and consent/);
    assert.match(planBuilderLeadError(validLead({ age18Confirmed: false })), /18/);
    assert.match(planBuilderLeadError(validLead({ marketingConsent: 'yes' })), /Marketing/);
    const record = planBuilderLeadRecord(validLead({ marketingConsent: true }));
    assert.equal(record.type, 'plan-builder');
    assert.equal(record.phone, null);
    assert.equal(record.message, [
      'Source: plan-builder',
      'Marketing consent: yes',
      '18 or older: yes',
      `Disclaimer acknowledged: ${ackTime}`,
    ].join('\n'));
    assert.doesNotMatch(record.message, /180|waist|schedule/i);
  });
});

describe('disclaimer pagination', () => {
  test('the acknowledgment box moves to the next page instead of overlapping', () => {
    const pages = layoutFlow([
      { id: 'section', height: 600 },
      { id: 'ack', height: 88 },
      { id: 'next', height: 72 },
    ], { startY: 112, bottom: 746 });
    assert.equal(flowsOverlap(pages), false);
    assert.equal(pages.at(-1).some((item) => item.id === 'next'), true);
    const ack = pages.flat().find((item) => item.id === 'ack');
    const section = pages.flat().find((item) => item.id === 'section');
    assert.ok(ack.y >= section.y + section.height || pages.findIndex((page) => page.includes(ack)) > pages.findIndex((page) => page.includes(section)));
  });
});

describe('page source', () => {
  const html = decode(read('plan-builder.html'));
  const sources = [
    'plan-builder.html',
    'plan-builder.js',
    'plan-builder.css',
    'plan-builder-engine.js',
    'plan-builder-pdf.js',
    'plan-builder-copy.js',
    'lib/plan-builder-lead.js',
  ].map(read).join('\n');

  test('the full disclaimer on the page matches the PDF copy', () => {
    assert.equal(DISCLAIMER.length, 8);
    DISCLAIMER.forEach((section) => {
      assert.ok(html.includes(section.title), section.title);
      assert.ok(html.includes(section.body), section.body.slice(0, 40));
    });
    assert.match(html, /meal-timing change/);
    assert.match(html, /pregnant or nursing, or recently gave birth/);
    assert.match(html, /Call 911 for chest pain or pressure, fainting, confusion, or severe shortness of breath/);
    assert.match(html, /In heat, walk early or indoors/);
    assert.match(html, /To the fullest extent allowed by law/);
    assert.match(PDF_ACK, /does not ask for a signature/);
    assert.doesNotMatch(PDF_ACK, /Signature:/);
    assert.doesNotMatch(sources, /fasting/i);
    assert.doesNotMatch(sources, /\$85|LoadLine Solo|\bSolo\b/);
  });

  test('form labels, the optional marketing box, and the privacy TODO', () => {
    const ids = [...read('plan-builder.html').matchAll(/<(?:input|select)\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(ids.length > 10);
    ids.forEach((id) => assert.match(read('plan-builder.html'), new RegExp(`for="${id}"`), id));
    assert.match(html, /I am 18 or older/);
    assert.match(read('plan-builder.html'), /id="age"[\s\S]*?min="18"/);
    assert.match(read('plan-builder.html'), /id="marketing" name="marketing" type="checkbox"/);
    assert.doesNotMatch(read('plan-builder.html'), /id="marketing"[^>]*required/);
    assert.match(html, /Marketing email is optional/);
    assert.match(html, /See our Privacy Policy/);
    assert.match(read('plan-builder.html'), /TODO: No privacy policy page exists/);
    assert.equal(html.includes('https://noexcuseschallenges.com'), true);
    assert.match(read('plan-builder.js'), /addEventListener\('change', syncSubtitle\)/);
    assert.doesNotMatch(sources, /toISOString|localStorage|claude\.use/);
  });
});

describe('pdf', () => {
  test('the free PDF contains the disclaimer, the day count, and no signature line', () => {
    const code = read('vendor/jspdf.umd.min.js');
    const sandbox = {
      console,
      atob: (value) => Buffer.from(value, 'base64').toString('binary'),
      btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.navigator = { userAgent: 'node' };
    sandbox.document = { createElement: () => ({ style: {} }) };
    vm.runInNewContext(code, sandbox, { filename: 'jspdf.umd.min.js' });
    const built = plan({ days: 4 });
    const doc = renderPlanPdf(built, {
      name: 'Ada',
      planDate: todayLabel(new Date('2026-10-16T03:30:00.000Z'), 'America/Phoenix'),
      jsPDF: sandbox.jspdf.jsPDF,
      compress: false,
    });
    const output = doc.output();
    assert.ok(doc.getNumberOfPages() >= 21);
    assert.match(output, /4-day plan/);
    assert.match(output, /meal-timing change/);
    assert.match(output, /Call 911 for chest pain or pressure/);
    assert.match(output, /Screening estimate, not a diagnosis/);
    assert.match(output, /Ate within my window/);
    assert.match(output, /Build more daily movement/);
    assert.match(output, /noexcuseschallenges\.com/);
    assert.match(output, /DUMBBELLS/);
    assert.doesNotMatch(output, /Signature:/);
    assert.doesNotMatch(output, /fasting|LoadLine Solo|\$85|Kitchen closes|Obese range/i);
    assert.match(output, /Today: October 15, 2026|October 15, 2026/);
  });
});
