import { addDays, mondayKey } from './dates.js';
import { roundMiles } from './convert.js';

export function lifetimeMiles(entries) {
  return roundMiles(entries.reduce((sum, entry) => sum + (Number(entry.miles) || 0), 0));
}

export function campaignMiles(entries, campaignId) {
  return roundMiles(entries.reduce((sum, entry) => (
    entry.campaignId === campaignId ? sum + (Number(entry.miles) || 0) : sum
  ), 0));
}

export function dayMiles(entries, date, exceptId = null) {
  return roundMiles(entries.reduce((sum, entry) => (
    entry.date === date && entry.id !== exceptId ? sum + (Number(entry.miles) || 0) : sum
  ), 0));
}

export function weekMiles(entries, today) {
  const start = mondayKey(today);
  const end = addDays(start, 6);
  return roundMiles(entries.reduce((sum, entry) => (
    entry.date >= start && entry.date <= end ? sum + (Number(entry.miles) || 0) : sum
  ), 0));
}
