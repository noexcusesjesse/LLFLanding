import {
  DAY_NAMES,
  RoutineBook,
  RoutineProblem,
  RoutineStore,
  SLOT_ORDER,
  SLOT_REMINDER_LABELS,
  STEPS_PER_MINUTE,
  Scope,
  addDays,
  addMonths,
  blocksFor,
  cloneTemplate,
  daysInMonth,
  dayIndex,
  defaultBreaks,
  displayName,
  formatNumber,
  keyFor,
  longDate,
  makeUpStart,
  monthLabel,
  normalizedClock,
  snapped,
  standardTemplate,
  startOfDay,
  startOfMonth,
  timeLabel,
  timelineItems,
  weekdayName,
  weekdayOf,
  weekDays,
} from './engine/index.js';

const ICONS = {
  alarm: '<circle cx="12" cy="13" r="7"/><path d="M5 5l2.5 2M19 5l-2.5 2M12 10v3.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5"/>',
  briefcase: '<path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 13h18"/>',
  utensils: '<path d="M6 3v8a2 2 0 0 0 2 2V21M8 3v6M10 3v6M16 3c2 2 2 5 0 7v11"/>',
  cup: '<path d="M6 8h9v5a4 4 0 0 1-4 4H9a4 4 0 0 1-3-4V8z"/><path d="M15 9h2a3 3 0 0 1 0 6h-2M7 21h8"/>',
  bed: '<path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/><path d="M3 14h18M6 11V8a2 2 0 0 1 2-2h2"/>',
  sunrise: '<path d="M4 18h16M5 15a7 7 0 0 1 14 0"/><path d="M12 4v3M5 8l1.5 1.5M19 8l-1.5 1.5"/>',
  moon: '<path d="M16 3a8 8 0 1 0 5 13 7 7 0 0 1-5-13z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  pencil: '<path d="M4 20l4.2-1.1L19 8.1 15.9 5 5.1 15.8 4 20z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  bell: '<path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  play: '<path d="M8 6l11 6-11 6V6z"/>',
  skip: '<path d="M6 6l8 6-8 6V6zM16 6v12"/>',
  undo: '<path d="M8 8H4v4"/><path d="M4 12a8 8 0 1 0 2.5-5.8"/>',
};

const store = new RoutineStore();
const ui = {
  selected: startOfDay(new Date()),
  now: new Date(),
  setup: null,
  sheet: null,
  confirm: null,
  toast: null,
  toastTimer: 0,
  shakeId: null,
};

store.onChange = () => {
  scheduleReminders();
  render();
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function timeValue(minutes) {
  const normalized = normalizedClock(minutes);
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function minutesFromTime(value) {
  const [hour, minute] = String(value).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return normalizedClock(hour * 60 + minute);
}

function slotIcon(slot) {
  return {
    morning: 'sunrise', break: 'cup', lunch: 'utensils', after_work: 'briefcase', evening: 'moon', custom: 'plus',
  }[slot] || 'plus';
}

function blockIcon(block) {
  if (block.kind === 'wake') return 'alarm';
  if (block.kind === 'work') return block.isOff ? 'sun' : 'briefcase';
  if (block.kind === 'lunch') return 'utensils';
  if (block.kind === 'break') return 'cup';
  return 'bed';
}

function btn(label, action, extra = '') {
  return `<button type="button" class="btn ${extra}" data-action="${action}">${label}</button>`;
}

function chip(label, on, action, extra = '') {
  return `<button type="button" class="chip${on ? ' on' : ''}" data-action="${action}" ${extra} aria-pressed="${on}">${esc(label)}</button>`;
}

function timeBox(title, field, minutes, owner) {
  return `<div class="time-box">
    <div class="time-head"><span class="kicker">${esc(title)}</span><span class="time-readout">${esc(timeLabel(minutes))}</span></div>
    <div class="time-controls">
      <button type="button" class="btn small" data-action="nudge" data-owner="${owner}" data-field="${field}" data-delta="-5" aria-label="5 minutes earlier">−5</button>
      <input type="time" aria-label="${esc(title)}" data-action="time" data-owner="${owner}" data-field="${field}" value="${timeValue(minutes)}">
      <button type="button" class="btn small" data-action="nudge" data-owner="${owner}" data-field="${field}" data-delta="5" aria-label="5 minutes later">+5</button>
    </div>
  </div>`;
}

function minuteBox(title, field, owner, value, options, min, max, custom) {
  const chips = options.map((option) => chip(`${option} min`, !custom && value === option, 'pick-minutes', `data-owner="${owner}" data-field="${field}" data-value="${option}"`)).join('');
  const customChip = chip('Custom', custom, 'custom-minutes', `data-owner="${owner}" data-field="${field}"`);
  const stepper = custom ? `<div class="stepper">
      <button type="button" class="btn small" data-action="step-minutes" data-owner="${owner}" data-field="${field}" data-delta="-5" data-min="${min}" data-max="${max}" aria-label="Shorter">−</button>
      <strong>${value} min</strong>
      <button type="button" class="btn small" data-action="step-minutes" data-owner="${owner}" data-field="${field}" data-delta="5" data-min="${min}" data-max="${max}" aria-label="Longer">+</button>
    </div>` : '';
  return `<div class="chip-box"><div class="kicker">${esc(title)}</div><div class="chips" style="margin-top:10px">${chips}${customChip}</div>${stepper}</div>`;
}

function toggleBox(title, detail, field, owner, checked) {
  return `<div class="toggle">
    <label class="checkline"><span>${esc(title)}</span>
      <input type="checkbox" data-action="toggle" data-owner="${owner}" data-field="${field}" ${checked ? 'checked' : ''}>
    </label>
    ${detail ? `<p class="fine" style="margin:0">${esc(detail)}</p>` : ''}
  </div>`;
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = `<div class="app-shell">${header()}${body()}</div>${sheetHtml()}`;
  document.getElementById('toasts').innerHTML = ui.toast ? toastView() : '';
  const dialog = root.querySelector('dialog');
  if (dialog) {
    dialog.showModal();
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTop();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeTop();
    });
  }
  bindGestures();
  if (ui.focusSteps) {
    document.querySelector(`[data-steps-for="${ui.focusSteps}"]`)?.focus();
    ui.focusSteps = null;
  }
}

function header() {
  return `<header class="app-header">
    <a class="brand-lockup" href="/"><img src="/assets/loadline-fitness-logo.jpg" alt="LoadLine Fitness"></a>
    <div class="header-actions">
      <a class="header-link" href="/apps">Apps</a>
      <button type="button" class="icon-button" data-action="open-reminders" aria-label="Reminders">${icon('bell')}</button>
    </div>
  </header>`;
}

function body() {
  if (ui.setup) return setupView();
  if (!store.isSetUp) return emptyView();
  return routineView();
}

function emptyView() {
  return `<main id="routine" class="center-empty">
    <p class="kicker">Walkingout</p>
    <h1 class="display-xl">No routine yet</h1>
    <p>Tell us when you're up, working, and eating. We'll slot the walks in.</p>
    ${btn(`${icon('plus')} Set up your routine`, 'open-setup', 'primary')}
  </main>`;
}

