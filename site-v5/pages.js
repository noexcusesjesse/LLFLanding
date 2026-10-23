// Page bodies for the v5 redo. Copy is taken word for word from
// loadline-website/new-site-copy.md (FINAL v5). [REED]/[COUNSEL] flags render
// as small badges so reviewers can see them on staging.
import { BYLINE, FB_GROUP, FF_AMAZON, NEC, PHONE, PHONE_HREF, btn, counsel, ext, hold, reed } from './layout.js';

const sec = (inner, alt = false, id = '') => `<section${alt ? ' class="alt"' : ''}${id ? ` id="${id}"` : ''}><div class="w">${inner}</div></section>`;
const hero = (inner) => `<section class="hero"><div class="w">${inner}</div></section>`;

const MEMBER_GATE = (program) => `${program} include${program.includes(' and ') ? '' : 's'} no fasting. Members can join any free No Excuses Challenge. To join a challenge fast, you must have finished Basic Training and your doctor must have cleared you for fasting. Clearance for exercise doesn't count. A 24-hour fast also needs your doctor's OK for that fast, and anything over 24 hours needs all three boxes of the doctor-cleared check-in.`;

const FORMULA = `<div class="g">
  <div class="c"><h3>Train</h3><p>Strength and skill work that makes you more capable, not more dependent.</p></div>
  <div class="c"><h3>Move</h3><p>Daily movement that fits a life. Walking, mobility, and work you'll actually repeat.</p></div>
  <div class="c"><h3>Recover</h3><p>Rest is part of the work, not a luxury add-on.</p></div>
  <div class="c"><h3>Track</h3><p>Simple accountability so the next session is honest.</p></div>
  <div class="c"><h3>Repeat</h3><p>Consistency is the product. You win the year by returning, not by a dramatic first week.</p></div>
</div>`;

const CHECKIN = `<p><strong>The doctor-cleared check-in (all three boxes, required for anything over 24 hours):</strong></p>
<ul class="checks">
  <li>I am 18 or older.</li>
  <li>I have completed a 24-hour fast without problems. (Any 24-hour fast you've done counts.)</li>
  <li>My doctor has told me this specific fast is OK for me.</li>
</ul>
<p><small>(Source: Quarterly_Fast_2027_Menu_Model_Safety_and_Timer_Copy_v2.0, matching noexcuseschallenges.com.)</small> ${reed}</p>`;

const WHO_NOT = `<h2>Who should not join a challenge fast ${reed} ${counsel}</h2>
<p>Challenges are for adults 18 and older.</p>
<p>Do not join a challenge fast if you are under 18, pregnant or nursing, or have a current or past eating disorder. If you have diabetes or low blood sugar, take any prescription medication (especially glucose-lowering or blood-pressure medication), or have heart or kidney conditions, don't fast unless your doctor has cleared you for this specific fast. LoadLine never adjusts medication around a fast.</p>`;

const LOW_SUGAR = `<div class="warn" role="note"><h2>Low blood sugar and emergencies ${reed}</h2>
<p>Low blood sugar can look like shakiness, sweating, a pounding heart, confusion, or feeling faint. If that happens, stop the fast and eat or drink something with sugar now. Call 911 for chest pain or pressure, fainting, confusion that doesn't clear, seizure, a racing or irregular heartbeat, or severe shortness of breath.</p></div>`;

const yes = '<span aria-hidden="true">✓</span><span class="sr-only">Included</span>';
const no = (extra = '') => `<span aria-hidden="true">✗</span><span class="sr-only">Not included</span>${extra}`;

