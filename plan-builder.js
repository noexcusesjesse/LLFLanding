import {
  ACK_CHECKBOX,
  AGE_CHECKBOX,
  MARKETING_LABEL,
  NEXT_STEP,
  PLATE_COLUMNS,
  PRIVACY_NOTE,
} from './plan-builder-copy.js';
import {
  buildBlockReason,
  buildPlan,
  clockMinutes,
  downloadBlockReason,
  eatingWindow,
  formatTime,
  leadPayload,
  leadPayloadKeys,
  localTimestamp,
  planSubtitle,
  todayLabel,
} from './plan-builder-engine.js';
import { renderPlanPdf } from './plan-builder-pdf.js';

const $ = (id) => document.getElementById(id);
const ALLOWED_LEAD_KEYS = leadPayloadKeys();

function readEquipment() {
  return [...document.querySelectorAll('input[name="equipment"]:checked')].map((input) => input.value);
}

function readBuilder() {
  return {
    age18: $('age18').checked,
    age: $('age').value,
    goal: $('goal').value,
    level: $('level').value,
    days: $('days').value,
    steps: $('steps').value,
    weight: $('weight').value,
    sex: $('sex').value,
    heightFt: $('height-ft').value,
    heightIn: $('height-in').value,
    waist: $('waist').value,
    wake: $('wake').value,
    workStart: $('work-start').value,
    workEnd: $('work-end').value,
    bed: $('bed').value,
    eatStart: $('eat-start').value,
    equipment: readEquipment(),
  };
}

function setStatus(message, kind) {
  const className = kind === 'error' ? 'is-error' : kind === 'ok' ? 'is-ok' : '';
  ['status', 'build-status'].forEach((id) => {
    const status = $(id);
    status.textContent = message || '';
    status.className = className;
  });
}

function syncSubtitle() {
  $('plan-subtitle').textContent = planSubtitle($('days').value);
}

function syncToday() {
  $('today').textContent = todayLabel().label;
}

function syncWindow() {
  const preview = $('eat-preview');
  const windowPlan = eatingWindow($('eat-start').value);
  preview.textContent = windowPlan ? windowPlan.label : 'Eating window: optional';
}

let currentPlan = null;
let ackAt = null;
let sentKey = '';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderPlan(plan) {
  const out = $('plan-output');
  out.replaceChildren();
  const block = element('div', 'plan-block');
  block.append(
    element('h2', '', 'Your plan'),
    element('p', 'plan-note', plan.subtitle),
    element('p', '', `Goal: ${plan.goal}`),
  );
  if (plan.sex) block.append(element('p', '', `Sex: ${plan.sex}`));

  const goals = element('div', 'goal-grid');
  [
    [`${plan.stepLabel} steps`, 'Daily goal'],
    [`${plan.dayCount} days`, 'Strength per week'],
    [plan.waterLabel, plan.waterCaption],
    [`${plan.sleepHours} hrs`, `Sleep, lights out ${plan.lightsOut}`],
  ].forEach(([value, label]) => {
    const chip = element('div', 'goal-chip');
    chip.append(element('strong', '', value), element('span', '', label));
    goals.append(chip);
  });
  block.append(goals, element('p', 'plan-window', plan.eatingWindowLabel));

  block.append(element('h3', '', 'Body metrics'));
  if (plan.metrics.length) {
    const metrics = element('div', 'metric-grid');
    plan.metrics.forEach((metric) => {
      const chip = element('div', `metric-chip ${metric.tone}`);
      chip.append(
        element('span', '', metric.key),
        element('strong', '', metric.value),
        element('span', 'metric-label', metric.label),
        element('span', 'metric-status', metric.statusText),
      );
      metrics.append(chip);
    });
    block.append(metrics, element('p', 'plan-note', plan.screening));
  } else {
    block.append(element('p', 'plan-note', 'Add weight, height, and age to see BMI. Add waist and height to see waist-to-height ratio.'));
  }

  block.append(element('h3', '', 'Daily routine'));
  plan.schedule.forEach((row) => {
    const line = element('div', 'plan-row');
    line.append(element('div', `plan-time tone-${row.tone}`, row.time));
    const copy = element('div');
    copy.append(element('b', '', row.title), element('span', '', row.detail));
    line.append(copy);
    block.append(line);
  });

  block.append(element('h3', '', `Walking: ${plan.stepLabel} steps`));
  plan.walks.forEach((walk) => {
    const line = element('div', 'walk-row plan-row');
    line.append(element('div', 'eq-label', 'WALK'));
    line.append(element('div', 'plan-time tone-walk', walk.time));
    const copy = element('div');
    copy.append(element('b', '', walk.name), element('span', '', `${walk.stepLabel} steps, about ${walk.duration} min`));
    line.append(copy);
    block.append(line);
  });

  block.append(element('h3', '', 'Step ladder'));
  plan.ladder.forEach((level, index) => {
    const row = element('div', `ladder-row${level.current ? ' current' : ''}`);
    row.append(
      element('span', '', `Level ${index + 1}: ${level.steps.toLocaleString('en-US')}${index === 3 ? '+' : ''} steps`),
      element('span', '', level.current ? `${level.label} (your level)` : level.label),
    );
    block.append(row);
  });

  block.append(element('h3', '', plan.plateTitle));
  const plates = element('div', 'plate-grid');
  PLATE_COLUMNS.forEach((column) => {
    const card = element('div', 'plate-card');
    card.append(element('h3', '', column.title));
    const list = document.createElement('ul');
    column.items.forEach((item) => list.append(element('li', '', item)));
    card.append(list);
    plates.append(card);
  });
  block.append(plates);

  block.append(element('h3', '', `${plan.dayCount}-day workout (${plan.equipmentLabel})`));
  const days = element('div', 'day-grid');
  plan.days.forEach((day, index) => {
    const card = element('article', 'day-card');
    const heading = element('h3');
    heading.style.background = `rgb(${day.color.join(',')})`;
    heading.append(`Day ${index + 1}: ${day.name}`);
    heading.append(element('span', '', day.focus));
    card.append(heading);
    day.exercises.forEach((exercise, exerciseIndex) => {
      const row = element('div', 'ex-row');
      if (exercise.visual.type === 'photo') {
        const image = document.createElement('img');
        image.src = exercise.visual.src;
        image.alt = '';
        image.width = 112;
        image.height = 68;
        row.append(image);
      } else {
        row.append(element('div', 'eq-label', exercise.visual.text));
      }
      const copy = element('div');
      copy.append(element('b', '', `${exerciseIndex + 1}. ${exercise.name}`));
      copy.append(element('span', 'ex-detail', `${exercise.prescription} | ${exercise.equipment}`));
      row.append(copy);
      card.append(row);
    });
    days.append(card);
  });
  block.append(days);
  block.append(element('p', 'plan-note', 'Warm up 5 minutes before each workout. Rest 30-60 seconds between sets. Your PDF includes 12 four-week trackers and a blank copy. Educational information only, not medical advice.'));
  out.append(block);
}

