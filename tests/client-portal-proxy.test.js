import http from 'node:http';
import assert from 'node:assert/strict';
import { describe, test, before, after } from 'node:test';
import express from 'express';
import { clientPortalProxy, isPortalPath } from '../lib/client-portal-proxy.js';
import { robotsTxt } from '../lib/site-v5.js';

let upstream, upBase, front, frontBase, seen;
const SECRET = 'test-secret-value';

before(async () => {
  upstream = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      seen = { method: req.method, url: req.url, headers: req.headers, body };
      if (req.url.startsWith('/clients/range')) {
        res.writeHead(206, { 'content-range': 'bytes 0-3/10', 'content-length': '4', 'accept-ranges': 'bytes' });
        return res.end('abcd');
      }
      if (req.url.startsWith('/clients/login-post')) {
        res.setHeader('Set-Cookie', ['__Host-llf_session=abc; Path=/; HttpOnly; Secure; SameSite=Lax', '__Host-llf_csrf=def; Path=/; Secure; SameSite=Lax']);
        res.writeHead(303, { location: `${upBase}/clients/admin`, 'x-robots-tag': 'noindex, nofollow' });
        return res.end();
      }
      res.writeHead(200, { 'content-type': 'text/plain', 'x-frame-options': 'DENY', 'content-security-policy': "default-src 'self'" });
      res.end('portal:' + req.url);
    });
  });
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  upBase = `http://127.0.0.1:${upstream.address().port}`;

  const app = express();
  app.use(clientPortalProxy({ upstream: upBase, secret: SECRET, canonicalHost: () => 'www.loadlinefitness.com' }));
  app.use(express.json());
  app.get('/clientsfoo', (req, res) => res.send('main-site'));
  app.use((req, res) => res.status(404).send('main 404'));
  front = app.listen(0);
  await new Promise((r) => front.once('listening', r));
  frontBase = `http://127.0.0.1:${front.address().port}`;
});
after(() => { front.close(); upstream.close(); });

function req(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const r = http.request(frontBase + path, { method, headers: { Host: 'www.loadlinefitness.com', 'X-Forwarded-Proto': 'https', ...headers } }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

describe('client portal proxy', () => {
  test('only /clients and /clients/* are proxied', () => {
    assert.ok(isPortalPath('/clients'));
    assert.ok(isPortalPath('/clients/login'));
    assert.ok(!isPortalPath('/clientsfoo'));
    assert.ok(!isPortalPath('/'));
  });

  test('forwards the path, headers, secret and real client IP; strips spoofed x-llf-*', async () => {
    const r = await req('/clients/login?next=%2Fadmin', { headers: { 'X-Real-IP': '203.0.113.9', 'X-LLF-Proxy-Secret': 'forged', 'X-LLF-Verified-IP': '1.2.3.4', Cookie: 'a=b' } });
    assert.equal(r.status, 200);
    assert.equal(r.body, 'portal:/clients/login?next=%2Fadmin');
    assert.equal(seen.headers['x-llf-proxy-secret'], SECRET);
    assert.equal(seen.headers['x-llf-client-ip'], '203.0.113.9');
    assert.equal(seen.headers['x-llf-verified-ip'], undefined);
    assert.equal(seen.headers.cookie, 'a=b');
    assert.equal(seen.headers['x-forwarded-host'], 'www.loadlinefitness.com');
    assert.equal(seen.headers['x-forwarded-proto'], 'https');
    assert.equal(r.headers['x-frame-options'], 'DENY');
    assert.match(r.headers['content-security-policy'], /default-src/);
    assert.equal(r.headers['access-control-allow-origin'], undefined);
  });

  test('falls back to the first X-Forwarded-For address', async () => {
    await req('/clients', { headers: { 'X-Forwarded-For': '198.51.100.7, 10.0.0.1' } });
    assert.equal(seen.headers['x-llf-client-ip'], '198.51.100.7');
    assert.equal(seen.url, '/clients');
  });

  test('streams POST bodies untouched and passes every Set-Cookie and a rewritten Location', async () => {
    const payload = JSON.stringify({ email: 'x@example.com', password: 'p' });
    const r = await req('/clients/login-post', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://www.loadlinefitness.com' }, body: payload });
    assert.equal(seen.body, payload);
    assert.equal(seen.method, 'POST');
    assert.equal(seen.headers.origin, 'https://www.loadlinefitness.com');
    assert.equal(r.status, 303);
    assert.equal(r.headers['set-cookie'].length, 2);
    assert.match(r.headers['set-cookie'][0], /^__Host-llf_session=abc; Path=\//);
    assert.equal(r.headers.location, 'https://www.loadlinefitness.com/clients/admin');
  });

  test('passes Range requests and 206 responses', async () => {
    const r = await req('/clients/range', { headers: { Range: 'bytes=0-3' } });
    assert.equal(seen.headers.range, 'bytes=0-3');
    assert.equal(r.status, 206);
    assert.equal(r.headers['content-range'], 'bytes 0-3/10');
    assert.equal(r.body, 'abcd');
  });

  test('redirects apex / http to the canonical https://www host', async () => {
    const r = await req('/clients/login', { headers: { Host: 'loadlinefitness.com' } });
    assert.equal(r.status, 301);
    assert.equal(r.headers.location, 'https://www.loadlinefitness.com/clients/login');
  });

  test('other paths fall through to the main site', async () => {
    assert.equal((await req('/clientsfoo')).body, 'main-site');
  });

  test('returns 502 when the portal is down', async () => {
    const app = express();
    app.use(clientPortalProxy({ upstream: 'http://127.0.0.1:1', secret: SECRET, canonicalHost: () => undefined }));
    const s = app.listen(0); await new Promise((r) => s.once('listening', r));
    const r = await new Promise((resolve) => http.get(`http://127.0.0.1:${s.address().port}/clients`, (res) => { res.resume(); res.on('end', () => resolve(res)); }));
    s.close();
    assert.equal(r.statusCode, 502);
    assert.match(r.headers['x-robots-tag'], /noindex/);
  });

  test('robots.txt keeps the portal out of search', () => {
    const txt = robotsTxt('https://www.loadlinefitness.com');
    assert.match(txt, /^Disallow: \/clients$/m);
    assert.doesNotMatch(txt, /Disallow: \/\n/);
  });
});