export const PAGES = {
  '/': {
    title: 'LoadLine Fitness | Online Coaching. Load the Standard.',
    meta: 'LoadLine Fitness is online coaching that teaches you to own your fitness. LoadLine 365 ($185/mo) and LoadLine Solo ($85/mo).',
    body: hero(`<p class="eye">ONLINE COACHING · LOADLINE FITNESS</p>
<h1>Load the Standard. Live the Life.</h1>
<p class="sub">We don't want to own your fitness. We want to teach you how to own it. Online coaching from wherever you are, built to make you independent.</p>
<div class="ctas">${btn('#programs', 'See the Programs')} ${btn('/challenges', 'Join a Free Challenge', 'ghost')}</div>`)
      + sec(`<h2>This is not a gym. It's a mission.</h2>
<p>I spent years watching the same cycle: people start strong, burn out, and walk away thinking they failed. They didn't fail. The system failed them.</p>
<p>Traditional fitness is built on dependency: the next program, the next challenge, the next coach telling you what to do. That's a lease on your body, not ownership.</p>
<p>LoadLine teaches you to understand fitness, not just follow it, so the standard is something you carry for life.</p>
<p>— Jesse Collins, founder · <a href="/about">Read My Story</a></p>`)
      + sec(`<h2>Programs</h2><div class="g">
<div class="c"><h3>LoadLine 365</h3><p class="price">$185/month</p><p>Digital program with a virtual coach. Basic Training, then LoadLine 30, 60, 90, 180, and 365. The year ends at NOMAD status.</p><a href="/loadline-365">Learn more<span class="sr-only"> about LoadLine 365</span></a></div>
<div class="c"><h3>LoadLine Solo</h3><p class="price">$85/month</p><p>The self-guided digital program you run at home, starting with Basic Training.</p><a href="/solo">Learn more<span class="sr-only"> about LoadLine Solo</span></a></div>
</div>`, true, 'programs')
      + sec(`<h2>The formula: Train. Move. Recover. Track. Repeat.</h2>${FORMULA}`)
      + sec(`<h2>Safety first</h2><ul>
<li>Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</li>
<li><strong>LoadLine never prescribes, doses, or adjusts medication.</strong> Your doctor handles anything medical. ${reed}</li>
</ul><p><a href="/how-it-works">How it works</a></p>`, true)
      + sec(`<h2>Free challenges</h2><p><strong>No Excuses Challenges</strong>: ${BYLINE}.</p>
<p>Free community challenges with check-ins, streaks, and badges. <a href="/challenges">See current challenges</a></p>
<div class="ctas">${ext(NEC, 'Join free at noexcuseschallenges.com')}</div>`)
      + sec(`<h2>Books</h2>
<p><strong>Financially Fit</strong>: train your money like you train your body. ${ext(FF_AMAZON, 'Buy on Amazon<span class="sr-only">: Financially Fit</span>')}</p>
<p><strong>NO EXCUSES</strong>: a real person's guide to metabolic health. <a href="/books">See the books</a></p>`, true)
      + sec(`<h2>Free tools</h2><p>Plan Builder · Walkingout · WalkQuest · Free Tracker → <a href="/tools">Explore tools</a></p>`)
      + sec(`<h2>Start with a conversation.</h2>
<p>Book a free 30-minute video call. We'll talk about your goals, your schedule, and which program fits. No commitment, no pressure. This is not a medical evaluation. ${reed}</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} <span>Or call/text <a href="${PHONE_HREF}">${PHONE}</a></span></div>`, true),
  },

  '/loadline-365': {
    title: 'LoadLine 365 | Virtual Coaching Year | $185/mo',
    meta: 'LoadLine 365: a 12-month digital program with a virtual coach. Basic Training, then LoadLine 30, 60, 90, 180, 365, and NOMAD. $185/month.',
    body: hero(`<p class="eye">DIGITAL PROGRAM + VIRTUAL COACH</p><h1>LoadLine 365</h1>
<p class="sub">One year. One standard. One path to independence. $185/month.</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('/solo', 'Compare with Solo', 'ghost')}</div>`)
      + sec(`<h2>Why a year</h2><p>Most programs sell you 30 days or 12 weeks. Then the accountability ends and you're back where you started. LoadLine 365 is a 12-month curriculum built around one goal: teaching you to run the standard yourself.</p>
<p>The goal is not to keep you. The goal is to make you independent.</p>`)
      + sec(`<h2>The journey</h2><ol class="t">
<li><strong>Basic Training (14 days)</strong>: learn the five-verb formula, set up your tracker, record your starting numbers, and learn the plate method. It's not a crash diet and it's not a weight-loss promise. It's two weeks of learning the system so LoadLine 30 starts on rails.</li>
<li><strong>LoadLine 30</strong>: the first stage. Build the rhythm: train, move, recover, track, repeat.</li>
<li><strong>LoadLine 60</strong>: the standard starts to feel like how you live, not a streak you're guarding.</li>
<li><strong>LoadLine 90</strong>: three months in. Your skills and your accountability start to build on each other.</li>
<li><strong>LoadLine 180</strong>: halfway. The work becomes who you are, not a challenge on a calendar.</li>
<li><strong>LoadLine 365</strong>: the full year. You can run the standard without being owned by a program.</li>
<li><strong>NOMAD</strong>: the final stage of LoadLine 365.</li>
</ol>`, true)
      + sec(`<h2>What's included</h2><ul>
<li>Basic Training onboarding</li>
<li>Coaching from Jesse Collins: form checks, progress reviews, and accountability. Coaching covers training and habits only and never touches medication. ${reed}</li>
<li>LoadLine OS member tools (dashboard, plate tools, roadmap)</li>
<li>The 12-month curriculum, with a skill checkpoint each quarter (for example, a timed incline walk or a banded-row test). These measure fitness skills, not health outcomes. ${reed}</li>
<li>Habit and measurement tracking with a 7-day rolling average, so one day never defines a week</li>
</ul>`)
      + sec(`<h2>NOMAD: independence, not leaving</h2><p>NOMAD means you can carry the LoadLine standard anywhere: at home, in a hotel, or in a park. It doesn't mean you leave LoadLine. The program stays with you. The standard travels.</p>
<p><em>Load the standard. Then live it, wherever you are.</em></p>`, true)
      + sec(`<h2>Pricing</h2><p class="price">$185/month.</p><p>Billed monthly until you cancel, with no long-term contract. <span class="flag">COUNSEL: auto-renewal disclosure and cancellation method next to the button</span></p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('/solo', 'Compare with Solo ($85)', 'ghost')}</div>
<p class="note"><strong>Community challenges:</strong> ${MEMBER_GATE('LoadLine 365')} <a href="/fasting-safety">Fasting Safety</a> ${reed}</p>`, false, 'pricing'),
  },

  '/solo': {
    title: 'LoadLine Solo | Self-Guided Online Program | $85/mo',
    meta: 'LoadLine Solo: the LoadLine standard, self-guided, at home, starting with Basic Training. $85/month.',
    body: hero(`<h1>LoadLine Solo</h1><p class="sub">The LoadLine standard, self-guided, at home. $85/month.</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('#included', "See What's Included", 'ghost')}</div>`)
      + sec(`<h2>Who it's for</h2><p>People who don't need a coach standing over them. You want the system, the curriculum, and the tracking, and you want to run it yourself.</p>
<p><em>You do the work. We give you the system.</em></p>`)
      + sec(`<h2>What's included</h2><ul>
<li>LoadLine OS member tools</li>
<li>The full digital curriculum: training, movement, recovery, and tracking</li>
<li>Home equipment guide (the recommended setup matches the items on the <a href="/shop">Shop page</a>)</li>
<li>The plate method: a simple way to build a meal with vegetables, protein, slow carbs, and fats. It's general education, not an individual nutrition prescription. ${reed}</li>
<li>The formula at home: a 3-day band and dumbbell split and a daily step floor</li>
</ul>`, true, 'included')
      + sec(`<h2>Solo vs 365</h2><table><caption class="sr-only">LoadLine Solo compared with LoadLine 365</caption>
<thead><tr><th scope="col"><span class="sr-only">Feature</span></th><th scope="col">Solo $85</th><th scope="col">365 $185</th></tr></thead><tbody>
<tr><th scope="row">Digital curriculum</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">LoadLine OS tools</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">Basic Training onboarding</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">Virtual coaching with Jesse</th><td>${no()}</td><td>${yes}</td></tr>
<tr><th scope="row">Weekly Sunday reviews</th><td>${no()}</td><td>${yes}</td></tr>
<tr><th scope="row">Path to NOMAD</th><td>${no(' (self-guided)')}</td><td>${yes}</td></tr>
</tbody></table>`)
      + sec(`<h2>Pricing</h2><p class="price">$85/month.</p><p>Billed monthly until you cancel. ${counsel}</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('/loadline-365', 'See LoadLine 365', 'ghost')}</div>
<p class="note"><strong>Community challenges:</strong> ${MEMBER_GATE('LoadLine Solo')} <a href="/fasting-safety">Fasting Safety</a> ${reed}</p>`, true),
  },

  '/how-it-works': {
    title: 'How LoadLine Works | LoadLine Fitness',
    meta: 'One formula. Honest tracking. Clear boundaries.',
    body: hero(`<h1>How LoadLine works</h1><p class="sub">One formula. Honest tracking. Clear boundaries.</p>`)
      + sec(`<h2>The formula</h2>${FORMULA}`)
      + sec(`<h2>The 7-day trend, not the day</h2><p>Your scale number moves day to day with water, food, and heat. That's normal. LoadLine looks at a 7-day rolling average, so one day never defines a week. Missing a day is normal. Missing a week is a pattern. The standard is about returning. ${reed}</p>`, true)
      + sec(`<h2>What we track and what we don't</h2><p>You log habits: training sessions, steps, sleep, water, meals, and any measurements you choose. Labs and health numbers belong to your doctor. LoadLine doesn't interpret lab results. ${reed}</p>`)
      + sec(`<h2>Coaching boundaries</h2><p><strong>Coaches do:</strong> teach the formula, check your form, review your logs, and hold you accountable.</p>
<p><strong>Coaches never:</strong> prescribe, dose, or adjust medication, diagnose, or interpret labs. ${reed} ${counsel}</p>`, true)
      + sec(`<h2>Doctor clearance</h2><p>Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</p>
<div class="ctas">${btn('/#programs', 'See the Programs')}</div>`),
  },

  '/challenges': {
    title: 'No Excuses Challenges | LoadLine Fitness',
    meta: 'Free community challenges, Run by No Excuses Jesse · Powered by LoadLine Fitness.',
    body: hero(`<h1>No Excuses Challenges</h1><p><strong>${BYLINE}</strong></p>
<p class="sub">Free community challenges for the Metabolic Reset with Jesse group. Join, check in, and keep your word to yourself.</p>
<div class="ctas"><a class="btn" href="${NEC}" target="_blank" rel="noopener">Join Free at noexcuseschallenges.com<span class="sr-only"> (opens in a new tab)</span></a></div>`)
      + sec(`<h2>How it works</h2><ol><li>Create a free account.</li><li>Pick a current challenge.</li><li>Check in once a day, earn badges, and chat with the group.</li></ol>`)
      + sec(`<h2>2027 Quarterly Fasts ${reed}</h2><p>We fast together once a quarter. Every fast starts at <strong>7:00 PM Arizona time on a Thursday</strong>.</p>
<table><caption class="sr-only">2027 quarterly fast dates and optional ceilings</caption><thead><tr><th scope="col">Quarter</th><th scope="col">Start</th><th scope="col">Optional ceiling</th></tr></thead><tbody>
<tr><th scope="row">Q1</th><td>Thu, Jan 14, 2027</td><td>24 hours</td></tr>
<tr><th scope="row">Q2</th><td>Thu, Apr 8, 2027</td><td>28 hours</td></tr>
<tr><th scope="row">Q3</th><td>Thu, Jul 8, 2027</td><td>32 hours</td></tr>
<tr><th scope="row">Q4</th><td>Thu, Oct 14, 2027</td><td>36 hours</td></tr>
</tbody></table>
<p>12, 16, or 20 hours: talk to your doctor before you fast. <strong>24 hours</strong> requires your doctor's OK. <strong>Anything over 24 hours</strong> (28h, 32h, or 36h, where the quarter's ceiling allows) requires all three boxes of the doctor-cleared check-in. The ceiling is an option, not a dare. A 12-hour window done right counts the same as anything longer. Any early stop counts as complete. ${reed}</p>
${CHECKIN}
<p class="note"><strong>In Basic Training?</strong> Skip all challenge fasts, at every length. Fasting is not part of Basic Training. ${reed}</p>
<p class="note"><strong>Enrolled in LoadLine Solo or LoadLine 365?</strong> ${MEMBER_GATE('LoadLine Solo and LoadLine 365')} <a href="/fasting-safety">Fasting Safety</a> ${reed}</p>`, true)
      + sec(WHO_NOT)
      + sec(`${LOW_SUGAR}<p><em>General wellness and education. Not medical advice. Talk with your doctor before you change how you eat, fast, or exercise.</em> ${reed} ${counsel}</p>`, true),
  },

  '/fasting-safety': {
    title: 'Fasting Safety | No Excuses Challenges | LoadLine Fitness',
    meta: 'Fasting in No Excuses Challenges: education, not a program. Doctor gates by window length, exclusions, and low-blood-sugar warning signs.',
    body: hero(`<h1>Fasting in No Excuses Challenges: education, not a program</h1><p>${reed} ${counsel}</p>
<p class="sub">Fasting at LoadLine happens only in the free community challenges (${BYLINE}). It is <strong>not part of LoadLine 365 or LoadLine Solo</strong>.</p>`)
      + sec(`<ul>
<li><strong>12, 16, or 20 hours</strong>: talk to your doctor before you fast.</li>
<li><strong>24 hours</strong>: confirm your doctor has told you a 24-hour fast is OK for you.</li>
<li><strong>28, 32, or 36 hours</strong> (only in quarters whose ceiling allows it): all three boxes in the doctor-cleared check-in are required.</li>
</ul>
${CHECKIN}
<ul>
<li><strong>In Basic Training?</strong> Skip all challenge fasts, at every length. Fasting is not part of Basic Training.</li>
<li><strong>Enrolled in LoadLine Solo or LoadLine 365?</strong> ${MEMBER_GATE('LoadLine Solo and LoadLine 365')} ${reed}</li>
<li>LoadLine does not supervise your fast and never adjusts medication around it. If you take any medication, talk to your doctor before any fast.</li>
</ul>`)
      + sec(WHO_NOT, true)
      + sec(`${LOW_SUGAR}<p>Any early stop counts as complete. Longer fasts don't guarantee any result. There are no prizes for hours.</p>`),
  },

  '/about': {
    title: 'About Jesse Collins | LoadLine Fitness',
    meta: 'Jesse Collins, founder and architect of LoadLine Fitness, an online coaching company.',
    body: hero(`<h1>Jesse Collins</h1><p class="sub">Founder and architect of LoadLine Fitness.</p>`)
      + sec(`<p>Jesse Collins founded LoadLine Fitness, an online coaching company: digital programs plus an optional virtual coach. Jesse built LoadLine from years of training himself and coaching others. With a passion for long-term health, he built LoadLine on one principle: fitness should teach you to own your body, not rent it from a coach.</p>
<p class="hold">[JESSE DECISION: credential line placeholder. Confirm "coaching others" is accurate before launch.]</p>
<p>Jesse is also the first LoadLine client. He lives the standard every day. This is practice, not theory.</p>
<p><strong>No Excuses Jesse.</strong> Jesse runs the free No Excuses Challenges for the Metabolic Reset with Jesse community. <em>${BYLINE}.</em></p>
<p><strong>Online only.</strong> No gym, studio, or office. Everything happens by video, app, and message.</p>`),
  },

  '/books': {
    title: 'Books by Jesse Collins | LoadLine Fitness',
    meta: 'Financially Fit and NO EXCUSES, books by Jesse Collins.',
    body: hero(`<h1>Books by Jesse Collins</h1>`)
      + sec(`<h2>Financially Fit</h2><p><em>The LoadLine Manual for Independence, Wealth, and the Future</em></p>
<p>Train your money like you train your body.</p>
<div class="ctas"><a class="btn" href="${FF_AMAZON}" target="_blank" rel="noopener">Buy on Amazon<span class="sr-only">: Financially Fit (opens in a new tab)</span></a></div>
<p><em>Education only. Not financial, investment, tax, legal, or medical advice.</em> ${counsel}</p>`)
      + sec(`<h2>NO EXCUSES: A Real Person's Guide to Metabolic Health</h2>
<p>A real person's guide to nutrition, movement, sleep, and working with your doctor. Facts, not hype. ${reed}</p>
<p>${hold('Buy on Amazon link not live until Reed reads the Amazon listing and any excerpt.')}</p>`, true)
      + sec(`<p><em>Some links are affiliate links. As an Amazon Associate, LoadLine Fitness earns from qualifying purchases.</em> ${counsel}</p>`),
  },

  '/learn': {
    title: 'Learn | LoadLine Fitness',
    meta: 'Plain-English fact-checks. Facts, not hype. Education, not medical advice.',
    body: hero(`<h1>Learn</h1><p class="sub">Plain-English fact-checks. Facts, not hype. Education, not medical advice.</p>`)
      + sec(`<h2>Papers</h2><ul>
<li>Barefoot Shoes: A No Excuses Guide to Stronger Feet (Oct 19, 2026), <a href="/learn/barefoot-shoes">Read<span class="sr-only">: Barefoot Shoes</span></a></li>
<li>Losing Weight vs. Losing Fat: ${hold('PDF review pending (Reed). Not linked.')} ${reed}</li>
<li>Added Sugar: The Fact-Check: ${hold('PDF review pending (Reed). Not linked.')} ${reed}</li>
</ul>`)
      + sec(`<h2>Questions to bring to your doctor ${reed}</h2>
<p>Your weight is one number. Your health is bigger than a scale. Your doctor may check things like blood sugar, blood pressure, cholesterol, and kidney and liver function. Ask what each result means for you and how often to recheck it. LoadLine doesn't interpret labs. Your doctor does.</p>
<ul>
<li>What does my blood pressure reading mean for me?</li>
<li>Which blood tests should I have, and how often?</li>
<li>Is it safe for me to change my eating or exercise routine?</li>
<li>Do any of my medications affect exercise?</li>
</ul>
<p><em>Educational only. Not medical advice. Talk with your doctor or a registered dietitian before you change your diet, routine, or anything related to your medications.</em> ${reed}</p>`, true),
  },

  '/tools': {
    title: 'Free Tools | LoadLine Fitness',
    meta: 'Free LoadLine tools: Plan Builder, Walkingout, WalkQuest, and the Free Tracker.',
    body: hero(`<h1>Free Tools</h1>`)
      + sec(`<div class="g">
<div class="c"><h2><a href="/plan-builder">Plan Builder</a></h2><p>A free daily routine, a walking plan (6,000–12,000 steps), and a 3- or 4-day workout as a PDF. Ages 18+. Goal options: "Build a routine" · "Build strength". ${reed}</p></div>
<div class="c"><h2><a href="/apps/walkingout/">Walkingout</a></h2><p>Walks built around your day. Saved on your device.</p></div>
<div class="c"><h2><a href="/apps/walkquest/">WalkQuest</a></h2><p>Turn everyday walks into a journey across a map.</p></div>
<div class="c"><h2><a href="/tracker.html">Free Tracker (LoadLine Core)</a></h2><p>Log workouts, steps, water, sleep, meals, and daily check-ins. Saved on your device. Free for book readers and challenge members. Paid member tools are in LoadLine OS. ${reed}</p></div>
</div>
<p><em>Education only. Not medical advice.</em></p>`),
  },

  '/shop': {
    title: 'Shop | LoadLine Fitness',
    meta: 'Gear we use and recommend, plus LoadLine merch.',
    body: hero(`<h1>Shop</h1><p class="sub">Gear we use and recommend, plus LoadLine merch.</p>
<p><em>Some links are affiliate links. LoadLine Fitness may earn a commission at no extra cost to you. As an Amazon Associate I earn from qualifying purchases.</em> ${counsel}</p>`)
      + sec(`<h2>Featured</h2><p><strong>Financially Fit</strong>, ${ext(FF_AMAZON, 'Buy on Amazon<span class="sr-only">: Financially Fit</span>')}</p>`)
      + sec(`<h2>Bands</h2><ul>
<li>${ext('https://amzn.to/4rGyR6A', 'Tribe Fitness Resistance Bands Set', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/4jkVXh8', 'Long Resistance Bands Set', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/4yrM7Oj', 'Fabric Loop Bands', 'sponsored noopener')}</li>
</ul>`, true)
      + sec(`<h2>Dumbbells, kettlebells, bench</h2><ul>
<li>${ext('https://amzn.to/4zANw62', 'VIVITORY Adjustable Set', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/4yZniKS', 'CAP Adjustabell 12.5 lb', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/3U1UjXh', 'CAP 100 lb Hex Set', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/4zCQ7wy', 'CAP Kettlebell Set', 'sponsored noopener')}</li>
<li>${ext('https://amzn.to/4s6mMrC', 'CAP Elite Foldable Bench', 'sponsored noopener')}</li>
</ul>`)
      + sec(`<h2>Walking</h2><ul><li>${ext('https://amzn.to/4k5Ohzy', 'AIRHAS Barefoot Shoes', 'sponsored noopener')}</li></ul>`, true)
      + sec(`<h2>Merch</h2><ul><li>${ext('https://loadlinefitness.printful.me/product/loadline-fitness-logo-tee-unisex-organic-cotton-creator-20-t-shirt', 'LoadLine Fitness Logo Tee')}</li></ul>`),
  },

  '/faq': {
    title: 'FAQ | LoadLine Fitness',
    meta: 'Answers about LoadLine Fitness programs, NOMAD, doctor clearance, medication, billing, equipment, and free challenges.',
    body: hero(`<h1>FAQ</h1>`)
      + sec(`<dl class="faq">
<dt>Is LoadLine in person?</dt><dd>No. LoadLine Fitness is online only, with no gym, studio, or office.</dd>
<dt>What programs do you offer?</dt><dd>Two memberships, both starting with 14 days of Basic Training: LoadLine Solo ($85/month, self-guided) and LoadLine 365 ($185/month, with a virtual coach).</dd>
<dt>Is fasting part of the programs?</dt><dd>No. LoadLine Solo and LoadLine 365 include no fasting. ${reed}</dd>
<dt>Can members join the community challenges?</dt><dd>Yes. ${MEMBER_GATE('LoadLine Solo and LoadLine 365')} <a href="/fasting-safety">Fasting Safety</a> ${reed}</dd>
<dt>What is NOMAD?</dt><dd>The final stage of LoadLine 365. You can carry the standard anywhere without being owned by a coach or a program. It doesn't mean leaving LoadLine.</dd>
<dt>Do I need to be fit to start?</dt><dd>No. Basic Training teaches the system first, and the training scales to your level.</dd>
<dt>Do I need my doctor's OK?</dt><dd>Yes. Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</dd>
<dt>Will you adjust my medication?</dt><dd>Never. LoadLine never prescribes, doses, or adjusts medication. ${reed}</dd>
<dt>What if I miss a day?</dt><dd>Missing a day is normal. We use a 7-day rolling average. The standard is about returning.</dd>
<dt>Is it a contract?</dt><dd>No long-term contract. Monthly billing continues until you cancel. ${counsel}</dd>
<dt>What equipment do I need?</dt><dd>Bands, adjustable dumbbells, a bench, and a safe place to walk. See the <a href="/shop">Shop</a>.</dd>
<dt>Are challenges free?</dt><dd>Yes. ${BYLINE}.</dd>
</dl>`),
  },

  '/contact': {
    title: 'Request a Free Call | LoadLine Fitness',
    meta: 'Request a free 30-minute video call or more information from LoadLine Fitness.',
    body: hero(`<h1>Request a Free Call or More Information</h1>
<p class="sub">A free 30-minute video call about your goals, schedule, and training history, and which program fits. No commitment, no pressure. This is not a medical evaluation. ${reed}</p>
<p class="hold">STAGING: "Book a Free Call" points here until a real scheduler link is supplied. This form posts to a test stub and sends nothing.</p>`)
      + sec(`<form class="contact" id="contact-form" method="post" action="/api/test/contact" novalidate>
<div><label for="c-name">Name <span aria-hidden="true">*</span></label><input id="c-name" name="name" type="text" autocomplete="name" required aria-required="true"></div>
<div><label for="c-email">Email <span aria-hidden="true">*</span></label><input id="c-email" name="email" type="email" autocomplete="email" required aria-required="true"></div>
<div><label for="c-phone">Phone (optional)</label><input id="c-phone" name="phone" type="tel" autocomplete="tel"></div>
<div><label for="c-msg">Message <span aria-hidden="true">*</span></label><textarea id="c-msg" name="message" rows="5" required aria-required="true" placeholder="Tell us about your goals and what brought you to LoadLine Fitness..."></textarea></div>
<label class="chk"><input type="checkbox" name="age18" value="true" required aria-required="true"> <span>I am 18 or older <span aria-hidden="true">*</span></span></label>
<label class="chk"><input type="checkbox" name="consent" value="true" required aria-required="true"> <span>I agree to the <a href="/privacy">Privacy Policy</a> and to being contacted about my request <span aria-hidden="true">*</span> ${counsel}</span></label>
<p><small><span aria-hidden="true">*</span> Required</small></p>
<div><button class="btn" type="submit">Send My Request</button></div>
<p class="status" id="c-status" role="status" aria-live="polite"></p>
</form>
<p>Or call/text: <strong><a href="${PHONE_HREF}">${PHONE}</a></strong></p>
<script src="/site-v5/contact.js" defer></script>`),
  },

  '/terms': legal('Terms', 'Terms', ['Membership billing, auto-renewal, how to cancel, refunds, and the age requirement.']),
  '/disclaimer': legal('Disclaimer', 'Disclaimer', ['Fitness education only; not medical care; never prescribes, doses, or adjusts medication; physician clearance; assumption of risk; challenge fasting gates; challenge-fast exclusions (under 18, pregnant/nursing, eating-disorder history); 18+ rule; low-blood-sugar/911 line.'], true),
  '/affiliate-disclosure': legal('Affiliate Disclosure', 'Affiliate Disclosure', ['Amazon Associates, Printful, SiPhox.']),
};

function legal(title, h1, outline, medical = false) {
  return {
    title: `${title} | LoadLine Fitness`,
    meta: `${title} for LoadLine Fitness.`,
    body: hero(`<h1>${h1}</h1><p class="hold">Draft pending counsel. Outline only; not the final text.</p> ${counsel}${medical ? ' ' + reed : ''}`)
      + sec(`<p><strong>Outline:</strong> ${outline.join(' ')}</p>`),
  };
}

export const NOT_FOUND = {
  title: 'Page not found | LoadLine Fitness',
  meta: 'Page not found.',
  body: hero(`<h1>Page not found</h1><p class="sub">That page doesn't exist. Try the <a href="/">home page</a> or the <a href="/faq">FAQ</a>.</p>`),
};
