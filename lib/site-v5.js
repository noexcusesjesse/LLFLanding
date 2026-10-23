// STAGING ONLY: v5 site redo (loadline-website/new-site-copy.md FINAL v5).
// mountSiteV5(app) must run before every other route in server.js. It:
//  - sends the noindex header on every response (whole test build is noindex),
//  - serves the new pages at clean URLs,
//  - adds the 301 re-map from the redo proposal,
//  - wires the contact form to a stub that only logs (no email, no database).
// Before launch: drop the global noindex, the staging banner and the stub.
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
};

export const ROBOTS_TXT = 'User-agent: *\nDisallow: /\n';

export function renderPage(path) {
  const page = PAGES[path];
  return page ? layout({ path, ...page }) : null;
}

export function contactStubError(body = {}) {
  if (!String(body.name || '').trim()) return 'Name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '').trim())) return 'A valid email is required.';
  if (!String(body.message || '').trim()) return 'Message is required.';
  if (body.age18 !== true && body.age18 !== 'true') return 'You must confirm you are 18 or older.';
  if (body.consent !== true && body.consent !== 'true') return 'You must agree to the Privacy Policy.';
  return null;
}

export function mountSiteV5(app, rootDir) {
  app.use(noindexHeader);

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
    const target = REDIRECTS[req.path];
    const [base, hash] = target.split('#');
    res.redirect(301, base + (query ? '?' + query : '') + (hash ? '#' + hash : ''));
  });

  app.get('/robots.txt', (req, res) => res.type('text/plain').send(ROBOTS_TXT));
  app.get('/sitemap.xml', (req, res) => {
    const base = `${req.protocol}://${req.get('host')}`;
    const urls = Object.keys(PAGES).concat(['/learn/barefoot-shoes', '/privacy', '/plan-builder']);
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  });

  for (const path of Object.keys(PAGES)) {
    app.get(path, (req, res, next) => {
      if (req.originalUrl.split('?')[0] !== path && path !== '/') {
        if (req.originalUrl.split('?')[0] === path + '/') return res.redirect(301, path);
        return next();
      }
      res.type('html').send(renderPage(path));
    });
  }

  // Existing article, new URL. Its asset paths are absolute, so it renders as-is.
  app.get('/learn/barefoot-shoes', (req, res) => {
    res.type('html').send(applySiteNav(readFileSync(join(rootDir, 'papers', 'barefoot-shoes.html'), 'utf8')));
  });

  // Test endpoint only: validates, logs a redacted line, returns OK.
  app.post('/api/test/contact', (req, res) => {
    const error = contactStubError(req.body);
    if (error) return res.status(400).json({ error });
    const email = String(req.body.email).trim();
    console.log(`[contact-stub] test submission received (email domain: ${email.split('@')[1]}, message chars: ${String(req.body.message).length}). Not emailed, not stored.`);
    return res.json({ success: true, test: true, message: 'Thank you! We will be in touch within 24 hours.' });
  });
}

// Real 404 for unknown URLs (replaces the old home-page catch-all).
export function notFound(req, res) {
  res.status(404).type('html').send(layout({ path: '', ...NOT_FOUND }));
}
