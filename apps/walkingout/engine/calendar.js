/**
 * Monday-based local calendar and yyyy-MM-dd day keys.
 * Dates are built and read in local time so a calendar day stays put
 * in any timezone. Tests construct dates the same way.
 */

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function dateFromParts({ year, month, day, hour = 0, minute = 0 }) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, amount) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday. */
export function dayIndex(date) {
  return (startOfDay(date).getDay() + 6) % 7;
}

/** 1 = Monday … 7 = Sunday. */
export function weekdayOf(date) {
  return dayIndex(date) + 1;
}

export function keyFor(date) {
  const day = startOfDay(date);
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const dateNum = String(day.getDate()).padStart(2, '0');
  return `${day.getFullYear()}-${month}-${dateNum}`;
}

export function dateFromKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return dateFromParts({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
}

export function weekDays(date) {
  const monday = addDays(date, -dayIndex(date));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Minutes since local midnight of `day`. Truncates, matching Swift's Int division. */
export function minutesSinceStart(day, now) {
  return Math.trunc((now.getTime() - startOfDay(day).getTime()) / 60000);
}

/** Local date-time for a minute offset from the start of `day` (may pass midnight). */
export function dateForMinutes(minutes, day) {
  const result = startOfDay(day);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function weekdayName(date) {
  return DAY_NAMES[dayIndex(date)];
}

export function longDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(startOfDay(date));
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(startOfMonth(date)).toUpperCase();
}
