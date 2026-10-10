/**
 * Starter badge set. Base Camp and Border to Border stay locked until a
 * later update adds those campaigns. Chapter 10's story badge is
 * Old Joe's Successor so it does not repeat Lantern Lit.
 */

import { campaignMiles, lifetimeMiles } from './miles.js';
import { maxStreak, walkDates } from './streaks.js';
import { daysBetween } from './dates.js';

export const BADGES = [
  { id: 'first-mile', group: 'Distance', name: 'First Mile', hint: 'Log 1 lifetime mile.' },
  { id: 'ten-miles', group: 'Distance', name: '10 Miles', hint: 'Log 10 lifetime miles.' },
  { id: 'marathon', group: 'Distance', name: 'Marathon Distance', hint: 'Log 26.2 lifetime miles.' },
  { id: 'hundred', group: 'Distance', name: '100 Miles', hint: 'Log 100 lifetime miles.' },
  { id: 'five-hundred', group: 'Distance', name: '500 Miles', hint: 'Log 500 lifetime miles.' },
  { id: 'thousand', group: 'Distance', name: '1,000 Miles', hint: 'Log 1,000 lifetime miles.' },
  { id: 'streak-3', group: 'Streaks', name: '3 Days', hint: 'Walk 3 days in a row. One rest day a week is already built in.' },
  { id: 'streak-7', group: 'Streaks', name: '7 Days', hint: 'Walk 7 days in a row.' },
  { id: 'streak-30', group: 'Streaks', name: '30 Days', hint: 'Walk 30 days in a row.' },
  { id: 'streak-100', group: 'Streaks', name: '100 Days', hint: 'Walk 100 days in a row.' },
  { id: 'rim', group: 'Campaigns', name: 'Rim to Rim', hint: 'Finish Canyon Rim to Rim.' },
  { id: 'lantern-lit', group: 'Campaigns', name: 'Lantern Lit', hint: 'Finish The Walker.' },
  { id: 'base-camp', group: 'Campaigns', name: 'Base Camp', hint: 'A later campaign.', later: true },
  { id: 'border', group: 'Campaigns', name: 'Border to Border', hint: 'A later campaign.', later: true },
  { id: 'route66', group: 'Campaigns', name: 'Route 66 Complete', hint: 'Finish Route 66 Road Trip.' },
  { id: 'treadmill', group: 'Habits', name: 'Treadmill Trekker', hint: 'Log 10 indoor walks.' },
  { id: 'early-bird', group: 'Habits', name: 'Early Bird', hint: 'Log 5 walks before 8 AM.' },
  { id: 'comeback', group: 'Habits', name: 'Comeback', hint: 'Log a walk when your last one was 7 or more days earlier.' },
  { id: 'scout', group: 'Story', name: "Scout's Friend", hint: 'Reach Chapter 2 on The Walker.' },
  { id: 'storm', group: 'Story', name: 'Storm Chaser', hint: 'Reach Chapter 5 on The Walker.' },
  { id: 'successor', group: 'Story', name: "Old Joe's Successor", hint: 'Reach Chapter 10 on The Walker.' },
];

export function hasComeback(entries) {
  const dates = [...walkDates(entries)].sort();
  for (let index = 1; index < dates.length; index += 1) {
    if (daysBetween(dates[index - 1], dates[index]) >= 7) return true;
  }
  return false;
}

export function evaluateBadges(state) {
  const earned = new Set();
  const life = lifetimeMiles(state.entries || []);
  const streak = maxStreak(state.entries || []);
  const walker = campaignMiles(state.entries || [], 'walker');
  const rim = campaignMiles(state.entries || [], 'rim');
  const route = campaignMiles(state.entries || [], 'route66');
  const indoor = (state.entries || []).filter((entry) => entry.indoor && entry.miles > 0).length;
  const early = (state.entries || []).filter((entry) => entry.miles > 0 && entry.loggedHour < 8).length;

  if (life >= 1) earned.add('first-mile');
  if (life >= 10) earned.add('ten-miles');
  if (life >= 26.2 - 0.001) earned.add('marathon');
  if (life >= 100) earned.add('hundred');
  if (life >= 500) earned.add('five-hundred');
  if (life >= 1000) earned.add('thousand');
  if (streak >= 3) earned.add('streak-3');
  if (streak >= 7) earned.add('streak-7');
  if (streak >= 30) earned.add('streak-30');
  if (streak >= 100) earned.add('streak-100');
  if (rim >= 24) earned.add('rim');
  if (walker >= 100) earned.add('lantern-lit');
  if (route >= 2400) earned.add('route66');
  if (indoor >= 10) earned.add('treadmill');
  if (early >= 5) earned.add('early-bird');
  if (hasComeback(state.entries || [])) earned.add('comeback');
  if (walker >= 3) earned.add('scout');
  if (walker >= 25) earned.add('storm');
  if (walker >= 100) earned.add('successor');
  return earned;
}

export function getBadge(id) {
  return BADGES.find((badge) => badge.id === id) || null;
}

export function newBadgeIds(beforeState, afterState) {
  const before = evaluateBadges(beforeState);
  const after = evaluateBadges(afterState);
  return [...after].filter((id) => !before.has(id));
}
