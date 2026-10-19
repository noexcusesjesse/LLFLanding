import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

function read(name) {
  return readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
}

describe('barefoot shoes paper', () => {
  const page = read('papers/barefoot-shoes.html');
  const list = read('papers/papers.js');
  const index = read('papers.html');
  const server = read('server.js');

  test('the article uses the title, the meta description, and the reviewer wording', () => {
    assert.match(page, /<title>Barefoot Shoes: A No Excuses Guide to Stronger Feet \| LoadLine Fitness<\/title>/);
    assert.match(page, /<h1[^>]*>Barefoot Shoes: A No Excuses Guide to Stronger Feet<\/h1>/);
    assert.match(page, /content="Learn what barefoot shoes are, which options fit your budget, and how to transition slowly so your feet can get stronger over time instead of sore\."/);
    assert.match(page, /where the heel and forefoot sit level, so you stand and move closer to how you would barefoot/);
    assert.match(page, /asks your feet to do more of the work/);
    assert.doesNotMatch(page, /makes your feet do more of the work/);
    assert.match(page, /<em>Prices as listed in October 2026; they change often\.<\/em>/);
    assert.match(page, /built for lifting and gym training/);
    assert.doesNotMatch(page, /CrossFit/);
    assert.match(page, /Check with your doctor or a podiatrist first if you have diabetes, neuropathy or numbness in your feet, poor circulation, a current foot or Achilles injury, or you've been told you need orthotics\./);
    assert.match(page, /Expect mild soreness that fades within a day or two\. It is normal while your feet adapt to life without built-in arch support\./);
    assert.match(page, /Stop and get checked if you have swelling, numbness, or pain on the top of your foot that gets worse with walking\./);
    assert.match(page, /This article is general education, not medical advice\./);
    assert.doesNotMatch(page, /Wellness/);
    assert.doesNotMatch(page, /Affiliate disclosure: This page contains an affiliate link/);
  });

  test('the shop control is a sponsored affiliate link with the disclosure above it', () => {
    const disclosure = page.indexOf('Heads up: the link below is an affiliate link. As an Amazon Associate, LoadLine Fitness earns from qualifying purchases at no extra cost to you.');
    const button = page.indexOf('Shop barefoot shoes here');
    assert.ok(disclosure !== -1 && button !== -1 && disclosure < button);
    assert.equal(page.split('Heads up: the link below is an affiliate link.').length, 2);
    assert.match(page, /href="https:\/\/amzn\.to\/4k5Ohzy" target="_blank" rel="sponsored noopener noreferrer"/);
  });

  test('the coach line links to the consultation CTA', () => {
    assert.match(page, /href="\/#consultation">Talk to a LoadLine virtual coach and get started today\./);
  });

  test('the papers index lists it first and the server serves the article with the nav', () => {
    const barefoot = list.indexOf("slug: 'barefoot-shoes'");
    const losing = list.indexOf("slug: 'losing-weight-vs-losing-fat'");
    assert.ok(barefoot !== -1 && losing !== -1 && barefoot < losing);
    assert.match(list, /date: '2026-10-19'/);
    assert.match(list, /html: 'papers\/barefoot-shoes\.html'/);
    assert.match(index, /datetime="2026-10-19">October 19, 2026/);
    assert.match(index, /href="papers\/barefoot-shoes\.html"/);
    assert.match(index, /paper\.html \|\| \('paper\.html\?p='/);
    assert.match(server, /sendHtml\(res, `papers\/\$\{slug\}\.html`\)/);
  });
});
