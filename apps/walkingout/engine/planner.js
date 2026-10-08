/**
 * Pure routine engine. Port of RoutinePlanner.swift — no storage, no clock
 * unless the caller passes one.
 */

import { dateForMinutes, keyFor, minutesSinceStart, startOfDay, weekdayOf } from './calendar.js';
import {
  Slot,
  cloneWalk,
  displayName,
  endTime,
  isPinned,
  RoutineProblem,
} from './models.js';

export const STEPS_PER_MINUTE = 100;
export const MAX_WALK_MINUTES = 30;
export const DEFAULT_AMBIENT = 3000;
export const BED_BUFFER = 30;
export const STEP_BUFFER = 5;
export const DONE_SHARE = 0.6;
export const SNAP = 5;

const numberFormat = new Intl.NumberFormat('en-US');

export function formatNumber(value) {
  return numberFormat.format(value);
}

export function timeLabel(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function lengthLabel(minutes) {
  return `${minutes} min`;
}

export function normalizedClock(minutes) {
  return ((minutes % 1440) + 1440) % 1440;
}

export function snapped(minutes) {
  return Math.trunc(Math.round(minutes / SNAP)) * SNAP;
}

export function roundedUp(minutes) {
  return Math.trunc(Math.ceil(minutes / SNAP)) * SNAP;
}

export function activeRules(rules, weekday, key) {
  return rules
    .filter((rule) => rule.weekday === weekday && rule.effectiveFrom <= key)
    .sort((a, b) => {
      if (a.effectiveFrom !== b.effectiveFrom) return a.effectiveFrom < b.effectiveFrom ? -1 : 1;
      if (a.createdAt === b.createdAt) return 0;
      return a.createdAt < b.createdAt ? -1 : 1;
    });
}

export function scheduleFor(date, template, rules, dayOverride) {
  const key = keyFor(date);
  const weekday = weekdayOf(date);
  let layer = {
    wakeTime: null, bedTime: null, workStart: null, workEnd: null, dayOff: null,
    lunchStart: null, lunchMinutes: null, takesLunch: null, breaks: null,
  };
  for (const rule of activeRules(rules, weekday, key)) {
    layer = mergeLayer(rule.overrides, layer);
  }
  if (dayOverride) layer = mergeLayer(dayOverride, layer);

  const wake = layer.wakeTime ?? template.wakeTime;
  const local = (minutes) => (minutes < wake ? minutes + 1440 : minutes);

  let bed = local(layer.bedTime ?? template.bedTime);
  if (bed <= wake) bed += 1440;

  const usuallyWorks = template.workDays.includes(weekday);
  const isOff = layer.dayOff ?? !usuallyWorks;
  const isWorkDay = template.hasSetHours && !isOff;

  const workStart = local(layer.workStart ?? template.workStart);
  let workEnd = local(layer.workEnd ?? template.workEnd);
  if (workEnd <= workStart) workEnd += 1440;

  const takesLunch = layer.takesLunch ?? template.takesLunch;
  const lunch = isWorkDay && takesLunch
    ? {
      start: local(layer.lunchStart ?? template.lunchStart),
      minutes: Math.max(10, layer.lunchMinutes ?? template.lunchMinutes),
    }
    : null;
  const breaks = isWorkDay
    ? (layer.breaks ?? template.breaks)
      .map((item) => ({ start: local(item.start), minutes: Math.max(5, item.minutes) }))
      .sort((a, b) => a.start - b.start)
    : [];

  return {
    date: startOfDay(date),
    key,
    weekday,
    wake,
    bed,
    hasSetHours: template.hasSetHours,
    isWorkDay,
    workStart,
    workEnd,
    lunch,
    breaks,
  };
}

function mergeLayer(over, base) {
  return {
    wakeTime: over.wakeTime ?? base.wakeTime,
    bedTime: over.bedTime ?? base.bedTime,
    workStart: over.workStart ?? base.workStart,
    workEnd: over.workEnd ?? base.workEnd,
    dayOff: over.dayOff ?? base.dayOff,
    lunchStart: over.lunchStart ?? base.lunchStart,
    lunchMinutes: over.lunchMinutes ?? base.lunchMinutes,
    takesLunch: over.takesLunch ?? base.takesLunch,
    breaks: over.breaks ?? base.breaks,
  };
}

export function workWindows(schedule) {
  return [...schedule.breaks, ...(schedule.lunch ? [schedule.lunch] : [])];
}

function windowEnd(window) {
  return window.start + window.minutes;
}

export function blocksFor(schedule) {
  const blocks = [{ kind: 'wake', start: schedule.wake, end: null, isOff: false }];
  if (schedule.isWorkDay) {
    blocks.push({ kind: 'work', start: schedule.workStart, end: schedule.workEnd, isOff: false });
    schedule.breaks.forEach((item, index) => {
      blocks.push({ kind: 'break', index, start: item.start, end: item.start + item.minutes, isOff: false });
    });
    if (schedule.lunch) {
      blocks.push({
        kind: 'lunch',
        start: schedule.lunch.start,
        end: schedule.lunch.start + schedule.lunch.minutes,
        isOff: false,
      });
    } else {
      const middle = schedule.workStart + Math.trunc((schedule.workEnd - schedule.workStart) / 2);
      blocks.push({ kind: 'lunch', start: middle, end: null, isOff: true });
    }
  } else if (schedule.hasSetHours) {
    blocks.push({ kind: 'work', start: schedule.wake + 1, end: null, isOff: true });
  }
  blocks.push({ kind: 'bed', start: schedule.bed, end: null, isOff: false });
  return blocks
    .map((block) => ({ ...block, id: blockId(block), title: blockTitle(block) }))
    .sort((a, b) => a.start - b.start);
}

function blockId(block) {
  if (block.kind === 'break') return `break-${block.index}`;
  return block.kind;
}

export function blockTitle(block) {
  switch (block.kind) {
    case 'wake': return 'Wake-up';
    case 'work': return block.isOff ? 'Day off' : 'Work';
    case 'lunch': return block.isOff ? 'No lunch' : 'Lunch';
    case 'break': return `Break ${block.index + 1}`;
    case 'bed': return 'Bedtime';
    default: return 'Block';
  }
}

export function timelineItems(schedule, walks) {
  const blocks = blocksFor(schedule).map((block) => ({
    type: 'block',
    id: `block-${block.id}`,
    start: block.start,
    isBlock: true,
    block,
  }));
  const walkItems = walks.map((walk) => ({
    type: 'walk',
    id: `walk-${walk.id}`,
    start: walk.startTime,
    isBlock: false,
    walk,
  }));
  return [...blocks, ...walkItems].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.isBlock === b.isBlock) return 0;
    return a.isBlock ? -1 : 1;
  });
}

