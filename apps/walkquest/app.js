import {
  BADGES,
  WalkQuestStore,
  activeStepsPerMile,
  addDays,
  backupDue,
  campaignMiles,
  capDayMiles,
  checkDate,
  currentStreak,
  dayMiles,
  evaluateBadges,
  formatDistance,
  formatNumber,
  getBadge,
  getCampaign,
  getStop,
  hasComeback,
  kmToMiles,
  lifetimeMiles,
  markBackedUp,
  maxStreak,
  milesFromSteps,
  milesRemaining,
  milesToKm,
  needsBigDayConfirm,
  nextStop,
  parseBackup,
  prettyDate,
  restartedToday,
  roundMiles,
  serializeBackup,
  stepsFromMiles,
  strideLabel,
  todayKey,
  typoSuggestion,
  unlocksFromLog,
  unseenUnlocks,
  weekMiles,
} from './engine/index.js';
import { applyMiles, renderMap } from './maps.js';
import { drawPostcard } from './postcard.js';

const SAFETY = 'Education only, not medical advice. Check with your doctor before starting a new exercise program.';

const store = new WalkQuestStore();
const ui = {
  toast: '',
  toastTimer: 0,
  flash: '',
  error: '',
  confirm: null,
  queue: [],
  queueIndex: 0,
  mapFrom: null,
  mapToken: 0,
  hideBackup: false,
  logKey: '',
  logMode: 'steps',
  logDate: '',
  amount: '',
  indoor: false,
  note: '',
  editingId: null,
  phase: 'edit',
  typoAck: false,
  bigAck: false,
  suggestion: null,
  pendingMiles: 0,
  draftScreen: '',
  trailName: 'Walker',
  units: 'mi',
  strideMode: 'default',
  heightFeet: 5,
  heightInches: 6,
  calSteps: '',
  calDistance: '',
  pendingImport: null,
};

store.onChange = () => render();

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function today() {
  return todayKey(new Date());
}

function trailName() {
  return store.state.settings.trailName || 'Walker';
}

function units() {
  return store.state.settings.units === 'km' ? 'km' : 'mi';
}

function show(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function toast(message) {
  ui.toast = message;
  const slot = document.getElementById('toasts');
  if (slot && document.body.dataset.screen) {
    slot.innerHTML = toastHtml();
    armToast();
    return;
  }
  render();
}

function armToast() {
  if (!ui.toast) return;
  const message = ui.toast;
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    if (ui.toast !== message) return;
    ui.toast = '';
    const slot = document.getElementById('toasts');
    if (slot) slot.innerHTML = '';
  }, 3400);
}

function toastHtml() {
  if (!ui.toast) return '';
  return `<p class="toast" role="status">${esc(ui.toast)}</p>`;
}

function markSeen(id) {
  if (!id || store.state.seenUnlocks.includes(id)) return;
  store.update((state) => { state.seenUnlocks.push(id); }, { silent: true });
}

