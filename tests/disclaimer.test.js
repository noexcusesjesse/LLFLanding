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
    assert.ok(body.includes('Effective date: November 2, 2026 · Version 2.3'));
    assert.ok(!body.includes('Version 2.2'));
    const s9 = text(html.slice(html.indexOf('9. Limitation of Liability'), html.indexOf('10. Changes')));
    assert.ok(s9.includes('To the fullest extent allowed by law, LoadLine Fitness'));
    assert.ok(s9.includes('they apply only to the extent that law allows'));
    assert.ok(s9.includes('This does not limit liability for our gross negligence or willful misconduct.'));
    assert.ok(s9.indexOf('consequential damages.') < s9.indexOf('This does not limit liability') && s9.indexOf('This does not limit liability') < s9.indexOf('If the law where you live'));
    const s10 = text(html.slice(html.indexOf('10. Changes'), html.indexOf('11. Contact')));
    assert.ok(s10.includes('We may update this disclaimer from time to time. We will post the updated version on this page with a new effective date. If we make a material change, we will tell you by email or in the program and ask you to review and accept the updated version before you continue. Until you accept, the version you last agreed to still applies. Any update applies only going forward, not to anything that happened before its effective date.'));
    assert.doesNotMatch(s10, /keep using|Changes apply from the effective date shown/);
    const s7 = text(html.slice(html.indexOf('7. Assumption of Risk'), html.indexOf('8. Your Information')));
    assert.ok(s7.includes('You choose how and when to take part, and you agree to stop if something feels wrong. If you have chest pain or pressure, fainting, severe shortness of breath, or sudden dizziness, stop right away and call 911. You take part at your own risk.'));
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
