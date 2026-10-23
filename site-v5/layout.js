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

// Line icons (24px, stroke = currentColor). Decorative: aria-hidden.
const svg = (d) => `<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICONS = {
  dumbbell: svg('<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/>'),
  walk: svg('<circle cx="13" cy="4.5" r="1.5"/><path d="M10 21l2-6 3 3v3M9 12l2-4 3 1 2 3M11 8l-2 7"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  chart: svg('<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-6"/>'),
  repeat: svg('<path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/>'),
  coach: svg('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M10 9.5l4 2-4 2z"/>'),
  home: svg('<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5"/>'),
  clipboard: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
  map: svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
  chev: svg('<path d="M6 9l6 6 6-6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
};

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
    return `<li class="drop${active}"><details><summary>${item.group}${ICONS.chev}</summary><ul id="${item.id}">${item.items.map((i) => `<li>${navLink(i, current)}</li>`).join('')}</ul></details></li>`;
  });
  parts.push(`<li><a class="btn" href="/contact"${current === '/contact' ? ' aria-current="page"' : ''}>Book a Free Call</a></li>`);
  return parts.join('');
}

const FOOTER = `
<footer>
  <div class="w foot">
    <div>
      <p class="logo-foot"><picture><source type="image/webp" srcset="/assets/brand/loadline-lockup-h64.webp 1x, /assets/brand/loadline-lockup-h128.webp 2x"><img class="foot-img" src="/assets/brand/loadline-lockup-h64.png" srcset="/assets/brand/loadline-lockup-h64.png 1x, /assets/brand/loadline-lockup-h128.png 2x" width="180" height="64" alt="LoadLine Fitness"></picture></p>
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

export function layout({ path, title, meta, body, head = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<meta name="description" content="${meta}">
<meta name="theme-color" content="#0B1F3A">
<link rel="icon" href="/assets/brand/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16.png">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<meta property="og:image" content="${process.env.PUBLIC_URL || ''}/assets/brand/og-default.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<link rel="preload" href="/site-v5/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin>${head}
<link rel="stylesheet" href="/site-v5/site.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/site-v5/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="banner" role="note">STAGING / TEST BUILD: not the live site. Hidden from search. Forms do not send.</div>
<header class="site-head">
  <div class="w bar">
    <a class="logo" href="/"><picture><source type="image/webp" media="(max-width: 959px)" srcset="/assets/brand/loadline-lockup-h44.webp 1x, /assets/brand/loadline-lockup-h88.webp 2x"><source type="image/webp" srcset="/assets/brand/loadline-lockup-h56.webp 1x, /assets/brand/loadline-lockup-h112.webp 2x"><source media="(max-width: 959px)" srcset="/assets/brand/loadline-lockup-h44.png 1x, /assets/brand/loadline-lockup-h88.png 2x"><img class="logo-img" src="/assets/brand/loadline-lockup-h56.png" srcset="/assets/brand/loadline-lockup-h56.png 1x, /assets/brand/loadline-lockup-h112.png 2x" width="158" height="56" alt="LoadLine Fitness"></picture><span class="sr-only"> home</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-menu"><span class="open-ic">${ICONS.menu}</span><span class="close-ic">${ICONS.close}</span><span class="sr-only">Menu</span></button>
    <nav aria-label="Main"><ul class="menu" id="site-menu">${nav(path)}</ul></nav>
  </div>
</header>
<main id="main">
${body}
</main>
${FOOTER}
</body>
</html>`;
}

// Responsive photo. name-<w>.{avif,webp,jpg} live in /assets/photos.
const P = '/assets/photos/';
export function photo(name, widths, w, h, { alt = '', cls = '', sizes = '100vw', eager = false } = {}) {
  const set = (ext) => widths.map((x) => `${P}${name}-${x}.${ext} ${x}w`).join(', ');
  const big = widths[widths.length - 1];
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img${cls ? ` class="${cls}"` : ''} src="${P}${name}-${big}.jpg" srcset="${set('jpg')}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
// Full-bleed hero background: mobile crop below 700px, wide banner above.
export const HERO_BG = `<picture class="hero-bg"><source media="(max-width: 699px)" type="image/avif" srcset="${P}hero-m800.avif"><source media="(max-width: 699px)" type="image/webp" srcset="${P}hero-m800.webp"><source media="(max-width: 699px)" srcset="${P}hero-m800.jpg"><source type="image/avif" srcset="${P}hero-1600.avif 1600w, ${P}hero-1983.avif 1983w" sizes="100vw"><source type="image/webp" srcset="${P}hero-1600.webp 1600w, ${P}hero-1983.webp 1983w" sizes="100vw"><img src="${P}hero-1600.jpg" srcset="${P}hero-1600.jpg 1600w, ${P}hero-1983.jpg 1983w" sizes="100vw" width="1600" height="640" alt="" fetchpriority="high" decoding="async"></picture>`;
export const HERO_PRELOAD = `
<link rel="preload" as="image" type="image/avif" media="(max-width: 699px)" href="${P}hero-m800.avif">
<link rel="preload" as="image" type="image/avif" media="(min-width: 700px)" imagesrcset="${P}hero-1600.avif 1600w, ${P}hero-1983.avif 1983w" imagesizes="100vw">`;