function setupView() {
  const setup = ui.setup;
  const step = setup.step;
  return `<main id="routine">
    <div class="row-between">
      <div>
        <h1 class="display-xl">Your routine</h1>
        <p class="kicker">Step ${step + 1} of 7</p>
      </div>
      <button type="button" class="icon-button" data-action="close-setup" aria-label="Close">${icon('close')}</button>
    </div>
    <div class="progress" aria-hidden="true">${Array.from({ length: 7 }, (_, index) => `<span class="${index <= step ? 'on' : ''}"></span>`).join('')}</div>
    <div class="stack" style="margin-top:22px">${setupStep(setup)}</div>
    <div class="footer-bar">
      ${step > 0 ? btn('Back', 'setup-back', 'ghost') : ''}
      <button type="button" class="btn primary" data-action="setup-next" ${canAdvance(setup) ? '' : 'disabled'}>${setupNextTitle(setup)}</button>
    </div>
  </main>`;
}

function setupNextTitle(setup) {
  if (setup.step === 6) return 'Save routine';
  return setup.returnsToReview ? 'Back to review' : 'Next';
}

function canAdvance(setup) {
  const draft = setup.draft;
  if (setup.step === 1) return normalizedClock(draft.bedTime) !== normalizedClock(draft.wakeTime);
  if (setup.step === 3) return !draft.hasSetHours || normalizedClock(draft.workEnd) !== normalizedClock(draft.workStart);
  return true;
}

function question(title, detail) {
  return `<div class="question"><h2>${esc(title.toUpperCase())}</h2><p class="muted">${esc(detail)}</p></div>`;
}

function setupStep(setup) {
  const draft = setup.draft;
  switch (setup.step) {
    case 0:
      return `${question('When are you up?', 'Your morning walk lands 30 minutes after this.')}${timeBox('Wake-up', 'wakeTime', draft.wakeTime, 'setup')}`;
    case 1:
      return `${question('Lights out at…', 'Walks always wrap up at least 30 minutes before bed.')}${timeBox('Bedtime', 'bedTime', draft.bedTime, 'setup')}`;
    case 2:
      return `${question('Which days do you work?', 'Days off get a longer morning and evening walk instead of break walks.')}
        <div class="panel"><div class="weekdays">${DAY_NAMES.map((name, index) => chip(name.slice(0, 2), draft.workDays.includes(index + 1), 'toggle-day', `data-day="${index + 1}"`)).join('')}</div></div>
        <p class="fine">${esc(workDaysCaption(draft))}</p>`;
    case 3:
      return `${question('Your working hours', 'No walk is ever planned in work time outside a break or lunch.')}
        ${toggleBox("I don't work set hours", 'Skips break, lunch, and after-work walks. Every day plans like a day off.', 'noSetHours', 'setup', !draft.hasSetHours)}
        ${draft.hasSetHours ? timeBox('Work starts', 'workStart', draft.workStart, 'setup') + timeBox('Work ends', 'workEnd', draft.workEnd, 'setup') : ''}`;
    case 4:
      return `${question('Lunch', 'Half your lunch becomes a walk. You still eat.')}
        ${toggleBox("I don't take lunch", '', 'noLunch', 'setup', !draft.takesLunch)}
        ${draft.takesLunch ? timeBox('Lunch starts', 'lunchStart', draft.lunchStart, 'setup') + minuteBox('Lunch length', 'lunchMinutes', 'setup', draft.lunchMinutes, [30, 45, 60], 15, 120, setup.custom.lunch) : ''}`;
    case 5:
      return breaksStep(setup);
    default:
      return reviewStep(setup);
  }
}

function workDaysCaption(draft) {
  if (!draft.workDays.length) return 'No work days — every day plans as a day off.';
  const names = [...draft.workDays].sort((a, b) => a - b).map((day) => DAY_NAMES[day - 1]);
  return `Work days: ${names.join(', ')}.`;
}

function breaksStep(setup) {
  const draft = setup.draft;
  const counts = [0, 1, 2, 3, 4].map((count) => chip(String(count), setup.breakCount === count, 'break-count', `data-value="${count}"`)).join('');
  const times = draft.breaks.map((item, index) => timeBox(`Break ${index + 1}`, `break-${index}`, item.start, 'setup')).join('');
  return `${question('Breaks', "Every break becomes a walk — two minutes shorter so you're back on time.")}
    <div class="chip-box"><div class="kicker">Breaks per workday</div><div class="chips" style="margin-top:10px">${counts}</div></div>
    ${setup.breakCount > 0 ? minuteBox('Break length', 'breakMinutes', 'setup', setup.breakMinutes, [10, 15, 20], 5, 45, setup.custom.break) + times : ''}`;
}

function reviewStep(setup) {
  const preview = previewPlan(setup);
  const hasWork = setup.draft.hasSetHours && setup.draft.workDays.length > 0;
  const hasOff = !setup.draft.hasSetHours || setup.draft.workDays.length < 7;
  const toggle = hasWork && hasOff ? `<div class="chips">${chip('Work day', !setup.previewsDayOff, 'preview-mode', 'data-off="0"')}${chip('Day off', setup.previewsDayOff, 'preview-mode', 'data-off="1"')}</div>` : '';
  if (!preview) return question('Your day, planned', 'Tap anything to change it before you save.');
  const items = timelineItems(preview.schedule, preview.walks);
  return `${question('Your day, planned', 'Tap anything to change it before you save.')}
    ${toggle}
    <div class="panel stats">
      <div class="stat"><span>Walks</span><strong class="lime">${preview.walks.length}</strong></div>
      <div class="stat"><span>Walk steps</span><strong>${formatNumber(preview.distribution.planned)}</strong></div>
      <div class="stat"><span>Goal</span><strong>${formatNumber(preview.distribution.goal)}</strong></div>
    </div>
    ${preview.distribution.note ? `<p class="note-button">${esc(preview.distribution.note)}</p>` : ''}
    <div>${items.map((item, index) => previewRow(item, index === items.length - 1)).join('')}</div>
    <p class="fine">Steps per walk assume ~100 a minute, on top of about ${formatNumber(store.ambient)} everyday steps you take anyway.</p>`;
}

function previewPlan(setup) {
  const draft = setup.draft;
  const hasWork = draft.hasSetHours && draft.workDays.length > 0;
  const hasOff = !draft.hasSetHours || draft.workDays.length < 7;
  const wantsWork = hasWork && !(setup.previewsDayOff && hasOff);
  const today = startOfDay(new Date());
  let sample = today;
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(today, offset);
    const works = draft.workDays.includes(weekdayOf(day));
    if (works === wantsWork || !draft.hasSetHours) {
      sample = day;
      break;
    }
  }
  const book = RoutineBook.empty();
  book.template = cloneTemplate(draft);
  return book.plan(sample, store.inputsFor(), addDays(sample, -1));
}

function previewRow(item, isLast) {
  if (item.type === 'block') {
    const target = revisitTarget(item);
    return timelineRow(item.block.isOff ? null : item.start, false, isLast, `
      <button type="button" class="block-row${item.block.isOff ? ' off' : ''}" data-action="revisit" data-target="${target}">
        ${icon(blockIcon(item.block))}<span class="title">${esc(item.block.title.toUpperCase())}</span>
        <span class="detail">${esc(blockDetail(item.block, true))}</span>
      </button>`);
  }
  const walk = item.walk;
  return timelineRow(walk.startTime, true, isLast, `
    <button type="button" class="preview-walk" data-action="revisit" data-target="${revisitTarget(item)}">
      <span class="glyph">${icon(slotIcon(walk.slot))}</span>
      <span><strong>${esc(displayName(walk))}</strong><br><span class="fine">${walk.plannedMinutes} min</span></span>
      <span class="steps"><b>${formatNumber(walk.targetSteps)}</b><span>STEPS</span></span>
    </button>`);
}

