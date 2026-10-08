/**
 * Routine models. Field names match the Swift Codable structs so a saved
 * book reads the same way the iOS app describes it.
 */

export const Slot = {
  morning: 'morning',
  breakTime: 'break',
  lunch: 'lunch',
  afterWork: 'after_work',
  evening: 'evening',
  custom: 'custom',
};

export const SLOT_ORDER = [
  Slot.morning,
  Slot.breakTime,
  Slot.lunch,
  Slot.afterWork,
  Slot.evening,
  Slot.custom,
];

export const SLOT_TITLES = {
  [Slot.morning]: 'Morning walk',
  [Slot.breakTime]: 'Break walk',
  [Slot.lunch]: 'Lunch walk',
  [Slot.afterWork]: 'After-work walk',
  [Slot.evening]: 'Evening walk',
  [Slot.custom]: 'Added walk',
};

export const SLOT_REMINDER_LABELS = {
  [Slot.morning]: 'Morning walk',
  [Slot.breakTime]: 'Break walks',
  [Slot.lunch]: 'Lunch walk',
  [Slot.afterWork]: 'After-work walk',
  [Slot.evening]: 'Evening walk',
  [Slot.custom]: 'Walks I add',
};

export const Status = {
  planned: 'planned',
  done: 'done',
  skipped: 'skipped',
  missed: 'missed',
};

export const Scope = {
  day: 'day',
  weekday: 'weekday',
  everyDay: 'everyDay',
};

export const SCOPE_ORDER = [Scope.day, Scope.weekday, Scope.everyDay];

export class RoutineProblem extends Error {
  constructor(message) {
    super(message);
    this.name = 'RoutineProblem';
  }
}

export function emptyOverride() {
  return {
    wakeTime: null,
    bedTime: null,
    workStart: null,
    workEnd: null,
    dayOff: null,
    lunchStart: null,
    lunchMinutes: null,
    takesLunch: null,
    breaks: null,
  };
}

export function normalizeOverride(value) {
  const source = value ?? {};
  return {
    wakeTime: source.wakeTime ?? null,
    bedTime: source.bedTime ?? null,
    workStart: source.workStart ?? null,
    workEnd: source.workEnd ?? null,
    dayOff: source.dayOff ?? null,
    lunchStart: source.lunchStart ?? null,
    lunchMinutes: source.lunchMinutes ?? null,
    takesLunch: source.takesLunch ?? null,
    breaks: source.breaks ? source.breaks.map((item) => ({ start: item.start, minutes: item.minutes })) : null,
  };
}

export function isEmptyOverride(value) {
  const item = normalizeOverride(value);
  return item.wakeTime == null
    && item.bedTime == null
    && item.workStart == null
    && item.workEnd == null
    && item.dayOff == null
    && item.lunchStart == null
    && item.lunchMinutes == null
    && item.takesLunch == null
    && item.breaks == null;
}

export function merged(over, base) {
  const top = normalizeOverride(over);
  const bottom = normalizeOverride(base);
  return {
    wakeTime: top.wakeTime ?? bottom.wakeTime,
    bedTime: top.bedTime ?? bottom.bedTime,
    workStart: top.workStart ?? bottom.workStart,
    workEnd: top.workEnd ?? bottom.workEnd,
    dayOff: top.dayOff ?? bottom.dayOff,
    lunchStart: top.lunchStart ?? bottom.lunchStart,
    lunchMinutes: top.lunchMinutes ?? bottom.lunchMinutes,
    takesLunch: top.takesLunch ?? bottom.takesLunch,
    breaks: top.breaks ?? bottom.breaks,
  };
}

