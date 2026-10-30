// Page bodies for the v5 redo. Copy is taken word for word from
// loadline-website/new-site-copy.md (FINAL v5). [REED]/[COUNSEL] badges
// are hidden in the public build (reed/counsel render as empty strings).
import { HERO_BG, HERO_PRELOAD, photo, ICONS, FB_GROUP, FF_AMAZON, PHONE, PHONE_HREF, btn, counsel, ext, hold, reed } from './layout.js';

const media = (n) => `<div class="media">${photo(n, [640, 1024], 1024, 576, { sizes: '(min-width: 1180px) 1100px, 100vw' })}</div>`;
const JESSE = (cls) => photo('jesse', [320, 540], 540, 675, { alt: 'No Excuses Jesse', cls, sizes: '(min-width: 768px) 280px, 70vw' });
const sec = (inner, alt = false, id = '') => `<section class="sec${alt ? ' alt' : ''}"${id ? ` id="${id}"` : ''}><div class="w"><div class="panel reveal">${inner}</div></div></section>`;
// Grid sections render their cards directly (no outer panel).
const grid = (inner, alt = false, id = '') => `<section class="sec${alt ? ' alt' : ''}"${id ? ` id="${id}"` : ''}><div class="w reveal">${inner}</div></section>`;
const SHAPES = `<svg class="hero-art" aria-hidden="true" focusable="false" viewBox="0 0 600 600"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0B15A" stop-opacity=".55"/><stop offset="1" stop-color="#E0B15A" stop-opacity="0"/></linearGradient></defs><circle cx="420" cy="180" r="170" fill="none" stroke="url(#hg)" stroke-width="2"/><circle cx="420" cy="180" r="110" fill="none" stroke="url(#hg)" stroke-width="1.5"/><path d="M60 520 L300 300 L380 380 L560 200" fill="none" stroke="url(#hg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const hero = (inner, big = false, bg = '') => `<section class="hero${big ? ' hero-xl' : ''}${bg ? ' has-bg' : ''}">${bg || SHAPES}<div class="w hero-in">${inner}</div></section>`;

const FORMULA = `<div class="g g5">
  <div class="c">${ICONS.dumbbell}<h3>Train</h3><p>Strength and skill work that makes you more capable, not more dependent.</p></div>
  <div class="c">${ICONS.walk}<h3>Move</h3><p>Daily movement that fits a life. Walking, mobility, and work you'll actually repeat.</p></div>
  <div class="c">${ICONS.moon}<h3>Recover</h3><p>Rest is part of the work, not a luxury add-on.</p></div>
  <div class="c">${ICONS.chart}<h3>Track</h3><p>Simple accountability so the next session is honest.</p></div>
  <div class="c">${ICONS.repeat}<h3>Repeat</h3><p>Consistency is the product. You win the year by returning, not by a dramatic first week.</p></div>
</div>`;

const yes = '<span aria-hidden="true">✓</span><span class="sr-only">Included</span>';
const no = (extra = '') => `<span aria-hidden="true">✗</span><span class="sr-only">Not included</span>${extra}`;

export const PAGES = {
  '/': {
    title: 'LoadLine Fitness | Online Fitness Programs. Load the Standard.',
    meta: 'LoadLine Fitness is an online fitness program that teaches you to own your fitness. LoadLine 365 ($185/mo) and LoadLine Solo ($85/mo).',
    head: HERO_PRELOAD,
    body: hero(`<p class="eye">ONLINE PROGRAMS · LOADLINE FITNESS</p>
<h1>Load the Standard. Live the Life.</h1>
<p class="sub">We don't want to own your fitness. We want to teach you how to own it. Online programs you run from wherever you are, built to make you independent.</p>
<div class="ctas">${btn('#programs', 'See the Programs', 'lg')}</div>`, true, HERO_BG)
      + sec(`<div class="founder"><figure class="portrait">${JESSE('')}</figure><div><h2>This is not a gym. It's a mission.</h2>
<p>I spent years watching the same cycle: people start strong, burn out, and walk away thinking they failed. They didn't fail. The system failed them.</p>
<p>Traditional fitness is built on dependency: the next program, the next challenge, the next expert telling you what to do. That's a lease on your body, not ownership.</p>
<p>LoadLine teaches you to understand fitness, not just follow it, so the standard is something you carry for life.</p>
<p>— Jesse Collins, founder · <a href="/about">Read My Story</a></p></div></div>`)
      + grid(`<h2>Programs</h2>${media('program')}<div class="g tiers">
