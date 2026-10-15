import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

function read(name) {
  return readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
}

const FOOTERS = [
  'index.html',
  'plan-builder.html',
  'shop.html',
  'books.html',
  'papers.html',
  'paper.html',
  'apps.html',
  'metabolic-health.html',
  'loadline-solo.html',
  'loadline-365.html',
  'apps/walkingout/help/index.html',
  'tracker.html',
  'privacy.html',
];

describe('privacy policy', () => {
  const page = read('privacy.html');

  test('the page states the contact, the host, and the effective date', () => {
    assert.match(page, /LoadLine Fitness &amp; Wellness/);
    assert.match(page, /noexcusesjesse@gmail\.com/);
    assert.match(page, /Effective: \[pending\]/);
    assert.match(page, /do not have a mailing address/);
    assert.match(page, /hosted on Railway/);
    assert.match(page, /PostgreSQL/);
    assert.match(page, /before any vendor is added/);
    assert.match(page, /not for people under 18/);
    assert.match(page, /unsubscribe link/);
    assert.doesNotMatch(page, /SendGrid|gtag|Google Analytics|Plausible|Hotjar/);
    assert.doesNotMatch(page, /\b\d{1,5}\s+[A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)\b/);
  });

  test('the page lists what the forms collect and what stays in the browser', () => {
    assert.match(page, /marketing consent choice/);
    assert.match(page, /time you acknowledged the disclaimer/);
    assert.match(page, /18 or older/);
    assert.match(page, /source page, saved as plan-builder/);
    assert.match(page, /never sent to us/);
    assert.match(page, /Walkingout/);
    assert.match(page, /WalkQuest/);
    assert.match(page, /does not use an analytics product/);
    assert.match(page, /does not set analytics cookies/);
  });

  test('the route and the footer links point at /privacy', () => {
    assert.match(read('server.js'), /cleanPage\('\/privacy', 'privacy\.html'\)/);
    FOOTERS.forEach((file) => {
      assert.match(read(file), /href="\/privacy"/, file);
    });
  });
});