function route() {
  const parts = (location.hash || '#/welcome').replace(/^#\/?/, '').split('/');
  return { screen: parts[0] || 'welcome', a: parts[1] || '', b: parts[2] || '' };
}

function guard(parts) {
  const state = store.state;
  let screen = parts.screen;
  if (!state.welcomed) return 'welcome';
  if (!state.setupComplete && !['setup', 'about'].includes(screen)) return 'setup';
  if (!state.activeCampaign && ['map', 'log', 'read', 'postcard'].includes(screen)) return 'campaigns';
  if (screen === 'welcome' && state.welcomed) return state.activeCampaign ? 'map' : (state.setupComplete ? 'campaigns' : 'setup');
  return screen;
}

function render() {
  const parts = route();
  const screen = guard(parts);
  const path = screen === 'read' || screen === 'postcard'
    ? `${screen}/${parts.a}/${parts.b}`
    : screen === 'log' && parts.a && screen === parts.screen
      ? `log/${parts.a}`
      : screen;
  const desired = `#/${path}`;
  if (location.hash !== desired) {
    location.replace(desired);
    return;
  }
  if (screen === 'log') ensureLog(desired);
  if (screen === 'setup' || screen === 'settings') ensureDraft(screen);
  if (screen === 'unlock') {
    if (!ui.queue.length) {
      ui.queue = unseenUnlocks(store.state);
      ui.queueIndex = 0;
    }
    if (!ui.queue[ui.queueIndex]) {
      ui.queue = [];
      location.replace('#/map');
      return;
    }
    markSeen(ui.queue[ui.queueIndex].id);
  }
  document.body.dataset.screen = screen;
  document.title = `${titleFor(screen)} · WalkQuest`;
  const root = document.getElementById('app');
  root.innerHTML = shell(screen, bodyFor(screen, parts));
  document.getElementById('toasts').innerHTML = toastHtml();
  afterPaint(screen);
}

function titleFor(screen) {
  return {
    welcome: 'Welcome',
    setup: 'Quick setup',
    campaigns: 'Choose a campaign',
    map: 'Journey',
    log: 'Log a walk',
    unlock: 'Unlocked',
    read: 'Reader',
    postcard: 'Postcard',
    history: 'History',
    badges: 'Badges',
    settings: 'Settings',
    about: 'About',
  }[screen] || 'WalkQuest';
}

function shell(screen, main) {
  const bare = screen === 'welcome';
  const tabs = screen !== 'welcome';
  return `<div class="app-shell">
    ${bare ? '' : header(screen)}
    <main id="main">${main}</main>
    ${tabs ? tabbar(screen) : ''}
    ${ui.confirm ? confirmHtml() : ''}
  </div>`;
}

function header(screen) {
  const back = backTarget(screen);
  return `<header class="topbar">
    ${back ? `<button type="button" class="icon-btn" data-action="go" data-href="${back}" aria-label="Back">←</button>` : '<span class="icon-spacer"></span>'}
    <a class="wordmark" href="${store.state.activeCampaign ? '#/map' : '#/campaigns'}">
      <span class="mark">WalkQuest</span>
      <span class="byline">by LoadLine Fitness</span>
    </a>
    <a class="icon-btn" href="#/about" aria-label="About and safety">i</a>
  </header>`;
}

function backTarget(screen) {
  if (screen === 'log' || screen === 'read' || screen === 'postcard' || screen === 'unlock') return '#/map';
  if (screen === 'about' || screen === 'settings') return store.state.activeCampaign ? '#/map' : '#/campaigns';
  return '';
}

function tabbar(screen) {
  const tabs = [
    ['map', 'Trail', 'M3 16 L12 4 L21 16 V20 H3 Z'],
    ['badges', 'Badges', 'M12 3 L14.5 8.5 L20 9.2 L16 13.4 L17 19 L12 16.2 L7 19 L8 13.4 L4 9.2 L9.5 8.5 Z'],
    ['history', 'History', 'M5 5 H19 V19 H5 Z M8 9 H16 M8 13 H16 M8 17 H13'],
    ['settings', 'Settings', 'M12 8 a4 4 0 1 0 0.1 0 M4 12 H8 M16 12 H20 M12 4 V8 M12 16 V20'],
  ];
  return `<nav class="tabbar" aria-label="WalkQuest">
    ${tabs.map(([id, label, path]) => `<a href="#/${id === 'map' && !store.state.activeCampaign ? 'campaigns' : id}" class="${screen === id ? 'on' : ''}" ${screen === id ? 'aria-current="page"' : ''}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${path}"></path></svg>
      <span>${label}</span>
    </a>`).join('')}
  </nav>`;
}

function bodyFor(screen, parts) {
  if (screen === 'welcome') return welcomeScreen();
  if (screen === 'setup') return setupScreen();
  if (screen === 'campaigns') return campaignScreen();
  if (screen === 'map') return mapScreen();
  if (screen === 'log') return logScreen();
  if (screen === 'unlock') return unlockScreen();
  if (screen === 'read') return readerScreen(parts.a, parts.b);
  if (screen === 'postcard') return postcardScreen(parts.a, parts.b);
  if (screen === 'history') return historyScreen();
  if (screen === 'badges') return badgesScreen();
  if (screen === 'settings') return settingsScreen();
  return aboutScreen();
}

function welcomeScreen() {
  return `<section class="splash">
    <svg class="splash-art" viewBox="0 0 120 90" aria-hidden="true">
      <circle cx="92" cy="22" r="10" fill="#f5b724"/>
      <path d="M18 78 L28 48 H36 L40 58 H48 L58 30 H66 L70 48 H78 L88 78 Z" fill="#e6d3b1"/>
      <rect x="54" y="18" width="6" height="16" fill="#f5b724"/>
      <circle cx="57" cy="16" r="5" fill="#f5b724"/>
    </svg>
    <p class="wordmark splash-mark"><span class="mark">WalkQuest</span><span class="byline">by LoadLine Fitness</span></p>
    <h1>Turn your walks into a journey.</h1>
    <p class="lede">Pick a campaign, log your miles, and watch yourself move across a map. Chapters, checkpoints, and badges open as you go.</p>
    <ol class="steps">
      <li><span>1</span> Choose a trail.</li>
      <li><span>2</span> Walk in real life. Outside or on a treadmill.</li>
      <li><span>3</span> Log it. The map moves.</li>
    </ol>
    <p class="safety">${SAFETY}</p>
    <button type="button" class="btn primary block" data-action="start">Start walking</button>
  </section>`;
}

function setupScreen() {
  return `<section>
    <p class="kicker">Quick setup</p>
    <h1>Make the trail yours.</h1>
    <p class="lede">You can skip this. Miles and 2,000 steps per mile are ready if you do.</p>
    ${settingsFields()}
    <div class="row">
      <button type="button" class="btn ghost" data-action="skip-setup">Skip for now</button>
      <button type="button" class="btn primary" data-action="save-setup">Save and continue</button>
    </div>
  </section>`;
}

function settingsFields() {
  const distanceName = ui.units === 'km' ? 'Kilometers' : 'Miles';
  return `<label class="field" for="trail-name">Trail name
      <input id="trail-name" maxlength="40" autocomplete="nickname" value="${esc(ui.trailName)}">
    </label>
    <div class="field">
      <span class="field-label">Distance</span>
      <div class="segment" role="group" aria-label="Distance units">
        <button type="button" class="${ui.units === 'mi' ? 'on' : ''}" data-action="set-units" data-value="mi" aria-pressed="${ui.units === 'mi'}">Miles</button>
        <button type="button" class="${ui.units === 'km' ? 'on' : ''}" data-action="set-units" data-value="km" aria-pressed="${ui.units === 'km'}">Kilometers</button>
      </div>
    </div>
    <div class="field">
      <span class="field-label">Steps per mile</span>
      <div class="choice-list">
        ${choice('default', '2,000 steps per mile', 'Simple default. About a 2.6 foot stride.')}
        ${choice('height', 'Use my height', 'Estimates stride as height × 0.413.')}
        ${choice('calibrate', 'Calibrate my stride', 'Walk a known distance, then enter the steps.')}
      </div>
      ${ui.strideMode === 'height' ? heightControl() : ''}
      ${ui.strideMode === 'calibrate' ? calibrateControl(distanceName) : ''}
      <p class="fine" id="stride-preview">${esc(stridePreview())}</p>
    </div>`;
}

function choice(mode, title, detail) {
  const on = ui.strideMode === mode;
  return `<button type="button" class="choice ${on ? 'on' : ''}" data-action="set-stride" data-value="${mode}" aria-pressed="${on}">
    <strong>${title}</strong><span>${detail}</span>
  </button>`;
}

function heightControl() {
  return `<div class="split">
    <div class="stepper"><span>Feet</span>
      <button type="button" data-action="nudge-height" data-part="feet" data-delta="-1" aria-label="Shorter by one foot">−</button>
      <strong>${ui.heightFeet}</strong>
      <button type="button" data-action="nudge-height" data-part="feet" data-delta="1" aria-label="Taller by one foot">+</button>
    </div>
    <div class="stepper"><span>Inches</span>
      <button type="button" data-action="nudge-height" data-part="inches" data-delta="-1" aria-label="Shorter by one inch">−</button>
      <strong>${ui.heightInches}</strong>
      <button type="button" data-action="nudge-height" data-part="inches" data-delta="1" aria-label="Taller by one inch">+</button>
    </div>
  </div>`;
}

function calibrateControl(distanceName) {
  return `<div class="split">
    <label class="field" for="cal-distance">${distanceName} walked
      <input id="cal-distance" inputmode="decimal" value="${esc(ui.calDistance)}">
    </label>
    <label class="field" for="cal-steps">Steps counted
      <input id="cal-steps" inputmode="numeric" value="${esc(ui.calSteps)}">
    </label>
  </div>`;
}

function stridePreview() {
  const settings = draftSettings();
  if (settings.strideMode === 'calibrate' && !(settings.calibration?.miles > 0)) {
    return 'Walk a track lap or a measured block, then enter the steps and the distance.';
  }
  return strideLabel(settings);
}

function draftSettings() {
  let miles = Number(ui.calDistance);
  if (ui.units === 'km') miles = kmToMiles(miles);
  return {
    units: ui.units,
    strideMode: ui.strideMode,
    heightInches: ui.heightFeet * 12 + ui.heightInches,
    calibration: Number(ui.calSteps) > 0 && miles > 0 ? { steps: Number(ui.calSteps), miles } : null,
  };
}

function campaignScreen() {
  const cards = ['rim', 'walker', 'route66'].map((id) => {
    const campaign = getCampaign(id);
    const miles = campaignMiles(store.state.entries, id);
    const active = store.state.activeCampaign === id;
    return `<article class="campaign ${active ? 'on' : ''}">
      ${renderMap(campaign, miles, { mini: true })}
      <div class="campaign-copy">
        <p class="kicker">${esc(campaign.tag)}</p>
        <h2>${esc(campaign.name)}</h2>
        <p class="distance">${esc(formatDistance(campaign.distance, units()))}</p>
        <p>${esc(campaign.summary)}</p>
        ${miles > 0 ? `<p class="fine">${esc(formatDistance(miles, units()))} already on this trail.</p>` : ''}
        <button type="button" class="btn ${active ? 'ghost' : 'primary'} block" data-action="choose-campaign" data-id="${id}">
          ${active ? 'Continue this trail' : 'Walk this trail'}
        </button>
      </div>
    </article>`;
  }).join('');
  return `<section>
    <p class="kicker">Choose a campaign</p>
    <h1>Where are you walking?</h1>
    <p class="lede">One trail at a time. Switching keeps the miles you already logged on each one. Distances are rounded for the game.</p>
    <div class="campaign-list">${cards}</div>
  </section>`;
}

function mapScreen() {
  const state = store.state;
  const campaign = getCampaign(state.activeCampaign);
  const miles = campaignMiles(state.entries, campaign.id);
  const drawMiles = ui.mapFrom == null ? miles : ui.mapFrom;
  const next = nextStop(campaign.stops, miles);
  const streak = currentStreak(state.entries, today());
  const life = lifetimeMiles(state.entries);
  const pending = unseenUnlocks(state).length;
  const reached = campaign.stops.filter((stop) => miles >= stop.miles);
  const streakLine = `${formatNumber(streak)} ${streak === 1 ? 'day' : 'days'}`;
  const streakNote = streak === 0 && state.entries.some((entry) => entry.miles > 0)
    ? 'New streak starts today.'
    : 'One rest day a week is built in.';
  return `<section>
    ${ui.flash ? `<p class="banner">${esc(ui.flash)}</p>` : ''}
    ${pending ? `<button type="button" class="banner linkish" data-action="show-pending">${pending === 1 ? 'Something new is waiting on the trail.' : `${pending} new things are waiting on the trail.`}</button>` : ''}
    ${backupDue(state, today()) && !ui.hideBackup ? `<div class="banner">
      <p>Your walks live only on this device. Export a backup so a new phone can pick them up.</p>
      <div class="row tight">
        <button type="button" class="btn small primary" data-action="export-backup">Export backup</button>
        <button type="button" class="btn small ghost" data-action="dismiss-backup">Not now</button>
      </div>
    </div>` : ''}
    <div class="stats">
      <p><span>Done</span><strong>${esc(formatDistance(miles, units()))}</strong></p>
      <p><span>To go</span><strong>${esc(formatDistance(milesRemaining(campaign.distance, miles), units()))}</strong></p>
      <p><span>Streak</span><strong>${esc(streakLine)}</strong></p>
    </div>
    <p class="fine center">${esc(streakNote)} Lifetime ${esc(formatDistance(life, units()))}.</p>
    <div class="map-frame">${renderMap(campaign, drawMiles, { interactive: true })}</div>
    <div class="next-card">
      ${next
        ? `<p class="kicker">Next checkpoint</p><h2>${esc(next.title)}</h2><p>${esc(formatDistance(next.miles - miles, units()))} to go.</p>`
        : `<p class="kicker">Trail complete</p><h2>You walked the whole map.</h2><p>Extra miles still count on your lifetime total.</p>`}
    </div>
    <button type="button" class="btn primary block" data-action="go" data-href="#/log">Log a walk</button>
    <details class="stops" ${campaign.stops.length > 12 ? '' : 'open'}>
      <summary>Checkpoints <span>${reached.length} of ${campaign.stops.length}</span></summary>
      <ul>${campaign.stops.map((stop) => stopRow(campaign, stop, miles, next)).join('')}</ul>
    </details>
  </section>`;
}

function stopRow(campaign, stop, miles, next) {
  const open = miles >= stop.miles;
  const isNext = next?.id === stop.id;
  if (!open) {
    return `<li class="${isNext ? 'is-next' : 'locked'}"><span>${esc(stop.title)}</span><em>${esc(formatDistance(stop.miles, units()))}</em></li>`;
  }
  return `<li><button type="button" data-action="open-stop" data-campaign="${campaign.id}" data-stop="${stop.id}"><span>${esc(stop.title)}</span><em>Read</em></button></li>`;
}

function logScreen() {
  const distanceLabel = units() === 'km' ? 'Kilometers' : 'Miles';
  const modeLabel = ui.logMode === 'steps' ? 'Steps' : distanceLabel;
  const dates = [];
  for (let offset = 0; offset <= 7; offset += 1) dates.push(addDays(today(), -offset));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
  return `<section>
    <p class="kicker">${ui.editingId ? 'Edit walk' : 'Log a walk'}</p>
    <h1>${ui.editingId ? 'Fix this walk' : 'How far today?'}</h1>
    <div class="segment" role="group" aria-label="Log steps or distance">
      <button type="button" class="${ui.logMode === 'steps' ? 'on' : ''}" data-action="log-mode" data-value="steps" aria-pressed="${ui.logMode === 'steps'}">Steps</button>
      <button type="button" class="${ui.logMode === 'distance' ? 'on' : ''}" data-action="log-mode" data-value="distance" aria-pressed="${ui.logMode === 'distance'}">${esc(distanceLabel)}</button>
    </div>
    <label class="amount-label" for="amount">${esc(modeLabel)}</label>
    <input id="amount" class="amount" inputmode="${ui.logMode === 'steps' ? 'numeric' : 'decimal'}" autocomplete="off" enterkeyhint="done" value="${esc(ui.amount)}" aria-describedby="preview">
    <p id="preview" class="preview" aria-live="polite">${esc(conversionLine())}</p>
    ${ui.error ? `<p class="error" role="alert">${esc(ui.error)}</p>` : ''}
    ${ui.phase === 'typo' ? `<div class="check-card">
      <h2>That looks like an extra zero.</h2>
      <p>Did you mean ${esc(formatNumber(ui.suggestion))}?</p>
      <div class="row">
        <button type="button" class="btn primary" data-action="use-suggestion">Use ${esc(formatNumber(ui.suggestion))}</button>
        <button type="button" class="btn ghost" data-action="keep-typed">Keep what I typed</button>
      </div>
    </div>` : ''}
    ${ui.phase === 'big' ? `<div class="check-card">
      <h2>Big day! Is that right?</h2>
      <p>${esc(formatDistance(ui.pendingMiles, units()))} in one walk. Say the word and it counts.</p>
      <div class="row">
        <button type="button" class="btn primary" data-action="confirm-big">Yes</button>
        <button type="button" class="btn ghost" data-action="fix-big">Fix it</button>
      </div>
    </div>` : ''}
    ${ui.phase === 'edit' ? `<div class="pad" role="group" aria-label="Number pad">
      ${keys.map((key) => {
        const label = key === 'back' ? 'Delete' : key;
        const disabled = key === '.' && ui.logMode === 'steps';
        return `<button type="button" data-action="key" data-key="${key}" ${disabled ? 'disabled' : ''} aria-label="${label}">${key === 'back' ? '⌫' : key}</button>`;
      }).join('')}
    </div>
    <div class="dates" role="group" aria-label="Walk date">
      ${dates.map((date) => `<button type="button" class="${ui.logDate === date ? 'on' : ''}" data-action="set-date" data-date="${date}" aria-pressed="${ui.logDate === date}">${esc(prettyDate(date, today()))}</button>`).join('')}
    </div>
    <button type="button" class="toggle ${ui.indoor ? 'on' : ''}" data-action="toggle-indoor" aria-pressed="${ui.indoor}">
      <span><strong>Indoor / treadmill</strong><small>Counts the same. It just tags the walk.</small></span>
      <em>${ui.indoor ? 'On' : 'Off'}</em>
    </button>
    <p class="fine">Hot afternoon? An indoor walk counts the same. Bring water and walk in cooler hours.</p>
    <label class="field" for="note">Note, optional
      <input id="note" maxlength="280" placeholder="Lunch loop, walked with a friend" value="${esc(ui.note)}">
    </label>
    <button type="button" class="btn primary block" data-action="save-log">${ui.editingId ? 'Save changes' : 'Save walk'}</button>` : ''}
    <p class="safety">${SAFETY}</p>
  </section>`;
}

function conversionLine() {
  const settings = store.state.settings;
  const rate = activeStepsPerMile(settings);
  const amount = Number(ui.amount);
  if (!(amount > 0)) return `${strideLabel(settings)} Enter a number to preview it.`;
  if (ui.logMode === 'steps') {
    const miles = milesFromSteps(amount, rate);
    return `${formatNumber(amount)} steps = about ${formatDistance(miles, units())}. ${strideLabel(settings)}`;
  }
  const miles = units() === 'km' ? kmToMiles(amount) : amount;
  return `${formatDistance(miles, units())} = about ${formatNumber(stepsFromMiles(miles, rate))} steps. ${strideLabel(settings)}`;
}

function unlockScreen() {
  const item = ui.queue[ui.queueIndex];
  const count = ui.queue.length;
  const step = count > 1 ? `<p class="kicker">${ui.queueIndex + 1} of ${count}</p>` : '';
  if (item.type === 'badge') {
    const badge = getBadge(item.badgeId);
    return `<section class="celebrate">
      ${step}
      <p class="medal" aria-hidden="true">★</p>
      <p class="kicker">Badge earned</p>
      <h1>${esc(badge.name)}</h1>
      <p class="lede">${esc(badge.hint)}</p>
      <button type="button" class="btn primary block" data-action="go" data-href="#/badges">See badges</button>
      <button type="button" class="btn ghost block" data-action="next-unlock">${ui.queueIndex + 1 < count ? 'Next' : 'Back to the trail'}</button>
    </section>`;
  }
  const stop = getStop(item.campaignId, item.stopId);
  const campaign = getCampaign(item.campaignId);
  const chapter = stop.kind === 'chapter';
  return `<section class="celebrate">
    ${step}
    <p class="medal" aria-hidden="true">${chapter ? '✦' : '▲'}</p>
    <p class="kicker">${chapter ? 'Chapter unlocked' : 'Checkpoint'}</p>
    <h1>${esc(stop.title)}</h1>
    <p class="lede">${esc(campaign.name)} · ${esc(formatDistance(stop.miles, units()))}</p>
    <button type="button" class="btn primary block" data-action="open-stop" data-campaign="${item.campaignId}" data-stop="${item.stopId}">${chapter ? 'Read the chapter' : 'Read the field note'}</button>
    <button type="button" class="btn ghost block" data-action="go" data-href="#/postcard/${item.campaignId}/${item.stopId}">Make a postcard</button>
    <button type="button" class="btn text" data-action="skip-unlock">Keep walking</button>
  </section>`;
}

function readerScreen(campaignId, stopId) {
  const stop = getStop(campaignId, stopId);
  const campaign = getCampaign(campaignId);
  if (!stop || !campaign) return `<section><h1>That page isn't on the trail.</h1></section>`;
  const miles = campaignMiles(store.state.entries, campaignId);
  if (miles < stop.miles) {
    return `<section><h1>Still ahead.</h1><p class="lede">This one opens at ${esc(formatDistance(stop.miles, units()))}. Keep walking.</p>
      <button type="button" class="btn primary block" data-action="go" data-href="#/map">Back to the trail</button></section>`;
  }
  const chapter = stop.kind === 'chapter';
  return `<section class="reader">
    <p class="kicker">${chapter ? 'Chapter' : 'Field note'} · ${esc(campaign.name)}</p>
    ${renderMap(campaign, stop.miles, { mini: true })}
    <h1>${esc(stop.title)}</h1>
    <p class="fine">${esc(stop.place)} · ${esc(formatDistance(stop.miles, units()))}</p>
    <div class="prose">${stop.body.trim().split(/\n\n+/).map((part) => `<p>${esc(part)}</p>`).join('')}</div>
    ${stop.takeaway ? `<blockquote>${esc(stop.takeaway)}</blockquote>` : ''}
    <button type="button" class="btn ghost block" data-action="go" data-href="#/postcard/${campaignId}/${stopId}">Postcard</button>
    <button type="button" class="btn primary block" data-action="go" data-href="#/map">Back to the trail</button>
  </section>`;
}

function postcardScreen(campaignId, stopId) {
  const stop = getStop(campaignId, stopId);
  const campaign = getCampaign(campaignId);
  if (!stop || !campaign) return `<section><h1>No postcard for that stop.</h1></section>`;
  const miles = Math.max(campaignMiles(store.state.entries, campaignId), stop.miles);
  if (campaignMiles(store.state.entries, campaignId) < stop.miles) {
    return `<section><h1>Still ahead.</h1><button type="button" class="btn primary block" data-action="go" data-href="#/map">Back to the trail</button></section>`;
  }
  return `<section>
    <p class="kicker">Postcard</p>
    <h1>${esc(stop.title)}</h1>
    <canvas id="postcard" aria-label="Postcard for ${esc(stop.title)}"></canvas>
    <p class="fine">${esc(trailName())} · ${esc(formatDistance(miles, units()))} on ${esc(campaign.name)}</p>
    <div class="row">
      <button type="button" class="btn primary" data-action="save-postcard">Save</button>
      <button type="button" class="btn ghost" data-action="share-postcard">Share</button>
    </div>
  </section>`;
}

function historyScreen() {
  const state = store.state;
  const entries = [...state.entries].sort((a, b) => (a.date === b.date ? (b.createdAt || '').localeCompare(a.createdAt || '') : b.date.localeCompare(a.date)));
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (!last || last.date !== entry.date) groups.push({ date: entry.date, entries: [entry] });
    else last.entries.push(entry);
  }
  const list = groups.length ? groups.map((group) => `<section class="day-group">
      <header><h2>${esc(prettyDate(group.date, today()))}</h2><strong>${esc(formatDistance(dayMiles(state.entries, group.date), units()))}</strong></header>
      ${group.entries.map((entry) => {
        const campaign = getCampaign(entry.campaignId);
        return `<article class="entry">
          <p><strong>${esc(formatDistance(entry.miles, units()))}</strong> ${entry.steps ? `<span>· ${esc(formatNumber(entry.steps))} steps</span>` : ''}</p>
          <p class="fine">${esc(campaign?.name || 'Trail')}${entry.indoor ? ' · Indoor' : ''}${entry.note ? ` · ${esc(entry.note)}` : ''}</p>
          <div class="row tight">
            <button type="button" class="btn small ghost" data-action="go" data-href="#/log/${entry.id}">Edit</button>
            <button type="button" class="btn small danger" data-action="ask-delete" data-id="${entry.id}">Delete</button>
          </div>
        </article>`;
      }).join('')}
    </section>`).join('') : `<p class="lede">No walks yet. The map is waiting on the first one.</p>`;
  return `<section>
    <p class="kicker">History</p>
    <h1>Your walks</h1>
    <div class="stats">
      <p><span>This week</span><strong>${esc(formatDistance(weekMiles(state.entries, today()), units()))}</strong></p>
      <p><span>Lifetime</span><strong>${esc(formatDistance(lifetimeMiles(state.entries), units()))}</strong></p>
      <p><span>Streak</span><strong>${formatNumber(currentStreak(state.entries, today()))}</strong></p>
    </div>
    ${list}
  </section>`;
}