function revisitTarget(item) {
  if (item.type === 'block') {
    if (item.block.kind === 'wake') return 0;
    if (item.block.kind === 'bed') return 1;
    if (item.block.kind === 'work') return item.block.isOff ? 2 : 3;
    if (item.block.kind === 'lunch') return 4;
    return 5;
  }
  const slot = item.walk.slot;
  if (slot === 'morning') return 0;
  if (slot === 'break') return 5;
  if (slot === 'lunch') return 4;
  if (slot === 'after_work') return 3;
  return 1;
}

function routineView() {
  const plan = store.plan(ui.selected, ui.now);
  if (!plan) return emptyView();
  const key = keyFor(ui.selected);
  const todayKey = keyFor(ui.now);
  const isToday = key === todayKey;
  const isEditable = key >= todayKey;
  return `<main id="routine">
    <div class="row-between">
      <div>
        <h1 class="display-xl">Routine</h1>
        <p class="muted" style="margin:2px 0 0">Walks built around your day.</p>
      </div>
    </div>
    ${reminderBanner()}
    ${nextCard()}
    ${weekStrip()}
    <div class="day-head">
      <h2>${isToday ? 'Today' : esc(weekdayName(ui.selected))}</h2>
      <p>${esc(dayTrailing(plan, key))}</p>
    </div>
    ${plan.distribution.note && isEditable ? `<button type="button" class="note-button" data-action="open-add">${icon('plus')}<span>${esc(plan.distribution.note)}</span></button>` : ''}
    <div style="margin-top:8px">${timelineItems(plan.schedule, plan.walks).map((item, index, list) => routineRow(item, index === list.length - 1, plan, isEditable, isToday)).join('')}</div>
    <div class="stack" style="margin-top:8px">
      ${isEditable ? btn(`${icon('plus')} Add walk`, 'open-add', 'ghost block') : ''}
      ${isEditable && store.book.hasEdits(key) ? btn('Reset to default', 'ask-reset', 'danger block') : ''}
      <button type="button" class="linkish" data-action="edit-default">Edit my default routine</button>
      <p class="fine help">${isEditable
        ? 'Press and hold a walk to drag it. Swipe left to skip. Earlier and Later move it in 5-minute steps. Changes here affect this day only unless you choose otherwise.'
        : 'Past day — view only. You can still mark walks done or skipped.'}</p>
    </div>
    ${summaryBar(plan)}
  </main>`;
}

function dayTrailing(plan, key) {
  const count = plan.activeCount;
  const walks = `${count} walk${count === 1 ? '' : 's'}`;
  const kind = plan.schedule.isWorkDay ? 'Work day' : 'Day off';
  const edited = store.book.hasEdits(key) ? ' · Edited' : '';
  return `${kind} · ${walks}${edited}`;
}

function nextCard() {
  const plan = store.plan(startOfDay(ui.now), ui.now);
  if (!plan) return '';
  const next = plan.nextWalk;
  const body = next
    ? `<strong>${esc(displayName(next))}</strong><br><span class="fine">${esc(timeLabel(next.startTime))} · ${next.plannedMinutes} min</span>`
    : `<strong>Nothing left on today's routine</strong><br><span class="fine">Open the routine to add a walk.</span>`;
  const steps = next ? `<span class="steps"><b>${formatNumber(next.targetSteps)}</b><span>STEPS</span></span>` : '';
  return `<button type="button" class="next-card" data-action="show-today">
    <span class="glyph ${next ? '' : 'done'}">${icon(next ? slotIcon(next.slot) : 'check')}</span>
    <span><span class="kicker">Next walk</span><br>${body}</span>
    ${steps}
  </button>`;
}

function weekStrip() {
  const todayKey = keyFor(ui.now);
  const selectedKey = keyFor(ui.selected);
  const days = weekDays(ui.selected).map((day) => {
    const dayKey = keyFor(day);
    const classes = ['week-chip'];
    if (dayKey === todayKey) classes.push('today');
    if (dayKey === selectedKey) classes.push('selected');
    const met = store.isGoalMet(day);
    const dot = met ? 'var(--lime)' : dayKey < todayKey ? 'var(--alert)' : 'rgba(141,141,141,.7)';
    const dotColor = dayKey === todayKey && met ? 'var(--on-lime)' : dot;
    return `<button type="button" class="${classes.join(' ')}" data-action="select-day" data-key="${dayKey}" aria-pressed="${dayKey === selectedKey}" aria-label="${esc(longDate(day))}">
      <span class="dow">${esc(DAY_NAMES[dayIndex(day)].slice(0, 1))}</span>
      <span class="dom">${day.getDate()}</span>
      <span class="dot" style="background:${dotColor}"></span>
    </button>`;
  }).join('');
  return `<div class="week-strip" style="margin-top:14px">${days}
    <button type="button" class="week-chip cal-launch" data-action="open-calendar" aria-label="Open calendar">${icon('calendar')}</button>
  </div>`;
}

function routineRow(item, isLast, plan, isEditable, isToday) {
  if (item.type === 'block') {
    const block = item.block;
    return timelineRow(block.isOff ? null : block.start, false, isLast, `
      <button type="button" class="block-row${block.isOff ? ' off' : ''}" data-action="open-block" data-block="${esc(block.id)}" ${isEditable ? '' : 'disabled'}>
        ${icon(blockIcon(block))}<span class="title">${esc(block.title.toUpperCase())}</span>
        <span class="detail">${esc(blockDetail(block, isEditable))}</span>
        ${isEditable ? icon('pencil') : ''}
      </button>`);
  }
  return timelineRow(item.walk.startTime, true, isLast, walkCard(item.walk, plan.states[item.walk.id] || 'planned', isEditable, isToday));
}

function blockDetail(block, isEditable) {
  if (block.isOff) return isEditable ? 'Tap to switch on' : 'Off';
  if (block.end != null) return `until ${timeLabel(block.end)}`;
  return '';
}

function timelineRow(time, accent, isLast, content) {
  return `<div class="tl-row${isLast ? ' last' : ''}">
    <div class="tl-time${accent ? ' accent' : ''}">${time == null ? '' : esc(timeLabel(time))}</div>
    <div class="tl-rail"><div class="tl-node${accent ? ' accent' : ''}"></div></div>
    <div class="tl-body">${content}</div>
  </div>`;
}

function walkCard(walk, state, isEditable, isToday) {
  const canMove = isEditable && (state === 'planned' || state === 'upNext');
  const canSkip = isEditable && (state === 'planned' || state === 'upNext' || state === 'missed');
  const [line, tone] = statusLine(walk, state);
  const stepsValue = state === 'done' || state === 'missed' ? (walk.actualSteps ?? walk.targetSteps) : walk.targetSteps;
  const caption = state === 'done' ? 'STEPS BANKED' : state === 'missed' ? `OF ${formatNumber(walk.targetSteps)}` : 'TARGET STEPS';
  const canLog = keyFor(ui.selected) <= keyFor(ui.now);
  const shake = ui.shakeId === walk.id ? ' shake' : '';
  return `<div class="walk-shell">
    <div class="skip-back">${icon('skip')}<span>SKIP</span></div>
    <div class="move-pill" hidden></div>
    <article class="walk-card ${state}${shake}" data-gesture="walk" data-id="${esc(walk.id)}" data-can-move="${canMove}" data-can-skip="${canSkip}" data-editable="${isEditable}">
      <div class="walk-top">
        <span class="glyph ${state}">${icon(state === 'done' ? 'check' : slotIcon(walk.slot))}</span>
        <span><span class="walk-name">${esc(displayName(walk))}</span><br><span class="fine">${esc(timeLabel(walk.startTime))} · ${walk.plannedMinutes} min</span></span>
        <span class="steps"><b>${formatNumber(stepsValue)}</b><span>${esc(caption)}</span></span>
      </div>
      ${line ? `<p class="status-line ${tone}">${esc(line)}</p>` : ''}
      <div class="walk-actions">${walkActions(walk, state, isEditable, isToday, canMove)}</div>
      ${canLog ? `<label class="steps-log">Steps in this walk
        <input class="number-input" type="number" min="0" inputmode="numeric" data-action="actual-steps" data-id="${esc(walk.id)}" data-steps-for="${esc(walk.id)}" value="${walk.actualSteps ?? ''}" aria-label="Steps in ${esc(displayName(walk))}">
      </label>` : ''}
    </article>
  </div>`;
}

