import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  BOARD_SENTENCE,
  FORMATION_SENTENCE,
  HOSTING_LINE,
  ruckDeleteError,
  ruckInterestError,
  ruckInterestRecord,
  ruckNoticeHtml,
} from '../lib/ruck-interest.js';

function read(name) {
  return readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
}

const PAGES = ['ruck/index.html', 'ruck/privacy.html'];

const BANNED = [
  /powered by/i,
  /donate/i,
  /tax-deductible/i,
  /tax deductible/i,
  /tax-exempt/i,
  /tax exempt/i,
  /raffle/i,
  /sweepstakes/i,
];

describe('R.U.C.K. Foundation pages', () => {
  test('both pages stay out of search results and use the foundation footer', () => {
    for (const file of PAGES) {
      const html = read(file);
      assert.match(html, /<meta name="robots" content="noindex, nofollow">/, file);
      assert.match(html, /R\.U\.C\.K\. Foundation \(in formation\)/, file);
      assert.match(html, new RegExp(HOSTING_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), file);
      for (const pattern of BANNED) assert.doesNotMatch(html, pattern, file);
    }
    assert.match(read('ruck/index.html'), /Talk to your doctor before starting a new exercise routine\./);
    const privacy = read('ruck/privacy.html');
    assert.equal(privacy.includes('Talk to your doctor'), false);
  });

  test('the public page does not promote LoadLine and the privacy page names it only to refuse sharing', () => {
    const page = read('ruck/index.html');
    const privacy = read('ruck/privacy.html');
    assert.equal(page.includes('LoadLine'), false);
    assert.equal(page.includes('No Excuses'), false);
    assert.equal(page.includes('loadline-fitness-logo'), false);
    assert.equal((privacy.match(/LoadLine/g) || []).length, 1);
    assert.match(privacy, /never shared with or used by LoadLine or No Excuses/);
    assert.equal(privacy.includes('Powered by'), false);
    assert.doesNotMatch(page + privacy, /SITE-NAV|nav-cta|Book Now/);
  });

  test('the required formation, board, safety, and working-name lines are present', () => {
    const page = read('ruck/index.html');
    assert.match(page, new RegExp(FORMATION_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(page, new RegExp(BOARD_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(page, /Call 911 first in an emergency\. Stop walking if you feel chest pain, faintness, or severe shortness of breath\./);
    assert.match(page, /G\.R\.I\.T\. \(working name\)/);
    assert.match(page, /Walking Wonderland \(working name\)/);
    assert.match(page, /Planned, not active/);
    assert.match(page, /Signal Butte Park/);
    assert.match(page, /Join the list to hear when we launch\./);
    assert.match(page, /5 volunteer seats/);
    assert.match(page, /href="\/ruck\/privacy"/);
    assert.match(read('ruck/privacy.html'), new RegExp(FORMATION_SENTENCE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('the interest form collects only name, email, ZIP, and the four interests', () => {
    const page = read('ruck/index.html');
    assert.match(page, /id="name"/);
    assert.match(page, /id="email"/);
    assert.match(page, /id="zip"/);
    for (const value of ['walks', 'board', 'scholarships', 'gear']) {
      assert.match(page, new RegExp(`name="interests" type="checkbox" value="${value}"`));
    }
    assert.equal(page.includes('<textarea'), false);
    assert.equal(page.includes('type="tel"'), false);
    assert.match(read('ruck/privacy.html'), /id="delete-form"/);
  });

  test('LoadLine pages and the nav do not link to the foundation', () => {
    assert.equal(read('partials/site-nav.js').includes('/ruck'), false);
    const htmlFiles = [];
    function walk(dir) {
      for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
        const path = `${dir}${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'ruck') continue;
          walk(`${path}/`);
        } else if (entry.name.endsWith('.html')) htmlFiles.push(path);
      }
    }
    walk('');
    for (const file of htmlFiles) {
      assert.equal(read(file).includes('/ruck'), false, file);
    }
    assert.equal(readdirSync(new URL('..', import.meta.url)).some((name) => /sitemap/i.test(name)), false);
  });

  test('the server stores foundation rows apart from leads', () => {
    const server = read('server.js');
    assert.match(server, /cleanPage\('\/ruck', 'ruck\/index\.html'\)/);
    assert.match(server, /cleanPage\('\/ruck\/privacy', 'ruck\/privacy\.html'\)/);
    assert.match(server, /CREATE TABLE IF NOT EXISTS ruck_interest/);
    const interestStart = server.indexOf("app.post('/api/ruck/interest'");
    const deleteStart = server.indexOf("app.post('/api/ruck/delete'");
    const interestHandler = server.slice(interestStart, deleteStart);
    assert.match(interestHandler, /INSERT INTO ruck_interest/);
    assert.doesNotMatch(interestHandler, /INSERT INTO leads|sendEmail|NOTIFY_EMAIL/);
    const deleteHandler = server.slice(deleteStart, server.indexOf('// Serve admin dashboard'));
    assert.match(deleteHandler, /DELETE FROM ruck_interest/);
    assert.doesNotMatch(deleteHandler, /INSERT INTO leads|sendEmail/);
    assert.match(server, /Foundation interest is not stored with leads/);
  });

  test('interest submissions reject health fields and keep only the four interests', () => {
    const valid = {
      name: 'Ada Walker',
      email: 'ada@example.com',
      zip: '85212',
      interests: ['gear', 'walks'],
    };
    assert.equal(ruckInterestError(valid), null);
    assert.deepEqual(ruckInterestRecord(valid).interests, ['walks', 'gear']);
    assert.match(ruckInterestError({ ...valid, weight: '180' }), /name, email, ZIP, and interests/);
    assert.match(ruckInterestError({ ...valid, interests: [] }), /at least one interest/);
    assert.match(ruckInterestError({ ...valid, interests: ['board', 'health'] }), /at least one interest/);
    assert.match(ruckInterestError({ ...valid, zip: 'Mesa' }), /ZIP code/);
    assert.equal(ruckDeleteError({ name: 'Ada Walker', email: 'ada@example.com' }), null);
    assert.match(ruckDeleteError({ name: 'Ada Walker', email: 'ada@example.com', zip: '85212' }), /name and email/);
  });

  test('the plain response page is also noindex and does not promote LoadLine', () => {
    const html = ruckNoticeHtml({ title: "You're on the list", message: "You're on the list. We'll be in touch when a program launches." });
    assert.match(html, /noindex, nofollow/);
    assert.equal(html.includes('LoadLine'), false);
    for (const pattern of BANNED) assert.doesNotMatch(html, pattern);
    assert.match(html, /loadlinefitness\.com/);
  });
});
