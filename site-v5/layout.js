// Staging layout for the v5 site redo (new-site-copy.md FINAL v5).
// Every page carries a robots noindex meta; lib/site-v5.js also sends the header.

export const PHONE = '(866) 830-9123';
export const PHONE_HREF = 'tel:+18668309123';
export const FF_AMAZON = 'https://link.amazon/B03BV1u75';
export const NEC = 'https://noexcuseschallenges.com';
export const FB_GROUP = 'https://www.facebook.com/groups/metabolicresetwithjesse';
export const X_URL = 'https://x.com/LoadLineFitness';

// Review flags from the copy doc, shown as small badges on staging only.
export const reed = '<span class="flag" title="Medical review needed">REED</span>';
export const counsel = '<span class="flag" title="Legal review needed">COUNSEL</span>';
export const hold = (what) => `<span class="hold" role="note"><strong>On hold:</strong> ${what}</span>`;
export const ext = (href, text, rel = 'noopener') => `<a href="${href}" target="_blank" rel="${rel}">${text}<span class="sr-only"> (opens in a new tab)</span></a>`;
export const btn = (href, text, cls = '') => `<a class="btn${cls ? ' ' + cls : ''}" href="${href}">${text}</a>`;
export const BYLINE = 'Run by No Excuses Jesse · Powered by LoadLine Fitness';

const NAV = [
  { group: 'Programs', id: 'nav-programs', items: [['/loadline-365', 'LoadLine 365'], ['/solo', 'LoadLine Solo']] },
  ['/how-it-works', 'How It Works'],
  ['/challenges', 'Challenges'],
  ['/books', 'Books'],
  { group: 'Learn', id: 'nav-learn', items: [['/learn', 'Papers'], ['/fasting-safety', 'Fasting Safety']] },
  ['/tools', 'Tools'],
  ['/shop', 'Shop'],
];

function navLink([href, label], current) {
  const cur = href === current ? ' aria-current="page"' : '';
  return `<a href="${href}"${cur}>${label}</a>`;
}

function nav(current) {
  const parts = NAV.map((item) => {
    if (Array.isArray(item)) return `<li>${navLink(item, current)}</li>`;
    const active = item.items.some(([h]) => h === current) ? ' is-current' : '';
    return `<li class="drop${active}"><details><summary>${item.group}</summary><ul id="${item.id}">${item.items.map((i) => `<li>${navLink(i, current)}</li>`).join('')}</ul></details></li>`;
  });
  parts.push(`<li><a class="btn" href="/contact"${current === '/contact' ? ' aria-current="page"' : ''}>Book a Free Call</a></li>`);
  return parts.join('');
}

const FOOTER = `
<footer>
  <div class="w foot">
    <div>
      <p class="logo-foot">LOAD<b>LINE</b> FITNESS</p>
      <p>LoadLine Fitness · Load the Standard. Live the Life.</p>
      <p>Online coaching. No gym, no studio, no physical location.</p>
      <p>Call/text <a href="${PHONE_HREF}">${PHONE}</a> · X: ${ext(X_URL, '@LoadLineFitness')} · Community: ${ext(FB_GROUP, 'Metabolic Reset with Jesse (Facebook)')}</p>
      <p>Challenges are Run by No Excuses Jesse · Powered by LoadLine Fitness.</p>
    </div>
    <nav aria-label="Footer">
      <ul class="foot-links">
        <li><a href="/about">About</a></li><li><a href="/faq">FAQ</a></li><li><a href="/contact">Contact</a></li>
        <li><a href="/privacy">Privacy</a></li><li><a href="/terms">Terms</a></li><li><a href="/disclaimer">Disclaimer</a></li>
        <li><a href="/affiliate-disclosure">Affiliate Disclosure</a></li>
      </ul>
    </nav>
  </div>
  <div class="w">
    <p class="disc">Disclaimer: LoadLine Fitness provides fitness, movement, education, coaching, and accountability. It is not medical care. LoadLine never prescribes, doses, or adjusts medication. Talk with your doctor before you change how you eat or exercise. In an emergency, call 911. ${reed} ${counsel}</p>
    <p>© 2026 LoadLine Fitness. All rights reserved.</p>
  </div>
</footer>`;

export function layout({ path, title, meta, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<meta name="description" content="${meta}">
<meta name="theme-color" content="#0B1F3A">
<link rel="icon" href="/assets/icons/favicon.ico">
<link rel="stylesheet" href="/site-v5/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="banner" role="note">STAGING / TEST BUILD: not the live site. Hidden from search. Forms do not send.</div>
<header>
  <div class="w bar">
    <a class="logo" href="/" aria-label="LoadLine Fitness home">LOAD<b>LINE</b> FITNESS</a>
    <nav aria-label="Main"><ul class="menu">${nav(path)}</ul></nav>
  </div>
</header>
<main id="main">
${body}
</main>
${FOOTER}
</body>
</html>`;
}
