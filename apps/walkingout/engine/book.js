/**
 * The whole routine: default week, layered edits, and the walks of any day
 * that has been opened or changed. Port of RoutineBook.swift.
 */

import { dateForMinutes, dateFromKey, keyFor, minutesSinceStart, weekdayOf } from './calendar.js';
import {
  RoutineProblem,
  Scope,
  Slot,
  allowsSlot,
  applied,
  cloneTemplate,
  cloneWalk,
  displayName,
  emptyOverride,
  isEmptyOverride,
  merged,
  normalizeOverride,
  removingFields,
  standardReminders,
} from './models.js';
import {
  MAX_WALK_MINUTES,
  STEPS_PER_MINUTE,
  distribute,
  generate,
  makeUpStart,
  placementProblem,
  roundedUp,
  scheduleFor,
  shortfallNote,
  statesFor,
} from './planner.js';

function newId() {
  return crypto.randomUUID();
}

export class RoutineBook {
  constructor(data = {}) {
    this.template = data.template ? cloneTemplate(data.template) : null;
    this.dayOverrides = (data.dayOverrides ?? []).map(cloneDayOverride);
    this.weekdayRules = (data.weekdayRules ?? []).map(cloneRule);
    this.walks = {};
    for (const [key, list] of Object.entries(data.walks ?? {})) {
      this.walks[key] = list.map(cloneWalk);
    }
    this.reminders = {
      isOn: data.reminders?.isOn ?? true,
      mutedSlots: [...(data.reminders?.mutedSlots ?? [])],
      bedtimeNudge: data.reminders?.bedtimeNudge ?? true,
    };
  }

  static empty() {
    return new RoutineBook();
  }

  static fromJSON(data) {
    return new RoutineBook(data ?? {});
  }

  get isSetUp() {
    return this.template != null;
  }

  toJSON() {
    return {
      template: this.template ? cloneTemplate(this.template) : null,
      dayOverrides: this.dayOverrides.map(cloneDayOverride),
      weekdayRules: this.weekdayRules.map(cloneRule),
      walks: Object.fromEntries(Object.entries(this.walks).map(([key, list]) => [key, list.map(cloneWalk)])),
      reminders: {
        isOn: this.reminders.isOn,
        mutedSlots: [...this.reminders.mutedSlots],
        bedtimeNudge: this.reminders.bedtimeNudge,
      },
    };
  }

  dayOverride(key) {
    return this.dayOverrides.find((item) => item.date === key) ?? null;
  }

  schedule(date) {
    if (!this.template) return null;
    const override = this.dayOverride(keyFor(date))?.overrides ?? null;
    return scheduleFor(date, this.template, this.weekdayRules, override);
  }

  baseSchedule(date) {
    if (!this.template) return null;
    return scheduleFor(date, this.template, this.weekdayRules, null);
  }

  allWalks(date, inputs, today = new Date()) {
    const schedule = this.schedule(date);
    const base = this.baseSchedule(date);
    if (!schedule || !base) return [];
    const stored = (this.walks[schedule.key] ?? []).map(cloneWalk);
    if (schedule.key < keyFor(today) && stored.length) return stored;

    const result = generate(schedule, base, inputs).map((generated) => {
      const saved = stored.find((walk) => walk.id === generated.id);
      if (!saved) return generated;
      const walk = { ...generated };
      walk.status = saved.status;
      walk.actualSteps = saved.actualSteps;
      walk.name = saved.name;
      walk.isEdited = saved.isEdited;
      walk.isRemoved = saved.isRemoved;
      walk.lengthLocked = saved.lengthLocked;
      if (saved.lengthLocked) {
        walk.minutes = saved.minutes;
        walk.plannedMinutes = saved.minutes;
      }
      const offset = saved.startTime - saved.anchorTime;
      if (offset !== 0) {
        const moved = generated.anchorTime + offset;
        const fits = placementProblem(moved, walk.minutes, schedule, []) == null;
        walk.startTime = fits ? moved : generated.anchorTime;
      }
      return walk;
    });
    result.push(...stored.filter((walk) => walk.isUserAdded).map(cloneWalk));
    result.sort((a, b) => a.startTime - b.startTime);
    return result;
  }

  plan(date, inputs, now = new Date()) {
    const schedule = this.schedule(date);
    if (!schedule) return null;
    const visible = this.allWalks(date, inputs, now).filter((walk) => !walk.isRemoved);
    const distribution = distribute(visible, inputs);
    distribution.note = shortfallNote(distribution.covered, distribution.goal);
    const states = statesFor(distribution.walks, schedule, now);
    const done = distribution.walks
      .filter((walk) => states[walk.id] === 'done')
      .reduce((sum, walk) => sum + (walk.actualSteps ?? walk.targetSteps), 0);
    return {
      schedule,
      distribution,
      states,
      done,
      walks: distribution.walks,
      activeCount: distribution.walks.filter((walk) => walk.status !== 'skipped').length,
      nextWalk: distribution.walks.find((walk) => states[walk.id] === 'upNext') ?? null,
    };
  }

  stateOf(plan, walk) {
    return plan.states[walk.id] ?? 'planned';
  }

