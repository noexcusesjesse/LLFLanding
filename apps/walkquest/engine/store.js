/**
 * On-device store. Nothing here is sent to LoadLine.
 */

import { defaultState, parseBackup } from './backup.js';

const STORAGE_KEY = 'walkquest';

export class WalkQuestStore {
  constructor(options = {}) {
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
    this.storageKey = options.storageKey ?? STORAGE_KEY;
    this.state = defaultState();
    this.onChange = options.onChange ?? null;
    this.load();
  }

  load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = parseBackup(raw);
      if (parsed.ok) this.state = parsed.state;
    } catch {
      this.state = defaultState();
    }
  }

  save() {
    if (!this.storage) return;
    try {
      const payload = { app: 'walkquest', version: 1, ...this.state };
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      /* private mode or a full disk; the screen can still be used this visit */
    }
  }

  update(mutator, options = {}) {
    const next = structuredClone(this.state);
    mutator(next);
    this.state = next;
    this.save();
    if (!options.silent) this.onChange?.();
  }

  replace(state, options = {}) {
    this.state = state;
    this.save();
    if (!options.silent) this.onChange?.();
  }

  reset(options = {}) {
    this.state = defaultState();
    if (this.storage) this.storage.removeItem(this.storageKey);
    if (!options.silent) this.onChange?.();
  }
}
