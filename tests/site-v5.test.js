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
const GATE = "To join a challenge fast, you must have finished Basic Training and your doctor must have cleared you for fasting.";

describe('v5 site', () => {
  test('public pages are indexable; legal outlines are noindex and out of the sitemap', async () => {
    for (const path of Object.keys(PAGES).concat(['/learn/barefoot-shoes', '/ruck', '/ruck/privacy', '/plan-builder', '/tracker.html', '/privacy'])) {
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
  test('unknown URLs return a real 404', async () => {
    assert.equal((await fetch(base + '/no-such-page')).status, 404);
  });
  test('contact form posts to the real lead endpoint and the stub is gone', async () => {
    assert.match(PAGES['/contact'].body, /action="\/api\/leads"/);
    assert.equal((await fetch(base + '/api/test/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 404);
  });
  test('holds stay unlinked and member fasting lines link to /fasting-safety', () => {
    const all = JSON.stringify(PAGES);
    assert.doesNotMatch(all, /amzn\.to\/4dJO698/);
    assert.doesNotMatch(all, /losing-weight-vs-losing-fat\.pdf|added-sugar-fact-check\.pdf/);
    for (const p of ['/solo', '/loadline-365', '/faq', '/challenges']) {
      assert.ok(PAGES[p].body.includes(GATE), p);
      assert.match(PAGES[p].body, /href="\/fasting-safety"/, p);
    }
    assert.doesNotMatch(PAGES['/'].body, /fast/i);
    assert.doesNotMatch(all, /Reset Program|Boot Camp|most popular|72/i);
  });
  test('Book a Free Call goes to the contact form', () => {
    for (const p of Object.values(PAGES)) for (const m of p.body.matchAll(/href="([^"]+)"[^>]*>Book a Free Call/g)) assert.equal(m[1], '/contact');
  });
});
