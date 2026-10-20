import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, test } from 'node:test';
import { app } from '../server.js';
import {
  BOARD_SENTENCE,
  CUSTODY_SENTENCE,
  DATA_USE_PARAGRAPH,
  DELETION_HANDLING_SENTENCE,
  DELETION_REQUEST_CONFIRMATION,
  FORMATION_SENTENCE,
  HOSTING_LINE,
  UNFORMED_DELETION_SENTENCE,
  logRuckDeletionRequest,
  ruckDeletionRequestError,
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
  test('both pages are indexable and use the foundation footer', () => {
    for (const file of PAGES) {
      const html = read(file);
      assert.doesNotMatch(html, /noindex|nofollow/i, file);
      assert.doesNotMatch(html, /<meta[^>]*name="robots"/i, file);
      assert.match(html, /R\.U\.C\.K\. Foundation \(in formation\)/, file);
      assert.match(html, new RegExp(HOSTING_LINE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), file);
      for (const pattern of BANNED) assert.doesNotMatch(html, pattern, file);
    }
    const robotsPath = new URL('../robots.txt', import.meta.url);
    if (existsSync(robotsPath)) {
      assert.doesNotMatch(readFileSync(robotsPath, 'utf8'), /disallow:\s*\/ruck/i);
    }
    assert.doesNotMatch(read('server.js'), /X-Robots-Tag/i);
    for (const file of PAGES) {
      const html = read(file);
      assert.match(html, /<meta name="theme-color" content="#1B2A4A">/, file);
      assert.match(html, /href="\/ruck\/icons\/favicon\.ico"/, file);
      assert.match(html, /href="\/ruck\/icons\/favicon\.svg"/, file);
      assert.match(html, /href="\/ruck\/icons\/apple-touch-icon\.png"/, file);
      assert.equal(html.includes('assets/icons/favicon'), false, file);
    }
    assert.match(read('index.html'), /href="assets\/icons\/favicon\.ico"/);
    const ico = readFileSync(new URL('../ruck/icons/favicon.ico', import.meta.url));
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    assert.equal(ico.readUInt16LE(4), 3);
    assert.match(read('ruck/index.html'), /Talk to your doctor before starting a new exercise routine\./);
    const privacy = read('ruck/privacy.html');
    assert.equal(privacy.includes('Talk to your doctor'), false);
  });

  test('the public page does not promote LoadLine and the privacy page uses the hosting explanation', () => {
    const page = read('ruck/index.html');
    const privacy = read('ruck/privacy.html');
    assert.equal(page.includes('LoadLine'), false);
    assert.equal(page.includes('No Excuses'), false);
    assert.equal(page.includes('loadline-fitness-logo'), false);
    assert.equal((privacy.match(/LoadLine/g) || []).length, 2);
    assert.equal(privacy.includes(DATA_USE_PARAGRAPH), true);
    assert.equal(privacy.includes(CUSTODY_SENTENCE), true);
    assert.equal(privacy.includes(UNFORMED_DELETION_SENTENCE), true);
    assert.equal(privacy.includes(DELETION_HANDLING_SENTENCE), true);
    assert.equal(privacy.includes('Powered by'), false);
    assert.doesNotMatch(page + privacy, /SITE-NAV|nav-cta|Book Now/);
    assert.match(page, /Free and paid community walks are planned\./);
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
    assert.match(page, /Lace up\. Rise up\. Keep walking\./);
    assert.match(page, /R\.U\.C\.K\. = Rise Up, Connect, Keep walking\./);
    assert.match(page, /alt="R\.U\.C\.K\. Foundation logo"/);
    assert.match(read('ruck/privacy.html'), /alt="R\.U\.C\.K\. Foundation logo"/);
    assert.equal(page.includes('brand-ruck'), false);
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
    const privacy = read('ruck/privacy.html');
    assert.match(privacy, /id="delete-form"/);
    assert.match(privacy, /action="\/api\/ruck\/deletion-request"/);
    assert.equal(privacy.includes('/api/ruck/delete'), false);
    assert.equal(privacy.includes('name="zip"'), false);
    const script = read('ruck/ruck.js');
    assert.equal(script.includes(DELETION_REQUEST_CONFIRMATION), true);
    assert.equal(script.includes('/api/ruck/delete'), false);
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
    assert.match(server, /CREATE TABLE IF NOT EXISTS ruck_deletion_requests \([\s\S]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/);
    const interestStart = server.indexOf("app.post('/api/ruck/interest'");
    const requestStart = server.indexOf("app.post('/api/ruck/deletion-request'");
    const interestHandler = server.slice(interestStart, requestStart);
    assert.match(interestHandler, /INSERT INTO ruck_interest/);
    assert.doesNotMatch(interestHandler, /INSERT INTO leads|sendEmail|NOTIFY_EMAIL/);
    const requestHandler = server.slice(requestStart, server.indexOf('// Serve admin dashboard'));
    assert.match(requestHandler, /logRuckDeletionRequest/);
    assert.match(requestHandler, /DELETION_REQUEST_CONFIRMATION/);
    assert.equal(DELETION_REQUEST_CONFIRMATION, "We received your request. Jesse will confirm it's you and delete your information within 30 days.");
    assert.doesNotMatch(requestHandler, /DELETE FROM|INSERT INTO leads|sendEmail|NOTIFY_EMAIL/);
    assert.equal(server.includes("app.post('/api/ruck/delete'"), false);
    assert.match(server, /Foundation interest is not stored with leads/);
  });

  test('public copy does not name the interest table', () => {
    for (const file of [...PAGES, 'ruck/ruck.js']) {
      assert.equal(read(file).includes('ruck_interest'), false, file);
    }
    const html = ruckNoticeHtml({ title: 'Received', message: DELETION_REQUEST_CONFIRMATION });
    assert.equal(html.includes('ruck_interest'), false);
  });

  test('a deletion request is logged with a timestamp and does not email or touch leads', async () => {
    const calls = [];
    await logRuckDeletionRequest(async (sql, params) => {
      calls.push({ sql, params });
    }, { name: 'Ada Walker', email: 'ada@example.com' });
    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /INSERT INTO ruck_deletion_requests \(name, email, created_at\)/);
    assert.match(calls[0].sql, /CURRENT_TIMESTAMP/);
    assert.deepEqual(calls[0].params, ['Ada Walker', 'ada@example.com']);
    assert.doesNotMatch(calls[0].sql, /DELETE|leads|sendEmail/);
  });

  test('POST /api/ruck/delete returns 404', async () => {
    const server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}/api/ruck/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: 'Ada Walker', email: 'ada@example.com' }),
      });
      assert.equal(response.status, 404);
    } finally {
      await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    }
  });

  test('the lead dashboard and lead endpoints never read foundation tables', () => {
    const server = read('server.js');
    const admin = read('admin.html');
    const leadsGet = server.slice(server.indexOf("app.get('/api/leads'"), server.indexOf("app.patch('/api/leads/:id'"));
    const leadsPatch = server.slice(server.indexOf("app.patch('/api/leads/:id'"), server.indexOf('function authenticateAdmin'));
    const leadsPost = server.slice(server.indexOf("app.post('/api/leads'"), server.indexOf("app.get('/api/leads'"));
    for (const source of [leadsGet, leadsPatch, admin]) {
      assert.equal(source.includes('ruck_interest'), false);
      assert.equal(source.includes('ruck_deletion_requests'), false);
    }
    assert.match(leadsGet, /SELECT \* FROM leads/);
    assert.match(leadsPatch, /UPDATE leads SET/);
    assert.match(leadsPost, /ruck_deletion_requests/);
    assert.match(leadsPost, /Foundation interest is not stored with leads/);
    assert.equal(server.includes('/api/leads/export'), false);
    assert.equal(admin.includes('text/csv'), false);
    assert.equal(admin.toLowerCase().includes('export'), false);
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
    assert.equal(ruckDeletionRequestError({ name: 'Ada Walker', email: 'ada@example.com' }), null);
    assert.match(ruckDeletionRequestError({ name: 'Ada Walker', email: 'ada@example.com', zip: '85212' }), /name and email/);
  });

  test('the plain response page is also noindex and does not promote LoadLine', () => {
    const html = ruckNoticeHtml({ title: "You're on the list", message: "You're on the list. We'll be in touch when a program launches." });
    assert.match(html, /noindex, nofollow/);
    assert.equal(html.includes('LoadLine'), false);
    for (const pattern of BANNED) assert.doesNotMatch(html, pattern);
    assert.match(html, /loadlinefitness\.com/);
  });
});