function badgesScreen() {
  const state = store.state;
  const earned = evaluateBadges(state);
  const groups = ['Distance', 'Streaks', 'Campaigns', 'Habits', 'Story'];
  return `<section>
    <p class="kicker">Badges</p>
    <h1>${earned.size} of ${BADGES.length}</h1>
    <p class="lede">Earned badges stay in color. The others tell you what's left.</p>
    ${groups.map((group) => `<h2 class="group-label">${group}</h2><ul class="badge-grid">${BADGES.filter((badge) => badge.group === group).map((badge) => badgeCard(badge, earned, state)).join('')}</ul>`).join('')}
  </section>`;
}

function badgeCard(badge, earned, state) {
  const on = earned.has(badge.id);
  return `<li class="badge ${on ? 'on' : ''}">
    <span class="badge-mark" aria-hidden="true">${on ? '★' : '☆'}</span>
    <span>
      <strong>${esc(badge.name)}</strong>
      <small>${esc(on ? 'Earned' : badgeStatus(badge, state))}</small>
    </span>
  </li>`;
}

function badgeStatus(badge, state) {
  if (badge.later) return 'A later campaign.';
  const life = lifetimeMiles(state.entries);
  const goals = { 'first-mile': 1, 'ten-miles': 10, marathon: 26.2, hundred: 100, 'five-hundred': 500, thousand: 1000 };
  if (goals[badge.id]) return `${formatDistance(life, units())} of ${formatDistance(goals[badge.id], units())}`;
  if (badge.id.startsWith('streak')) return `Best streak: ${formatNumber(maxStreak(state.entries))} days.`;
  if (badge.id === 'treadmill') return `${state.entries.filter((entry) => entry.indoor && entry.miles > 0).length} of 10 indoor walks.`;
  if (badge.id === 'early-bird') return `${state.entries.filter((entry) => entry.miles > 0 && entry.loggedHour < 8).length} of 5 walks logged before 8 AM.`;
  if (badge.id === 'comeback') return hasComeback(state.entries) ? 'Earned' : 'Log a walk 7 or more days after the one before it.';
  return badge.hint;
}

