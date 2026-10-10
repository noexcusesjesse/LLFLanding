/**
 * A streak is logged walk days in a row. One missed day per Monday–Sunday
 * week is a built-in rest day and does not break the run. A second miss in
 * that week does. Rest days keep the streak alive and do not add to the count.
 * Today stays open until it ends: if you have not logged yet, the run is
 * counted through yesterday.
 */

import { addDays, mondayKey } from './dates.js';

export function walkDates(entries) {
  const dates = new Set();
  for (const entry of entries) {
    if (entry?.miles > 0 && typeof entry.date === 'string') dates.add(entry.date);
  }
  return dates;
}

function earliestDate(dates) {
  let earliest = null;
  for (const date of dates) {
    if (earliest === null || date < earliest) earliest = date;
  }
  return earliest;
}

export function streakEndingOn(dates, end) {
  if (!dates.size || !end) return 0;
  const earliest = earliestDate(dates);
  let cursor = end;
  let days = 0;
  const restUsed = new Map();
  for (let guard = 0; guard < 5000; guard += 1) {
    if (cursor < earliest && !dates.has(cursor)) break;
    if (dates.has(cursor)) {
      days += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (cursor <= earliest) break;
    const week = mondayKey(cursor);
    const used = restUsed.get(week) || 0;
    if (used >= 1) break;
    restUsed.set(week, used + 1);
    cursor = addDays(cursor, -1);
  }
  return days;
}

export function currentStreak(entries, today) {
  const dates = walkDates(entries);
  if (!dates.size) return 0;
  const end = dates.has(today) ? today : addDays(today, -1);
  return streakEndingOn(dates, end);
}

export function maxStreak(entries) {
  const dates = walkDates(entries);
  let best = 0;
  for (const date of dates) best = Math.max(best, streakEndingOn(dates, date));
  return best;
}

/** True when this log starts a fresh run after an older one died. */
export function restartedToday(entries, today) {
  const dates = walkDates(entries);
  if (!dates.has(today) || currentStreak(entries, today) !== 1) return false;
  for (const date of dates) {
    if (date < today) return true;
  }
  return false;
}