function statusLine(walk, state) {
  if (state === 'upNext') return ['Up next', 'good'];
  if (state === 'done') {
    if (walk.actualSteps != null && walk.status !== 'done') return [`Banked ${formatNumber(walk.actualSteps)} steps in the window.`, 'good'];
    return ['Marked done.', 'good'];
  }
  if (state === 'missed') return [`Window passed — ${formatNumber(walk.actualSteps ?? 0)} of ${formatNumber(walk.targetSteps)} steps.`, 'bad'];
  if (state === 'skipped') return ['Skipped — its steps moved to your other walks.', ''];
  return [null, ''];
}

function walkActions(walk, state, isEditable, isToday, canMove) {
  const id = esc(walk.id);
  const skip = `<button type="button" class="btn small ghost" data-action="skip" data-id="${id}">Skip</button>`;
  const earlier = canMove ? `<button type="button" class="btn small ghost" data-action="move" data-id="${id}" data-delta="-5">Earlier</button>` : '';
  const later = canMove ? `<button type="button" class="btn small ghost" data-action="move" data-id="${id}" data-delta="5">Later</button>` : '';
  const edit = isEditable ? `<button type="button" class="btn small ghost" data-action="open-edit" data-id="${id}">Edit</button>` : '';
  const move = `${earlier}${later}${edit}`;
  if (state === 'upNext' && isToday) {
    return `<button type="button" class="btn small primary" data-action="start" data-id="${id}">${icon('play')} Start walk</button>${skip}${move}`;
  }
  if (state === 'upNext' || state === 'planned') {
    if (isEditable) return `${skip}${move}`;
    return `<button type="button" class="btn small ghost" data-action="mark-done" data-id="${id}">Mark done</button>${skip}`;
  }
  if (state === 'missed') {
    const main = isToday
      ? `<button type="button" class="btn small danger" data-action="makeup" data-id="${id}">Make it up</button>`
      : `<button type="button" class="btn small ghost" data-action="mark-done" data-id="${id}">Mark done</button>`;
    return `${main}${skip}${isEditable ? move : ''}`;
  }
  if (state === 'skipped' || (state === 'done' && walk.status === 'done')) {
    return `<button type="button" class="btn small ghost" data-action="restore" data-id="${id}">${icon('undo')} Undo</button>`;
  }
  return move;
}

function summaryBar(plan) {
  const planned = plan.distribution.planned;
  const done = plan.done;
  const goal = plan.distribution.goal;
  const fraction = planned > 0 ? Math.max(0, Math.min(1, done / planned)) : 0;
  const key = keyFor(ui.selected);
  return `<div class="summary-bar" aria-label="Planned ${planned} steps, done ${done}, goal ${goal}">
    <label class="steps-log">Step count for this day
      <input class="number-input" type="number" min="0" inputmode="numeric" data-action="daily-steps" value="${store.stepsOn(ui.selected) || ''}" aria-label="Step count for ${esc(longDate(ui.selected))}">
    </label>
    <div class="summary-stats">
      <div><b>${formatNumber(planned)}</b><span>PLANNED</span></div><i class="vdiv"></i>
      <div><b class="lime">${formatNumber(done)}</b><span>DONE</span></div><i class="vdiv"></i>
      <div><b>${formatNumber(goal)}</b><span>GOAL</span></div>
    </div>
    <div class="rail"><span style="width:${fraction * 100}%"></span></div>
    <p class="fine" style="margin:8px 0 0">Type the steps you actually walked. The phone app reads these from Health; this page does not. ${key === keyFor(ui.now) ? "Today's count marks the week strip and the bedtime nudge." : ''}</p>
  </div>`;
}

function reminderBanner() {
  if (!store.book.reminders.isOn) return '';
  if (typeof Notification === 'undefined') {
    return `<p class="banner">This browser can't show system reminders. The timeline is here whenever the page is open. Installing Walkingout keeps the icon handy, and reminders still need the page open.</p>`;
  }
  if (Notification.permission === 'granted') {
    return `<p class="banner">A heads-up fires 5 minutes before each walk <strong>while this page is open</strong>. Browsers can't schedule it after you leave, the way the iPhone app can.</p>`;
  }
  return `<p class="banner">Reminders need permission, and they only fire while this page is open. <button type="button" class="btn small" data-action="allow-reminders">Allow reminders</button></p>`;
}

function sheetHtml() {
  if (ui.confirm) return confirmDialog();
  if (!ui.sheet) return '';
  if (ui.sheet.type === 'block') return blockSheet();
  if (ui.sheet.type === 'walk') return walkSheet();
  if (ui.sheet.type === 'calendar') return calendarSheet();
  if (ui.sheet.type === 'reminders') return remindersSheet();
  return '';
}

function dialog(inner) {
  return `<dialog class="sheet"><div class="sheet-card">${inner}</div></dialog>`;
}

function closeButton() {
  return `<button type="button" class="icon-button" data-action="close-sheet" aria-label="Close">${icon('close')}</button>`;
}

function blockSheet() {
  const sheet = ui.sheet;
  const plan = store.plan(ui.selected, ui.now);
  const template = store.book.template;
  const change = blockChange(sheet, plan.schedule, template);
  const empty = Object.keys(change).length === 0;
  return dialog(`
    <div class="sheet-head">
      <div><h2 class="display-lg">${esc(sheet.block.title.toUpperCase())}</h2><p class="fine">${esc(longDate(ui.selected))}</p></div>
      ${closeButton()}
    </div>
    <div class="stack" style="margin-top:14px">${blockControls(sheet)}${empty ? '' : scopePicker(sheet.scope, weekdayName(ui.selected))}</div>
    <div style="margin-top:16px">${btn(empty ? 'Done' : 'Save change', 'save-block', 'primary block')}</div>
  `);
}

