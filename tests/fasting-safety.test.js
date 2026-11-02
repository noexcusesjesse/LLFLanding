import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';
import { FASTING_SAFETY_MD } from '../site-v5/disclaimer.js';
import { PAGES } from '../site-v5/pages.js';
import { REDIRECTS } from '../lib/site-v5.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

const text = (html) => html.replace(/<\/?(p|li|ul|h\d|section|div|article|main|header|footer|nav)\b[^>]*>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const plain = (md) => md.replace(/^#+ |^- \[ \] |^- /gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|\*/g, '').replace(/\s+/g, ' ').trim();
const lines = (md) => md.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b && b !== '---').flatMap((b) => b.split('\n')).map(plain);

describe('/fasting-safety', () => {
  test('content file is the approved copy, byte for byte', () => {
    // sha256 of the approved fasting-safety.md. Change only with new approved copy.
    assert.equal(createHash('sha256').update(FASTING_SAFETY_MD).digest('hex'), 'a68f4df9ba71132286a6af0082c0cca43f15f13dec766db531e80c145a754ca1');
  });
  test('page renders every line of the markdown exactly, in order, and nothing else in the article', async () => {
    const r = await fetch(base + '/fasting-safety');
    assert.equal(r.status, 200);
    const html = await r.text();
    const main = text(html.slice(html.indexOf('<main'), html.indexOf('</main>')));
    const want = lines(FASTING_SAFETY_MD);
    let at = 0;
    for (const l of want) {
      const i = main.indexOf(l, at);
      assert.ok(i >= 0, `missing or out of order: ${l.slice(0, 80)}`);
      at = i + l.length;
    }
    assert.equal(main.trim(), want.join(' '));
    assert.match(html, /<h1 class="dl-h1">Fasting Safety<\/h1>/);
    assert.match(html, /<a href="https:\/\/noexcuseschallenges\.com">noexcuseschallenges\.com<\/a>/);
    assert.equal((html.match(/<section class="dl-sec/g) || []).length, 9);
  });
  test('is a same-site page, noindex, out of the sitemap, not redirected', async () => {
    assert.equal(REDIRECTS['/fasting-safety'], undefined);
    const r = await fetch(base + '/fasting-safety', { redirect: 'manual' });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
    assert.match(await r.text(), /<meta name="robots" content="noindex, nofollow">/);
    assert.equal(PAGES['/fasting-safety'].noindex, true);
    assert.doesNotMatch(await (await fetch(base + '/sitemap.xml')).text(), /fasting-safety/);
  });
  test('copy has no em-dashes, coach wording, or & Wellness', async () => {
    assert.doesNotMatch(FASTING_SAFETY_MD, /\u2014|coach|& Wellness/i);
    const html = await (await fetch(base + '/fasting-safety')).text();
    assert.doesNotMatch(html, /\u2014|&mdash;|coach|&amp; Wellness|& Wellness/i);
  });
  test('disclaimer Section 6 carries the Reset Program line and both Fasting Safety links go to /fasting-safety', async () => {
    const html = await (await fetch(base + '/disclaimer')).text();
    const s6 = html.slice(html.indexOf('6. Fasting'), html.indexOf('7. Assumption of Risk'));
    assert.ok(text(s6).includes("Clearance for exercise doesn't count. The No Excuses Reset Program also includes physician-gated 24-hour and 36-hour fasts, never in Basic Training or The Ninety. See Fasting Safety."));
    const links = [...s6.matchAll(/<a href="([^"]+)">Fasting Safety<\/a>/g)].map((m) => m[1]);
    assert.deepEqual(links, ['/fasting-safety', '/fasting-safety']);
    assert.doesNotMatch(s6, /\u2014/);
  });
});
