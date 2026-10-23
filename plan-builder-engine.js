/**
 * Client-side plan math for the LoadLine Plan Builder.
 * Nothing in this module sends data anywhere.
 */

import {
  NUTRITION_CHIPS,
  PLATE_TITLE,
  SCREENING_LINE,
  STEP_LADDER,
  TRACKER_HABIT,
  WALK_BREAK,
} from './plan-builder-copy.js';

export const EQUIPMENT_ORDER = ['d', 'k', 'b', 'w'];

export const EQUIPMENT_NAMES = {
  d: 'Dumbbells',
  k: 'Kettlebell',
  b: 'Bands/Tubes',
  w: 'Bodyweight',
};

export const METRIC_ORANGE = '#fbbf24';
export const METRIC_GREEN = '#22c55e';

export const WORKOUT_DAYS = [
  {
    name: 'Push Focus',
    focus: 'Chest, Shoulders, Triceps, Core',
    color: [198, 40, 40],
    slots: [
      ['Dumbbell Chest Press', 'Kettlebell Floor Press', 'Band Chest Press', 'Push-Ups'],
      ['Dumbbell Shoulder Press', 'Kettlebell Overhead Press', 'Band Overhead Press', 'Pike Push-Ups'],
      ['Dumbbell Floor Fly', 'Kettlebell Arnold Press', 'Band Chest Fly', 'Wide Push-Ups'],
      ['Dumbbell Lateral Raises', 'Kettlebell Halo', 'Band Lateral Raises', 'Plank Shoulder Taps'],
      ['Dumbbell Overhead Triceps Extension', 'Kettlebell Triceps Extension', 'Band Triceps Push Down', 'Chair Dips'],
      ['Plank', 'Kettlebell Plank Drag', 'Pallof Press', 'Plank'],
    ],
  },
  {
    name: 'Pull Focus',
    focus: 'Back, Biceps, Core',
    color: [21, 101, 192],
    slots: [
      ['One-Arm Dumbbell Row', 'Kettlebell Row', 'Band Row', 'Superman Pulls'],
      ['Dumbbell Deadlift', 'Kettlebell Deadlift', 'Band Good Morning', 'Bodyweight Good Morning'],
      ['Dumbbell Pullover', 'Kettlebell High Pull', 'Band Lat Pulldown', 'Prone Y Raises'],
      ['Dumbbell Rear Delt Fly', 'Kettlebell Renegade Row', 'Band Pull Aparts', 'Reverse Snow Angels'],
      ['Dumbbell Bicep Curls', 'Kettlebell Bicep Curl', 'Band Bicep Curls', 'Towel Isometric Curl'],
      ['Bird Dog', 'Kettlebell Swing', 'Band Core Rotation', 'Bird Dog'],
    ],
  },
  {
    name: 'Legs & Core',
    focus: 'Quads, Hamstrings, Glutes, Core',
    color: [46, 125, 50],
    slots: [
      ['Dumbbell Goblet Squat', 'Kettlebell Goblet Squat', 'Banded Squat', 'Bodyweight Squat'],
      ['Dumbbell Reverse Lunge', 'Kettlebell Reverse Lunge', 'Banded Reverse Lunge', 'Reverse Lunge'],
      ['Dumbbell Romanian Deadlift', 'Kettlebell Sumo Deadlift', 'Band Deadlift', 'Glute Bridge'],
      ['Dumbbell Step-Ups', 'Kettlebell Step-Up', 'Lateral Band Walk', 'Step-Ups'],
      ['Dumbbell Calf Raises', 'Kettlebell Glute Bridge', 'Banded Glute Bridge', 'Calf Raises'],
      ['Russian Twists', 'Kettlebell Russian Twist', 'Band Core Rotation', 'Dead Bug'],
    ],
  },
  {
    name: 'Full Body',
    focus: 'Total body, Conditioning, Core',
    color: [230, 115, 20],
    slots: [
      ['Dumbbell Thruster', 'Kettlebell Clean and Press', 'Band Squat to Press', 'Burpees'],
      ['Dumbbell Bent-Over Row', 'Kettlebell Swing', 'Band Row', 'Inchworm Walkouts'],
      ['Dumbbell Split Squat', 'Kettlebell Racked Split Squat', 'Band Split Squat', 'Split Squat'],
      ['Dumbbell Farmer Carry', 'Kettlebell Farmer Carry', 'Band Face Pulls', 'Bear Crawl'],
      ['Dumbbell Hammer Curl to Press', 'Kettlebell Bicep Curl', 'Band Bicep Curls', 'Mountain Climbers'],
      ['Plank', 'Kettlebell Russian Twist', 'Band Core Rotation', 'Plank'],
    ],
  },
];