function blockControls(sheet) {
  if (sheet.block.kind === 'wake') {
    return `${timeBox('Up at', 'wake', sheet.wake, 'sheet')}<p class="fine">Your morning walk moves with it.</p>`;
  }
  if (sheet.block.kind === 'bed') {
    return `${timeBox('Bed at', 'bed', sheet.bed, 'sheet')}<p class="fine">Walks always finish at least 30 minutes before this.</p>`;
  }
  if (sheet.block.kind === 'work') {
    return `${toggleBox('Day off', 'Plans the day like a weekend: longer morning and evening walks, no break walks.', 'dayOff', 'sheet', sheet.dayOff)}
      ${sheet.dayOff ? '' : `${timeBox('Work starts', 'workStart', sheet.workStart, 'sheet')}${timeBox('Work ends', 'workEnd', sheet.workEnd, 'sheet')}<p class="fine">The after-work walk moves with the end of the day.</p>`}`;
  }
  if (sheet.block.kind === 'lunch') {
    return `${toggleBox('No lunch today', 'Removes the lunch walk and moves its steps to your other walks.', 'noLunchToday', 'sheet', !sheet.takesLunch)}
      ${sheet.takesLunch ? `${timeBox('Lunch starts', 'lunchStart', sheet.lunchStart, 'sheet')}${minuteBox('Length', 'lunchMinutes', 'sheet', sheet.lunchMinutes, [30, 45, 60], 15, 120, sheet.customLunch)}` : ''}`;
  }
  return `${timeBox('Break starts', 'breakStart', sheet.breakStart, 'sheet')}
    ${minuteBox('Length', 'breakMinutes', 'sheet', sheet.breakMinutes, [10, 15, 20], 5, 45, sheet.customBreak)}
    <p class="fine">The break walk moves with it and runs two minutes shorter than the break.</p>`;
}

function scopePicker(scope, weekday) {
  const options = [
    [Scope.day, 'This day only', 'Every other day stays as it is.'],
    [Scope.weekday, `Apply to all ${weekday}s`, `This ${weekday} and every one after it. Past ones keep theirs.`],
    [Scope.everyDay, 'Update my default routine', 'Changes the routine every day is built from, from today on.'],
  ];
  return `<div class="scope"><div class="kicker">Apply to</div>
    ${options.map(([value, title, detail]) => `<button type="button" class="${scope === value ? 'on' : ''}" data-action="set-scope" data-scope="${value}">
      <span class="mark">${scope === value ? '●' : '○'}</span>
      <span><strong>${esc(title)}</strong><br><span class="fine">${esc(detail)}</span></span>
    </button>`).join('')}
  </div>`;
}

function blockChange(sheet, schedule, template) {
  const result = {};
  const block = sheet.block;
  if (block.kind === 'wake' && sheet.wake !== normalizedClock(schedule.wake)) result.wakeTime = sheet.wake;
  if (block.kind === 'bed' && sheet.bed !== normalizedClock(schedule.bed)) result.bedTime = sheet.bed;
  if (block.kind === 'work') {
    if (sheet.dayOff !== !schedule.isWorkDay) result.dayOff = sheet.dayOff;
    if (!sheet.dayOff) {
      if (sheet.workStart !== normalizedClock(schedule.workStart)) result.workStart = sheet.workStart;
      if (sheet.workEnd !== normalizedClock(schedule.workEnd)) result.workEnd = sheet.workEnd;
    }
  }
  if (block.kind === 'lunch') {
    if (sheet.takesLunch !== (schedule.lunch != null)) result.takesLunch = sheet.takesLunch;
    if (sheet.takesLunch) {
      if (sheet.lunchStart !== normalizedClock(schedule.lunch?.start ?? template.lunchStart)) result.lunchStart = sheet.lunchStart;
      if (sheet.lunchMinutes !== (schedule.lunch?.minutes ?? template.lunchMinutes)) result.lunchMinutes = sheet.lunchMinutes;
    }
  }
  if (block.kind === 'break') {
    const list = schedule.breaks.map((item) => ({ start: normalizedClock(item.start), minutes: item.minutes }));
    if (block.index < list.length) {
      const updated = { start: sheet.breakStart, minutes: sheet.breakMinutes };
      if (list[block.index].start !== updated.start || list[block.index].minutes !== updated.minutes) {
        list[block.index] = updated;
        result.breaks = list;
      }
    }
  }
  return result;
}

function walkSheet() {
  const sheet = ui.sheet;
  const adding = sheet.mode === 'add';
  return dialog(`
    <div class="sheet-head">
      <div><h2 class="display-lg">${adding ? 'Add a walk' : 'Edit walk'}</h2><p class="fine">${esc(longDate(ui.selected))}</p></div>
      ${closeButton()}
    </div>
    <div class="stack" style="margin-top:14px">
      <label class="name-field panel"><span class="kicker">Name</span>
        <input class="text-input" data-field="walk-name" value="${esc(sheet.name)}" placeholder="${esc(sheet.placeholder)}">
      </label>
      ${timeBox('Starts', 'start', sheet.start, 'sheet')}
      ${minuteBox('Length', 'minutes', 'sheet', sheet.minutes, [10, 15, 20, 30], 5, 120, sheet.custom)}
      <p class="fine">About ${formatNumber(sheet.minutes * STEPS_PER_MINUTE)} steps at ~100 a minute.</p>
      ${sheet.problem ? `<p class="problem${sheet.shake ? ' shake' : ''}">${esc(sheet.problem)}</p>` : ''}
      ${btn(adding ? `${icon('plus')} Add walk` : 'Save walk', 'save-walk', 'primary block')}
      ${adding ? '' : btn('Delete walk', 'ask-delete', 'danger block')}
    </div>
  `);
}

function calendarSheet() {
  const month = ui.sheet.month;
  const cells = monthCells(month);
  const todayKey = keyFor(ui.now);
  const selectedKey = keyFor(ui.selected);
  const names = DAY_NAMES.map((name) => `<span class="dow">${esc(name.slice(0, 1))}</span>`).join('');
  const days = cells.map((day) => {
    if (!day) return '<span></span>';
    const key = keyFor(day);
    const classes = ['day-cell'];
    if (key === selectedKey) classes.push('selected');
    if (key === todayKey) classes.push('today');
    if (key < todayKey) classes.push('past');
    if (store.book.hasEdits(key)) classes.push('edited');
    return `<button type="button" class="${classes.join(' ')}" data-action="pick-day" data-key="${key}" aria-label="${esc(longDate(day))}${store.book.hasEdits(key) ? ', edited' : ''}">
      <span>${day.getDate()}</span><span class="mark-dot"></span>
    </button>`;
  }).join('');
  return dialog(`
    <div class="sheet-head">
      <div><h2 class="display-lg">Pick a day</h2><p class="fine">Past days are view-only, apart from marking walks done or skipped.</p></div>
      ${closeButton()}
    </div>
    <div class="panel" style="margin-top:14px">
      <div class="row-between">
        <button type="button" class="icon-button" data-action="month" data-delta="-1" aria-label="Previous month">${icon('back')}</button>
        <strong>${esc(monthLabel(month))}</strong>
        <button type="button" class="icon-button" data-action="month" data-delta="1" aria-label="Next month">${icon('chevron')}</button>
      </div>
      <div class="calendar-grid" style="margin-top:12px">${names}${days}</div>
    </div>
    <div class="legend" style="margin-top:12px"><span><i></i> Edited day</span><span><i class="ring"></i> Today</span></div>
    ${btn('Jump to today', 'jump-today', 'ghost block')}
  `);
}

