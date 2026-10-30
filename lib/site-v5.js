// v5 site (loadline-website/new-site-copy.md FINAL v5).
// mountSiteV5(app) must run before every other route in server.js. It:
//  - sends noindex only on legal outlines (/eating-window keeps its own in server.js),
//  - serves the new pages at clean URLs,
//  - adds the 301 re-map from the redo proposal.
// The contact form posts to the production lead endpoint, POST /api/leads.
import { join } from 'path';
import { readFileSync } from 'fs';
import { noindexHeader } from './noindex.js';
import { applySiteNav } from '../partials/site-nav.js';
import { layout } from '../site-v5/layout.js';
import { NOT_FOUND, PAGES } from '../site-v5/pages.js';

export const REDIRECTS = {
  '/index.html': '/',
  '/loadline-365.html': '/loadline-365',
  '/365': '/loadline-365',
  '/loadline-solo.html': '/solo',
  '/pricing.html': '/loadline-365#pricing',
  '/metabolic-health.html': '/learn',
  '/papers.html': '/learn',
  '/papers/barefoot-shoes.html': '/learn/barefoot-shoes',
  '/books.html': '/books',
  '/shop.html': '/shop',
  '/reset-program': '/loadline-365',
  '/reset-program.html': '/loadline-365',
  // Challenges belong to the No Excuses Jesse brand, not LoadLine.
  '/challenges': 'https://noexcuseschallenges.com',
  '/challenges.html': 'https://noexcuseschallenges.com',
  '/fasting-safety': 'https://noexcuseschallenges.com',
};

export const robotsTxt = (base) => `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;

export function renderPage(path, opts = {}) {
  const page = PAGES[path];
  return page ? layout({ path, ...page, noindex: page.noindex || Boolean(opts.noindex) }) : null;
}

export const PUBLIC_HOSTS = new Set(['www.loadlinefitness.com', 'loadlinefitness.com']);
export const NOINDEX_PATHS = Object.keys(PAGES).filter((p) => PAGES[p].noindex);
const siteBase = (req) => (process.env.CANONICAL_HOST ? `https://${process.env.CANONICAL_HOST}` : `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`);

export function mountSiteV5(app, rootDir) {
  // Only the real domains are indexable. Any other host (the *.up.railway.app
  // test and production domains, localhost) gets noindex on every response.
  app.use((req, res, next) => {
    if (!PUBLIC_HOSTS.has(String(req.hostname || '').toLowerCase())) {
      res.locals.offHost = true;
      res.set('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  // Legal outlines stay reachable but out of search until final.
  app.use(NOINDEX_PATHS, noindexHeader);

  // Apex/http -> https://www. only when CANONICAL_HOST is set (production
  // hosts). Unset on staging, so the PR preview host is left alone.
  app.use((req, res, next) => {
    const canonical = process.env.CANONICAL_HOST;
    if (!canonical) return next();
    const proto = req.get('x-forwarded-proto') || req.protocol;
    if (req.hostname !== canonical || proto !== 'https') {
      return res.redirect(301, `https://${canonical}${req.originalUrl}`);
    }
    return next();
  });

  app.get(Object.keys(REDIRECTS), (req, res) => {
    const query = req.originalUrl.split('?')[1];
    const target = REDIRECTS[req.path] || REDIRECTS[req.path.toLowerCase().replace(/\/+$/, '')];
    const [base, hash] = target.split('#');
    res.redirect(301, base + (query ? '?' + query : '') + (hash ? '#' + hash : ''));
  });

  app.get('/robots.txt', (req, res) => res.type('text/plain').send(robotsTxt(siteBase(req))));
  app.get('/sitemap.xml', (req, res) => {
    const base = siteBase(req);
    const urls = Object.keys(PAGES).filter((p) => !PAGES[p].noindex && !REDIRECTS[p]).concat(['/learn/barefoot-shoes', '/privacy', '/plan-builder']);
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  });

  for (const path of Object.keys(PAGES)) {
    app.get(path, (req, res, next) => {
      if (req.originalUrl.split('?')[0] !== path && path !== '/') {
        if (req.originalUrl.split('?')[0] === path + '/') return res.redirect(301, path);
        return next();
      }
      res.type('html').send(renderPage(path, { noindex: Boolean(res.locals.offHost) }));
    });
  }

  // Existing article, new URL. Its asset paths are absolute, so it renders as-is.
  app.get('/learn/barefoot-shoes', (req, res) => {
    res.type('html').send(applySiteNav(readFileSync(join(rootDir, 'papers', 'barefoot-shoes.html'), 'utf8')));
  });

}

// Real 404 for unknown URLs (replaces the old home-page catch-all).
export function notFound(req, res) {
  res.status(404).type('html').send(layout({ path: '', ...NOT_FOUND, noindex: true }));
}