const REP_OVERRIDES = {
  Burpees: '8-12',
  'Inchworm Walkouts': '8-10',
  'Dumbbell Farmer Carry': '30-40 sec',
  'Kettlebell Farmer Carry': '30-40 sec',
  'Bear Crawl': '20-30 sec',
  'Mountain Climbers': '30 sec',
  Plank: '30-60 sec',
  'Kettlebell Swing': '15-20',
  'Band Pull Aparts': '15-20',
  'Bird Dog': '10 each side',
  'Dead Bug': '10 each side',
  'Kettlebell Plank Drag': '10 each side',
  'Band Core Rotation': '12 each side',
  'Pallof Press': '12 each side',
  'Russian Twists': '15-20 total',
  'Kettlebell Russian Twist': '15-20 total',
  'Lateral Band Walk': '12 steps each side',
  'Dumbbell Calf Raises': '15-20',
  'Calf Raises': '15-20',
  'Towel Isometric Curl': '20-30 sec hold',
  'Plank Shoulder Taps': '20 total',
};

// TODO: Exercise and walking photos were omitted from the source draft.
// This repo has logos, banners, and app screenshots, not exercise demonstrations.
// Until real LoadLine photos are added, exercises use the gray equipment label.
export const EXERCISE_PHOTOS = {};

export function exerciseVisual(name, equipmentName) {
  const photo = EXERCISE_PHOTOS[name];
  if (photo) return { type: 'photo', src: photo, text: equipmentName };
  return { type: 'label', text: equipmentName };
}

export function planSubtitle(dayCount) {
  const days = Number(dayCount) === 4 ? 4 : 3;
  return `Your daily wellness routine and ${days}-day workout plan, ready to download as a PDF.`;
}