function monthCells(month) {
  const lead = dayIndex(month);
  const count = daysInMonth(month);
  const cells = Array(lead).fill(null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  return cells;
}

function remindersSheet() {
  const prefs = store.book.reminders;
  const slots = SLOT_ORDER.map((slot) => toggleBox(
    SLOT_REMINDER_LABELS[slot],
    '',
    `slot:${slot}`,
    'reminders',
    !prefs.mutedSlots.includes(slot),
  )).join('');
  return dialog(`
    <div class="sheet-head"><div><h2 class="display-lg">Reminders</h2><p class="fine">Walkingout</p></div>${closeButton()}</div>
    <div class="stack" style="margin-top:14px">
      ${reminderBanner()}
      ${toggleBox('Walk reminders', '', 'remindersOn', 'reminders', prefs.isOn)}
      <p class="fine">A heads-up 5 minutes before each planned walk — "Lunch walk in 5 — 1,500 steps." Skipped walks stay quiet.</p>
      ${prefs.isOn ? slots + toggleBox('Bedtime nudge', '', 'bedtimeNudge', 'reminders', prefs.bedtimeNudge) : ''}
      ${prefs.isOn ? '<p class="fine">Two hours before bed, only if you\'re still short of today\'s target.</p>' : ''}
      <label class="name-field panel">Step goal
        <input class="text-input" type="number" min="0" data-action="goal" value="${store.goal}">
      </label>
      <label class="name-field panel">Everyday steps
        <input class="text-input" type="number" min="0" data-action="ambient" value="${store.ambient}">
      </label>
      <p class="fine">Everyday steps are the ones you take without a planned walk. The routine spreads whatever is left of the goal.</p>
    </div>
  `);
}

function confirmDialog() {
  const confirm = ui.confirm;
  return dialog(`
    <h2 class="display-lg">${esc(confirm.title)}</h2>
    <p class="muted">${esc(confirm.message)}</p>
    <div class="action-row">${btn(confirm.yes, 'confirm-yes', 'danger')}${btn('Keep it', 'confirm-no', 'ghost')}</div>
  `);
}

function toastView() {
  const toast = ui.toast;
  return `<div class="toast${toast.isAlert ? ' alert' : ''}" role="status">
    <p>${esc(toast.message)}</p>
    ${toast.undo ? '<button type="button" data-action="undo-toast">UNDO</button>' : ''}
  </div>`;
}

function showToast(message, isAlert = false, undo = null) {
  const id = crypto.randomUUID();
  ui.toast = { id, message, isAlert, undo };
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    if (ui.toast?.id === id) {
      ui.toast = null;
      render();
    }
  }, undo ? 4000 : 2600);
  render();
}

function closeTop() {
  if (ui.confirm) ui.confirm = null;
  else ui.sheet = null;
  render();
}

function openSetup(existing) {
  const template = cloneTemplate(existing ?? standardTemplate());
  ui.setup = {
    step: 0,
    draft: template,
    breakCount: template.breaks.length,
    breakMinutes: template.breaks[0]?.minutes ?? 15,
    hasTunedBreaks: existing != null,
    returnsToReview: false,
    previewsDayOff: false,
    custom: {
      lunch: ![30, 45, 60].includes(template.lunchMinutes),
      break: ![10, 15, 20].includes(template.breaks[0]?.minutes ?? 15),
    },
  };
  render();
}

function respreadBreaks() {
  const setup = ui.setup;
  setup.draft.breaks = defaultBreaks(setup.breakCount, setup.breakMinutes, setup.draft);
}

function goSetup(target) {
  if (target === 5 && !ui.setup.hasTunedBreaks) respreadBreaks();
  ui.setup.step = target;
  render();
}

function advanceSetup() {
  const setup = ui.setup;
  if (!canAdvance(setup)) return;
  if (setup.step === 6) {
    saveSetup();
    return;
  }
  if (setup.returnsToReview) {
    setup.returnsToReview = false;
    goSetup(6);
    return;
  }
  let next = setup.step + 1;
  if (setup.step === 3 && !setup.draft.hasSetHours) next = 6;
  if (next === 5 && !setup.hasTunedBreaks) respreadBreaks();
  goSetup(next);
}

function saveSetup() {
  const template = cloneTemplate(ui.setup.draft);
  if (!template.hasSetHours) template.breaks = [];
  ui.setup = null;
  store.update((book) => book.setTemplate(template));
  requestReminderPermission();
}

function suggestedStart() {
  const plan = store.plan(ui.selected, ui.now);
  if (!plan) return 18 * 60;
  const isToday = keyFor(ui.selected) === keyFor(ui.now);
  const nowMinutes = isToday ? Math.round((ui.now - startOfDay(plan.schedule.date)) / 60000) : null;
  return makeUpStart(20, plan.schedule, plan.walks, nowMinutes) ?? Math.max(plan.schedule.wake + 30, plan.schedule.bed - 120);
}

function openAdd() {
  ui.sheet = {
    type: 'walk', mode: 'add', start: normalizedClock(suggestedStart()), minutes: 20, name: '',
    placeholder: 'Name (optional)', custom: false, problem: null,
  };
  render();
}

function openEdit(id) {
  const walk = findWalk(id);
  if (!walk) return;
  ui.sheet = {
    type: 'walk', mode: 'edit', walkId: id, start: normalizedClock(walk.startTime), minutes: walk.plannedMinutes,
    name: walk.name ?? '', placeholder: displayName(walk),
    custom: ![10, 15, 20, 30].includes(walk.plannedMinutes), problem: null,
  };
  render();
}

function openBlock(id) {
  const plan = store.plan(ui.selected, ui.now);
  const block = blocksFor(plan.schedule).find((item) => item.id === id);
  if (!block) return;
  const template = store.book.template;
  const schedule = plan.schedule;
  let breakItem = null;
  if (block.kind === 'break') breakItem = schedule.breaks[block.index];
  ui.sheet = {
    type: 'block',
    block,
    scope: Scope.day,
    wake: normalizedClock(schedule.wake),
    bed: normalizedClock(schedule.bed),
    dayOff: !schedule.isWorkDay,
    workStart: normalizedClock(schedule.workStart),
    workEnd: normalizedClock(schedule.workEnd),
    takesLunch: schedule.lunch != null,
    lunchStart: normalizedClock(schedule.lunch?.start ?? template.lunchStart),
    lunchMinutes: schedule.lunch?.minutes ?? template.lunchMinutes,
    breakStart: normalizedClock(breakItem?.start ?? 600),
    breakMinutes: breakItem?.minutes ?? 15,
    customLunch: ![30, 45, 60].includes(schedule.lunch?.minutes ?? template.lunchMinutes),
    customBreak: ![10, 15, 20].includes(breakItem?.minutes ?? 15),
  };
  render();
}

function findWalk(id) {
  return store.plan(ui.selected, ui.now)?.walks.find((walk) => walk.id === id) ?? null;
}

function withBook(run) {
  try {
    store.update(run);
    return null;
  } catch (error) {
    return error instanceof RoutineProblem ? error : new RoutineProblem("That didn't save. Try a different time.");
  }
}

function setWalkStatus(id, status) {
  withBook((book) => book.setStatus(status, id, ui.selected, store.inputsFor(), ui.now));
}

function selectDay(key) {
  const [year, month, day] = key.split('-').map(Number);
  ui.selected = new Date(year, month - 1, day);
  ui.now = new Date();
  store.open(ui.selected, ui.now);
  render();
}

function onClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'open-setup') openSetup(null);
  else if (action === 'edit-default') openSetup(store.book.template);
  else if (action === 'close-setup') { ui.setup = null; render(); }
  else if (action === 'setup-back') {
    const targetStep = ui.setup.step === 6 && !ui.setup.draft.hasSetHours ? 3 : Math.max(0, ui.setup.step - 1);
    goSetup(targetStep);
  } else if (action === 'setup-next') advanceSetup();
  else if (action === 'toggle-day') toggleWorkDay(Number(target.dataset.day));
  else if (action === 'break-count') {
    ui.setup.breakCount = Number(target.dataset.value);
    respreadBreaks();
    render();
  } else if (action === 'preview-mode') {
    ui.setup.previewsDayOff = target.dataset.off === '1';
    render();
  } else if (action === 'revisit') {
    ui.setup.returnsToReview = true;
    goSetup(Number(target.dataset.target));
  } else if (action === 'nudge') nudgeField(target.dataset.owner, target.dataset.field, Number(target.dataset.delta));
  else if (action === 'pick-minutes') setMinutes(target.dataset.owner, target.dataset.field, Number(target.dataset.value), false);
  else if (action === 'custom-minutes') setCustom(target.dataset.owner, target.dataset.field, true);
  else if (action === 'step-minutes') {
    const min = Number(target.dataset.min);
    const max = Number(target.dataset.max);
    const current = readMinutes(target.dataset.owner, target.dataset.field);
    setMinutes(target.dataset.owner, target.dataset.field, Math.min(max, Math.max(min, current + Number(target.dataset.delta))), true);
  } else if (action === 'show-today' || action === 'jump-today') {
    ui.sheet = null;
    selectDay(keyFor(new Date()));
  } else if (action === 'select-day') selectDay(target.dataset.key);
  else if (action === 'pick-day') {
    ui.sheet = null;
    selectDay(target.dataset.key);
  } else if (action === 'open-calendar') {
    ui.sheet = { type: 'calendar', month: startOfMonth(ui.selected) };
    render();
  } else if (action === 'month') {
    ui.sheet.month = addMonths(ui.sheet.month, Number(target.dataset.delta));
    render();
  } else if (action === 'open-reminders') { ui.sheet = { type: 'reminders' }; render(); }
  else if (action === 'open-add') openAdd();
  else if (action === 'open-edit') openEdit(target.dataset.id);
  else if (action === 'open-block') openBlock(target.dataset.block);
  else if (action === 'close-sheet') closeTop();
  else if (action === 'set-scope') { ui.sheet.scope = target.dataset.scope; render(); }
  else if (action === 'save-block') saveBlock();
  else if (action === 'save-walk') saveWalk();
  else if (action === 'skip') skipWalk(target.dataset.id);
  else if (action === 'restore') setWalkStatus(target.dataset.id, 'planned');
  else if (action === 'mark-done') setWalkStatus(target.dataset.id, 'done');
  else if (action === 'start') {
    ui.focusSteps = target.dataset.id;
    showToast('Log the steps from this walk when you are back. This page does not track a live walk.');
  } else if (action === 'move') {
    const ok = moveWalk(target.dataset.id, Number(target.dataset.delta));
    if (!ok) ui.shakeId = target.dataset.id;
  } else if (action === 'makeup') makeUp(target.dataset.id);
  else if (action === 'ask-reset') {
    ui.confirm = {
      title: 'Reset this day?',
      message: "This day's time changes, added walks, and skips are cleared. The walks are rebuilt from your default routine.",
      yes: 'Reset to default',
      run() {
        ui.confirm = null;
        store.update((book) => book.resetDay(keyFor(ui.selected)));
        showToast('Back to your default routine.');
      },
    };
    render();
  } else if (action === 'ask-delete') {
    ui.confirm = {
      title: 'Delete this walk?',
      message: 'Only this day changes. Its steps move to your other walks.',
      yes: 'Delete walk',
      run() {
        const id = ui.sheet.walkId;
        ui.confirm = null;
        ui.sheet = null;
        store.update((book) => book.deleteWalk(id, ui.selected, store.inputsFor(), ui.now));
        showToast('Walk deleted — its steps moved to your other walks.');
      },
    };
    render();
  } else if (action === 'confirm-yes') ui.confirm?.run();
  else if (action === 'confirm-no') { ui.confirm = null; render(); }
  else if (action === 'undo-toast') {
    const undo = ui.toast?.undo;
    ui.toast = null;
    undo?.();
    render();
  } else if (action === 'allow-reminders') requestReminderPermission();
}

function onChange(event) {
  const el = event.target;
  const action = el.dataset.action;
  if (action === 'time') {
    const minutes = minutesFromTime(el.value);
    if (minutes == null) return;
    writeTime(el.dataset.owner, el.dataset.field, minutes);
    render();
  } else if (action === 'toggle') {
    writeToggle(el.dataset.owner, el.dataset.field, el.checked);
    render();
  } else if (action === 'actual-steps') {
    const steps = Number(el.value);
    if (!Number.isFinite(steps) || steps < 0) return;
    const before = findWalk(el.dataset.id)?.actualSteps ?? -1;
    if (!(steps > before)) {
      showToast('Logged steps only go up.', true);
      return;
    }
    store.update((book) => book.recordActual(steps, el.dataset.id, ui.selected, store.inputsFor(), ui.now));
  } else if (action === 'daily-steps') {
    store.setDailySteps(ui.selected, el.value);
    scheduleReminders();
  } else if (action === 'goal') store.setGoal(el.value, store.ambient);
  else if (action === 'ambient') store.setGoal(store.goal, el.value);
}

function onInput(event) {
  if (event.target.dataset.field === 'walk-name' && ui.sheet?.type === 'walk') ui.sheet.name = event.target.value;
}

function toggleWorkDay(day) {
  const days = new Set(ui.setup.draft.workDays);
  if (days.has(day)) days.delete(day);
  else days.add(day);
  ui.setup.draft.workDays = [...days].sort((a, b) => a - b);
  render();
}

function writeTime(owner, field, minutes) {
  if (owner === 'setup') {
    if (field.startsWith('break-')) {
      const index = Number(field.slice(6));
      ui.setup.hasTunedBreaks = true;
      if (ui.setup.draft.breaks[index]) ui.setup.draft.breaks[index].start = minutes;
      return;
    }
    ui.setup.draft[field] = minutes;
    return;
  }
  if (ui.sheet) ui.sheet[field] = minutes;
}

function nudgeField(owner, field, delta) {
  const current = owner === 'setup'
    ? (field.startsWith('break-') ? ui.setup.draft.breaks[Number(field.slice(6))]?.start : ui.setup.draft[field])
    : ui.sheet[field];
  writeTime(owner, field, normalizedClock((current ?? 0) + delta));
  render();
}

function readMinutes(owner, field) {
  if (owner === 'setup') {
    if (field === 'breakMinutes') return ui.setup.breakMinutes;
    return ui.setup.draft[field];
  }
  return ui.sheet[field];
}

function setMinutes(owner, field, value, custom) {
  if (owner === 'setup') {
    if (field === 'breakMinutes') {
      ui.setup.breakMinutes = value;
      ui.setup.draft.breaks = ui.setup.draft.breaks.map((item) => ({ start: item.start, minutes: value }));
      ui.setup.custom.break = custom;
    } else {
      ui.setup.draft[field] = value;
      if (field === 'lunchMinutes') ui.setup.custom.lunch = custom;
    }
  } else if (ui.sheet) {
    ui.sheet[field] = value;
    if (field === 'minutes') ui.sheet.custom = custom;
    if (field === 'lunchMinutes') ui.sheet.customLunch = custom;
    if (field === 'breakMinutes') ui.sheet.customBreak = custom;
    ui.sheet.problem = null;
  }
  render();
}

function setCustom(owner, field, custom) {
  if (owner === 'setup') {
    if (field === 'breakMinutes') ui.setup.custom.break = custom;
    if (field === 'lunchMinutes') ui.setup.custom.lunch = custom;
  } else if (ui.sheet) {
    if (field === 'minutes') ui.sheet.custom = custom;
    if (field === 'lunchMinutes') ui.sheet.customLunch = custom;
    if (field === 'breakMinutes') ui.sheet.customBreak = custom;
  }
  render();
}

