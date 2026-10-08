/**
 * Port of WalkingoutTests/RoutineTests.swift.
 * "Now" is Sunday 4 Oct 2026, 8 AM. The week under test is Mon 5 – Sun 11 Oct 2026.
 * Default setup: 6 AM – 10 PM, work 8–5 Mon–Fri, 30-min lunch at noon, two 15-min breaks.
 * Goal 12,000 with 3,000 everyday steps.
 */

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { dateFromParts, keyFor } from '../apps/walkingout/engine/calendar.js';
import { RoutineBook } from '../apps/walkingout/engine/book.js';
import { RoutineProblem, Scope, Slot, standardTemplate } from '../apps/walkingout/engine/models.js';
import { MAX_WALK_MINUTES, formatNumber, shortfallNote } from '../apps/walkingout/engine/planner.js';

const inputs = { goal: 12_000, ambient: 3_000 };

function date(day, hour = 0) {
  return dateFromParts({ year: 2026, month: 10, day, hour });
}

const now = date(4, 8);

function freshBook() {
  const book = RoutineBook.empty();
  book.setTemplate(standardTemplate());
  return book;
}

function plan(book, day) {
  const result = book.plan(date(day), inputs, now);
  assert.ok(result, `expected a plan for Oct ${day}`);
  return result;
}

function walk(dayPlan, slot, index = 0) {
  const found = dayPlan.walks.find((item) => item.slot === slot && item.slotIndex === index);
  assert.ok(found, `expected a ${slot} walk at index ${index}`);
  return found;
}

