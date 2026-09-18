// ===================== DATA & STATE =====================
const STORAGE = 'loadline_tracker_v1';
let allData = JSON.parse(localStorage.getItem(STORAGE) || '{}');
let currentDate = new Date();
const TABS = ['stats','workout','nutrition','supplements','steps','primer','grocery'];

function save() { localStorage.setItem(STORAGE, JSON.stringify(allData)); }
function dateKey(d) { return d.toISOString().split('T')[0]; }
function dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }
function getDayData() { const dk = dateKey(currentDate); if (!allData[dk]) allData[dk] = {}; return allData[dk]; }

// ===================== SPLASH & PROFILE =====================
function acceptSplash() {
  allData.splashAccepted = true; save();
  document.getElementById('splashScreen').classList.add('hidden');
  if (!allData.profile) { document.getElementById('profileSetup').classList.remove('hidden'); }
  else { showApp(); }
}

function saveProfile() {
  const name = document.getElementById('profName').value.trim() || 'User';
  const gender = document.getElementById('profGender').value;
  const age = parseInt(document.getElementById('profAge').value) || 0;
  const height = parseFloat(document.getElementById('profHeight').value) || 0;
  const weight = parseFloat(document.getElementById('profWeight').value) || 0;
  const waist = parseFloat(document.getElementById('profWaist').value) || 0;
  const tre = document.getElementById('profTRE').value;
  allData.profile = { name, gender, age, height, weight, waist, tre, created: new Date().toISOString() };
  if (!allData.bodyLog) allData.bodyLog = [];
  allData.bodyLog.push({ date: dateKey(new Date()), weight, waist, notes: 'Baseline' });
  save();
  document.getElementById('profileSetup').classList.add('hidden');
  showApp();
}

function openEditProfile() {
  document.getElementById('profileMenu').classList.remove('show');
  const p = allData.profile;
  if (p) {
    document.getElementById('profName').value = p.name;
    document.getElementById('profGender').value = p.gender;
    document.getElementById('profAge').value = p.age;
    document.getElementById('profHeight').value = p.height;
    document.getElementById('profWeight').value = p.weight;
    document.getElementById('profWaist').value = p.waist;
    document.getElementById('profTRE').value = p.tre || '14:10';
  }
  document.getElementById('profileSetup').classList.remove('hidden');
}

function showApp() {
  document.getElementById('mainApp').classList.remove('hidden');
  const p = allData.profile;
  if (p) {
    document.getElementById('profAvatar').textContent = p.name.charAt(0).toUpperCase();
    document.getElementById('profDisplayName').textContent = p.name;
  }
  renderAll();
}

function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('show'); }
document.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-chip') && !e.target.closest('.profile-dropdown')) {
    document.getElementById('profileMenu').classList.remove('show');
  }
});

function resetApp() {
  if (confirm('This will delete ALL your tracking data. Are you sure?')) {
    localStorage.removeItem(STORAGE);
    location.reload();
  }
}

function changeDate(offset) { currentDate.setDate(currentDate.getDate() + offset); renderAll(); }

function switchTab(tab) {
  TABS.forEach((t, i) => { document.querySelectorAll('.tab')[i].classList.toggle('active', t === tab); });
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
  if (tab === 'stats') renderStats();
}

