/**
 * One nav for every public page. server.js injects it in place of
 * <!-- SITE-NAV current="..." --> so the links stay in the HTML for
 * search engines and for browsers with JavaScript turned off.
 */

const LINKS = {
  story: { href: '/#my-story', label: 'My Story' },
  coach: { href: '/#about-coach', label: 'The Coach' },
  system: { href: '/#system', label: 'The System' },
  pricing: { href: '/#pricing', label: 'Pricing' },
  faq: { href: '/#faq', label: 'FAQ' },
  metabolic: { href: '/metabolic-health.html', label: 'Metabolic Health' },
  books: { href: '/books.html', label: 'Books' },
  papers: { href: '/papers.html', label: 'Papers' },
  apps: { href: '/apps', label: 'Apps' },
  shop: { href: '/shop.html', label: 'Shop' },
  book: { href: '/#consultation', label: 'Book Now', cta: true },
};

function link(id, current) {
  const item = LINKS[id];
  const currentAttr = current === id ? ' aria-current="page"' : '';
  const classAttr = item.cta ? ' class="nav-cta"' : '';
  return `<a href="${item.href}"${classAttr}${currentAttr}>${item.label}</a>`;
}

function group(id, label, ids, current) {
  const active = ids.includes(current) ? ' is-current' : '';
  return `<details class="nav-drop${active}">
      <summary aria-expanded="false" aria-haspopup="true" aria-controls="${id}">${label}</summary>
      <div class="nav-menu" id="${id}" role="group" aria-label="${label}">
        ${ids.map((item) => link(item, current)).join('\n        ')}
      </div>
    </details>`;
}

function section(label, ids, current) {
  return `<p class="nav-section-label">${label}</p>
          ${ids.map((item) => link(item, current)).join('\n          ')}`;
}

export function renderSiteNav(current = '') {
  const about = ['story', 'coach'];
  const program = ['system', 'pricing', 'faq', 'metabolic'];
  const resources = ['books', 'papers', 'apps'];
  return `<nav class="nav container" aria-label="Main navigation" data-site-nav>
      <a class="brand" href="/#top" aria-label="LoadLine Fitness home">
        <img src="/assets/loadline-fitness-logo.jpg" alt="LoadLine Fitness logo">
      </a>
      <div class="nav-links">
        ${group('nav-about', 'About', about, current)}
        ${group('nav-program', 'Program', program, current)}
        ${group('nav-resources', 'Resources', resources, current)}
        ${link('shop', current)}
        ${link('book', current)}
      </div>
      <details class="nav-mobile">
        <summary aria-expanded="false" aria-controls="nav-mobile-panel">Menu</summary>
        <div id="nav-mobile-panel">
          ${section('About', about, current)}
          ${section('Program', program, current)}
          ${section('Resources', resources, current)}
          ${section('Shop', ['shop'], current)}
          ${link('book', current)}
        </div>
      </details>
    </nav>
    <script>
      (function () {
        var nav = document.querySelector('[data-site-nav]');
        if (!nav) return;
        var drops = nav.querySelectorAll('.nav-drop');
        function expanded(drop, on) {
          var summary = drop.querySelector('summary');
          if (summary) summary.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        drops.forEach(function (drop) {
          drop.addEventListener('toggle', function () {
            expanded(drop, drop.open || drop.matches(':hover') || drop.contains(document.activeElement));
            if (!drop.open) return;
            drops.forEach(function (other) { if (other !== drop) other.open = false; });
          });
          drop.addEventListener('mouseenter', function () { expanded(drop, true); });
          drop.addEventListener('mouseleave', function () {
            if (!drop.open && !drop.contains(document.activeElement)) expanded(drop, false);
          });
          drop.addEventListener('focusin', function () { expanded(drop, true); });
          drop.addEventListener('focusout', function () {
            setTimeout(function () {
              if (!drop.open && !drop.contains(document.activeElement)) expanded(drop, false);
            }, 0);
          });
        });
        document.addEventListener('keydown', function (event) {
          if (event.key !== 'Escape') return;
          drops.forEach(function (drop) { drop.open = false; expanded(drop, false); });
          var mobile = nav.querySelector('.nav-mobile');
          if (mobile) mobile.open = false;
        });
        document.addEventListener('click', function (event) {
          drops.forEach(function (drop) {
            if (!drop.contains(event.target)) drop.open = false;
          });
        });
        nav.querySelectorAll('.nav-mobile a').forEach(function (anchor) {
          anchor.addEventListener('click', function () {
            var mobile = nav.querySelector('.nav-mobile');
            if (mobile) mobile.open = false;
          });
        });
        var mobile = nav.querySelector('.nav-mobile');
        if (mobile) {
          var summary = mobile.querySelector('summary');
          var sync = function () { if (summary) summary.setAttribute('aria-expanded', mobile.open ? 'true' : 'false'); };
          sync();
          mobile.addEventListener('toggle', sync);
        }
      })();
    </script>`;
}

export function applySiteNav(html) {
  return html.replace(/<!-- SITE-NAV(?: current="([^"]*)")? -->/g, (_, current) => renderSiteNav(current || ''));
}
