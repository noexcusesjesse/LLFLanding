import assert from 'node:assert/strict';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

describe('image content types', () => {
  test('.avif is served as image/avif', async () => {
    const r = await fetch(base + '/assets/photos/hero-1600.avif');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'image/avif');
  });
  test('.webp is served as image/webp', async () => {
    const r = await fetch(base + '/assets/photos/hero-1600.webp');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('content-type'), 'image/webp');
  });
});
