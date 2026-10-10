/**
 * Friendly limits. They catch typos. There is no leaderboard to police.
 */

import { daysBetween, isDateKey } from './dates.js';
import { roundMiles } from './convert.js';

export const BIG_DAY_MILES = 20;
export const BIG_DAY_STEPS = 40000;
export const DAY_CAP_MILES = 50;
export const TYPO_STEPS = 100000;
export const MAX_BACKFILL_DAYS = 7;

export function checkDate(date, today) {
  if (!isDateKey(date) || !isDateKey(today)) {
    return { ok: false, reason: 'invalid', message: 'Pick a day from the last week.' };
  }
  const diff = daysBetween(date, today);
  if (diff < 0) {
    return { ok: false, reason: 'future', message: "That date hasn't happened yet." };
  }
  if (diff > MAX_BACKFILL_DAYS) {
    return { ok: false, reason: 'too_old', message: "Let's keep it to the last week." };
  }
  return { ok: true };
}

/** Steps like 100,000+ get one suggested fix: drop zeros until it is under the line. */
export function typoSuggestion(steps) {
  if (!(steps >= TYPO_STEPS)) return null;
  let suggested = steps;
  while (suggested >= TYPO_STEPS) suggested = Math.round(suggested / 10);
  return suggested;
}

export function needsBigDayConfirm(miles, steps = null) {
  return miles > BIG_DAY_MILES || (steps != null && steps > BIG_DAY_STEPS);
}

export function capDayMiles(existingMiles, addingMiles) {
  const used = roundMiles(Math.max(0, existingMiles));
  const adding = roundMiles(Math.max(0, addingMiles));
  const room = roundMiles(DAY_CAP_MILES - used);
  if (room <= 0) {
    return {
      miles: 0,
      capped: true,
      blocked: true,
      message: 'This day is already at 50 miles, so there is no room to add another walk.',
    };
  }
  if (adding > room) {
    return {
      miles: room,
      capped: true,
      blocked: false,
      message: `That's a lot for one day, so this day stops at 50 miles. We added ${room} miles.`,
    };
  }
  return { miles: adding, capped: false, blocked: false, message: '' };
}