function settingsScreen() {
  const state = store.state;
  const when = state.backup.lastBackupAt ? prettyDate(state.backup.lastBackupAt.slice(0, 10), today()) : 'never';
  return `<section>
    <p class="kicker">Settings</p>
    <h1>Your trail kit</h1>
    ${settingsFields()}
    <button type="button" class="btn primary block" data-action="save-settings">Save settings</button>
    <h2 class="group-label">Backup</h2>
    <p class="fine">Last backup: ${esc(when)}. The file holds your walks, settings, and progress, with a version number so a later WalkQuest can still read it.</p>
    <div class="row">
      <button type="button" class="btn ghost" data-action="export-backup">Export</button>
      <button type="button" class="btn ghost" data-action="pick-import">Import</button>
    </div>
    <input id="import-file" type="file" accept="application/json,.json" hidden>
    <h2 class="group-label">Campaign</h2>
    <p class="fine">One active trail. The miles on the others stay put.</p>
    <div class="choice-list">
      ${['rim', 'walker', 'route66'].map((id) => {
        const campaign = getCampaign(id);
        const on = state.activeCampaign === id;
        const miles = campaignMiles(state.entries, id);
        return `<button type="button" class="choice ${on ? 'on' : ''}" data-action="switch-campaign" data-id="${id}" aria-pressed="${on}">
          <strong>${esc(campaign.name)}</strong><span>${esc(formatDistance(miles, units()))} logged${on ? ' · active' : ''}</span>
        </button>`;
      }).join('')}
    </div>
    <h2 class="group-label">On this phone</h2>
    <p class="fine">Add WalkQuest to your home screen from the browser menu. After it has loaded once, it keeps working offline. Use the same browser, or import a backup.</p>
    <a class="btn ghost block" href="#/about">About and safety</a>
    <button type="button" class="btn danger block" data-action="ask-reset">Erase walks on this device</button>
  </section>`;
}