const MASK = (1n << 64n) - 1n;

/** Same walk on the same date always gets the same id. */
export function stableId(key, slot, index) {
  const text = `walkingout|${key}|${slot}|${index}`;
  let a = 0xcbf29ce484222325n;
  let b = 0x9e3779b97f4a7c15n;
  for (const byte of new TextEncoder().encode(text)) {
    a = ((a ^ BigInt(byte)) * 0x100000001b3n) & MASK;
    b = ((b + BigInt(byte)) & MASK);
    b = (b * 0xff51afd7ed558ccdn) & MASK;
    b ^= b >> 29n;
  }
  const bytes = [];
  for (let shift = 56; shift >= 0; shift -= 8) bytes.push(Number((a >> BigInt(shift)) & 0xffn));
  const y0 = Number((b >> 56n) & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes.push((y0 & 0x3f) | 0x80);
  for (let shift = 48; shift >= 0; shift -= 8) bytes.push(Number((b >> BigInt(shift)) & 0xffn));
  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function makeWalk(slot, index, start, minutes, maxMinutes, key) {
  return {
    id: stableId(key, slot, index),
    date: key,
    slot,
    slotIndex: index,
    startTime: start,
    anchorTime: start,
    minutes,
    maxMinutes: Math.max(minutes, maxMinutes),
    plannedMinutes: minutes,
    targetSteps: minutes * STEPS_PER_MINUTE,
    status: 'planned',
    actualSteps: null,
    isUserAdded: false,
    name: null,
    lengthLocked: false,
    isEdited: false,
    isRemoved: false,
    makeUpFor: null,
  };
}

export function coreWalks(schedule) {
  const walks = [];
  const latestEnd = schedule.bed - BED_BUFFER;
  const morningStart = schedule.wake + 30;

  if (schedule.isWorkDay) {
    const room = Math.min(schedule.workStart - 10, latestEnd) - morningStart;
    if (schedule.workStart - schedule.wake >= 45 && room >= 10) {
      walks.push(makeWalk(
        Slot.morning,
        0,
        morningStart,
        Math.min(15, room),
        Math.min(MAX_WALK_MINUTES, room),
        schedule.key,
      ));
    }
  } else {
    const room = latestEnd - morningStart;
    if (room >= 10) {
      walks.push(makeWalk(
        Slot.morning,
        0,
        morningStart,
        Math.min(25, room),
        Math.min(MAX_WALK_MINUTES, room),
        schedule.key,
      ));
    }
  }

  if (!schedule.isWorkDay) return walks;

  schedule.breaks.forEach((item, index) => {
    const minutes = Math.max(5, item.minutes - 2);
    const start = item.start + 1;
    if (start < schedule.wake || start + minutes > latestEnd) return;
    walks.push(makeWalk(Slot.breakTime, index, start, minutes, minutes, schedule.key));
  });

  if (schedule.lunch && schedule.lunch.start >= schedule.wake && schedule.lunch.start + 5 <= latestEnd) {
    const minutes = Math.max(5, Math.trunc(schedule.lunch.minutes / 2));
    const ceiling = Math.min(MAX_WALK_MINUTES, Math.max(minutes, schedule.lunch.minutes - 10));
    walks.push(makeWalk(Slot.lunch, 0, schedule.lunch.start, minutes, ceiling, schedule.key));
  }

  const afterStart = schedule.workEnd + 15;
  const afterRoom = latestEnd - afterStart;
  if (afterRoom >= 10) {
    walks.push(makeWalk(
      Slot.afterWork,
      0,
      afterStart,
      Math.min(20, afterRoom),
      Math.min(MAX_WALK_MINUTES, afterRoom),
      schedule.key,
    ));
  }

  return walks.sort((a, b) => a.startTime - b.startTime);
}

export function eveningWalk(schedule, core) {
  let start = schedule.bed - 120;
  const latestEnd = schedule.bed - BED_BUFFER;
  if (core.length) {
    const last = core.reduce((best, item) => (
      best.startTime + best.maxMinutes < item.startTime + item.maxMinutes ? item : best
    ));
    start = Math.max(start, last.startTime + last.maxMinutes + 15);
  }
  start = Math.max(start, schedule.wake + 30);
  const room = latestEnd - start;
  if (room < 10) return null;
  const natural = schedule.isWorkDay ? 15 : 25;
  return makeWalk(Slot.evening, 0, start, Math.min(natural, room), Math.min(MAX_WALK_MINUTES, room), schedule.key);
}

export function generate(schedule, base, inputs) {
  const walks = coreWalks(schedule);
  const evening = eveningWalk(schedule, walks);
  if (evening) {
    let needsEvening;
    if (!schedule.isWorkDay) {
      needsEvening = true;
    } else {
      const reference = base.isWorkDay ? base : schedule;
      const capacity = coreWalks(reference).reduce((sum, walk) => sum + walk.maxMinutes, 0) * STEPS_PER_MINUTE;
      needsEvening = inputs.ambient + capacity < inputs.goal;
    }
    if (needsEvening) walks.push(evening);
  }
  return walks.sort((a, b) => a.startTime - b.startTime);
}

function cappedMinutes(walk) {
  return Math.min(MAX_WALK_MINUTES, Math.max(walk.minutes, walk.maxMinutes));
}

export function distribute(walks, inputs) {
  const gap = Math.max(0, inputs.goal - inputs.ambient);
  const output = walks.map(cloneWalk);
  let pinnedSteps = 0;
  const flexible = [];

  output.forEach((item, index) => {
    if (item.status === 'skipped' || isPinned(item)) {
      output[index].plannedMinutes = item.minutes;
      output[index].targetSteps = item.minutes * STEPS_PER_MINUTE;
      if (item.status !== 'skipped') pinnedSteps += item.minutes * STEPS_PER_MINUTE;
    } else {
      flexible.push(index);
    }
  });

  let remaining = Math.max(0, gap - pinnedSteps);
  const shares = new Map();
  let open = [...flexible];
  while (open.length) {
    const weight = open.reduce((sum, index) => sum + Math.max(1, output[index].minutes), 0);
    const capped = open.filter((index) => (
      remaining * Math.max(1, output[index].minutes) / weight > cappedMinutes(output[index]) * STEPS_PER_MINUTE
    ));
    if (!capped.length) {
      for (const index of open) {
        shares.set(index, remaining * Math.max(1, output[index].minutes) / weight);
      }
      remaining = 0;
      break;
    }
    for (const index of capped) {
      const cap = cappedMinutes(output[index]) * STEPS_PER_MINUTE;
      shares.set(index, cap);
      remaining -= cap;
    }
    remaining = Math.max(0, remaining);
    open = open.filter((index) => !capped.includes(index));
  }
  const isShort = remaining > 0.5;

  let flexibleSteps = 0;
  for (const index of flexible) {
    const share = shares.get(index) ?? 0;
    flexibleSteps += share;
    output[index].targetSteps = Math.trunc(Math.round(share / 50)) * 50;
    const minutes = Math.trunc(Math.ceil(share / STEPS_PER_MINUTE));
    output[index].plannedMinutes = Math.min(cappedMinutes(output[index]), Math.max(5, minutes));
  }

  const planned = output
    .filter((walk) => walk.status !== 'skipped')
    .reduce((sum, walk) => sum + walk.targetSteps, 0);
  const covered = isShort
    ? inputs.ambient + pinnedSteps + Math.trunc(Math.round(flexibleSteps))
    : Math.max(inputs.goal, inputs.ambient + planned);

  return { walks: output, planned, covered, goal: inputs.goal };
}

export function shortfallNote(covered, goal) {
  if (covered >= goal) return null;
  return `Routine covers ${formatNumber(covered)} of ${formatNumber(goal)} — add a walk?`;
}

export function placementProblem(start, minutes, schedule, walks, excluding = null) {
  const end = start + minutes;
  if (start < schedule.wake) return new RoutineProblem("That's before you're up.");
  if (end > schedule.bed - BED_BUFFER) {
    return new RoutineProblem('Too close to bedtime — walks wrap up 30 min before bed.');
  }
  if (schedule.isWorkDay && start < schedule.workEnd && end > schedule.workStart) {
    const inside = workWindows(schedule).some((window) => start >= window.start && end <= windowEnd(window));
    if (!inside) return new RoutineProblem("That's work time — drop it in a break or lunch.");
  }
  const clash = walks.some((other) => (
    other.id !== excluding
    && other.status !== 'skipped'
    && start < endTime(other)
    && end > other.startTime
  ));
  if (clash) return new RoutineProblem('Another walk is already there.');
  return null;
}

export function makeUpStart(minutes, schedule, walks, nowMinutes) {
  const floor = roundedUp(Math.max(schedule.wake, (nowMinutes ?? schedule.wake) + 5));
  const latest = schedule.bed - BED_BUFFER - minutes;
  const preferred = Math.max(roundedUp(schedule.bed - 120), floor);
  for (let start = preferred; start <= latest; start += SNAP) {
    if (!placementProblem(start, minutes, schedule, walks)) return start;
  }
  for (let start = floor; start <= latest; start += SNAP) {
    if (!placementProblem(start, minutes, schedule, walks)) return start;
  }
  return null;
}

export function windowContaining(start, schedule) {
  if (!schedule.isWorkDay || start < schedule.workStart || start >= schedule.workEnd) return null;
  return workWindows(schedule).find((window) => start >= window.start && start < windowEnd(window)) ?? null;
}

export function reachedTarget(walk) {
  if (walk.actualSteps == null) return null;
  return walk.actualSteps >= Math.max(1, walk.targetSteps) * DONE_SHARE;
}

export function statesFor(walks, schedule, now) {
  const todayKey = keyFor(now);
  const states = {};
  const isFuture = schedule.key > todayKey;
  const isPast = schedule.key < todayKey;
  const nowMinutes = minutesSinceStart(schedule.date, now);
  let foundNext = false;

  const ordered = [...walks].sort((a, b) => a.startTime - b.startTime);
  for (const item of ordered) {
    if (item.status === 'skipped') {
      states[item.id] = 'skipped';
      continue;
    }
    if (item.status === 'done') {
      states[item.id] = 'done';
      continue;
    }
    if (item.status === 'missed') {
      states[item.id] = 'missed';
      continue;
    }
    if (isFuture) {
      states[item.id] = 'planned';
      continue;
    }
    const windowOver = isPast || nowMinutes >= endTime(item) + STEP_BUFFER;
    const reached = reachedTarget(item);
    if (reached === true) states[item.id] = 'done';
    else if (windowOver) states[item.id] = reached === false ? 'missed' : 'planned';
    else if (!foundNext) {
      states[item.id] = 'upNext';
      foundNext = true;
    } else states[item.id] = 'planned';
  }
  return states;
}

export function ambientEstimate(log, walkSteps, today) {
  const samples = [];
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = keyFor(day);
    const entry = log[key];
    if (!entry || entry.source !== 'healthKit' || !(entry.steps > 0)) continue;
    const net = entry.steps - (walkSteps[key] ?? 0);
    if (net > 0) samples.push(net);
  }
  if (samples.length < 3) return DEFAULT_AMBIENT;
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const clamped = Math.min(9000, Math.max(500, average));
  return Math.trunc(Math.round(clamped / 100)) * 100;
}

export function defaultBreaks(count, minutes, template) {
  if (count <= 0) return [];
  const workStart = template.workStart;
  let workEnd = template.workEnd;
  if (workEnd <= workStart) workEnd += 1440;

  let segments = [{ start: workStart, end: workEnd }];
  if (template.takesLunch) {
    let lunch = template.lunchStart;
    if (lunch < workStart) lunch += 1440;
    const lunchEnd = lunch + template.lunchMinutes;
    if (lunch > workStart && lunchEnd < workEnd) {
      segments = [
        { start: workStart, end: lunch },
        { start: lunchEnd, end: workEnd },
      ];
    }
  }

  const assigned = Array(segments.length).fill(0);
  for (let n = 0; n < count; n += 1) {
    let best = 0;
    let bestRoom = -1;
    segments.forEach((segment, index) => {
      const room = (segment.end - segment.start) / (assigned[index] + 1);
      if (room > bestRoom) {
        bestRoom = room;
        best = index;
      }
    });
    assigned[best] += 1;
  }

  const result = [];
  segments.forEach((segment, index) => {
    if (assigned[index] <= 0) return;
    const length = segment.end - segment.start;
    for (let slot = 1; slot <= assigned[index]; slot += 1) {
      const raw = segment.start + Math.trunc((length * slot) / (assigned[index] + 1));
      let start = Math.trunc(Math.round(raw / 30)) * 30;
      start = Math.min(Math.max(start, segment.start), Math.max(segment.start, segment.end - minutes));
      result.push({ start: ((start % 1440) + 1440) % 1440, minutes });
    }
  });
  return result.sort((a, b) => a.start - b.start);
}

export function reminderCopy(walk) {
  return {
    title: `${displayName(walk)} in 5 — ${formatNumber(walk.targetSteps)} steps.`,
    body: `${timeLabel(walk.startTime)} · ${walk.plannedMinutes} min. No excuses.`,
  };
}