<div class="c tier featured">${ICONS.screen}<h3>LoadLine 365</h3><p class="price">$185/month</p><p>Digital program plus Jesse as your gym best friend: an accountability partner who tells you the truth. Basic Training, then LoadLine 30, 60, 90, 180, and 365. The year ends at NOMAD status.</p><a href="/loadline-365">Learn more<span class="sr-only"> about LoadLine 365</span></a></div>
<div class="c tier">${ICONS.home}<h3>LoadLine Solo</h3><p class="price">$85/month</p><p>The self-guided digital program you run at home, starting with Basic Training.</p><a href="/solo">Learn more<span class="sr-only"> about LoadLine Solo</span></a></div>
</div>`, true, 'programs')
      + grid(`<h2>The formula: Train. Move. Recover. Track. Repeat.</h2>${FORMULA}`)
      + sec(`<h2>Safety first</h2><ul>
<li>Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</li>
<li><strong>LoadLine never prescribes, doses, or adjusts medication.</strong> Your doctor handles anything medical. ${reed}</li>
</ul><p><a href="/how-it-works">How it works</a></p>`, true)
      + sec(`<h2>Books</h2>
<p><strong>Financially Fit</strong>: train your money like you train your body. ${ext(FF_AMAZON, 'Buy on Amazon<span class="sr-only">: Financially Fit</span>')}</p>
<p><strong>NO EXCUSES</strong>: a real person's guide to metabolic health. <a href="/books">See the books</a></p>`)
      + sec(`<h2>Free tools</h2><p>Plan Builder · WalkingOut Routine (Free) · Free Tracker → <a href="/tools">Explore tools</a></p>${media('tools')}`, true)
      + sec(`<h2>Start with a conversation.</h2>
<p>Book a free 30-minute video call. We'll talk about your goals, your schedule, and which program fits. No commitment, no pressure. This is not a medical evaluation. ${reed}</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} <span>Or call/text <a href="${PHONE_HREF}">${PHONE}</a></span></div>`),
  },

  '/loadline-365': {
    title: 'LoadLine 365 | A Year With Your Gym Best Friend | $185/mo',
    meta: 'LoadLine 365: a 12-month digital program with Jesse as your gym best friend and accountability partner. Basic Training, then LoadLine 30, 60, 90, 180, 365, and NOMAD. $185/month.',
    body: hero(`<p class="eye">DIGITAL PROGRAM + GYM BEST FRIEND</p><h1>LoadLine 365</h1>
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
<li>Jesse Collins as your gym best friend: an accountability partner, mentor, and motivator who tells you the truth without sugarcoating. Form checks, progress reviews, and accountability cover training and habits only and never touch medication. ${reed}</li>
<li>Check-ins handled by Jesse, who aims to reply within 1 business day</li>
<li>LoadLine OS member tools (dashboard, plate tools, roadmap)</li>
<li>The 12-month curriculum, with a skill checkpoint each quarter (for example, a timed incline walk or a banded-row test). These measure fitness skills, not health outcomes. ${reed}</li>
<li>Habit and measurement tracking with a 7-day rolling average, so one day never defines a week</li>
</ul>`)
      + sec(`<h2>NOMAD: independence, not leaving</h2><p>NOMAD means you can carry the LoadLine standard anywhere: at home, in a hotel, or in a park. It doesn't mean you leave LoadLine. The program stays with you. The standard travels.</p>
<p><em>Load the standard. Then live it, wherever you are.</em></p>`, true)
      + sec(`<h2>Pricing</h2><div class="c tier featured solo-tier">${ICONS.screen}<p class="price">$185/month.</p><p>Billed monthly until you cancel, with no long-term contract.</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('/solo', 'Compare with Solo ($85)', 'ghost')}</div></div>
<p class="note"><strong>Fasting:</strong> LoadLine 365 includes no fasting. ${reed}</p>`, false, 'pricing'),
  },

  '/solo': {
    title: 'LoadLine Solo | Self-Guided Online Program | $85/mo',
    meta: 'LoadLine Solo: the LoadLine standard, self-guided, at home, starting with Basic Training. $85/month.',
    body: hero(`<h1>LoadLine Solo</h1><p class="sub">The LoadLine standard, self-guided, at home. $85/month.</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('#included', "See What's Included", 'ghost')}</div>`)
      + sec(`<h2>Who it's for</h2><p>People who don't need someone standing over them. You want the system, the curriculum, and the tracking, and you want to run it yourself.</p>
<p><em>You do the work. We give you the system.</em></p>`)
      + sec(`<h2>What's included</h2><ul>
<li>LoadLine OS member tools</li>
<li>The full digital curriculum: training, movement, recovery, and tracking</li>
<li>Home equipment guide (the recommended setup matches the items on the <a href="/shop">Shop page</a>)</li>
<li>The plate method: a simple way to build a meal with vegetables, protein, slow carbs, and fats. It's general education, not an individual nutrition prescription. ${reed}</li>
<li>The formula at home: a 3-day band and dumbbell split and a daily step floor</li>
</ul>`, true, 'included')
      + sec(`<h2>Solo vs 365</h2><div class="tbl"><table><caption class="sr-only">LoadLine Solo compared with LoadLine 365</caption>
<thead><tr><th scope="col"><span class="sr-only">Feature</span></th><th scope="col">Solo $85</th><th scope="col">365 $185</th></tr></thead><tbody>
<tr><th scope="row">Digital curriculum</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">LoadLine OS tools</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">Basic Training onboarding</th><td>${yes}</td><td>${yes}</td></tr>
<tr><th scope="row">Jesse as your gym best friend</th><td>${no()}</td><td>${yes}</td></tr>
<tr><th scope="row">Weekly Sunday reviews</th><td>${no()}</td><td>${yes}</td></tr>
<tr><th scope="row">Path to NOMAD</th><td>${no(' (self-guided)')}</td><td>${yes}</td></tr>
</tbody></table></div>`)
      + sec(`<h2>Pricing</h2><div class="c tier featured solo-tier">${ICONS.home}<p class="price">$85/month.</p><p>Billed monthly until you cancel. ${counsel}</p>
<div class="ctas">${btn('/contact', 'Book a Free Call')} ${btn('/loadline-365', 'See LoadLine 365', 'ghost')}</div></div>
<p class="note"><strong>Fasting:</strong> LoadLine Solo includes no fasting. ${reed}</p>`, true),
  },

  '/how-it-works': {
    title: 'How LoadLine Works | LoadLine Fitness',
    meta: 'One formula. Honest tracking. Clear boundaries.',
    body: hero(`<h1>How LoadLine works</h1><p class="sub">One formula. Honest tracking. Clear boundaries.</p>`)
      + grid(`<h2>The formula</h2>${FORMULA}`)
      + sec(`<h2>The 7-day trend, not the day</h2><p>Your scale number moves day to day with water, food, and heat. That's normal. LoadLine looks at a 7-day rolling average, so one day never defines a week. Missing a day is normal. Missing a week is a pattern. The standard is about returning. ${reed}</p>`, true)
      + sec(`<h2>What we track and what we don't</h2><p>You log habits: training sessions, steps, sleep, water, meals, and any measurements you choose. Labs and health numbers belong to your doctor. LoadLine doesn't interpret lab results. ${reed}</p>`)
      + sec(`<h2>Clear boundaries</h2><p><strong>In LoadLine 365, Jesse does:</strong> teach the formula, check your form, review your logs, and hold you accountable, with the truth and no sugarcoating.</p>
<p><strong>LoadLine never:</strong> prescribes, doses, or adjusts medication, diagnoses, or interprets labs. ${reed} ${counsel}</p>`, true)
      + sec(`<h2>Doctor clearance</h2><p>Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</p>
<div class="ctas">${btn('/#programs', 'See the Programs')}</div>`),
  },

  '/about': {
    title: 'About Jesse Collins | LoadLine Fitness',
    meta: 'Jesse Collins, founder and architect of LoadLine Fitness, an online fitness company.',
    body: hero(`<div class="founder hero-founder"><figure class="portrait">${photo('jesse', [320, 540], 540, 675, { alt: 'No Excuses Jesse', sizes: '(min-width: 768px) 280px, 70vw', eager: true })}</figure><div><h1>Jesse Collins</h1><p class="sub">Founder and architect of LoadLine Fitness.</p></div></div>`)
      + sec(`<p>Jesse Collins founded LoadLine Fitness, an online fitness company: digital programs, plus the option to have Jesse in your corner as your gym best friend. Jesse built LoadLine from years of training himself and training alongside others. With a passion for long-term health, he built LoadLine on one principle: fitness should teach you to own your body, not rent it from someone else.</p>
<p>Jesse is also the first LoadLine client. He lives the standard every day. This is practice, not theory.</p>
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
    meta: 'Free LoadLine tools: Plan Builder, WalkingOut Routine (Free), and the Free Tracker.',
    body: hero(`<h1>Free Tools</h1>`)
      + `<div class="w media-top">${photo('tools', [640, 1024], 1024, 576, { sizes: '(min-width: 1180px) 1100px, 100vw' })}</div>`
      + grid(`<div class="g">
<div class="c">${ICONS.clipboard}<h2><a href="/plan-builder">Plan Builder</a></h2><p>A free daily routine, a walking plan (6,000–12,000 steps), and a 3- or 4-day workout as a PDF. Ages 18+. Goal options: "Build a routine" · "Build strength". ${reed}</p></div>
<div class="c">${ICONS.walk}<h2><a href="/apps/walkingout/">WalkingOut Routine (Free)</a></h2><p>Walks built around your day. Saved on your device.</p></div>
<div class="c">${ICONS.chart}<h2><a href="/tracker.html">Free Tracker (LoadLine Core)</a></h2><p>Log workouts, steps, water, sleep, meals, and daily check-ins. Saved on your device. Free for everyone. Paid member tools are in LoadLine OS. ${reed}</p></div>
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
    meta: 'Answers about LoadLine Fitness programs, NOMAD, doctor clearance, medication, billing, and equipment.',
    body: hero(`<h1>FAQ</h1>`)
      + sec(`<div class="faq">
<details><summary>Is LoadLine in person?${ICONS.chev}</summary><div class="ans">No. LoadLine Fitness is online only, with no gym, studio, or office.</div></details>
<details><summary>What programs do you offer?${ICONS.chev}</summary><div class="ans">Two memberships, both starting with 14 days of Basic Training: LoadLine Solo ($85/month, self-guided) and LoadLine 365 ($185/month, with Jesse as your gym best friend and accountability partner).</div></details>
<details><summary>Is fasting part of the programs?${ICONS.chev}</summary><div class="ans">No. LoadLine Solo and LoadLine 365 include no fasting. ${reed}</div></details>
<details><summary>What is NOMAD?${ICONS.chev}</summary><div class="ans">The final stage of LoadLine 365. You can carry the standard anywhere without being owned by a program or by anyone else. It doesn't mean leaving LoadLine.</div></details>
<details><summary>Do I need to be fit to start?${ICONS.chev}</summary><div class="ans">No. Basic Training teaches the system first, and the training scales to your level.</div></details>
<details><summary>Do I need my doctor's OK?${ICONS.chev}</summary><div class="ans">Yes. Before you start any LoadLine program (Solo or 365), confirm your doctor has cleared you for exercise. ${reed}</div></details>
<details><summary>Will you adjust my medication?${ICONS.chev}</summary><div class="ans">Never. LoadLine never prescribes, doses, or adjusts medication. ${reed}</div></details>
<details><summary>What if I miss a day?${ICONS.chev}</summary><div class="ans">Missing a day is normal. We use a 7-day rolling average. The standard is about returning.</div></details>
<details><summary>Is it a contract?${ICONS.chev}</summary><div class="ans">No long-term contract. Monthly billing continues until you cancel. ${counsel}</div></details>
<details><summary>What equipment do I need?${ICONS.chev}</summary><div class="ans">Bands, adjustable dumbbells, a bench, and a safe place to walk. See the <a href="/shop">Shop</a>.</div></details>
</div>`),
  },

  '/contact': {
    title: 'Request a Free Call | LoadLine Fitness',
    meta: 'Request a free 30-minute video call or more information from LoadLine Fitness.',
    body: hero(`<h1>Request a Free Call or More Information</h1>
<p class="sub">A free 30-minute video call about your goals, schedule, and training history, and which program fits. No commitment, no pressure. This is not a medical evaluation. ${reed}</p>`)
      + sec(`<form class="contact" id="contact-form" method="post" action="/api/leads" novalidate>
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
  '/disclaimer': legal('Disclaimer', 'Disclaimer', ['Fitness education only; not medical care; never prescribes, doses, or adjusts medication; physician clearance; assumption of risk; 18+ rule; low-blood-sugar/911 line.'], true),
  '/affiliate-disclosure': legal('Affiliate Disclosure', 'Affiliate Disclosure', ['Amazon Associates, Printful, SiPhox.']),
};

function legal(title, h1, outline, medical = false) {
  return {
    title: `${title} | LoadLine Fitness`,
    meta: `${title} for LoadLine Fitness.`,
    noindex: true, // outline only until counsel signs off
    body: hero(`<h1>${h1}</h1><p class="hold">Draft pending counsel. Outline only; not the final text.</p> ${counsel}${medical ? ' ' + reed : ''}`)
      + sec(`<p><strong>Outline:</strong> ${outline.join(' ')}</p>`),
  };
}

export const NOT_FOUND = {
  title: 'Page not found | LoadLine Fitness',
  meta: 'Page not found.',
  body: hero(`<h1>Page not found</h1><p class="sub">That page doesn't exist. Try the <a href="/">home page</a> or the <a href="/faq">FAQ</a>.</p>`),
};