function aboutScreen() {
  return `<section class="reader">
    <p class="kicker">About and safety</p>
    <h1>WalkQuest</h1>
    <p class="byline">by LoadLine Fitness</p>
    <p>WalkQuest is a walking game. You pick a campaign, log walks yourself, and move along a map drawn for the game. Story chapters, field notes, checkpoints, and badges open as the miles add up.</p>
    <p>The maps are stylized pictures. They are not for navigation, and they are not a trail guide. Real walks, especially in the heat or on a long route, need your own plan and water.</p>
    <p class="safety">${SAFETY}</p>
    <h2>Your data stays here</h2>
    <p>Your trail name, walks, settings, and badges stay on this device. LoadLine does not receive them. There is no account. Clearing this browser, or switching phones, can erase what is stored here, so export a backup when the app reminds you.</p>
    <p><a href="https://www.loadlinefitness.com">LoadLine Fitness</a></p>
    <a class="btn ghost block" href="/apps">All apps</a>
  </section>`;
}

function confirmHtml() {
  const copy = {
    reset: ['Erase walks on this device?', 'This clears the log, badges, and settings in this browser. Export a backup first if you want them.', 'Erase', 'confirm-reset', 'Keep my walks'],
    delete: ['Delete this walk?', 'The miles come off the map and your lifetime total.', 'Delete', 'confirm-delete', 'Keep it'],
    import: ['Replace what is on this device?', 'The backup will take the place of the walks stored here.', 'Import', 'confirm-import', 'Cancel'],
    switch: ['Switch trails?', 'Miles you already logged on each campaign stay put. New walks go to the trail you pick.', 'Switch', 'confirm-switch', 'Stay'],
  }[ui.confirm.type];
  return `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <h2 id="confirm-title">${copy[0]}</h2>
    <p>${copy[1]}</p>
    <div class="row">
      <button type="button" class="btn ${ui.confirm.type === 'reset' || ui.confirm.type === 'delete' ? 'danger' : 'primary'}" data-action="${copy[3]}" data-autofocus>${copy[2]}</button>
      <button type="button" class="btn ghost" data-action="cancel-confirm">${copy[4]}</button>
    </div>
  </div></div>`;
}