// ===================== YOUR NUMBERS =====================
function renderStats() {
  const el = document.getElementById('sec-stats');
  const p = allData.profile || {};
  const log = allData.bodyLog || [];
  const latest = log.length ? log[log.length - 1] : {};
  const baseline = log.length ? log[0] : {};
  const cw = latest.weight || p.weight || 0;
  const cwa = latest.waist || p.waist || 0;
  const h = p.height || 0;
  const bmi = (h > 0 && cw > 0) ? ((cw / (h * h)) * 703).toFixed(1) : '--';
  const whtr = (h > 0 && cwa > 0) ? (cwa / h).toFixed(2) : '--';
  const whtrS = whtr !== '--' ? (parseFloat(whtr) < 0.5 ? 'Healthy' : 'Elevated') : '';
  const wChg = (baseline.weight && cw && baseline.weight !== cw) ? (cw - baseline.weight) : null;
  const waChg = (baseline.waist && cwa && baseline.waist !== cwa) ? (cwa - baseline.waist) : null;

  let html = '<div class="stats-hero">';
  html += '<div class="stat-card"><div class="stat-value">' + (cw || '--') + '</div><div class="stat-label">Weight (lbs)</div>' + (wChg !== null ? '<div class="stat-change ' + (wChg < 0 ? 'down' : wChg > 0 ? 'up' : 'neutral') + '">' + (wChg > 0 ? '+' : '') + wChg.toFixed(1) + ' lbs</div>' : '') + '</div>';
  html += '<div class="stat-card"><div class="stat-value">' + (cwa || '--') + '</div><div class="stat-label">Waist (in)</div>' + (waChg !== null ? '<div class="stat-change ' + (waChg < 0 ? 'down' : waChg > 0 ? 'up' : 'neutral') + '">' + (waChg > 0 ? '+' : '') + waChg.toFixed(1) + ' in</div>' : '') + '</div>';
  html += '<div class="stat-card"><div class="stat-value">' + bmi + '</div><div class="stat-label">BMI</div><div class="stat-change neutral">' + (bmi !== '--' ? (parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese') : '') + '</div></div>';
  html += '<div class="stat-card"><div class="stat-value">' + whtr + '</div><div class="stat-label">Waist/Height</div><div class="stat-change ' + (whtrS === 'Healthy' ? 'down' : 'up') + '">' + whtrS + '</div></div>';
  html += '</div>';

  html += '<div class="card highlight"><h3>Your Profile</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:12px;">';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">Name</span><span style="font-weight:700;color:white;">' + (p.name || '--') + '</span></div>';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">Gender</span><span style="font-weight:700;color:white;">' + (p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '--') + '</span></div>';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">Age</span><span style="font-weight:700;color:white;">' + (p.age || '--') + '</span></div>';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">Height</span><span style="font-weight:700;color:white;">' + (p.height ? p.height + '"' : '--') + '</span></div>';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">TRE Window</span><span style="font-weight:700;color:white;">' + (p.tre || '14:10') + '</span></div>';
  html += '<div><span style="font-size:0.75rem;color:var(--text2);display:block;">Days Tracking</span><span style="font-weight:700;color:white;">' + log.length + '</span></div>';
  html += '</div></div>';

  html += '<div class="card"><h3>Log Today\'s Numbers</h3><div class="log-form">';
  html += '<div class="form-field"><label>Weight (lbs)</label><input type="number" id="logWeight" step="0.1" placeholder="' + (cw || '200') + '"></div>';
  html += '<div class="form-field"><label>Waist (in)</label><input type="number" id="logWaist" step="0.1" placeholder="' + (cwa || '38') + '"></div>';
  html += '<div class="form-field"><label>Notes</label><input type="text" id="logNotes" placeholder="Optional"></div>';
  html += '<button onclick="logBodyNumbers()">Log</button></div></div>';

  if (log.length > 0) {
    html += '<div class="card"><h3>History</h3><table class="history-table"><thead><tr><th>Date</th><th>Weight</th><th>Waist</th><th>BMI</th><th>WHtR</th><th>Notes</th><th></th></tr></thead><tbody>';
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      const eb = (h > 0 && e.weight) ? ((e.weight / (h * h)) * 703).toFixed(1) : '--';
      const ew = (h > 0 && e.waist) ? (e.waist / h).toFixed(2) : '--';
      html += '<tr><td>' + e.date + '</td><td>' + (e.weight || '--') + ' lbs</td><td>' + (e.waist || '--') + '"</td><td>' + eb + '</td><td>' + ew + '</td><td style="font-size:0.8rem;color:var(--text2);">' + (e.notes || '') + '</td><td><button class="del-btn" onclick="deleteLog(' + i + ')">x</button></td></tr>';
    }
    html += '</tbody></table></div>';
  }

  html += '<div class="card"><h3>LoadLine Domain Targets</h3><div style="display:grid;gap:8px;margin-top:12px;">';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Body Load</span><span style="color:var(--green-light);font-weight:700;">5 lb Green Zone corridor</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Abdominal Load (WHtR)</span><span style="color:var(--green-light);font-weight:700;">&lt; 0.50</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Glycemic Load (HbA1c)</span><span style="color:var(--green-light);font-weight:700;">&lt; 5.7%</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Cardiovascular (BP)</span><span style="color:var(--green-light);font-weight:700;">&lt; 120/80 mmHg</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Lipid Load (Trig/HDL)</span><span style="color:var(--green-light);font-weight:700;">&lt; 2.0</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Performance</span><span style="color:var(--green-light);font-weight:700;">8,000+ steps + 3x resistance/week</span></div>';
  html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-radius:6px;"><span>Recovery</span><span style="color:var(--green-light);font-weight:700;">7-9 hrs sleep + TRE window</span></div>';
  html += '</div></div>';

  el.innerHTML = html;
}

function logBodyNumbers() {
  const weight = parseFloat(document.getElementById('logWeight').value) || null;
  const waist = parseFloat(document.getElementById('logWaist').value) || null;
  const notes = document.getElementById('logNotes').value.trim();
  if (!weight && !waist) return;
  if (!allData.bodyLog) allData.bodyLog = [];
  const dk = dateKey(currentDate);
  const existing = allData.bodyLog.findIndex(e => e.date === dk);
  const entry = { date: dk, weight, waist, notes };
  if (existing >= 0) { allData.bodyLog[existing] = entry; } else { allData.bodyLog.push(entry); }
  save(); renderStats();
}

function deleteLog(idx) { if (!allData.bodyLog) return; allData.bodyLog.splice(idx, 1); save(); renderStats(); }

// ===================== WORKOUT DATA =====================
const WORKOUTS = {
  tuesday: {
    title: 'Workout 1: Upper Pull, Posture & Biceps', day: 'Tue',
    exercises: [
      { name: 'Door Top-Anchor High Lat Pulldown', sets: 3, reps: '12-15', detail: 'Kneel facing door. Pull handles toward upper chest, driving elbows down and back. Squeeze lats 2s at bottom.' },
      { name: 'Door Mid-Anchor Standing/Seated Neutral Row', sets: 3, reps: '12', detail: 'Anchor at mid-chest. Step back for tension. Pull handles to lower ribs, pinching scapulae together for 2s.' },
      { name: 'Door-Anchor Face Pull with External Rotation', sets: 3, reps: '15', detail: 'Anchor at eye level. Pull toward forehead with wrists rotating backward so thumbs point behind ears.' },
      { name: 'Under-Foot Standing Tube Band Bicep Curls', sets: 3, reps: '12-15', detail: 'Stand on middle of band. Keep elbows locked at ribs. 3-second lowering tempo.' },
      { name: 'Bodyweight Prone Cobra', sets: 2, reps: '10', detail: 'Lie prone on floor. Lift chest and rotate thumbs to ceiling. 3-second apex hold.' }
    ]
  },
  thursday: {
    title: 'Workout 2: Lower Hinge, Squat & Core', day: 'Thu',
    exercises: [
      { name: 'Bodyweight Box / Chair Squats', sets: 3, reps: '12-15', detail: 'Push hips back and lower over 3s until lightly tapping chair seat. Drive through midfoot.' },
      { name: 'Under-Foot Banded Romanian Deadlift (RDL)', sets: 3, reps: '12', detail: 'Step on tube band, grip handles low. Hinge hips back with soft knees until hamstrings load.' },
      { name: 'Bodyweight Reverse Lunges', sets: 3, reps: '10/leg', detail: 'Step backward, descending back knee toward floor. Keep front shin vertical.' },
      { name: 'Door Mid-Anchor Pallof Anti-Rotation Press', sets: 3, reps: '10-12/side', detail: 'Stand sideways to door. Press handle straight out from sternum. Hold 2-3 seconds.' },
      { name: 'Bodyweight Forearm Plank or Dead Bug', sets: 3, reps: '45s or 10/side', detail: 'Lock in ribcage, brace abs tightly, prevent anterior pelvic tilt.' }
    ]
  },
  saturday: {
    title: 'Workout 3: Upper Push, Shoulders & Triceps', day: 'Sat',
    exercises: [
      { name: 'Door Mid-Anchor Chest Press', sets: 3, reps: '12-15', detail: 'Face away from door anchor. Press forward with elbows tucked at 45 degrees.' },
      { name: 'Stepped-On Band Lateral Raises', sets: 3, reps: '12-15', detail: 'Stand on band with one foot, raise handles to parallel. 2-second eccentric.' },
      { name: 'Door Top-Anchor Overhead Triceps Extension', sets: 3, reps: '12-15', detail: 'Facing away from door, hinge forward slightly. Extend elbows to full lockout.' },
      { name: 'Stepped-On Band Overhead Shoulder Press', sets: 3, reps: '10-12', detail: 'Bring handles to shoulders, press overhead in scapular plane.' },
      { name: 'Bodyweight Bird-Dog', sets: 3, reps: '10/side', detail: 'Reach opposite arm and leg straight out. 2-second hold at apex.' }
    ]
  }
};

// ===================== NUTRITION DATA =====================
const NUTRITION_PLAN = [
  { day: 1, meals: [
    { time: '9:00 AM', title: 'Meal A: Turkey & Egg Power Scramble', food: '4 oz lean ground turkey, 2 whole eggs, 3/4 cup egg whites, peppers/onions/spinach, 1 Tbsp nutritional yeast, 1/4 avocado, 1 cup berries.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Lemon-Garlic Chicken Plate', food: '7 oz cooked chicken breast, 2 cups broccoli/cauliflower, 5 oz sweet potato, 1 tsp olive oil, lemon/garlic/herbs.', protein: '55-60g' },
    { time: '5:00 PM', title: 'Meal C: Greek Yogurt Berry Bowl', food: '1.5 cups high-protein plain Greek yogurt + berries + cinnamon.', protein: '35-45g' }
  ]},
  { day: 2, meals: [
    { time: '9:00 AM', title: 'Meal A: Greek Yogurt Breakfast + Eggs', food: '1.5 cups plain high-protein Greek yogurt, 3/4 cup berries, 1 Tbsp chia, cinnamon + 2 eggs.', protein: '45-55g' },
    { time: '1:00 PM', title: 'Meal B: Turkey Taco Bowl', food: '7 oz lean ground turkey, lettuce, tomato, onion, peppers, 1/2 cup black beans, salsa, 1/4 avocado.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Chocolate-Berry Protein Smoothie', food: '1 scoop chocolate protein, 1 cup unsweetened milk, 3/4 cup frozen berries, ice.', protein: '35-45g' }
  ]},
  { day: 3, meals: [
    { time: '9:00 AM', title: 'Meal A: Spinach Turkey Omelet', food: '2 eggs + 1 cup egg whites, 3 oz turkey, spinach, tomato, onion, 1 Tbsp nutritional yeast; berries on side.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Salmon, Quinoa & Broccoli', food: '7 oz salmon, 1/2 cup cooked quinoa, 2 cups broccoli/asparagus, lemon/herbs.', protein: '45-50g' },
    { time: '5:00 PM', title: 'Meal C: Cottage Cheese Berry Bowl', food: '1.5 cups low-fat cottage cheese, 3/4 cup berries, cinnamon.', protein: '35-40g' }
  ]},
  { day: 4, meals: [
    { time: '9:00 AM', title: 'Meal A: Southwest Egg & Turkey Bowl', food: '4 oz lean turkey, 2 eggs, 1/2 cup egg whites, peppers, onion, tomato, salsa, spinach, 1/4 avocado.', protein: '45-50g' },
    { time: '1:00 PM', title: 'Meal B: Loaded Turkey Meatballs', food: '7 oz cooked lean turkey meatballs, 1/2 cup marinara, 2 cups broccoli/cauliflower.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Vanilla-Cinnamon Protein Smoothie', food: '1 scoop vanilla protein, 1 cup unsweetened milk, 3/4 cup Greek yogurt, cinnamon, ice.', protein: '40-45g' }
  ]},
  { day: 5, meals: [
    { time: '9:00 AM', title: 'Meal A: Veggie Omelet + Turkey', food: '2 eggs + 1 cup egg whites, 3-4 oz turkey, mushrooms/peppers/spinach, nutritional yeast; fruit on side.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Chicken Fajita Bowl', food: '7 oz chicken, peppers/onions, lettuce, tomato, 1/2 cup black beans, salsa, 1/4 avocado, lime.', protein: '55-60g' },
    { time: '5:00 PM', title: 'Meal C: Greek Yogurt Crunch Bowl', food: '1.5 cups high-protein Greek yogurt, berries, cinnamon, 1 Tbsp chopped walnuts.', protein: '35-45g' }
  ]},
  { day: 6, meals: [
    { time: '9:00 AM', title: 'Meal A: Protein Oatmeal + Eggs', food: '1/2 cup dry oats + 1/2 scoop protein + cinnamon; 2 eggs + 3/4 cup egg whites. Add berries.', protein: '45-50g' },
    { time: '1:00 PM', title: 'Meal B: Turkey Burger Power Bowl', food: '7 oz lean turkey burger, large salad, tomato/onion, 5 oz sweet potato, 1/4 avocado.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Egg & Veggie Mini Plate', food: '2 eggs + 1 cup egg whites scrambled with vegetables.', protein: '35-40g' }
  ]},
  { day: 7, meals: [
    { time: '9:00 AM', title: 'Meal A: Southwest Breakfast Scramble', food: '4 oz lean turkey, 2 eggs, 1/2 cup egg whites, peppers, onion, tomato, salsa, spinach, 1/4 avocado.', protein: '45-50g' },
    { time: '1:00 PM', title: 'Meal B: Garlic Salmon & Sweet Potato', food: '7 oz salmon, green beans/asparagus, 5 oz sweet potato, lemon and garlic.', protein: '45-50g' },
    { time: '5:00 PM', title: 'Meal C: Berry-Chia Protein Smoothie', food: '1 scoop protein, unsweetened milk, 3/4 cup berries, 1 Tbsp chia, ice.', protein: '35-45g' }
  ]},
  { day: 8, meals: [
    { time: '9:00 AM', title: 'Meal A: Turkey & Egg Power Scramble', food: '4 oz lean ground turkey, 2 whole eggs, 3/4 cup egg whites, peppers/onions/spinach, 1 Tbsp nutritional yeast, 1/4 avocado, 1 cup berries.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Turkey Broccoli Power Bowl', food: '7 oz lean turkey, 2 cups broccoli, 1/2 cup quinoa or beans, tomato/onion, 1/4 avocado.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Greek Yogurt Berry Bowl', food: '1.5 cups high-protein plain Greek yogurt + berries + cinnamon.', protein: '35-45g' }
  ]},
  { day: 9, meals: [
    { time: '9:00 AM', title: 'Meal A: Greek Yogurt Breakfast + Eggs', food: '1.5 cups plain high-protein Greek yogurt, 3/4 cup berries, 1 Tbsp chia, cinnamon + 2 eggs.', protein: '45-55g' },
    { time: '1:00 PM', title: 'Meal B: Salmon Taco Bowl', food: '7 oz salmon, lettuce, cabbage, tomato, salsa, 1/2 cup black beans, 1/4 avocado, lime.', protein: '45-50g' },
    { time: '5:00 PM', title: 'Meal C: Chocolate-Berry Protein Smoothie', food: '1 scoop chocolate protein, 1 cup unsweetened milk, 3/4 cup frozen berries, ice.', protein: '35-45g' }
  ]},
  { day: 10, meals: [
    { time: '9:00 AM', title: 'Meal A: Spinach Turkey Omelet', food: '2 eggs + 1 cup egg whites, 3 oz turkey, spinach, tomato, onion, 1 Tbsp nutritional yeast; berries on side.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Chicken Meatballs & Vegetables', food: '7 oz cooked chicken meatballs, tomato sauce, 2 cups roasted vegetables.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Cottage Cheese Berry Bowl', food: '1.5 cups low-fat cottage cheese, 3/4 cup berries, cinnamon.', protein: '35-40g' }
  ]},
  { day: 11, meals: [
    { time: '9:00 AM', title: 'Meal A: Protein Oatmeal + Eggs', food: '1/2 cup dry oats + 1/2 scoop protein + cinnamon; 2 eggs + 3/4 cup egg whites.', protein: '45-50g' },
    { time: '1:00 PM', title: 'Meal B: Turkey Taco Bowl', food: '7 oz lean ground turkey, lettuce, tomato, onion, peppers, 1/2 cup black beans, salsa, 1/4 avocado.', protein: '50-55g' },
    { time: '5:00 PM', title: 'Meal C: Vanilla-Cinnamon Protein Smoothie', food: '1 scoop vanilla protein, 1 cup unsweetened milk, 3/4 cup Greek yogurt, cinnamon, ice.', protein: '40-45g' }
  ]},
  { day: 12, meals: [
    { time: '9:00 AM', title: 'Meal A: Veggie Omelet + Turkey', food: '2 eggs + 1 cup egg whites, 3-4 oz turkey, mushrooms/peppers/spinach, nutritional yeast; fruit on side.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Lemon Salmon Plate', food: '7 oz salmon, 2 cups green vegetables, 1/2 cup quinoa or 5 oz sweet potato, lemon/herbs.', protein: '45-50g' },
    { time: '5:00 PM', title: 'Meal C: Greek Yogurt Crunch Bowl', food: '1.5 cups high-protein Greek yogurt, berries, cinnamon, 1 Tbsp chopped walnuts.', protein: '35-45g' }
  ]},
  { day: 13, meals: [
    { time: '9:00 AM', title: 'Meal A: Southwest Breakfast Scramble', food: '4 oz lean turkey, 2 eggs, 1/2 cup egg whites, peppers, onion, tomato, salsa, spinach, 1/4 avocado.', protein: '45-50g' },
    { time: '1:00 PM', title: 'Meal B: Chicken Avocado Bowl', food: '7 oz chicken, mixed greens, tomato, cucumber, peppers, 1/2 cup beans, 1/4 avocado, salsa/lime.', protein: '55-60g' },
    { time: '5:00 PM', title: 'Meal C: Berry-Chia Protein Smoothie', food: '1 scoop protein, unsweetened milk, 3/4 cup berries, 1 Tbsp chia, ice.', protein: '35-45g' }
  ]},
  { day: 14, meals: [
    { time: '9:00 AM', title: 'Meal A: Turkey & Egg Power Scramble', food: '4 oz lean ground turkey, 2 whole eggs, 3/4 cup egg whites, peppers/onions/spinach, 1 Tbsp nutritional yeast, 1/4 avocado, 1 cup berries.', protein: '50-55g' },
    { time: '1:00 PM', title: 'Meal B: Turkey or Salmon Celebration Bowl', food: 'Choose 7 oz turkey or salmon; 2 cups vegetables, 1/2 cup beans/quinoa or sweet potato.', protein: '45-55g' },
    { time: '5:00 PM', title: 'Meal C: Protein Mini Meal of Choice', food: 'Greek yogurt bowl, cottage cheese bowl, eggs/egg whites, or a protein smoothie.', protein: '35-45g' }
  ]}
];

const SUPPLEMENTS = [
  { time: 'On waking', name: 'Creatine: 3-5g', notes: 'Take with plain water. Fasted.', phase: 'FASTED' },
  { time: 'Morning', name: 'Decaf green tea (optional)', notes: 'Unsweetened. Fasting-friendly.', phase: 'FASTED' },
  { time: '~11:30 AM', name: 'Psyllium husk + water', notes: '30 min before Meal A. Separate from meds.', phase: 'Pre-Meal' },
  { time: '12:00 PM', name: 'Resistant potato starch: 1 tsp', notes: 'Mix into cool/cold food. Do not cook.', phase: 'MEAL A' },
  { time: '12:00 PM', name: "Bob's Red Mill Nutritional Yeast: 1 Tbsp", notes: 'Sprinkle on eggs, vegetables, bowls.', phase: 'MEAL A' },
  { time: '12:00 PM', name: 'Multivitamin + D3/K2 + Fish Oil', notes: 'Take with food for absorption.', phase: 'MEAL A' },
  { time: 'Eating window', name: 'Chia seeds: 2 Tbsp in water', notes: 'Keep inside eating window.', phase: 'EATING' },
  { time: 'Meal B', name: 'Optional 2nd fish oil dose', notes: 'If regimen calls for it.', phase: 'EATING' },
  { time: 'Evening', name: 'Magnesium glycinate', notes: '1-2 hours before bed.', phase: 'EVENING' }
];

const PRIMER = [
  { name: 'Standing Band Pull-Aparts', detail: '2 sets x 15 reps. Pull band to sternum, squeeze shoulder blades 1 second.' },
  { name: "Quadruped Cat-Cow to Child's Pose", detail: '8 slow cycles. Inhale extend, exhale round, sink hips to heels for 3s lat stretch.' },
  { name: 'Bodyweight Glute Bridges', detail: '1 set x 15 reps, 2-second apex hold. Drive heels into floor, squeeze glutes.' },
  { name: 'Half-Kneeling Hip Flexor Stretch', detail: '30 seconds per side. Tuck pelvis under, shift forward, reach overhead.' },
  { name: 'Standing Overhead Band Pass-Throughs', detail: '10 slow passes. Wide grip, straight arms, rotate from thighs overhead.' }
];

const GROCERY = {
  'Protein': ['Lean ground turkey: 5-6 lb', 'Chicken breast: 4-5 lb', 'Salmon: 3-4 lb', 'Eggs: 2 dozen', 'Liquid egg whites: 2-3 cartons', 'Greek yogurt: 3-4 large tubs', 'Cottage cheese: 2 large tubs', 'Protein powder: 8-10 servings'],
  'Vegetables': ['Broccoli/cauliflower', 'Spinach', 'Mixed greens/lettuce', 'Bell peppers', 'Onions', 'Tomatoes', 'Cucumbers', 'Green beans', 'Asparagus', 'Cabbage/slaw mix', 'Mushrooms'],
  'Fruit & Carbs': ['Fresh/frozen berries', 'Sweet potatoes', 'Black beans', 'Quinoa', 'Old-fashioned oats'],
  'Healthy Fats': ['Avocados', 'Olive oil', 'Walnuts'],
  'Flavor': ['Lemons', 'Limes', 'Garlic', 'Cinnamon', 'Paprika', 'Cumin', 'Chili powder', 'Italian herbs', 'Black pepper', 'Salsa', 'Lower-sugar marinara'],
  'LoadLine Pantry': ["Bob's Red Mill Nutritional Yeast", 'Unmodified potato starch', 'Chia seeds', 'Psyllium husk', 'Creatine', 'Unsweetened milk']
};

// ===================== RENDER FUNCTIONS =====================
function renderWorkout() {
  const el = document.getElementById('sec-workout');
  const day = currentDate.getDay();
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayName = dayNames[day];
  const dd = getDayData();
  if (!dd.workout) dd.workout = {};
  let wk = null;
  if (dayName === 'tuesday') wk = 'tuesday';
  else if (dayName === 'thursday') wk = 'thursday';
  else if (dayName === 'saturday') wk = 'saturday';
  if (!wk) {
    const isSun = dayName === 'sunday';
    el.innerHTML = '<div class="card ' + (isSun ? 'highlight' : '') + '"><div class="workout-header"><h2>' + (isSun ? 'Sunday Lite Day' : 'Rest Day') + '</h2><span class="workout-badge ' + (isSun ? 'badge-green' : 'badge-grey') + '">' + (isSun ? 'Active Recovery' : 'No Resistance') + '</span></div><p>' + (isSun ? 'Lite Day: Walking only. Complete 10,000 steps. No lifting.' : 'Active recovery. Focus on your 10,000-step daily floor.') + '</p></div>';
    return;
  }
  const w = WORKOUTS[wk];
  let html = '<div class="card highlight"><div class="workout-header"><h2>' + w.title + '</h2><span class="workout-badge badge-green">' + w.day + ' Training</span></div><p style="font-size:0.85rem;color:var(--text2);margin-top:4px;">3-second eccentric tempo (3-0-1-1). Rest 60-75 seconds between sets.</p></div>';
  w.exercises.forEach((ex, i) => {
    const key = wk + '_' + i;
    const checked = dd.workout[key] && dd.workout[key].done;
    const sets = (dd.workout[key] && dd.workout[key].sets) || [];
    html += '<div class="exercise"><div class="exercise-top"><div><div class="exercise-name">' + ex.name + '</div><div class="exercise-detail">' + ex.sets + ' sets x ' + ex.reps + ' reps. ' + ex.detail + '</div></div><div class="exercise-check ' + (checked ? 'done' : '') + '" onclick="toggleExercise(' + "'" + wk + "'," + i + ')"></div></div><div class="set-log"><label>Sets:</label><input placeholder="Wt" value="' + (sets[0] || '') + '" onchange="logSet(' + "'" + wk + "'," + i + ',0,this.value)">';
    for (let s = 1; s <= ex.sets; s++) html += '<input placeholder="R' + s + '" value="' + (sets[s] || '') + '" onchange="logSet(' + "'" + wk + "'," + i + ',' + s + ',this.value)">';
    html += '</div></div>';
  });
  const completed = w.exercises.filter((_, i) => dd.workout[wk + '_' + i] && dd.workout[wk + '_' + i].done).length;
  el.innerHTML = '<div class="card" style="margin-bottom:20px;text-align:center;"><span style="font-size:2rem;font-weight:900;color:var(--green-light);">' + completed + '/' + w.exercises.length + '</span><br><span style="font-size:0.85rem;color:var(--text2);">exercises completed</span></div>' + html;
}

function toggleExercise(wk, idx) { const dd = getDayData(); const key = wk + '_' + idx; if (!dd.workout) dd.workout = {}; if (!dd.workout[key]) dd.workout[key] = {}; dd.workout[key].done = !dd.workout[key].done; save(); renderWorkout(); }
function logSet(wk, idx, si, val) { const dd = getDayData(); const key = wk + '_' + idx; if (!dd.workout) dd.workout = {}; if (!dd.workout[key]) dd.workout[key] = { sets: [] }; if (!dd.workout[key].sets) dd.workout[key].sets = []; dd.workout[key].sets[si] = val; save(); }

function renderNutrition() {
  const el = document.getElementById('sec-nutrition');
  const nd = ((dayOfYear(currentDate) - 1) % 14) + 1;
  const plan = NUTRITION_PLAN[nd - 1];
  const dd = getDayData();
  if (!dd.meals) dd.meals = {};
  let btnHtml = '<div class="day-selector">';
  for (let d = 1; d <= 14; d++) btnHtml += '<button class="day-btn ' + (d === nd ? 'active' : '') + '" onclick="goNutDay(' + d + ')">Day ' + d + '</button>';
  btnHtml += '</div>';
  let macroHtml = '<div class="macro-bar"><div class="macro-item"><h4>Protein</h4><div class="macro-value">' + (dd.meals.protein || 0) + 'g</div><div class="macro-target">Target: 150-170g</div></div><div class="macro-item"><h4>Carbs</h4><div class="macro-value">' + (dd.meals.carbs || 0) + 'g</div><div class="macro-target">Target: 100-140g</div></div><div class="macro-item"><h4>Fat</h4><div class="macro-value">' + (dd.meals.fat || 0) + 'g</div><div class="macro-target">Target: 60-75g</div></div></div>';
  let mealHtml = '';
  plan.meals.forEach((m, i) => {
    const ck = dd.meals['day' + nd + '_meal' + i];
    mealHtml += '<div class="meal-card"><div class="meal-header"><div><div class="meal-time">' + m.time + '</div><div class="meal-title">' + m.title + '</div></div><div class="exercise-check ' + (ck ? 'done' : '') + '" onclick="toggleMeal(' + i + ')"></div></div><div class="meal-food">' + m.food + '</div><span class="meal-protein">' + m.protein + ' protein</span></div>';
  });
  let macroInput = `<div class="card" style="margin-top:20px;"><h3>Log Today's Macros</h3><div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;"><div style="flex:1;min-width:100px;"><label style="font-size:0.75rem;color:var(--text2);display:block;margin-bottom:4px;">Protein (g)</label><input type="number" value="${dd.meals.protein || ''}" onchange="logMacro('protein',this.value)" style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);text-align:center;font-size:1rem;"></div><div style="flex:1;min-width:100px;"><label style="font-size:0.75rem;color:var(--text2);display:block;margin-bottom:4px;">Carbs (g)</label><input type="number" value="${dd.meals.carbs || ''}" onchange="logMacro('carbs',this.value)" style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);text-align:center;font-size:1rem;"></div><div style="flex:1;min-width:100px;"><label style="font-size:0.75rem;color:var(--text2);display:block;margin-bottom:4px;">Fat (g)</label><input type="number" value="${dd.meals.fat || ''}" onchange="logMacro('fat',this.value)" style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);text-align:center;font-size:1rem;"></div></div></div>`;
  const completed = plan.meals.filter((_, i) => dd.meals['day' + nd + '_meal' + i]).length;
  el.innerHTML = '<div class="card highlight" style="margin-bottom:20px;text-align:center;"><span style="font-size:1.5rem;font-weight:900;">Day ' + nd + ' of 14</span><span style="font-size:0.85rem;color:var(--text2);display:block;margin-top:4px;">' + completed + '/3 meals completed</span></div>' + btnHtml + macroHtml + mealHtml + macroInput;
}

function goNutDay(d) { currentDate.setDate(currentDate.getDate() + (d - ((dayOfYear(currentDate) - 1) % 14 + 1))); renderAll(); }
function toggleMeal(i) { const dd = getDayData(); const nd = ((dayOfYear(currentDate) - 1) % 14) + 1; if (!dd.meals) dd.meals = {}; const k = 'day' + nd + '_meal' + i; dd.meals[k] = !dd.meals[k]; save(); renderNutrition(); }
function logMacro(t, v) { const dd = getDayData(); if (!dd.meals) dd.meals = {}; dd.meals[t] = v; save(); }

function renderSupplements() {
  const el = document.getElementById('sec-supplements');
  const dd = getDayData();
  if (!dd.supps) dd.supps = {};
  const completed = SUPPLEMENTS.filter((_, i) => dd.supps['s' + i]).length;
  let html = '<div class="card highlight" style="margin-bottom:20px;text-align:center;"><span style="font-size:1.5rem;font-weight:900;">' + completed + '/' + SUPPLEMENTS.length + '</span><span style="font-size:0.85rem;color:var(--text2);display:block;margin-top:4px;">supplements completed</span><div style="margin-top:8px;background:var(--bg3);border-radius:10px;height:12px;overflow:hidden;"><div style="height:100%;background:linear-gradient(90deg,var(--green),var(--green-light));border-radius:10px;width:' + (completed / SUPPLEMENTS.length * 100) + '%;transition:width 0.3s;"></div></div></div>';
  SUPPLEMENTS.forEach((s, i) => {
    const ck = dd.supps['s' + i];
    html += '<div class="supplement-row"><div class="supplement-check ' + (ck ? 'done' : '') + '" onclick="toggleSupp(' + i + ')"></div><div class="supplement-time">' + s.time + '</div><div style="flex:1;"><div class="supplement-name">' + s.name + '</div><div class="supplement-notes">' + s.notes + ' <span style="color:var(--green);font-weight:700;font-size:0.7rem;">[' + s.phase + ']</span></div></div></div>';
  });
  html += '<div class="card" style="margin-top:20px;"><h3>' + (allData.profile ? allData.profile.tre : '14:10') + ' TRE Schedule</h3><p>Keep all calorie-containing supplements and foods inside the eating window. Creatine in plain water and unsweetened tea are fasting-compatible.</p></div>';
  el.innerHTML = html;
}
function toggleSupp(i) { const dd = getDayData(); if (!dd.supps) dd.supps = {}; dd.supps['s' + i] = !dd.supps['s' + i]; save(); renderSupplements(); }

function renderSteps() {
  const el = document.getElementById('sec-steps');
  const dd = getDayData();
  const steps = dd.steps || 0;
  const pct = Math.min((steps / 10000) * 100, 100);
  el.innerHTML = '<div class="card"><div class="steps-tracker"><div class="steps-number">' + steps.toLocaleString() + '</div><div class="steps-label">of 10,000 steps</div><div class="steps-bar-wrap"><div class="steps-bar" style="width:' + pct + '%"></div></div><div class="steps-input-wrap"><input type="number" id="stepsInput" placeholder="Enter steps" value="' + (steps || '') + '" min="0" max="100000"><button onclick="logSteps()">Log Steps</button></div></div></div><div class="steps-blocks"><div class="step-block"><h4>Block 1</h4><div class="target">3,500-4,000</div><div class="desc">Morning fasted walk (30-35 min)</div></div><div class="step-block"><h4>Block 2</h4><div class="target">2,500-3,000</div><div class="desc">Post-lunch walk (20-25 min)</div></div><div class="step-block"><h4>Block 3</h4><div class="target">3,000-3,500</div><div class="desc">Evening wind-down walk (25-30 min)</div></div></div><div class="card" style="margin-top:20px;"><h3>Mesa, Arizona Heat Protocol</h3><p>&lt;85°F: Outdoor walking encouraged. 100 oz baseline hydration.</p><p>85-99°F: Early morning or post-sunset only. Add 16 oz fluid + electrolytes.</p><p>100°F+: Indoor steps only. 116-130+ oz daily fluid with LMNT electrolytes.</p></div>';
}
function logSteps() { const val = parseInt(document.getElementById('stepsInput').value) || 0; const dd = getDayData(); dd.steps = val; save(); renderSteps(); }

function renderPrimer() {
  const el = document.getElementById('sec-primer');
  const dd = getDayData();
  if (!dd.primer) dd.primer = {};
  const completed = PRIMER.filter((_, i) => dd.primer['p' + i]).length;
  let html = '<div class="card highlight" style="margin-bottom:20px;text-align:center;"><span style="font-size:1.5rem;font-weight:900;">' + completed + '/' + PRIMER.length + '</span><span style="font-size:0.85rem;color:var(--text2);display:block;margin-top:4px;">primer exercises completed</span><div style="margin-top:8px;background:var(--bg3);border-radius:10px;height:12px;overflow:hidden;"><div style="height:100%;background:linear-gradient(90deg,var(--green),var(--green-light));border-radius:10px;width:' + (completed / PRIMER.length * 100) + '%;transition:width 0.3s;"></div></div></div>';
  PRIMER.forEach((p, i) => {
    const ck = dd.primer['p' + i];
    html += '<div class="primer-exercise"><div class="exercise-check ' + (ck ? 'done' : '') + '" onclick="togglePrimer(' + i + ')"></div><div class="primer-info"><div class="primer-name">' + (i + 1) + '. ' + p.name + '</div><div class="primer-detail">' + p.detail + '</div></div></div>';
  });
  html += '<div class="card" style="margin-top:20px;"><h3>Daily 5-10 Min Metabolic Primer</h3><p>Perform every day. Restores spinal mobility, wakes the posterior chain, and lubricates joints.</p></div>';
  el.innerHTML = html;
}
function togglePrimer(i) { const dd = getDayData(); if (!dd.primer) dd.primer = {}; dd.primer['p' + i] = !dd.primer['p' + i]; save(); renderPrimer(); }

function renderGrocery() {
  const el = document.getElementById('sec-grocery');
  const dd = getDayData();
  if (!dd.grocery) dd.grocery = {};
  let html = '<div class="card highlight" style="margin-bottom:20px;"><h3>Two-Week Grocery List</h3><p>From the LoadLine 14-Day Metabolic Nutrition Plan. Check items as you shop.</p></div>';
  Object.entries(GROCERY).forEach(([cat, items]) => {
    html += '<div class="grocery-section"><h3>' + cat + '</h3>';
    items.forEach((item, i) => {
      const key = cat + '_' + i;
      html += '<div class="grocery-item"><input type="checkbox" id="g_' + key + '" ' + (dd.grocery[key] ? 'checked' : '') + ' onchange="toggleGrocery(' + "'" + key + "'" + ')"><label for="g_' + key + '">' + item + '</label></div>';
    });
    html += '</div>';
  });
  el.innerHTML = html;
}
function toggleGrocery(key) { const dd = getDayData(); if (!dd.grocery) dd.grocery = {}; dd.grocery[key] = !dd.grocery[key]; save(); }

function renderAll() {
  const opts = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  document.getElementById('dateLabel').textContent = currentDate.toLocaleDateString('en-US', opts);
  renderStats(); renderWorkout(); renderNutrition(); renderSupplements(); renderSteps(); renderPrimer(); renderGrocery();
}

// ===================== INIT =====================
if (allData.splashAccepted) {
  document.getElementById('splashScreen').classList.add('hidden');
  if (!allData.profile) { document.getElementById('profileSetup').classList.remove('hidden'); }
  else { showApp(); }
}# force redeploy Fri Sep 18 09:23:26 AM MST 2026
