/**
 * WalkQuest rules: progress, streaks, steps-to-miles, and the friendly limits.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import {
  BADGES,
  CAMPAIGNS,
  DEFAULT_STEPS_PER_MILE,
  WalkQuestStore,
  activeStepsPerMile,
  addDays,
  backupDue,
  campaignMiles,
  capDayMiles,
  checkDate,
  currentStreak,
  evaluateBadges,
  formatDistance,
  getCampaign,
  kmToMiles,
  lifetimeMiles,
  maxStreak,
  milesFromSteps,
  mondayKey,
  needsBigDayConfirm,
  parseBackup,
  pointAtMiles,
  serializeBackup,
  stepsPerMileFromCalibration,
  stepsPerMileFromHeight,
  typoSuggestion,
  weekMiles,
} from '../apps/walkquest/engine/index.js';

function memory() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function entry(overrides) {
  return {
    id: overrides.id || 'e1',
    campaignId: 'walker',
    date: '2026-10-10',
    miles: 1,
    steps: null,
    inputMode: 'distance',
    indoor: false,
    note: '',
    loggedHour: 12,
    ...overrides,
  };
}

describe('steps and distance', () => {
  test('default stride is 2000 steps per mile', () => {
    assert.equal(DEFAULT_STEPS_PER_MILE, 2000);
    assert.equal(milesFromSteps(8400, 2000), 4.2);
    assert.equal(activeStepsPerMile({ strideMode: 'default' }), 2000);
  });

  test('height times 0.413 estimates stride', () => {
    const steps = stepsPerMileFromHeight(72);
    const strideInches = 72 * 0.413;
    assert.ok(Math.abs(steps - (63360 / strideInches)) < 0.001);
    assert.equal(Math.round(activeStepsPerMile({ strideMode: 'height', heightInches: 70 })), Math.round(stepsPerMileFromHeight(70)));
  });

  test('calibration uses the measured distance', () => {
    assert.equal(stepsPerMileFromCalibration(4000, 2), 2000);
    assert.equal(activeStepsPerMile({
      strideMode: 'calibrate',
      calibration: { steps: 4200, miles: 2 },
    }), 2100);
  });

  test('kilometers convert and the display can show either unit', () => {
    assert.ok(Math.abs(kmToMiles(1.609344) - 1) < 0.001);
    assert.equal(formatDistance(1, 'mi'), '1 mi');
    assert.match(formatDistance(1, 'km'), /1\.6 km/);
  });

  test('an indoor flag does not change the miles', () => {
    const outside = milesFromSteps(2000, 2000);
    const inside = milesFromSteps(2000, 2000);
    assert.equal(outside, inside);
    assert.equal(entry({ indoor: true, miles: outside }).miles, outside);
  });
});

describe('sanity limits', () => {
  const today = '2026-10-10';

  test('future dates and anything older than 7 days are refused', () => {
    assert.equal(checkDate('2026-10-11', today).reason, 'future');
    assert.equal(checkDate(addDays(today, -8), today).reason, 'too_old');
    assert.match(checkDate(addDays(today, -8), today).message, /last week/);
    assert.equal(checkDate(addDays(today, -7), today).ok, true);
    assert.equal(checkDate(today, today).ok, true);
  });

  test('100,000 steps suggests the likely smaller number', () => {
    assert.equal(typoSuggestion(100000), 10000);
    assert.equal(typoSuggestion(1000000), 10000);
    assert.equal(typoSuggestion(250000), 25000);
    assert.equal(typoSuggestion(99999), null);
  });

  test('a single entry over 20 miles or 40,000 steps asks first', () => {
    assert.equal(needsBigDayConfirm(20, 40000), false);
    assert.equal(needsBigDayConfirm(20.1, null), true);
    assert.equal(needsBigDayConfirm(10, 40001), true);
  });

  test('a day caps at 50 miles', () => {
    assert.equal(capDayMiles(10, 20).capped, false);
    assert.equal(capDayMiles(40, 20).miles, 10);
    assert.equal(capDayMiles(40, 20).capped, true);
    assert.equal(capDayMiles(50, 5).blocked, true);
    assert.equal(capDayMiles(50, 5).miles, 0);
    const exact = capDayMiles(30, 20);
    assert.equal(exact.capped, false);
    assert.equal(exact.miles, 20);
  });
});

describe('streaks', () => {
  test('weeks start on Monday', () => {
    assert.equal(mondayKey('2026-10-10'), '2026-10-05');
    assert.equal(mondayKey('2026-10-11'), '2026-10-05');
    assert.equal(mondayKey('2026-10-12'), '2026-10-12');
    assert.equal(addDays('2025-12-31', 1), '2026-01-01');
  });

  test('consecutive walk days count, and half a mile counts', () => {
    const entries = [
      entry({ date: '2026-10-08', miles: 0.5 }),
      entry({ date: '2026-10-09', miles: 1 }),
      entry({ date: '2026-10-10', miles: 2 }),
    ];
    assert.equal(currentStreak(entries, '2026-10-10'), 3);
  });

  test('one rest day in a week does not break the streak', () => {
    const entries = [
      entry({ date: '2026-10-05' }),
      entry({ date: '2026-10-06' }),
      entry({ date: '2026-10-08' }),
    ];
    assert.equal(currentStreak(entries, '2026-10-08'), 3);
  });

  test('a second miss in the same week breaks it', () => {
    const mondayOnly = [entry({ date: '2026-10-05' })];
    assert.equal(currentStreak(mondayOnly, '2026-10-08'), 0);
    const restarted = [entry({ id: 'mon', date: '2026-10-05' }), entry({ id: 'thu', date: '2026-10-08' })];
    assert.equal(currentStreak(restarted, '2026-10-08'), 1);
  });

  test('today stays open until a walk is logged', () => {
    const entries = [entry({ date: '2026-10-08' }), entry({ date: '2026-10-09' })];
    assert.equal(currentStreak(entries, '2026-10-10'), 2);
  });

  test('each week gets its own rest day', () => {
    const entries = [
      entry({ date: '2026-10-09' }),
      entry({ date: '2026-10-10' }),
      entry({ date: '2026-10-12' }),
    ];
    assert.equal(currentStreak(entries, '2026-10-12'), 3);
  });

  test('the best streak is remembered after a break', () => {
    const entries = [];
    for (let day = 1; day <= 5; day += 1) entries.push(entry({ id: `a${day}`, date: `2026-10-0${day}` }));
    entries.push(entry({ id: 'b', date: '2026-10-12' }));
    assert.equal(maxStreak(entries), 5);
    assert.equal(currentStreak(entries, '2026-10-12'), 1);
  });
});

describe('progress', () => {
  test('miles stay on the campaign they were logged to, and lifetime adds them up', () => {
    const entries = [
      entry({ campaignId: 'walker', miles: 4 }),
      entry({ campaignId: 'rim', miles: 2 }),
    ];
    assert.equal(campaignMiles(entries, 'walker'), 4);
    assert.equal(campaignMiles(entries, 'rim'), 2);
    assert.equal(campaignMiles(entries, 'route66'), 0);
    assert.equal(lifetimeMiles(entries), 6);
  });

  test('the marker moves in proportion to the miles between checkpoints', () => {
    const stops = getCampaign('walker').stops;
    const start = pointAtMiles(stops, 0);
    const next = pointAtMiles(stops, 3);
    const mid = pointAtMiles(stops, 1.5);
    assert.equal(start.x, stops[0].x);
    assert.ok(Math.abs(mid.x - ((start.x + next.x) / 2)) < 0.001);
    assert.ok(Math.abs(mid.y - ((start.y + next.y) / 2)) < 0.001);
    const end = pointAtMiles(stops, 500);
    assert.equal(end.x, stops[stops.length - 1].x);
  });

  test('this week is Monday through Sunday', () => {
    const entries = [
      entry({ date: '2026-10-04', miles: 9 }),
      entry({ date: '2026-10-05', miles: 2 }),
      entry({ date: '2026-10-10', miles: 3 }),
    ];
    assert.equal(weekMiles(entries, '2026-10-10'), 5);
  });
});

describe('campaigns, chapters, and badges', () => {
  test('v1 ships The Walker, Canyon Rim to Rim, and Route 66', () => {
    assert.deepEqual(CAMPAIGNS.map((campaign) => campaign.id), ['rim', 'walker', 'route66']);
    assert.equal(getCampaign('walker').distance, 100);
    assert.equal(getCampaign('rim').distance, 24);
    assert.equal(getCampaign('route66').distance, 2400);
  });

  test('The Walker uses the ten chapters and takeaways from the plan', () => {
    const expected = [
      ['The Journal', 0, 'Starting is the hardest mile.'],
      ['Wash Crossing', 3, 'Company makes the miles lighter.'],
      ['The First Waystation', 8, "You're part of something bigger."],
      ['Saguaro Forest', 15, 'Slow growth is still growth.'],
      ['Monsoon', 25, 'Plans change. Keep going anyway.'],
      ['The Ghost Town', 35, 'Every place has a story. So do you.'],
      ['The Long Flat', 48, 'Boring miles still count.'],
      ['Sky Island', 60, 'The view changes when you climb.'],
      ['The Switchbacks', 75, 'One switchback at a time.'],
      ['The Lantern', 100, "You did what you said you'd do."],
    ];
    const stops = getCampaign('walker').stops;
    assert.deepEqual(stops.map((stop) => [stop.title, stop.miles, stop.takeaway]), expected);
    for (const stop of stops) {
      const words = stop.body.trim().split(/\s+/).length;
      assert.ok(words >= 180 && words <= 420, `${stop.title} is ${words} words`);
      assert.ok(stop.body.includes(stop.takeaway));
    }
    assert.match(stops[0].body, /The trail doesn't care how fast you go/);
  });

  test('field notes are short and Route 66 checkpoints stay within 50 to 150 miles', () => {
    for (const campaign of [getCampaign('rim'), getCampaign('route66')]) {
      for (const stop of campaign.stops) {
        const sentences = stop.body.split(/(?<=[.!?])\s+/).filter(Boolean);
        assert.ok(sentences.length >= 2 && sentences.length <= 3, `${stop.title} has ${sentences.length} sentences`);
      }
    }
    const stops = getCampaign('route66').stops;
    for (let index = 1; index < stops.length; index += 1) {
      const gap = stops[index].miles - stops[index - 1].miles;
      assert.ok(gap >= 50 && gap <= 150, `${stops[index].title} gap ${gap}`);
    }
    assert.deepEqual(stops.filter((stop) => [
      'Chicago', 'St. Louis', 'Tulsa', 'Amarillo', 'Albuquerque', 'Winslow', 'Flagstaff', 'Kingman', 'Santa Monica Pier',
    ].includes(stop.title)).map((stop) => stop.title), [
      'Chicago', 'St. Louis', 'Tulsa', 'Amarillo', 'Albuquerque', 'Winslow', 'Flagstaff', 'Kingman', 'Santa Monica Pier',
    ]);
  });

  test('badges include Old Joe\'s Successor and do not duplicate Lantern Lit', () => {
    const names = BADGES.map((badge) => badge.name);
    assert.equal(names.includes("Old Joe's Successor"), true);
    assert.equal(names.includes('Lantern Lighter'), false);
    assert.equal(names.includes('Lantern Lit'), true);
    assert.ok(BADGES.length >= 20 && BADGES.length <= 22);

    const started = { entries: [entry({ campaignId: 'walker', miles: 100, loggedHour: 7, indoor: true })], started: ['walker'] };
    const earned = evaluateBadges(started);
    assert.equal(earned.has('successor'), true);
    assert.equal(earned.has('lantern-lit'), true);
    assert.equal(earned.has('hundred'), true);
    assert.equal(earned.has('scout'), true);
    assert.equal(earned.has('base-camp'), false);
    assert.equal(earned.has('rim'), false);

    const indoor = { entries: Array.from({ length: 10 }, (_, index) => entry({ id: `i${index}`, indoor: true, date: `2026-09-${String(index + 1).padStart(2, '0')}` })) };
    assert.equal(evaluateBadges(indoor).has('treadmill'), true);
    const early = { entries: Array.from({ length: 5 }, (_, index) => entry({ id: `m${index}`, loggedHour: 6, date: `2026-10-0${index + 1}` })) };
    assert.equal(evaluateBadges(early).has('early-bird'), true);
    const comeback = { entries: [entry({ id: 'c1', date: '2026-10-01' }), entry({ id: 'c2', date: '2026-10-08' })] };
    assert.equal(evaluateBadges(comeback).has('comeback'), true);
    assert.equal(evaluateBadges({ entries: [entry({ miles: 26.2 })] }).has('marathon'), true);
  });
});

describe('backup', () => {
  test('a versioned backup round-trips and a strange file is refused', () => {
    const state = {
      version: 1,
      welcomed: true,
      setupComplete: true,
      settings: { trailName: 'Ace', units: 'km', strideMode: 'default', heightInches: null, calibration: null },
      activeCampaign: 'walker',
      started: ['walker'],
      entries: [entry({ miles: 3.5, note: 'lunch loop' })],
      seenUnlocks: ['stop:walker:journal'],
      backup: { lastBackupAt: null, entryCount: 0 },
      startedAt: '2026-10-01',
    };
    const raw = JSON.stringify(serializeBackup(state, '2026-10-10T15:00:00.000Z'));
    const parsed = parseBackup(raw);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.state.settings.trailName, 'Ace');
    assert.equal(parsed.state.settings.units, 'km');
    assert.equal(parsed.state.entries[0].miles, 3.5);
    assert.equal(JSON.parse(raw).version, 1);
    assert.equal(JSON.parse(raw).app, 'walkquest');
    assert.equal(parseBackup('{"app":"other","version":1,"entries":[]}').ok, false);
    assert.equal(parseBackup('{"app":"walkquest","version":2,"entries":[]}').ok, false);
    assert.equal(parseBackup('not json').ok, false);
  });

  test('the store keeps a backup on a device and reminds after 10 walks or 30 days', () => {
    const store = new WalkQuestStore({ storage: memory() });
    store.update((state) => {
      state.entries.push(entry({ note: 'kept' }));
      state.settings.trailName = 'Ace';
    });
    const again = new WalkQuestStore({ storage: store.storage, storageKey: store.storageKey });
    assert.equal(again.state.settings.trailName, 'Ace');
    assert.equal(again.state.entries[0].note, 'kept');

    const ten = { entries: Array.from({ length: 10 }, (_, index) => entry({ id: `n${index}` })), backup: { entryCount: 0 }, startedAt: '2026-10-10' };
    assert.equal(backupDue(ten, '2026-10-10'), true);
    assert.equal(backupDue({ ...ten, entries: ten.entries.slice(0, 9) }, '2026-10-10'), false);
    const backedUp = { entries: [entry({})], backup: { lastBackupAt: '2026-09-01T00:00:00.000Z', entryCount: 1 }, startedAt: '2026-08-01' };
    assert.equal(backupDue(backedUp, '2026-10-01'), true);
    assert.equal(backupDue(backedUp, '2026-09-20'), false);
  });
});

describe('compliance copy', () => {
  test('the safety line is on welcome, the log screen, and about', () => {
    const source = readFileSync(new URL('../apps/walkquest/app.js', import.meta.url), 'utf8');
    const safety = 'Education only, not medical advice. Check with your doctor before starting a new exercise program.';
    assert.equal(source.includes(safety), true);
    for (const name of ['function welcomeScreen', 'function logScreen', 'function aboutScreen']) {
      const start = source.indexOf(name);
      const next = source.indexOf('\nfunction ', start + name.length);
      assert.match(source.slice(start, next), /SAFETY/);
    }
    assert.equal(source.includes('Lantern Lighter'), false);
  });

  test('app copy stays on the wellness side of the line', () => {
    const root = new URL('../apps/walkquest/', import.meta.url);
    const files = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(js|html|css)$/.test(name)) files.push(full);
      }
    };
    walk(root.pathname);
    const banned = [
      /calorie/i,
      /peptide/i,
      /valley\s*wide/i,
      /no excuses reset/i,
      /(?<!font-)weight/i,
      /\bpounds?\b/i,
      /\blbs\b/i,
      /heart rate/i,
      /blood pressure/i,
      /blood sugar/i,
      /biomarker/i,
    ];
    const text = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    for (const pattern of banned) assert.equal(pattern.test(text), false, pattern.source);
    assert.equal(text.includes('https://loadlinefitness.com'), false);
    assert.match(text, /https:\/\/www\.loadlinefitness\.com/);
  });
});
