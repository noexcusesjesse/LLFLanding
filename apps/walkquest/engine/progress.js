import { getCampaign, CAMPAIGNS } from './campaigns.js';
import { campaignMiles } from './miles.js';
import { evaluateBadges, newBadgeIds } from './badges.js';
import { roundMiles } from './convert.js';

export function stopUnlockId(campaignId, stopId) {
  return `stop:${campaignId}:${stopId}`;
}

export function badgeUnlockId(badgeId) {
  return `badge:${badgeId}`;
}

export function nextStop(stops, miles) {
  return stops.find((stop) => stop.miles > miles) || null;
}

export function milesRemaining(distance, miles) {
  return roundMiles(Math.max(0, distance - miles));
}

export function isStopOpen(miles, stop) {
  return miles >= stop.miles;
}

export function stopsCrossed(campaign, beforeMiles, afterMiles) {
  return campaign.stops
    .filter((stop) => beforeMiles < stop.miles && afterMiles >= stop.miles)
    .map((stop) => ({
      type: 'stop',
      id: stopUnlockId(campaign.id, stop.id),
      campaignId: campaign.id,
      stopId: stop.id,
    }));
}

export function unlocksFromLog(beforeState, afterState, campaignId, beforeMiles, afterMiles) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return [];
  const stops = stopsCrossed(campaign, beforeMiles, afterMiles);
  const badges = newBadgeIds(beforeState, afterState).map((badgeId) => ({
    type: 'badge',
    id: badgeUnlockId(badgeId),
    badgeId,
  }));
  return [...stops, ...badges];
}

export function unseenUnlocks(state) {
  const items = [];
  const seen = new Set(state.seenUnlocks || []);
  for (const campaign of CAMPAIGNS) {
    const started = state.activeCampaign === campaign.id
      || (state.started || []).includes(campaign.id)
      || (state.entries || []).some((entry) => entry.campaignId === campaign.id);
    if (!started) continue;
    const miles = campaignMiles(state.entries || [], campaign.id);
    for (const stop of campaign.stops) {
      if (miles < stop.miles) continue;
      const id = stopUnlockId(campaign.id, stop.id);
      if (!seen.has(id)) items.push({ type: 'stop', id, campaignId: campaign.id, stopId: stop.id });
    }
  }
  for (const badgeId of evaluateBadges(state)) {
    const id = badgeUnlockId(badgeId);
    if (!seen.has(id)) items.push({ type: 'badge', id, badgeId });
  }
  return items;
}

export function pointAtMiles(stops, miles) {
  const trail = pointsThrough(stops, miles);
  return trail[trail.length - 1];
}

export function pointsThrough(stops, miles) {
  if (!stops.length) return [];
  if (miles <= stops[0].miles) return [{ x: stops[0].x, y: stops[0].y }];
  const last = stops[stops.length - 1];
  if (miles >= last.miles) return stops.map((stop) => ({ x: stop.x, y: stop.y }));
  const points = [];
  for (let index = 0; index < stops.length; index += 1) {
    const stop = stops[index];
    if (stop.miles < miles) {
      points.push({ x: stop.x, y: stop.y });
      continue;
    }
    const prev = stops[index - 1];
    const span = stop.miles - prev.miles;
    const t = span === 0 ? 1 : (miles - prev.miles) / span;
    points.push({
      x: prev.x + (stop.x - prev.x) * t,
      y: prev.y + (stop.y - prev.y) * t,
    });
    break;
  }
  return points;
}

export function linePath(points) {
  return points.map((point, index) => {
    const x = Math.round(point.x * 10) / 10;
    const y = Math.round(point.y * 10) / 10;
    return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join(' ');
}
