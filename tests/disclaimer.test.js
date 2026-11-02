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
  test('effective date and Sections 7, 9, 10 are final copy, with no review notes', async () => {
    const html = await (await fetch(base + '/disclaimer')).text();
    const body = text(html);
    assert.ok(body.includes('Effective date: November 1, 2026 · Version 2.2'));
    const s9 = text(html.slice(html.indexOf('9. Limitation of Liability'), html.indexOf('10. Changes')));
    assert.ok(s9.includes('To the fullest extent allowed by law, LoadLine Fitness'));
    assert.ok(s9.includes('they apply only to the extent that law allows'));
    const s10 = text(html.slice(html.indexOf('10. Changes'), html.indexOf('11. Contact')));
    assert.ok(s10.includes('we will post the updated version on this page with a new effective date'));
    const s7 = text(html.slice(html.indexOf('7. Assumption of Risk'), html.indexOf('8. Your Information')));
    assert.ok(s7.includes('you take part at your own risk.'));
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    assert.ok(main.length > 0);
    assert.doesNotMatch(text(main), /counsel|attorney|pending|being finalized|draft|coach|& Wellness|\[JESSE|\u2014/i);
    assert.doesNotMatch(main, /<!--|class="pending"/);
  });
  test('does not link the unpublished /intake-privacy page and stays out of the sitemap', async () => {
    const html = await (await fetch(base + '/disclaimer')).text();
    assert.doesNotMatch(html, /href="[^"]*intake-privacy/);
    assert.ok(text(html).includes('LoadLine Intake Privacy Notice'));
    const sm = await (await fetch(base + '/sitemap.xml')).text();
    assert.doesNotMatch(sm, /\/disclaimer</);
  });
});