describe('Daily routine', () => {
  test('defaultSetupBuildsTheWorkdayWalks', () => {
    const tuesday = plan(freshBook(), 6);
    assert.deepEqual(tuesday.walks.map((item) => item.slot), [
      Slot.morning, Slot.breakTime, Slot.lunch, Slot.breakTime, Slot.afterWork,
    ]);
    assert.deepEqual(tuesday.walks.map((item) => item.startTime), [390, 601, 720, 901, 1035]);
    assert.ok(tuesday.walks.every((item) => item.plannedMinutes <= MAX_WALK_MINUTES));
    assert.equal(tuesday.distribution.note, null);
    assert.equal(tuesday.distribution.planned, 8_950);

    const saturday = plan(freshBook(), 10);
    assert.deepEqual(saturday.walks.map((item) => item.slot), [Slot.morning, Slot.evening]);
    assert.equal(saturday.schedule.isWorkDay, false);
  });

  test('noLunchWednesdayOnlyChangesWednesday', () => {
    const book = freshBook();
    const before = plan(book, 7);
    book.editBlock(date(7), { takesLunch: false }, Scope.day);
    const after = plan(book, 7);

    assert.equal(after.walks.some((item) => item.slot === Slot.lunch), false);
    assert.ok(walk(after, Slot.morning).targetSteps > walk(before, Slot.morning).targetSteps);
    assert.ok(walk(after, Slot.afterWork).targetSteps > walk(before, Slot.afterWork).targetSteps);
    assert.ok(after.walks.every((item) => item.plannedMinutes <= MAX_WALK_MINUTES));
    assert.notEqual(after.distribution.note, null);

    assert.equal(plan(book, 6).walks.some((item) => item.slot === Slot.lunch), true);
    assert.equal(plan(book, 8).walks.some((item) => item.slot === Slot.lunch), true);
  });

  test('movingThursdayLunchMovesOnlyThatLunchWalk', () => {
    const book = freshBook();
    book.editBlock(date(8), { lunchStart: 13 * 60 + 30 }, Scope.day);
    assert.equal(walk(plan(book, 8), Slot.lunch).startTime, 810);
    assert.equal(walk(plan(book, 7), Slot.lunch).startTime, 720);
    assert.equal(walk(plan(book, 15), Slot.lunch).startTime, 720);
  });

  test('skippingRedistributesAndUndoRestores', () => {
    const book = freshBook();
    const original = plan(book, 5);
    const morning = walk(original, Slot.morning);

    book.setStatus('skipped', morning.id, date(5), inputs, now);
    const skipped = plan(book, 5);
    assert.equal(book.stateOf(skipped, morning), 'skipped');
    assert.ok(walk(skipped, Slot.lunch).targetSteps > walk(original, Slot.lunch).targetSteps);
    assert.ok(walk(skipped, Slot.afterWork).targetSteps > walk(original, Slot.afterWork).targetSteps);
    const active = skipped.walks
      .filter((item) => item.status !== 'skipped')
      .reduce((sum, item) => sum + item.targetSteps, 0);
    assert.equal(skipped.distribution.planned, active);

    book.setStatus('planned', morning.id, date(5), inputs, now);
    assert.deepEqual(plan(book, 5).distribution, original.distribution);
  });

  test('addingASaturdayEveningWalk', () => {
    const book = freshBook();
    const before = plan(book, 10);
    const added = book.addWalk(date(10), 19 * 60, 20, null, inputs, now);
    const after = plan(book, 10);

    const onTimeline = after.walks.find((item) => item.id === added.id);
    assert.ok(onTimeline);
    assert.equal(onTimeline.startTime, 1_140);
    assert.equal(onTimeline.targetSteps, 2_000);
    assert.equal(after.distribution.planned, before.distribution.planned + 2_000);
  });

  test('dayOffNextTuesdayFromTheCalendar', () => {
    const book = freshBook();
    book.editBlock(date(13), { dayOff: true }, Scope.day);
    const tuesday = plan(book, 13);

    assert.equal(tuesday.schedule.isWorkDay, false);
    assert.deepEqual(tuesday.walks.map((item) => item.slot), [Slot.morning, Slot.evening]);
    assert.equal(book.hasEdits(keyFor(date(13))), true);
    assert.equal(book.hasEdits(keyFor(date(12))), false);
    assert.equal(plan(book, 6).schedule.isWorkDay, true);
  });

  test('applyToAllFridaysLeavesPastFridaysAlone', () => {
    const book = freshBook();
    book.editBlock(date(9), { lunchStart: 13 * 60 }, Scope.weekday);

    assert.equal(walk(plan(book, 9), Slot.lunch).startTime, 780);
    assert.equal(walk(plan(book, 16), Slot.lunch).startTime, 780);
    assert.equal(walk(plan(book, 23), Slot.lunch).startTime, 780);
    assert.equal(walk(plan(book, 2), Slot.lunch).startTime, 720);
    assert.equal(walk(plan(book, 8), Slot.lunch).startTime, 720);
  });

  test('resetToDefaultClearsTheDay', () => {
    const book = freshBook();
    const key = keyFor(date(7));
    book.editBlock(date(7), { takesLunch: false }, Scope.day);
    const morning = walk(plan(book, 7), Slot.morning);
    book.setStatus('skipped', morning.id, date(7), inputs, now);
    assert.equal(book.hasEdits(key), true);

    book.resetDay(key);
    assert.equal(book.dayOverride(key), null);
    assert.equal(book.walks[key], undefined);
    assert.equal(book.hasEdits(key), false);
    const rebuilt = plan(book, 7);
    assert.deepEqual(rebuilt.walks.map((item) => item.slot), [
      Slot.morning, Slot.breakTime, Slot.lunch, Slot.breakTime, Slot.afterWork,
    ]);
    assert.equal(book.stateOf(rebuilt, walk(rebuilt, Slot.morning)), 'planned');
  });

  test('walksCantDropIntoWorkTimeOrBedtime', () => {
    const book = freshBook();
    const breakWalk = walk(plan(book, 5), Slot.breakTime);
    assert.throws(
      () => book.moveWalk(breakWalk.id, date(5), 11 * 60, inputs, now),
      (error) => error instanceof RoutineProblem,
    );
    assert.throws(
      () => book.addWalk(date(5), 21 * 60 + 40, 10, null, inputs, now),
      (error) => error instanceof RoutineProblem,
    );
  });

  test('movedWalkTravelsWithItsBlock', () => {
    const book = freshBook();
    const lunch = walk(plan(book, 5), Slot.lunch);
    book.moveWalk(lunch.id, date(5), 730, inputs, now);
    book.editBlock(date(5), { lunchStart: 13 * 60 }, Scope.day);
    assert.equal(walk(plan(book, 5), Slot.lunch).startTime, 790);
  });

  test('makeUpFailureSurfacesItsOwnMessage', () => {
    const book = freshBook();
    const morning = walk(plan(book, 4), Slot.morning);
    const late = dateFromParts({ year: 2026, month: 10, day: 4, hour: 21, minute: 30 });
    assert.throws(
      () => book.makeUp(morning.id, date(4), inputs, late),
      (error) => {
        assert.ok(error instanceof RoutineProblem);
        assert.equal(error.message, 'No room left before bedtime today.');
        return true;
      },
    );

    const tuesday = walk(plan(book, 6), Slot.morning);
    const added = book.makeUp(tuesday.id, date(6), inputs, now);
    assert.equal(added.makeUpFor, tuesday.id);
    assert.throws(
      () => book.makeUp(tuesday.id, date(6), inputs, now),
      (error) => {
        assert.ok(error instanceof RoutineProblem);
        assert.equal(error.message, "Already made up — it's on the timeline.");
        return true;
      },
    );
  });

  test('shortfallNoteWording', () => {
    const covered = formatNumber(9_800);
    const goal = formatNumber(12_000);
    assert.equal(shortfallNote(9_800, 12_000), `Routine covers ${covered} of ${goal} — add a walk?`);
    assert.equal(shortfallNote(12_000, 12_000), null);
  });
});