  hasEdits(key) {
    const override = this.dayOverride(key);
    if (override && !isEmptyOverride(override.overrides)) return true;
    return (this.walks[key] ?? []).some((walk) => (
      walk.isUserAdded || walk.isEdited || walk.isRemoved || walk.lengthLocked || walk.status === 'skipped'
    ));
  }

  setTemplate(template) {
    const value = cloneTemplate(template);
    value.breaks = [...value.breaks].sort((a, b) => a.start - b.start);
    value.updatedAt = new Date().toISOString();
    this.template = value;
  }

  editBlock(date, change, scope) {
    const fields = normalizeOverride(change);
    if (isEmptyOverride(fields) || !this.template) return;
    const key = keyFor(date);
    const weekday = weekdayOf(date);

    if (scope === Scope.day) {
      const existing = this.dayOverride(key)?.overrides ?? emptyOverride();
      this.upsertDayOverride(key, merged(fields, existing));
      return;
    }

    if (scope === Scope.weekday) {
      this.weekdayRules.push({
        id: newId(),
        weekday,
        effectiveFrom: key,
        overrides: fields,
        createdAt: new Date().toISOString(),
      });
      this.dayOverrides = this.dayOverrides.flatMap((item) => {
        if (item.date < key) return [item];
        const itemDate = dateFromKey(item.date);
        if (!itemDate || weekdayOf(itemDate) !== weekday) return [item];
        const overrides = removingFields(item.overrides, fields);
        return isEmptyOverride(overrides) ? [] : [{ ...item, overrides }];
      });
      return;
    }

    if (scope === Scope.everyDay) {
      const updated = applied(fields, this.template);
      if (fields.dayOff != null) {
        const days = new Set(updated.workDays);
        if (fields.dayOff) days.delete(weekday);
        else days.add(weekday);
        updated.workDays = [...days].sort((a, b) => a - b);
      }
      updated.updatedAt = new Date().toISOString();
      this.template = updated;
      this.weekdayRules = this.weekdayRules.flatMap((rule) => {
        const overrides = removingFields(rule.overrides, fields);
        return isEmptyOverride(overrides) ? [] : [{ ...rule, overrides }];
      });
      this.dayOverrides = this.dayOverrides.flatMap((item) => {
        if (item.date < key) return [item];
        const overrides = removingFields(item.overrides, fields);
        return isEmptyOverride(overrides) ? [] : [{ ...item, overrides }];
      });
    }
  }

  upsertDayOverride(key, overrides) {
    this.dayOverrides = this.dayOverrides.filter((item) => item.date !== key);
    if (isEmptyOverride(overrides)) return;
    this.dayOverrides.push({
      id: newId(),
      date: key,
      overrides: normalizeOverride(overrides),
      createdAt: new Date().toISOString(),
    });
  }

  resetDay(key) {
    this.dayOverrides = this.dayOverrides.filter((item) => item.date !== key);
    delete this.walks[key];
  }

  materialize(date, inputs, today = new Date()) {
    const key = keyFor(date);
    if (this.walks[key] != null || !this.isSetUp) return false;
    const list = this.allWalks(date, inputs, today);
    if (!list.length) return false;
    this.walks[key] = list.map(cloneWalk);
    return true;
  }

  editWalks(date, inputs, today, transform) {
    const list = this.allWalks(date, inputs, today);
    transform(list);
    this.walks[keyFor(date)] = list.map(cloneWalk).sort((a, b) => a.startTime - b.startTime);
  }

  setStatus(status, id, date, inputs, today = new Date()) {
    this.editWalks(date, inputs, today, (list) => {
      const index = list.findIndex((walk) => walk.id === id);
      if (index < 0) return;
      list[index].status = status;
    });
  }

  addWalk(date, start, minutes, name, inputs, today = new Date()) {
    const schedule = this.schedule(date);
    if (!schedule) throw new RoutineProblem('Set up your routine first.');
    const current = this.plan(date, inputs, today)?.walks ?? [];
    const problem = placementProblem(start, minutes, schedule, current);
    if (problem) throw problem;
    const trimmed = name?.trim() ?? '';
    const walk = {
      id: newId(),
      date: schedule.key,
      slot: Slot.custom,
      slotIndex: 0,
      startTime: start,
      anchorTime: start,
      minutes,
      maxMinutes: minutes,
      plannedMinutes: minutes,
      targetSteps: minutes * STEPS_PER_MINUTE,
      status: 'planned',
      actualSteps: null,
      isUserAdded: true,
      name: trimmed ? trimmed : null,
      lengthLocked: true,
      isEdited: true,
      isRemoved: false,
      makeUpFor: null,
    };
    this.editWalks(date, inputs, today, (list) => list.push(walk));
    return cloneWalk(walk);
  }

