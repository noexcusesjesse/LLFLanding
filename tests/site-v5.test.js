import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';
import { PAGES } from '../site-v5/pages.js';
import { REDIRECTS } from '../lib/site-v5.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

const GATE = "To join a challenge fast, you must have finished Basic Training and your doctor must have cleared you for fasting.";

describe('v5 staging site', () => {
  test('every new page renders 200 with noindex header and meta', async () => {
    for (const path of Object.keys(PAGES).concat(['/learn/barefoot-shoes'])) {
      const r = await fetch(base + path);
      assert.equal(r.status, 200, path);
      assert.match(r.headers.get('x-robots-tag') || '', /noindex/, path);
      const html = await r.text();
      if (path !== '/learn/barefoot-shoes') assert.match(html, /<meta name="robots" content="noindex, nofollow">/, path);
    }
  });
  test('the whole build is noindex, including legacy routes, and robots.txt blocks all', async () => {
    for (const path of ['/ruck', '/ruck/privacy', '/eating-window/', '/plan-builder', '/tracker.html', '/privacy']) {
      const r = await fetch(base + path);
      assert.equal(r.status, 200, path);
      assert.match(r.headers.get('x-robots-tag') || '', /noindex/, path);
    }
    assert.match(await (await fetch(base + '/robots.txt')).text(), /Disallow: \/\n/);
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
  test('contact stub validates and returns OK without email or database', async () => {
    const post = (body) => fetch(base + '/api/test/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post({ name: 'A' })).status, 400);
    const ok = await post({ name: 'Test', email: 't@example.com', message: 'hi', age18: true, consent: true });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).test, true);
    const stub = readFileSync(new URL('../lib/site-v5.js', import.meta.url), 'utf8');
    assert.doesNotMatch(stub, /pool|sendEmail|sendgrid/i);
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
