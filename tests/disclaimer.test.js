import assert from 'node:assert/strict';
import { describe, test, before, after } from 'node:test';
import { app } from '../server.js';
import { DISCLAIMER_MD } from '../site-v5/disclaimer.js';
import { PAGES } from '../site-v5/pages.js';

let server, base;
before(async () => { server = app.listen(0); await new Promise(r => server.once('listening', r)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => server.close());

const text = (html) => html.replace(/<\/?(p|li|ul|h\d|section|div|article|main|header|footer|nav)\b[^>]*>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const plain = (md) => md.replace(/^#+ |^- \[ \] |^- /gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|\*/g, '').replace(/\s+/g, ' ').trim();

describe('/disclaimer', () => {
  test('renders the program disclaimer copy verbatim and stays noindex', async () => {
    const r = await fetch(base + '/disclaimer');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('x-robots-tag') || '', /noindex/);
    const html = await r.text();
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.equal(PAGES['/disclaimer'].noindex, true);
    const body = text(html);
    for (const block of DISCLAIMER_MD.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b && b !== '---')) {
      for (const line of block.split('\n')) assert.ok(body.includes(plain(line)), `missing: ${plain(line).slice(0, 80)}`);
    }
    assert.doesNotMatch(html, /Outline only; not the final text/);
  });
  test('Section 9 [COUNSEL] placeholder is a visible callout, not hidden', async () => {
    const html = await (await fetch(base + '/disclaimer')).text();
    const s9 = html.slice(html.indexOf('9. Limitation of Liability'), html.indexOf('10. Changes'));
    assert.match(s9, /class="pending" role="note"/);
    assert.match(s9, /Pending attorney wording/);
    assert.match(s9, /\[COUNSEL: Limitation of liability and release language\./);
  });
});