function currentAckTime() {
  if (!$('ack').checked) return '';
  if (!ackAt) ackAt = localTimestamp(new Date());
  return ackAt;
}

async function loadLogo() {
  try {
    const response = await fetch('/assets/loadline-fitness-logo.jpg');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function buildFromForm() {
  const input = readBuilder();
  const reason = buildBlockReason({ age18: input.age18, age: input.age });
  if (reason) {
    currentPlan = null;
    $('plan-output').replaceChildren();
    setStatus(`Error: ${reason}`, 'error');
    return null;
  }
  const result = buildPlan({ ...input, age18: true });
  if (!result.ok) {
    currentPlan = null;
    $('plan-output').replaceChildren();
    setStatus(`Error: ${result.error}`, 'error');
    return null;
  }
  currentPlan = result.plan;
  renderPlan(result.plan);
  setStatus('Your plan is ready on this page. Enter your name and email when you want the PDF.', 'ok');
  return result.plan;
}

$('builder-form').addEventListener('submit', (event) => {
  event.preventDefault();
  buildFromForm();
});

$('days').addEventListener('change', syncSubtitle);
$('eat-start').addEventListener('input', syncWindow);
$('ack').addEventListener('change', () => {
  ackAt = $('ack').checked ? localTimestamp(new Date()) : null;
});

$('download-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const plan = buildFromForm();
  const reason = downloadBlockReason({
    age18: $('age18').checked,
    age: $('age').value,
    plan,
    name: $('first-name').value,
    email: $('email').value,
    ack: $('ack').checked,
    disclaimerAcknowledgedAt: currentAckTime(),
  });
  if (reason) {
    setStatus(`Error: ${reason}`, 'error');
    return;
  }

  const payload = leadPayload({
    name: $('first-name').value,
    email: $('email').value,
    marketingConsent: $('marketing').checked,
    disclaimerAcknowledgedAt: currentAckTime(),
  });
  const unexpected = Object.keys(payload).filter((key) => !ALLOWED_LEAD_KEYS.includes(key));
  if (unexpected.length) {
    setStatus('Error: The download was stopped before anything was sent.', 'error');
    return;
  }

  const button = $('download');
  button.disabled = true;
  const key = JSON.stringify(payload);
  try {
    if (sentKey !== key) {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      let result = {};
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) throw new Error(result.error || 'We could not save your details.');
      sentKey = key;
    }
    const doc = renderPlanPdf(plan, {
      name: payload.name,
      planDate: todayLabel(),
      logo: await loadLogo(),
    });
    const file = `LoadLine_Plan_${payload.name.replace(/[^\w]+/g, '_') || 'Plan'}.pdf`;
    doc.save(file);
    $('thanks').hidden = false;
    setStatus('Your free plan is downloading.', 'ok');
    $('thanks').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setStatus(`Error: ${error.message || 'The PDF was not downloaded.'}`, 'error');
  } finally {
    button.disabled = false;
  }
});

function visible(id) {
  return $(id).textContent.replace(/\s+/g, ' ').trim();
}

function assertCopyLocks() {
  if (!visible('age18-label').includes(AGE_CHECKBOX)) throw new Error('Age checkbox copy drifted.');
  if (!visible('ack-label').includes(ACK_CHECKBOX)) throw new Error('Disclaimer checkbox copy drifted.');
  if (!visible('marketing-label').includes(MARKETING_LABEL)) throw new Error('Marketing checkbox copy drifted.');
  if (visible('privacy-note') !== PRIVACY_NOTE) throw new Error('Privacy note drifted.');
  if ($('next-step-link').getAttribute('href') !== NEXT_STEP.url) throw new Error('Next step link drifted.');
}

const privacyPolicyLink = document.querySelector('#marketing-label a[href="/privacy"]');
if (privacyPolicyLink) {
  privacyPolicyLink.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

syncToday();
syncSubtitle();
syncWindow();
assertCopyLocks();
$('eat-preview').textContent = eatingWindow($('eat-start').value)?.label || 'Eating window: optional';

const sample = clockMinutes('08:00');
if (sample == null || formatTime(sample) !== '8:00 AM') {
  setStatus('Error: The schedule clock could not be started.', 'error');
}