function ensureLog(hash) {
  if (ui.logKey === hash) return;
  ui.logKey = hash;
  const id = hash.split('/')[2] || '';
  const entry = id ? store.state.entries.find((item) => item.id === id) : null;
  ui.editingId = entry?.id || null;
  ui.logMode = entry?.inputMode === 'distance' ? 'distance' : 'steps';
  ui.logDate = entry?.date || today();
  ui.indoor = Boolean(entry?.indoor);
  ui.note = entry?.note || '';
  ui.phase = 'edit';
  ui.typoAck = false;
  ui.bigAck = false;
  ui.error = '';
  if (!entry) ui.amount = '';
  else if (entry.inputMode === 'steps') ui.amount = entry.steps ? String(entry.steps) : '';
  else ui.amount = String(units() === 'km' ? Math.round(milesToKm(entry.miles) * 10) / 10 : entry.miles);
}

function ensureDraft(screen) {
  if (ui.draftScreen === screen) return;
  const settings = store.state.settings;
  ui.trailName = settings.trailName || 'Walker';
  ui.units = settings.units === 'km' ? 'km' : 'mi';
  ui.strideMode = settings.strideMode || 'default';
  const inches = settings.heightInches || 66;
  ui.heightFeet = Math.min(7, Math.max(4, Math.floor(inches / 12)));
  ui.heightInches = inches % 12;
  ui.calSteps = settings.calibration ? String(settings.calibration.steps) : '';
  ui.calDistance = settings.calibration
    ? String(Math.round((settings.units === 'km' ? milesToKm(settings.calibration.miles) : settings.calibration.miles) * 100) / 100)
    : '';
  ui.draftScreen = screen;
}

function readDraftInputs() {
  const name = document.getElementById('trail-name');
  if (name) ui.trailName = name.value;
  const note = document.getElementById('note');
  if (note) ui.note = note.value;
  const amount = document.getElementById('amount');
  if (amount) ui.amount = amount.value;
  const distance = document.getElementById('cal-distance');
  if (distance) ui.calDistance = distance.value;
  const steps = document.getElementById('cal-steps');
  if (steps) ui.calSteps = steps.value;
}

function applyDraft(skipInvalid) {
  readDraftInputs();
  const name = ui.trailName.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 40) || 'Walker';
  const settings = draftSettings();
  if (settings.strideMode === 'calibrate' && !settings.calibration) {
    if (skipInvalid) settings.strideMode = 'default';
    else {
      toast('Add the steps and the distance you walked, or pick another stride option.');
      return false;
    }
  }
  if (settings.strideMode === 'height') {
    const inches = settings.heightInches;
    if (inches < 48 || inches > 86) {
      toast('Enter a height between 4 feet and 7 feet 2 inches.');
      return false;
    }
  }
  store.update((state) => {
    state.settings.trailName = name;
    state.settings.units = ui.units === 'km' ? 'km' : 'mi';
    state.settings.strideMode = settings.strideMode;
    if (settings.strideMode === 'height') state.settings.heightInches = settings.heightInches;
    if (settings.strideMode === 'calibrate' && settings.calibration) state.settings.calibration = settings.calibration;
  }, { silent: true });
  ui.draftScreen = '';
  return true;
}

function finishSetup(skip) {
  if (skip) {
    store.update((state) => {
      state.welcomed = true;
      state.setupComplete = true;
      state.startedAt = state.startedAt || new Date().toISOString();
    }, { silent: true });
  } else if (!applyDraft(false)) return;
  else {
    store.update((state) => {
      state.welcomed = true;
      state.setupComplete = true;
      state.startedAt = state.startedAt || new Date().toISOString();
    }, { silent: true });
  }
  ui.draftScreen = '';
  show('#/campaigns');
}

function chooseCampaign(id) {
  if (!getCampaign(id)) return;
  if (store.state.activeCampaign === id) {
    show('#/map');
    return;
  }
  const before = structuredClone(store.state);
  const beforeMiles = campaignMiles(before.entries, id);
  store.update((state) => {
    state.started = state.started || [];
    if (!state.started.includes(id)) state.started.push(id);
    state.activeCampaign = id;
  }, { silent: true });
  const queue = unlocksFromLog(before, store.state, id, -1, beforeMiles)
    .filter((item) => !store.state.seenUnlocks.includes(item.id));
  ui.mapFrom = null;
  if (queue.length) openUnlock(queue);
  else show('#/map');
}

function openUnlock(queue) {
  ui.queue = queue;
  ui.queueIndex = 0;
  markSeen(queue[0]?.id);
  show('#/unlock');
}

function sanitizeAmount(raw) {
  const text = String(raw);
  if (ui.logMode === 'steps') return text.replace(/[^\d]/g, '').slice(0, 7);
  const cleaned = text.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned.slice(0, 4);
  return `${cleaned.slice(0, dot).slice(0, 4)}.${cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)}`;
}

function pressKey(key) {
  ui.phase = 'edit';
  ui.typoAck = false;
  ui.bigAck = false;
  ui.error = '';
  ui.amount = key === 'back' ? ui.amount.slice(0, -1) : sanitizeAmount(ui.amount + key);
  const input = document.getElementById('amount');
  const preview = document.getElementById('preview');
  if (input && preview) {
    input.value = ui.amount;
    preview.textContent = conversionLine();
    return;
  }
  render();
}

function parsedAmount() {
  readDraftInputs();
  ui.amount = sanitizeAmount(ui.amount);
  const value = Number(ui.amount);
  if (!(value > 0)) return { ok: false, message: 'Add a distance first.' };
  const rate = activeStepsPerMile(store.state.settings);
  if (ui.logMode === 'steps') {
    if (!Number.isInteger(value)) return { ok: false, message: 'Use a whole number of steps.' };
    return { ok: true, steps: value, miles: milesFromSteps(value, rate) };
  }
  const miles = units() === 'km' ? kmToMiles(value) : roundMiles(value);
  if (!(miles > 0)) return { ok: false, message: 'Add a distance first.' };
  return { ok: true, steps: null, miles };
}