function writeToggle(owner, field, checked) {
  if (owner === 'setup') {
    if (field === 'noSetHours') ui.setup.draft.hasSetHours = !checked;
    if (field === 'noLunch') ui.setup.draft.takesLunch = !checked;
    return;
  }
  if (owner === 'sheet' && ui.sheet) {
    if (field === 'dayOff') ui.sheet.dayOff = checked;
    if (field === 'noLunchToday') ui.sheet.takesLunch = !checked;
    return;
  }
  if (owner === 'reminders') {
    if (field === 'remindersOn') {
      store.update((book) => { book.reminders.isOn = checked; });
      if (checked) requestReminderPermission();
    } else if (field === 'bedtimeNudge') {
      store.update((book) => { book.reminders.bedtimeNudge = checked; });
    } else if (field.startsWith('slot:')) {
      const slot = field.slice(5);
      store.update((book) => {
        const muted = new Set(book.reminders.mutedSlots);
        if (checked) muted.delete(slot);
        else muted.add(slot);
        book.reminders.mutedSlots = SLOT_ORDER.filter((item) => muted.has(item));
      });
      if (checked) requestReminderPermission();
    }
  }
}

function saveBlock() {
  const plan = store.plan(ui.selected, ui.now);
  const change = blockChange(ui.sheet, plan.schedule, store.book.template);
  const scope = ui.sheet.scope;
  if (Object.keys(change).length) {
    store.update((book) => book.editBlock(ui.selected, change, scope));
    const weekday = weekdayName(ui.selected);
    const message = scope === Scope.day
      ? 'Changed for this day only.'
      : scope === Scope.weekday
        ? `Changed for every ${weekday} from here on.`
        : 'Default routine updated.';
    ui.sheet = null;
    showToast(message);
    return;
  }
  ui.sheet = null;
  render();
}

function saveWalk() {
  const sheet = ui.sheet;
  const name = sheet.name ?? '';
  const error = sheet.mode === 'add'
    ? withBook((book) => book.addWalk(ui.selected, sheet.start, sheet.minutes, name.trim() ? name : null, store.inputsFor(), ui.now))
    : withBook((book) => {
      const walk = book.plan(ui.selected, store.inputsFor(), ui.now)?.walks.find((item) => item.id === sheet.walkId);
      const length = walk && sheet.minutes === walk.plannedMinutes ? null : sheet.minutes;
      book.updateWalk(sheet.walkId, ui.selected, sheet.start, length, name.trim(), store.inputsFor(), ui.now);
    });
  if (error) {
    sheet.problem = error.message;
    sheet.shake = true;
    render();
    return;
  }
  const minutes = sheet.minutes;
  const adding = sheet.mode === 'add';
  ui.sheet = null;
  if (adding) showToast(`Walk added — ${formatNumber(minutes * STEPS_PER_MINUTE)} steps.`);
  else render();
}

function skipWalk(id) {
  setWalkStatus(id, 'skipped');
  showToast('Skipped — steps moved to your other walks.', false, () => setWalkStatus(id, 'planned'));
}

function moveWalk(id, delta) {
  const walk = findWalk(id);
  if (!walk) return false;
  const target = snapped(walk.startTime + delta);
  const error = withBook((book) => book.moveWalk(id, ui.selected, target, store.inputsFor(), ui.now));
  if (error) {
    showToast(error.message, true);
    return false;
  }
  return true;
}

function makeUp(id) {
  let added = null;
  const error = withBook((book) => {
    added = book.makeUp(id, ui.selected, store.inputsFor(), ui.now);
  });
  if (error) showToast(error.message, true);
  else if (added) showToast(`Make-up walk at ${timeLabel(added.startTime)} — ${formatNumber(added.targetSteps)} steps.`);
}

function bindGestures() {
  document.querySelectorAll('[data-gesture="walk"]').forEach((card) => {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let mode = null;
    let timer = 0;
    let dragMinutes = 0;
    let swipe = 0;
    const shell = card.closest('.walk-shell');
    const canMove = card.dataset.canMove === 'true';
    const canSkip = card.dataset.canSkip === 'true';

    const reset = () => {
      card.style.transform = '';
      card.classList.remove('is-dragging');
      shell?.classList.remove('is-swiping', 'will-skip');
      const pill = shell?.querySelector('.move-pill');
      if (pill) pill.hidden = true;
    };

    card.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button, input, a, label')) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      mode = null;
      dragMinutes = 0;
      swipe = 0;
      if (canMove) {
        timer = setTimeout(() => {
          mode = 'drag';
          card.classList.add('is-dragging');
          try { card.setPointerCapture(pointerId); } catch { /* already released */ }
        }, 350);
      }
    });

    card.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (mode !== 'drag' && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) clearTimeout(timer);
      if (mode === 'drag') {
        event.preventDefault();
        dragMinutes = snapped(Math.round(dy));
        card.style.transform = `translateY(${dragMinutes}px) scale(1.02)`;
        const walk = findWalk(card.dataset.id);
        const pill = shell?.querySelector('.move-pill');
        if (pill && walk) {
          pill.hidden = false;
          pill.textContent = `→ ${timeLabel(snapped(walk.startTime + dragMinutes))}`;
        }
      } else if (canSkip && Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.4 && dx < 0) {
        mode = 'swipe';
        swipe = dx;
        card.style.transform = `translateX(${dx}px)`;
        shell?.classList.add('is-swiping');
        shell?.classList.toggle('will-skip', dx < -80);
      }
    }, { passive: false });

    const finish = (event) => {
      if (event.pointerId !== pointerId) return;
      clearTimeout(timer);
      const ended = mode;
      const delta = dragMinutes;
      const commit = ended === 'swipe' && swipe < -80;
      pointerId = null;
      mode = null;
      reset();
      if (ended === 'drag' || ended === 'swipe') card.dataset.suppress = '1';
      if (ended === 'drag' && delta !== 0) {
        const ok = moveWalk(card.dataset.id, delta);
        if (!ok) ui.shakeId = card.dataset.id;
      } else if (commit) skipWalk(card.dataset.id);
    };
    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);
    card.addEventListener('click', (event) => {
      if (card.dataset.suppress === '1') {
        card.dataset.suppress = '';
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target.closest('button, input, a, label')) return;
      if (card.dataset.editable === 'true') openEdit(card.dataset.id);
    });
  });
}

let reminderTimers = [];

function scheduleReminders() {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const today = startOfDay(new Date());
  const days = [0, 1, 2].map((offset) => addDays(today, offset));
  const reminders = store.book.reminderSchedule(
    days,
    () => store.inputsFor(),
    (day) => store.isGoalMet(day),
    new Date(),
  );
  for (const reminder of reminders) {
    const delay = reminder.fireDate.getTime() - Date.now();
    if (delay < 0 || delay > 2_000_000_000) continue;
    reminderTimers.push(setTimeout(() => {
      try { new Notification(reminder.title, { body: reminder.body, tag: reminder.id }); } catch { /* permission race */ }
    }, delay));
  }
}

async function requestReminderPermission() {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();
  } catch { /* user dismissed */ }
  scheduleReminders();
  render();
}

document.addEventListener('click', onClick);
document.addEventListener('change', onChange);
document.addEventListener('input', onInput);

ui.now = new Date();
if (store.isSetUp) store.open(ui.selected, ui.now);
scheduleReminders();
render();
setInterval(() => {
  ui.now = new Date();
  if (!ui.sheet && !ui.setup && !ui.confirm) {
    scheduleReminders();
    render();
  }
}, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/apps/walkingout/sw.js', { scope: '/apps/walkingout/' }).catch(() => {});
}
