/**
 * Browser store. The book is the same JSON the planner reads. Goal, everyday
 * steps, and typed daily totals live beside it because a website can't read
 * a phone's step counter.
 */

import { keyFor } from './calendar.js';
import { RoutineBook } from './book.js';
import { DEFAULT_AMBIENT } from './planner.js';

const STORAGE_KEY = 'walkingout-routine';

export class RoutineStore {
  constructor(options = {}) {
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    this.storageKey = options.storageKey ?? STORAGE_KEY;
    this.book = RoutineBook.empty();
    this.goal = 12000;
    this.ambient = DEFAULT_AMBIENT;
    this.dailySteps = {};
    this.onChange = options.onChange ?? null;
    this.load();
  }

  get isSetUp() {
    return this.book.isSetUp;
  }

  load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.book = RoutineBook.fromJSON(data.book ?? data);
      if (Number.isFinite(data.goal)) this.goal = data.goal;
      if (Number.isFinite(data.ambient)) this.ambient = data.ambient;
      this.dailySteps = data.dailySteps && typeof data.dailySteps === 'object' ? { ...data.dailySteps } : {};
    } catch {
      this.book = RoutineBook.empty();
    }
  }

  save() {
    if (!this.storage) return;
    const payload = {
      version: 1,
      book: this.book.toJSON(),
      goal: this.goal,
      ambient: this.ambient,
      dailySteps: this.dailySteps,
    };
    this.storage.setItem(this.storageKey, JSON.stringify(payload));
  }

  update(transform) {
    const copy = RoutineBook.fromJSON(this.book.toJSON());
    transform(copy);
    if (JSON.stringify(copy.toJSON()) === JSON.stringify(this.book.toJSON())) return;
    this.book = copy;
    this.save();
    this.onChange?.();
  }

  reset() {
    this.book = RoutineBook.empty();
    this.dailySteps = {};
    this.save();
    this.onChange?.();
  }

  inputsFor() {
    return { goal: Math.max(0, Math.round(this.goal)), ambient: Math.max(0, Math.round(this.ambient)) };
  }

  plan(date, now = new Date()) {
    return this.book.plan(date, this.inputsFor(), now);
  }

  isGoalMet(date) {
    return (this.dailySteps[keyFor(date)] ?? 0) >= this.inputsFor().goal;
  }

  stepsOn(date) {
    return this.dailySteps[keyFor(date)] ?? 0;
  }

  setDailySteps(date, steps) {
    const key = keyFor(date);
    const value = Math.max(0, Math.round(Number(steps) || 0));
    if (this.dailySteps[key] === value) return;
    this.dailySteps[key] = value;
    this.save();
    this.onChange?.();
  }

  setGoal(goal, ambient) {
    const nextGoal = Math.max(0, Math.round(Number(goal) || 0));
    const nextAmbient = Math.max(0, Math.round(Number(ambient) || 0));
    if (nextGoal === this.goal && nextAmbient === this.ambient) return;
    this.goal = nextGoal;
    this.ambient = nextAmbient;
    this.save();
    this.onChange?.();
  }

  open(date, today = new Date()) {
    const copy = RoutineBook.fromJSON(this.book.toJSON());
    if (!copy.materialize(date, this.inputsFor(), today)) return;
    this.book = copy;
    this.save();
  }
}