function saveLog() {
  const parsed = parsedAmount();
  if (!parsed.ok) {
    ui.error = parsed.message;
    ui.phase = 'edit';
    render();
    return;
  }
  const dateCheck = checkDate(ui.logDate, today());
  if (!dateCheck.ok) {
    ui.error = dateCheck.message;
    ui.phase = 'edit';
    render();
    return;
  }
  if (parsed.steps != null && parsed.steps >= 100000 && !ui.typoAck) {
    ui.suggestion = typoSuggestion(parsed.steps);
    ui.phase = 'typo';
    ui.error = '';
    render();
    return;
  }
  if (needsBigDayConfirm(parsed.miles, parsed.steps) && !ui.bigAck) {
    ui.pendingMiles = parsed.miles;
    ui.phase = 'big';
    ui.error = '';
    render();
    return;
  }
  const cap = capDayMiles(dayMiles(store.state.entries, ui.logDate, ui.editingId), parsed.miles);
  if (cap.blocked) {
    ui.error = 'This day is already at 50 miles, so there is no room to add another walk.';
    ui.phase = 'edit';
    render();
    return;
  }
  writeEntry(parsed, cap);
}

function writeEntry(parsed, cap) {
  const before = structuredClone(store.state);
  const existing = ui.editingId ? before.entries.find((entry) => entry.id === ui.editingId) : null;
  const campaignId = existing?.campaignId || before.activeCampaign;
  const beforeMiles = campaignMiles(before.entries, campaignId);
  const entry = {
    id: existing?.id || uid(),
    campaignId,
    date: ui.logDate,
    miles: cap.miles,
    steps: parsed.steps,
    stepsPerMile: parsed.steps != null ? activeStepsPerMile(before.settings) : null,
    inputMode: ui.logMode,
    indoor: ui.indoor,
    note: ui.note.trim().slice(0, 280),
    loggedHour: existing ? existing.loggedHour : new Date().getHours(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    capped: cap.capped,
  };
  store.update((state) => {
    state.entries = state.entries.filter((item) => item.id !== entry.id);
    state.entries.push(entry);
  }, { silent: true });
  const queue = unlocksFromLog(before, store.state, campaignId, beforeMiles, campaignMiles(store.state.entries, campaignId))
    .filter((item) => !store.state.seenUnlocks.includes(item.id));
  if (campaignId === store.state.activeCampaign) ui.mapFrom = beforeMiles;
  ui.logKey = '';
  ui.flash = cap.capped
    ? `That's a lot for one day, so this day stops at 50 miles. We logged ${formatDistance(cap.miles, units())}.`
    : '';
  if (!existing && restartedToday(store.state.entries, today())) ui.toast = 'New streak starts today.';
  else ui.toast = cap.capped ? '' : 'Walk logged. Every mile counts.';
  if (queue.length) openUnlock(queue);
  else show('#/map');
}

function exportBackup() {
  const payload = serializeBackup(markBackedUp(store.state));
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `walkquest-backup-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  store.update((state) => {
    state.backup = { lastBackupAt: payload.exportedAt, entryCount: state.entries.length };
  }, { silent: true });
  ui.hideBackup = true;
  ui.draftScreen = '';
  toast('Backup saved on this device.');
  render();
}

function readImport(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseBackup(String(reader.result));
    if (!parsed.ok) {
      toast(parsed.error);
      return;
    }
    ui.pendingImport = parsed.state;
    ui.confirm = { type: 'import' };
    render();
  };
  reader.readAsText(file);
}

function postcardFileName() {
  const parts = route();
  return `walkquest-${parts.b || 'postcard'}.png`;
}

function savePostcard() {
  const canvas = document.getElementById('postcard');
  if (!canvas) return;
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = postcardFileName();
  link.click();
}

async function sharePostcard() {
  const canvas = document.getElementById('postcard');
  if (!canvas) return;
  const parts = route();
  const stop = getStop(parts.a, parts.b);
  const campaign = getCampaign(parts.a);
  const miles = campaign ? campaignMiles(store.state.entries, campaign.id) : 0;
  const text = `${trailName()} reached ${stop?.title || 'a checkpoint'} on ${campaign?.name || 'WalkQuest'}. ${formatDistance(miles, units())} walked.`;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], postcardFileName(), { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'WalkQuest', text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: 'WalkQuest', text });
      return;
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
  }
  savePostcard();
  toast('Sharing is not available here, so the postcard was saved instead.');
}

function afterPaint() {
  armToast();
  const focus = document.querySelector('[data-autofocus]');
  if (focus) focus.focus();
  const parts = route();
  if (parts.screen === 'postcard') {
    const canvas = document.getElementById('postcard');
    const campaign = getCampaign(parts.a);
    const stop = getStop(parts.a, parts.b);
    if (canvas && campaign && stop) {
      drawPostcard(canvas, {
        campaignName: campaign.name,
        stopTitle: stop.title,
        trailName: trailName(),
        miles: Math.max(campaignMiles(store.state.entries, campaign.id), stop.miles),
        units: units(),
        stops: campaign.stops,
      });
    }
  }
  const svg = document.querySelector('[data-map]');
  const campaign = getCampaign(store.state.activeCampaign);
  if (!svg || !campaign || ui.mapFrom == null || parts.screen !== 'map') return;
  const from = ui.mapFrom;
  const to = campaignMiles(store.state.entries, campaign.id);
  ui.mapFrom = null;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || Math.abs(to - from) < 0.001) {
    applyMiles(svg, campaign, to);
    return;
  }
  const token = ++ui.mapToken;
  const start = performance.now();
  const tick = (now) => {
    if (token !== ui.mapToken) return;
    const t = Math.min(1, (now - start) / 1400);
    const eased = 1 - (1 - t) ** 3;
    applyMiles(svg, campaign, from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  applyMiles(svg, campaign, from);
  requestAnimationFrame(tick);
}

function onClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'go') {
    ui.draftScreen = '';
    show(button.dataset.href);
    return;
  }
  if (action === 'start') {
    store.update((state) => {
      state.welcomed = true;
      state.startedAt = state.startedAt || new Date().toISOString();
    }, { silent: true });
    show('#/setup');
    return;
  }
  if (action === 'skip-setup') finishSetup(true);
  if (action === 'save-setup') finishSetup(false);
  if (action === 'save-settings') {
    if (applyDraft(false)) {
      toast('Settings saved.');
      render();
    }
    return;
  }
  if (action === 'set-units') {
    readDraftInputs();
    ui.units = button.dataset.value;
    render();
    return;
  }
  if (action === 'set-stride') {
    readDraftInputs();
    ui.strideMode = button.dataset.value;
    render();
    return;
  }
  if (action === 'nudge-height') {
    readDraftInputs();
    const delta = Number(button.dataset.delta);
    if (button.dataset.part === 'feet') ui.heightFeet = Math.min(7, Math.max(4, ui.heightFeet + delta));
    else ui.heightInches = Math.min(11, Math.max(0, ui.heightInches + delta));
    render();
    return;
  }
  if (action === 'choose-campaign') chooseCampaign(button.dataset.id);
  if (action === 'switch-campaign') {
    if (button.dataset.id === store.state.activeCampaign) return;
    ui.confirm = { type: 'switch', id: button.dataset.id };
    render();
    return;
  }
  if (action === 'confirm-switch') {
    const id = ui.confirm?.id;
    ui.confirm = null;
    chooseCampaign(id);
    return;
  }
  if (action === 'key') pressKey(button.dataset.key);
  if (action === 'log-mode') {
    readDraftInputs();
    ui.logMode = button.dataset.value;
    ui.amount = sanitizeAmount(ui.amount);
    ui.phase = 'edit';
    ui.typoAck = false;
    ui.bigAck = false;
    render();
    return;
  }
  if (action === 'set-date') {
    ui.logDate = button.dataset.date;
    render();
    return;
  }
  if (action === 'toggle-indoor') {
    readDraftInputs();
    ui.indoor = !ui.indoor;
    render();
    return;
  }
  if (action === 'save-log') saveLog();
  if (action === 'use-suggestion') {
    ui.amount = String(ui.suggestion);
    ui.typoAck = true;
    ui.phase = 'edit';
    saveLog();
    return;
  }
  if (action === 'keep-typed') {
    ui.typoAck = true;
    ui.phase = 'edit';
    saveLog();
    return;
  }
  if (action === 'confirm-big') {
    ui.bigAck = true;
    ui.phase = 'edit';
    saveLog();
    return;
  }
  if (action === 'fix-big') {
    ui.phase = 'edit';
    ui.bigAck = false;
    render();
    return;
  }
  if (action === 'open-stop') {
    const campaign = getCampaign(button.dataset.campaign);
    const stop = getStop(button.dataset.campaign, button.dataset.stop);
    const miles = campaignMiles(store.state.entries, button.dataset.campaign);
    if (!stop || miles < stop.miles) {
      toast(`Keep walking. This one opens at ${formatDistance(stop?.miles || 0, units())}.`);
      return;
    }
    show(`#/read/${button.dataset.campaign}/${button.dataset.stop}`);
    return;
  }
  if (action === 'next-unlock') {
    ui.queueIndex += 1;
    if (!ui.queue[ui.queueIndex]) {
      ui.queue = [];
      show('#/map');
      return;
    }
    markSeen(ui.queue[ui.queueIndex].id);
    render();
    return;
  }
  if (action === 'skip-unlock') {
    const ids = ui.queue.map((item) => item.id);
    store.update((state) => {
      for (const id of ids) if (!state.seenUnlocks.includes(id)) state.seenUnlocks.push(id);
    }, { silent: true });
    ui.queue = [];
    show('#/map');
    return;
  }
  if (action === 'show-pending') {
    ui.queue = unseenUnlocks(store.state);
    ui.queueIndex = 0;
    if (ui.queue.length) show('#/unlock');
    return;
  }
  if (action === 'save-postcard') savePostcard();
  if (action === 'share-postcard') sharePostcard();
  if (action === 'export-backup') exportBackup();
  if (action === 'pick-import') document.getElementById('import-file')?.click();
  if (action === 'dismiss-backup') {
    ui.hideBackup = true;
    render();
    return;
  }
  if (action === 'ask-delete') {
    ui.confirm = { type: 'delete', id: button.dataset.id };
    render();
    return;
  }
  if (action === 'confirm-delete') {
    const id = ui.confirm?.id;
    const entry = store.state.entries.find((item) => item.id === id);
    ui.confirm = null;
    if (entry && entry.campaignId === store.state.activeCampaign) {
      ui.mapFrom = campaignMiles(store.state.entries, entry.campaignId);
    }
    store.update((state) => {
      state.entries = state.entries.filter((item) => item.id !== id);
    }, { silent: true });
    ui.draftScreen = '';
    toast('Walk deleted.');
    render();
    return;
  }
  if (action === 'ask-reset') {
    ui.confirm = { type: 'reset' };
    render();
    return;
  }
  if (action === 'confirm-reset') {
    ui.confirm = null;
    ui.queue = [];
    ui.logKey = '';
    ui.draftScreen = '';
    ui.hideBackup = false;
    store.reset({ silent: true });
    show('#/welcome');
    return;
  }
  if (action === 'confirm-import' && ui.pendingImport) {
    const imported = ui.pendingImport;
    ui.pendingImport = null;
    ui.confirm = null;
    ui.queue = [];
    ui.logKey = '';
    ui.draftScreen = '';
    store.replace(imported, { silent: true });
    toast('Backup loaded. You are picked up where you left off.');
    show(imported.activeCampaign ? '#/map' : '#/campaigns');
    return;
  }
  if (action === 'cancel-confirm') {
    ui.confirm = null;
    ui.pendingImport = null;
    render();
  }
}