export function localDateISO(date = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatLocalDate(date = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('month')} ${get('day')}, ${get('year')}`;
}

export function todayLabel(date = new Date(), timeZone) {
  return {
    iso: localDateISO(date, timeZone),
    label: `Today: ${formatLocalDate(date, timeZone)}`,
  };
}

export function localTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function clockMinutes(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatTime(totalMinutes) {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440;
  let hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function norm(totalMinutes) {
  return ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
}

function round5(totalMinutes) {
  return Math.round(totalMinutes / 5) * 5;
}

export function waterOunces(weight) {
  const pounds = Number(weight);
  if (!Number.isFinite(pounds) || pounds <= 0) return 96;
  return Math.min(120, Math.max(64, Math.round(pounds / 2 / 4) * 4));
}

export function bmiCategory(bmi) {
  const outside = { tone: 'outside', color: METRIC_ORANGE, statusText: 'Outside the usual healthy range' };
  if (bmi < 18.5) {
    return { label: 'BMI category: Underweight (under 18.5)', ...outside };
  }
  if (bmi < 25) {
    return {
      label: 'BMI category: Healthy (18.5-24.9)',
      tone: 'healthy',
      color: METRIC_GREEN,
      statusText: 'Inside the usual healthy range',
    };
  }
  if (bmi < 30) return { label: 'BMI category: Overweight (25-29.9)', ...outside };
  return { label: 'BMI category: Obesity (30+)', ...outside };
}

export function waistCategory(ratio) {
  const shown = Number(ratio.toFixed(2));
  if (shown >= 0.5) {
    return {
      label: '0.50 or higher, worth discussing with your doctor.',
      tone: 'outside',
      color: METRIC_ORANGE,
      statusText: 'Outside the usual healthy range',
      shown,
    };
  }
  return {
    label: 'Under 0.50',
    tone: 'healthy',
    color: METRIC_GREEN,
    statusText: 'Inside the usual healthy range',
    shown,
  };
}

export function bodyMetrics({ weight, heightInches, age, waist }) {
  const metrics = [];
  const pounds = Number(weight);
  const inches = Number(heightInches);
  const years = Number(age);
  const waistInches = Number(waist);
  if (pounds > 0 && inches >= 36 && years >= 18) {
    const bmi = (703 * pounds) / (inches * inches);
    const category = bmiCategory(bmi);
    const low = Math.round((18.5 * inches * inches) / 703);
    const high = Math.round((24.9 * inches * inches) / 703);
    metrics.push({
      key: 'BMI',
      value: bmi.toFixed(1),
      ...category,
      note: `BMI is weight divided by height squared. The healthy range is 18.5 to 24.9, which for your height is about ${low} to ${high} lb. BMI does not separate muscle from fat.`,
    });
  }
  if (waistInches > 0 && inches >= 36) {
    const ratio = waistInches / inches;
    const category = waistCategory(ratio);
    metrics.push({
      key: 'Waist-to-height ratio',
      value: category.shown.toFixed(2),
      label: category.label,
      tone: category.tone,
      color: category.color,
      statusText: category.statusText,
      note: `Waist-to-height ratio with a ${waistInches} in waist. Under 0.50 is the mark used here. 0.50 or higher is worth discussing with your doctor.`,
    });
  }
  return metrics;
}

export function primaryEquipment(selected, dayIndex) {
  const have = EQUIPMENT_ORDER.filter((id) => selected.includes(id));
  const set = have.length ? have : ['w'];
  return set[dayIndex % set.length];
}

export function pickExercise(slot, primary) {
  const index = { d: 0, k: 1, b: 2, w: 3 }[primary];
  const name = slot[index];
  if (name && String(name).trim()) return { name: String(name).trim(), equipment: primary };
  const bodyweight = slot[3];
  return { name: bodyweight && String(bodyweight).trim() ? String(bodyweight).trim() : 'Bodyweight', equipment: 'w' };
}

function repText(name, equipment, goal) {
  if (REP_OVERRIDES[name]) return REP_OVERRIDES[name];
  const base = equipment === 'b' ? '12-15' : equipment === 'w' ? '10-15' : goal === 'build' ? '8-12' : '12-15';
  let suffix = '';
  if (/Lunge|Step-Up|Split Squat/.test(name)) suffix = ' each leg';
  else if (/Kettlebell (Floor|Overhead|Row|Renegade|Clean)|One-Arm/.test(name)) suffix = ' each side';
  return base + suffix;
}

function prescription(name, equipment, goal, sets) {
  const reps = repText(name, equipment, goal);
  const unit = /^[\d-]+$/.test(reps) ? ' reps' : '';
  return `${sets} sets x ${reps}${unit}`;
}

export function exercisesForDay(dayDef, primary, goal, level) {
  return dayDef.slots.map((slot, index) => {
    const picked = pickExercise(slot, primary);
    const sets = level === 'i' && index < 2 ? 4 : 3;
    return {
      name: picked.name,
      equipmentId: picked.equipment,
      equipment: EQUIPMENT_NAMES[picked.equipment],
      prescription: prescription(picked.name, picked.equipment, goal, sets),
      visual: exerciseVisual(picked.name, EQUIPMENT_NAMES[picked.equipment]),
    };
  });
}

function formatSteps(steps) {
  return String(steps).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function buildBlockReason({ age18, age }) {
  if (age18 !== true) return 'Check "I am 18 or older" to use this plan builder.';
  if (!(Number(age) >= 18)) return 'This plan builder is for ages 18 and over.';
  return null;
}

export function downloadBlockReason(state) {
  const ageReason = buildBlockReason(state);
  if (ageReason) return ageReason;
  if (!state.plan) return 'Build your plan first.';
  if (!String(state.name || '').trim()) return 'Enter your first name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(state.email || '').trim())) return 'Enter a valid email.';
  if (state.ack !== true || !state.disclaimerAcknowledgedAt) {
    return 'Read and acknowledge the disclaimer before you download.';
  }
  return null;
}

const LEAD_KEYS = ['name', 'email', 'marketingConsent', 'disclaimerAcknowledgedAt', 'age18Confirmed', 'source'];

export function leadPayload({ name, email, marketingConsent, disclaimerAcknowledgedAt }) {
  return {
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    marketingConsent: marketingConsent === true,
    disclaimerAcknowledgedAt,
    age18Confirmed: true,
    source: 'plan-builder',
  };
}

export function leadPayloadKeys() {
  return LEAD_KEYS.slice();
}

export function buildPlan(input) {
  const blocked = buildBlockReason({ age18: input.age18 === true, age: input.age });
  if (blocked) return { ok: false, error: blocked };

  const wake = clockMinutes(input.wake || '06:00');
  const workStart = clockMinutes(input.workStart || '08:00');
  const workEnd = clockMinutes(input.workEnd || '16:30');
  const bed = clockMinutes(input.bed || '22:00');
  if (wake == null || workStart == null || workEnd == null || bed == null) {
    return { ok: false, error: 'Enter wake, work, and bedtime.' };
  }

  const dayCount = Number(input.days) === 4 ? 4 : 3;
  const goal = input.goal === 'build' ? 'build' : 'tone';
  const level = input.level === 'i' ? 'i' : 'b';
  const steps = [6000, 8000, 10000, 12000].includes(Number(input.steps)) ? Number(input.steps) : 6000;
  const anchor = norm(round5(bed - 150));
  const length = workEnd >= workStart ? workEnd - workStart : workEnd + 1440 - workStart;
  const midMorning = norm(round5(workStart + length * 0.19));
  const lunch = norm(round5(workStart + length * 0.62));
  const afternoon = norm(round5(workStart + length * 0.82));
  const dinnerAt = norm(Math.min(Math.max(anchor - 60, workEnd + 80), anchor - 20));
  const eveningAt = anchor;
  const sleepHours = (((wake - bed) % 1440 + 1440) % 1440 / 60).toFixed(1).replace(/\.0$/, '');
  const water = waterOunces(input.weight);
  const heightInches = Number(input.heightFt) * 12 + Number(input.heightIn);
  const dinnerDetail = 'Lean protein, vegetables, fiber-rich carbs.';

  const schedule = [
    [wake, 'Wake up & hydrate', '16 oz water, light stretching or deep breathing, set your intention', 'recover'],
    [norm(wake + 15), 'Morning walk', '20-30 min walk outdoors or on a treadmill for energy and mood', 'walk'],
    [norm(wake + 50), 'Get ready', 'Shower, prep healthy meals or snacks, check your top 3 priorities', 'work'],
    [norm(wake + 80), 'Breakfast', 'High protein, nutrient-dense meal: eggs, Greek yogurt, or a protein shake', 'meal'],
    [workStart, 'Focus time: work starts', 'Start with your top priority, stay hydrated, use a sit-stand setup if possible', 'work'],
    [midMorning, '10 min walk break', 'Get up and move, stretch, reset your focus', 'walk'],
    [lunch, 'Nutritious lunch', 'Lean protein, vegetables, healthy carbs, then a short walk outside', 'meal'],
    [afternoon, '10 min walk break', WALK_BREAK, 'walk'],
    [workEnd, 'Work ends', 'Wrap up tasks, plan tomorrow, take a short walk to clear your mind', 'work'],
    [norm(workEnd + 30), 'Exercise', `Strength days (${dayCount} per week): 30-45 min workout. Other days: longer walk, bike, or activity`, 'walk'],
    [dinnerAt, 'Healthy dinner', dinnerDetail, 'meal'],
    [eveningAt, 'Evening walk', '20-30 min easy walk to aid digestion, lower stress, and support sleep', 'walk'],
    [norm(bed - 60), 'Wind down', 'Minimal screens, read or meditate, keep your bedroom cool, dark, and quiet', 'recover'],
    [bed, 'Lights out', `Target ${sleepHours} hours of sleep and stay consistent, even on weekends`, 'recover'],
  ]
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row[0] - b.row[0] || a.index - b.index)
    .map(({ row }) => ({
      minutes: row[0],
      time: formatTime(row[0]),
      title: row[1],
      detail: row[2],
      tone: row[3],
    }));

  const shares = [
    ['Morning walk', norm(wake + 15), 0.25],
    ['Mid-morning break', midMorning, 0.15],
    ['Lunch walk', norm(lunch + 20), 0.25],
    ['Afternoon break', afternoon, 0.15],
    ['Evening walk', eveningAt, 0.2],
  ];
  const walks = shares.map(([name, minutes, share]) => {
    const walkSteps = Math.round((steps * share) / 50) * 50;
    return {
      name,
      minutes,
      time: formatTime(minutes),
      steps: walkSteps,
      stepLabel: formatSteps(walkSteps),
      duration: Math.round(walkSteps / 115),
    };
  });

  const selected = EQUIPMENT_ORDER.filter((id) => (input.equipment || []).includes(id));
  const days = WORKOUT_DAYS.slice(0, dayCount).map((dayDef, dayIndex) => {
    const primary = primaryEquipment(selected, dayIndex);
    return {
      name: dayDef.name,
      focus: dayDef.focus,
      color: dayDef.color,
      primary,
      equipment: EQUIPMENT_NAMES[primary],
      exercises: exercisesForDay(dayDef, primary, goal, level),
    };
  });

  const sex = input.sex === 'f' ? 'Female' : input.sex === 'm' ? 'Male' : '';
  const metrics = bodyMetrics({
    weight: input.weight,
    heightInches,
    age: input.age,
    waist: input.waist,
  });
  const equipmentLabel = `${(selected.length ? selected : ['w']).map((id) => EQUIPMENT_NAMES[id]).join(', ')} + Walking`;

  return {
    ok: true,
    plan: {
      dayCount,
      subtitle: planSubtitle(dayCount),
      goal: goal === 'build' ? 'Build strength' : 'Build a routine',
      goalId: goal,
      level,
      steps,
      stepLabel: formatSteps(steps),
      water,
      waterLabel: `${water} oz`,
      waterCaption: 'Water per day (general guideline)',
      sleepHours,
      lightsOut: formatTime(bed),
      schedule,
      walks,
      walkMinutes: walks.reduce((sum, walk) => sum + walk.duration, 0),
      distance: (steps / 2200).toFixed(1),
      days,
      equipmentLabel,
      metrics,
      screening: SCREENING_LINE,
      sex,
      nutrition: [...NUTRITION_CHIPS],
      plateTitle: PLATE_TITLE,
      ladder: STEP_LADDER.map(([count, text]) => ({
        steps: count,
        label: text,
        current: count === steps,
      })),
      trackerRows: [
        `Steps goal (${formatSteps(steps)})`,
        'Workout done',
        `Water goal (${water} oz, general guideline)`,
        TRACKER_HABIT,
      ],
      scheduleExample: dayCount === 4 ? 'Mon, Tue, Thu, Fri' : 'Mon, Wed, Fri',
    },
  };
}

export function layoutFlow(items, { startY = 112, bottom = 746 } = {}) {
  const pages = [];
  let page = [];
  let y = startY;
  items.forEach((item) => {
    if (page.length && y + item.height > bottom) {
      pages.push(page);
      page = [];
      y = startY;
    }
    page.push({ ...item, y });
    y += item.height;
  });
  if (page.length) pages.push(page);
  return pages;
}

export function flowsOverlap(pages) {
  return pages.some((page) => page.some((item, index) => {
    if (index === 0) return false;
    const previous = page[index - 1];
    return item.y < previous.y + previous.height - 0.01;
  }));
}
