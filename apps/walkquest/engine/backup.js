import { isDateKey } from './dates.js';
import { daysBetween } from './dates.js';
import { evaluateBadges } from './badges.js';

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'walkquest';

export function defaultState() {
  return {
    version: 1,
    welcomed: false,
    setupComplete: false,
    settings: {
      trailName: 'Walker',
      units: 'mi',
      strideMode: 'default',
      heightInches: null,
      calibration: null,
    },
    activeCampaign: null,
    started: [],
    entries: [],
    seenUnlocks: [],
    backup: { lastBackupAt: null, entryCount: 0 },
    startedAt: null,
  };
}

export function serializeBackup(state, exportedAt = new Date().toISOString()) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt,
    welcomed: state.welcomed,
    setupComplete: state.setupComplete,
    settings: state.settings,
    activeCampaign: state.activeCampaign,
    started: state.started || [],
    entries: state.entries,
    seenUnlocks: state.seenUnlocks,
    badges: [...evaluateBadges(state)],
    backup: state.backup,
    startedAt: state.startedAt,
  };
}

function cleanName(value) {
  const name = String(value ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40);
  return name || 'Walker';
}

function cleanEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (!isDateKey(entry.date)) return null;
  const miles = Number(entry.miles);
  if (!Number.isFinite(miles) || miles < 0) return null;
  const campaignId = String(entry.campaignId || '');
  if (!campaignId) return null;
  const steps = entry.steps == null ? null : Number(entry.steps);
  return {
    id: String(entry.id || `w_${entry.date}_${Math.random().toString(36).slice(2, 8)}`),
    campaignId,
    date: entry.date,
    miles,
    steps: Number.isFinite(steps) && steps >= 0 ? steps : null,
    stepsPerMile: Number.isFinite(Number(entry.stepsPerMile)) ? Number(entry.stepsPerMile) : null,
    inputMode: entry.inputMode === 'steps' ? 'steps' : 'distance',
    indoor: Boolean(entry.indoor),
    note: String(entry.note || '').slice(0, 280),
    loggedHour: Number.isInteger(entry.loggedHour) && entry.loggedHour >= 0 && entry.loggedHour <= 23
      ? entry.loggedHour
      : null,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : null,
    capped: Boolean(entry.capped),
  };
}

export function parseBackup(raw) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return { ok: false, error: "That file didn't open. Try the backup you exported from WalkQuest." };
  }
  if (!data || data.app !== BACKUP_APP) {
    return { ok: false, error: "That file isn't a WalkQuest backup." };
  }
  if (data.version !== BACKUP_VERSION) {
    return { ok: false, error: 'That backup is from a different WalkQuest version.' };
  }
  if (!Array.isArray(data.entries)) {
    return { ok: false, error: 'That backup is missing its walk log.' };
  }
  const state = defaultState();
  state.welcomed = Boolean(data.welcomed);
  state.setupComplete = Boolean(data.setupComplete);
  const settings = data.settings && typeof data.settings === 'object' ? data.settings : {};
  state.settings = {
    trailName: cleanName(settings.trailName),
    units: settings.units === 'km' ? 'km' : 'mi',
    strideMode: ['default', 'height', 'calibrate'].includes(settings.strideMode) ? settings.strideMode : 'default',
    heightInches: Number.isFinite(Number(settings.heightInches)) ? Number(settings.heightInches) : null,
    calibration: settings.calibration && Number(settings.calibration.steps) > 0 && Number(settings.calibration.miles) > 0
      ? { steps: Number(settings.calibration.steps), miles: Number(settings.calibration.miles) }
      : null,
  };
  state.activeCampaign = ['walker', 'rim', 'route66'].includes(data.activeCampaign) ? data.activeCampaign : null;
  const started = Array.isArray(data.started) ? data.started.filter((id) => ['walker', 'rim', 'route66'].includes(id)) : [];
  if (state.activeCampaign && !started.includes(state.activeCampaign)) started.push(state.activeCampaign);
  for (const entry of data.entries) {
    if (['walker', 'rim', 'route66'].includes(entry?.campaignId) && !started.includes(entry.campaignId)) {
      started.push(entry.campaignId);
    }
  }
  state.started = started;
  state.entries = data.entries.map(cleanEntry).filter(Boolean);
  state.seenUnlocks = Array.isArray(data.seenUnlocks) ? data.seenUnlocks.filter((id) => typeof id === 'string') : [];
  state.startedAt = typeof data.startedAt === 'string' ? data.startedAt : null;
  const backup = data.backup && typeof data.backup === 'object' ? data.backup : {};
  state.backup = {
    lastBackupAt: typeof backup.lastBackupAt === 'string' ? backup.lastBackupAt : null,
    entryCount: Number.isFinite(Number(backup.entryCount)) ? Number(backup.entryCount) : 0,
  };
  return { ok: true, state };
}

export function backupDue(state, today) {
  if (!state.entries?.length || !today) return false;
  const sinceCount = state.entries.length - (state.backup?.entryCount || 0);
  if (sinceCount >= 10) return true;
  const anchor = state.backup?.lastBackupAt
    ? state.backup.lastBackupAt.slice(0, 10)
    : (state.startedAt ? state.startedAt.slice(0, 10) : null);
  if (!anchor) return false;
  return daysBetween(anchor, today) >= 30;
}

export function markBackedUp(state, when = new Date().toISOString()) {
  return {
    ...state,
    backup: { lastBackupAt: when, entryCount: state.entries.length },
  };
}