  updateWalk(id, date, start, minutes, name, inputs, today = new Date()) {
    const schedule = this.schedule(date);
    if (!schedule) return;
    const current = this.plan(date, inputs, today)?.walks ?? [];
    const existing = current.find((walk) => walk.id === id);
    if (!existing) return;
    const length = minutes ?? existing.plannedMinutes;
    const problem = placementProblem(start, length, schedule, current, id);
    if (problem) throw problem;
    const trimmed = name == null ? null : name.trim();
    this.editWalks(date, inputs, today, (list) => {
      const index = list.findIndex((walk) => walk.id === id);
      if (index < 0) return;
      list[index].startTime = start;
      if (list[index].isUserAdded) list[index].anchorTime = start;
      if (minutes != null && (minutes !== existing.plannedMinutes || list[index].lengthLocked)) {
        list[index].minutes = minutes;
        list[index].maxMinutes = minutes;
        list[index].plannedMinutes = minutes;
        list[index].lengthLocked = true;
      }
      if (trimmed != null) list[index].name = trimmed ? trimmed : null;
      list[index].isEdited = true;
    });
  }

  moveWalk(id, date, start, inputs, today = new Date()) {
    this.updateWalk(id, date, start, null, null, inputs, today);
  }

  deleteWalk(id, date, inputs, today = new Date()) {
    this.editWalks(date, inputs, today, (list) => {
      const index = list.findIndex((walk) => walk.id === id);
      if (index < 0) return;
      if (list[index].isUserAdded) list.splice(index, 1);
      else list[index].isRemoved = true;
    });
  }

  makeUp(missedId, date, inputs, now = new Date()) {
    const current = this.plan(date, inputs, now);
    const missed = current?.walks.find((walk) => walk.id === missedId);
    if (!current || !missed) throw new RoutineProblem("That walk isn't on the board anymore.");
    if (current.walks.some((walk) => walk.makeUpFor === missedId)) {
      throw new RoutineProblem("Already made up — it's on the timeline.");
    }
    const shortSteps = Math.max(missed.targetSteps - (missed.actualSteps ?? 0), 500);
    const minutes = Math.min(MAX_WALK_MINUTES, Math.max(10, roundedUp(Math.trunc(shortSteps / STEPS_PER_MINUTE))));
    const isToday = current.schedule.key === keyFor(now);
    const nowMinutes = isToday ? minutesSinceStart(current.schedule.date, now) : null;
    const start = makeUpStart(minutes, current.schedule, current.walks, nowMinutes);
    if (start == null) throw new RoutineProblem('No room left before bedtime today.');
    const walk = this.addWalk(date, start, minutes, 'Make-up walk', inputs, now);
    walk.makeUpFor = missedId;
    walk.slot = Slot.evening;
    this.editWalks(date, inputs, now, (list) => {
      const index = list.findIndex((item) => item.id === walk.id);
      if (index >= 0) list[index] = walk;
    });
    return cloneWalk(walk);
  }

  recordActual(steps, id, date, inputs, today = new Date()) {
    const key = keyFor(date);
    const current = this.walks[key] ?? this.allWalks(date, inputs, today);
    const existing = current.find((walk) => walk.id === id);
    if (!existing || !(steps > (existing.actualSteps ?? -1))) return false;
    this.editWalks(date, inputs, today, (list) => {
      const index = list.findIndex((walk) => walk.id === id);
      if (index < 0) return;
      list[index].actualSteps = steps;
    });
    return true;
  }

  reminderSchedule(days, inputsFor, isGoalMet, now = new Date()) {
    if (!this.isSetUp || !this.reminders.isOn) return [];
    const output = [];
    for (const day of days) {
      const plan = this.plan(day, inputsFor(day), now);
      if (!plan) continue;
      for (const walk of plan.walks) {
        const state = plan.states[walk.id] ?? 'planned';
        if ((state !== 'planned' && state !== 'upNext') || !allowsSlot(this.reminders, walk.slot)) continue;
        const fireDate = dateForMinutes(walk.startTime - 5, plan.schedule.date);
        if (!(fireDate > now)) continue;
        output.push({
          id: `walkingout.routine.${walk.id}`,
          fireDate,
          title: `${displayName(walk)} in 5 — ${formatSteps(walk.targetSteps)} steps.`,
          body: `${formatTime(walk.startTime)} · ${walk.plannedMinutes} min. No excuses.`,
        });
      }
      if (this.reminders.bedtimeNudge && !isGoalMet(day)) {
        const fireDate = dateForMinutes(plan.schedule.bed - 120, plan.schedule.date);
        if (fireDate > now) {
          output.push({
            id: `walkingout.routine.bed.${plan.schedule.key}`,
            fireDate,
            title: 'Still short today?',
            body: "Bedtime's two hours out. One more walk keeps the streak alive.",
          });
        }
      }
    }
    return output.sort((a, b) => a.fireDate - b.fireDate).slice(0, 48);
  }
}

function formatSteps(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatTime(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function cloneDayOverride(item) {
  return {
    id: item.id,
    date: item.date,
    overrides: normalizeOverride(item.overrides),
    createdAt: item.createdAt,
  };
}

function cloneRule(rule) {
  return {
    id: rule.id,
    weekday: rule.weekday,
    effectiveFrom: rule.effectiveFrom,
    overrides: normalizeOverride(rule.overrides),
    createdAt: rule.createdAt,
  };
}

export { standardReminders };
