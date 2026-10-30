import http from 'node:http';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';
import { PAGES } from '../site-v5/pages.js';
import { REDIRECTS } from '../lib/site-v5.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

// fetch() drops a custom Host header, so host-specific checks use http.get.
const hget = (path, host = 'www.loadlinefitness.com') => new Promise((resolve, reject) => {
  http.get(base + path, { headers: { Host: host } }, (res) => {
    let body = ''; res.on('data', (c) => { body += c; });
    res.on('end', () => resolve({ status: res.statusCode, headers: { get: (k) => res.headers[k.toLowerCase()] }, text: async () => body }));
  }).on('error', reject);
});

describe('v5 site', () => {
  test('public pages are indexable; legal outlines are noindex and out of the sitemap', async () => {
    for (const path of Object.keys(PAGES).filter((p) => !REDIRECTS[p]).concat(['/learn/barefoot-shoes', '/ruck', '/ruck/privacy', '/plan-builder', '/tracker.html', '/privacy'])) {
      const r = await hget(path);
      assert.equal(r.status, 200, path);
      const html = await r.text();
      const outline = Boolean(PAGES[path] && PAGES[path].noindex);
      if (outline) {
        assert.match(r.headers.get('x-robots-tag') || '', /noindex/, path);
        assert.match(html, /<meta name="robots" content="noindex, nofollow">/, path);
      } else {
        assert.doesNotMatch(r.headers.get('x-robots-tag') || '', /noindex/, path);
        if (PAGES[path]) assert.doesNotMatch(html, /name="robots" content="noindex/, path);
      }
      assert.doesNotMatch(html, /STAGING \/ TEST BUILD|class="flag"/, path);
    }
    assert.deepEqual(Object.keys(PAGES).filter((p) => PAGES[p].noindex), ['/terms', '/disclaimer', '/affiliate-disclosure']);
    const sm = await (await fetch(base + '/sitemap.xml')).text();
    assert.doesNotMatch(sm, /terms|disclaimer|affiliate-disclosure/);
    const ew = await hget('/eating-window/');
    assert.match(ew.headers.get('x-robots-tag') || '', /noindex/);
    const robots = await (await fetch(base + '/robots.txt')).text();
    assert.doesNotMatch(robots, /Disallow: \/\n/);
    assert.match(robots, /Allow: \/\n/);
    assert.match(robots, /Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });
  test('non-public hosts (railway test/prod domains) are noindex everywhere', async () => {
    for (const path of ['/', '/about', '/ruck', '/plan-builder']) {
      const r = await hget(path, 'llf-site-test-production.up.railway.app');
      assert.match(r.headers.get('x-robots-tag') || '', /noindex/, path);
      if (path === '/' || path === '/about') assert.match(await r.text(), /<meta name="robots" content="noindex, nofollow">/, path);
    }
    const apex = await hget('/', 'loadlinefitness.com');
    assert.doesNotMatch(apex.headers.get('x-robots-tag') || '', /noindex/);
  });
  test('old URLs 301 to the new map', async () => {
    for (const [from, to] of Object.entries(REDIRECTS)) {
      const r = await fetch(base + from, { redirect: 'manual' });
      assert.equal(r.status, 301, from);
      assert.equal(r.headers.get('location'), to, from);
    }
  });
  test('challenges are off LoadLine: no nav item or on-site links, and the old URLs 301 to noexcuseschallenges.com', async () => {
    for (const from of ['/challenges', '/challenges/', '/Challenges', '/challenges?x=1', '/challenges.html', '/fasting-safety', '/fasting-safety/']) {
      const r = await fetch(base + from, { redirect: 'manual' });
      assert.equal(r.status, 301, from);
      assert.match(r.headers.get('location'), /^https:\/\/noexcuseschallenges\.com\/?(\?x=1)?$/, from);
    }
    for (const path of Object.keys(PAGES).filter((p) => !REDIRECTS[p]).concat(['/apps', '/papers'])) {
      const html = await (await hget(path)).text();
      assert.doesNotMatch(html, /href="\/challenges/, path);
      assert.doesNotMatch(html, />Challenges<\/a>/, path);
      assert.doesNotMatch(html, /href="\/fasting-safety/, path);
    }
    const sm = await (await fetch(base + '/sitemap.xml')).text();
    assert.doesNotMatch(sm, /\/challenges|fasting-safety/);
    assert.equal(PAGES['/challenges'], undefined);
    assert.equal(PAGES['/fasting-safety'], undefined);
  });
  test('books are off the LoadLine nav and /books 301s to noexcusesbooks.com', async () => {
    for (const from of ['/books', '/books/', '/Books', '/books.html', '/books?x=1']) {
      const r = await fetch(base + from, { redirect: 'manual' });
      assert.equal(r.status, 301, from);
      assert.match(r.headers.get('location'), /^https:\/\/noexcusesbooks\.com\/?(\?x=1)?$/, from);
    }
    for (const path of ['/', '/about', '/faq', '/apps', '/papers', '/plan-builder']) {
      const html = await (await hget(path)).text();
      const navs = (html.match(/<nav[\s\S]*?<\/nav>/g) || []).join('');
      assert.doesNotMatch(navs, /books/i, path);
    }
    assert.doesNotMatch(await (await fetch(base + '/sitemap.xml')).text(), /\/books/);
  });
  test('unknown URLs return a real 404', async () => {
    assert.equal((await fetch(base + '/no-such-page')).status, 404);
  });
  test('contact form posts to the real lead endpoint and the stub is gone', async () => {
    assert.match(PAGES['/contact'].body, /action="\/api\/leads"/);
    assert.equal((await fetch(base + '/api/test/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 404);
  });
  test('holds stay unlinked and member fasting lines say the programs include no fasting', () => {
    const all = JSON.stringify(PAGES);
    assert.doesNotMatch(all, /amzn\.to\/4dJO698/);
    assert.doesNotMatch(all, /losing-weight-vs-losing-fat\.pdf|added-sugar-fact-check\.pdf/);
    for (const p of ['/solo', '/loadline-365', '/faq']) {
      assert.match(PAGES[p].body, /includes? no fasting/, p);
      assert.doesNotMatch(PAGES[p].body, /fasting-safety|No Excuses Challenge|community challenge|challenge fast/i, p);
    }
    assert.doesNotMatch(PAGES['/'].body, /fast/i);
    assert.doesNotMatch(all, /Reset Program|Boot Camp|most popular|72/i);
  });
  test('Book a Free Call goes to the contact form', () => {
    for (const p of Object.values(PAGES)) for (const m of p.body.matchAll(/href="([^"]+)"[^>]*>Book a Free Call/g)) assert.equal(m[1], '/contact');
  });
  test('no coach wording on shipped pages; LoadLine 365 uses the gym best friend framing', async () => {
    const paths = Object.keys(PAGES).concat(['/learn/barefoot-shoes', '/papers', '/apps', '/plan-builder', '/privacy', '/tracker.html', '/apps/walkingout/help/', '/ruck', '/ruck/privacy', '/sitemap.xml']);
    for (const path of paths) {
      const html = await (await hget(path)).text();
      assert.doesNotMatch(html, /coach/i, path);
    }
    const p365 = PAGES['/loadline-365'];
    assert.match(p365.body, /gym best friend/);
    assert.match(p365.body, /accountability partner, mentor, and motivator who tells you the truth without sugarcoating/);
    assert.match(p365.body, /Check-ins handled by Jesse, who aims to reply within 1 business day/);
    assert.match(PAGES['/faq'].body, /\$185\/month, with Jesse as your gym best friend/);
    assert.doesNotMatch(p365.title + p365.meta + p365.body, /\u2014/);
  });
});
