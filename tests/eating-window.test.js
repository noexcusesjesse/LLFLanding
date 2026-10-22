import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

describe('Eating Window app', () => {
  test('served with noindex meta and header', async () => {
    const r = await fetch(base + '/eating-window/');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(await r.text(), /<meta name="robots" content="noindex, nofollow">/);
  });
  test('bare path redirects to trailing slash', async () => {
    const r = await fetch(base + '/eating-window', { redirect: 'manual' });
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), '/eating-window/');
  });
  test('sw and manifest load', async () => {
    for (const f of ['sw.js', 'manifest.webmanifest', 'icons/icon-192.png']) {
      const r = await fetch(base + '/eating-window/' + f);
      assert.equal(r.status, 200, f);
      assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
    }
  });
  test('not linked from other pages', () => {
    for (const f of ['index.html', 'apps.html']) assert.doesNotMatch(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), /eating-window/);
  });
});