function onInput(event) {
  if (event.target.id === 'amount') {
    const clean = sanitizeAmount(event.target.value);
    if (clean !== event.target.value) event.target.value = clean;
    ui.amount = clean;
    ui.typoAck = false;
    ui.bigAck = false;
    const preview = document.getElementById('preview');
    if (preview) preview.textContent = conversionLine();
  }
  if (event.target.id === 'note') ui.note = event.target.value;
  if (event.target.id === 'trail-name') ui.trailName = event.target.value;
  if (event.target.id === 'cal-distance') ui.calDistance = event.target.value;
  if (event.target.id === 'cal-steps') ui.calSteps = event.target.value;
  if (event.target.id === 'cal-distance' || event.target.id === 'cal-steps') {
    const preview = document.getElementById('stride-preview');
    if (preview) preview.textContent = stridePreview();
  }
}

function onChange(event) {
  if (event.target.id === 'import-file') readImport(event.target);
}

function onKey(event) {
  if (event.key === 'Escape' && ui.confirm) {
    ui.confirm = null;
    ui.pendingImport = null;
    render();
    return;
  }
  if (event.key === 'Enter' && event.target.closest?.('[data-action="open-stop"]')) {
    event.preventDefault();
    event.target.click();
    return;
  }
  if (document.body.dataset.screen !== 'log' || ui.phase !== 'edit') return;
  if (event.target.id === 'note' || event.target.id === 'amount') return;
  if (/^\d$/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
    event.preventDefault();
    pressKey(event.key === 'Backspace' ? 'back' : event.key);
  }
}

document.addEventListener('click', onClick);
document.addEventListener('input', onInput);
document.addEventListener('change', onChange);
document.addEventListener('keydown', onKey);
window.addEventListener('hashchange', () => render());

if (!location.hash) {
  const state = store.state;
  if (!state.welcomed) location.replace('#/welcome');
  else if (!state.setupComplete) location.replace('#/setup');
  else if (!state.activeCampaign) location.replace('#/campaigns');
  else location.replace('#/map');
}
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/apps/walkquest/sw.js', { scope: '/apps/walkquest/' }).catch(() => {});
}