export function removingFields(self, other) {
  const copy = normalizeOverride(self);
  const drop = normalizeOverride(other);
  if (drop.wakeTime != null) copy.wakeTime = null;
  if (drop.bedTime != null) copy.bedTime = null;
  if (drop.workStart != null) copy.workStart = null;
  if (drop.workEnd != null) copy.workEnd = null;
  if (drop.dayOff != null) copy.dayOff = null;
  if (drop.lunchStart != null) copy.lunchStart = null;
  if (drop.lunchMinutes != null) copy.lunchMinutes = null;
  if (drop.takesLunch != null) copy.takesLunch = null;
  if (drop.breaks != null) copy.breaks = null;
  return copy;
}

export function standardTemplate() {
  return {
    wakeTime: 6 * 60,
    bedTime: 22 * 60,
    workDays: [1, 2, 3, 4, 5],
    workStart: 8 * 60,
    workEnd: 17 * 60,
    hasSetHours: true,
    lunchStart: 12 * 60,
    lunchMinutes: 30,
    takesLunch: true,
    breaks: [
      { start: 10 * 60, minutes: 15 },
      { start: 15 * 60, minutes: 15 },
    ],
    updatedAt: new Date(0).toISOString(),
  };
}

export function cloneTemplate(template) {
  return {
    wakeTime: template.wakeTime,
    bedTime: template.bedTime,
    workDays: [...template.workDays],
    workStart: template.workStart,
    workEnd: template.workEnd,
    hasSetHours: template.hasSetHours,
    lunchStart: template.lunchStart,
    lunchMinutes: template.lunchMinutes,
    takesLunch: template.takesLunch,
    breaks: template.breaks.map((item) => ({ start: item.start, minutes: item.minutes })),
    updatedAt: template.updatedAt,
  };
}

export function applied(change, template) {
  const result = cloneTemplate(template);
  const fields = normalizeOverride(change);
  if (fields.wakeTime != null) result.wakeTime = fields.wakeTime;
  if (fields.bedTime != null) result.bedTime = fields.bedTime;
  if (fields.workStart != null) result.workStart = fields.workStart;
  if (fields.workEnd != null) result.workEnd = fields.workEnd;
  if (fields.lunchStart != null) result.lunchStart = fields.lunchStart;
  if (fields.lunchMinutes != null) result.lunchMinutes = fields.lunchMinutes;
  if (fields.takesLunch != null) result.takesLunch = fields.takesLunch;
  if (fields.breaks != null) {
    result.breaks = fields.breaks
      .map((item) => ({ start: item.start, minutes: item.minutes }))
      .sort((a, b) => a.start - b.start);
  }
  return result;
}

export function standardReminders() {
  return { isOn: true, mutedSlots: [], bedtimeNudge: true };
}

export function allowsSlot(reminders, slot) {
  return reminders.isOn && !reminders.mutedSlots.includes(slot);
}

export function cloneWalk(walk) {
  return {
    id: walk.id,
    date: walk.date,
    slot: walk.slot,
    slotIndex: walk.slotIndex,
    startTime: walk.startTime,
    anchorTime: walk.anchorTime,
    minutes: walk.minutes,
    maxMinutes: walk.maxMinutes,
    plannedMinutes: walk.plannedMinutes,
    targetSteps: walk.targetSteps,
    status: walk.status,
    actualSteps: walk.actualSteps ?? null,
    isUserAdded: walk.isUserAdded,
    name: walk.name ?? null,
    lengthLocked: walk.lengthLocked,
    isEdited: walk.isEdited,
    isRemoved: walk.isRemoved,
    makeUpFor: walk.makeUpFor ?? null,
  };
}

export function isPinned(walk) {
  return walk.isUserAdded || walk.lengthLocked;
}

export function endTime(walk) {
  return walk.startTime + walk.plannedMinutes;
}

export function displayName(walk) {
  if (walk.name && walk.name.trim()) return walk.name.trim();
  if (walk.slot === Slot.breakTime) return `Break walk ${walk.slotIndex + 1}`;
  return SLOT_TITLES[walk.slot] ?? 'Walk';
}

export function standardInputs() {
  return { goal: 12000, ambient: 3000 };
}
