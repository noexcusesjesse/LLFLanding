/**
 * R.U.C.K. Foundation interest list.
 * Stored in ruck_interest, never in the leads table.
 */

export const RUCK_INTERESTS = ['walks', 'board', 'scholarships', 'gear'];

export const FORMATION_SENTENCE = 'The R.U.C.K. Foundation is being formed as an Arizona nonprofit. 501(c)(3) status has not been applied for or granted.';

export const BOARD_SENTENCE = 'Board seats are volunteer. Reasonable, approved expenses are reimbursed. Board pay may be considered in the future, subject to legal and financial review.';

export const HOSTING_LINE = "Temporarily hosted on loadlinefitness.com until the foundation's own site launches.";

const INTEREST_KEYS = new Set(['name', 'email', 'zip', 'interests']);
const DELETE_KEYS = new Set(['name', 'email']);
const INTEREST_IDS = new Set(RUCK_INTERESTS);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP = /^\d{5}(?:-\d{4})?$/;

function asObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body;
}

function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\r\n]+/g, ' ');
}

function cleanEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function extraKeys(body, allowed) {
  return Object.keys(body).filter((key) => !allowed.has(key));
}

export function ruckInterestError(body) {
  const record = asObject(body);
  if (!record) return 'Invalid submission.';
  if (extraKeys(record, INTEREST_KEYS).length) {
    return 'This form only accepts name, email, ZIP, and interests.';
  }
  const name = cleanName(record.name);
  if (!name || name.length > 100) return 'Enter your name.';
  const email = cleanEmail(record.email);
  if (!EMAIL.test(email) || email.length > 255) return 'Enter a valid email.';
  const zip = typeof record.zip === 'string' ? record.zip.trim() : '';
  if (!ZIP.test(zip)) return 'Enter a 5-digit ZIP code.';
  const raw = record.interests;
  const values = Array.isArray(raw) ? raw : (raw == null || raw === '' ? [] : [raw]);
  if (!values.length || values.some((item) => typeof item !== 'string' || !INTEREST_IDS.has(item))) {
    return 'Choose at least one interest.';
  }
  if (new Set(values).size !== values.length) return 'Choose at least one interest.';
  return null;
}

export function ruckInterestRecord(body) {
  const selected = new Set(Array.isArray(body.interests) ? body.interests : [body.interests]);
  return {
    name: cleanName(body.name),
    email: cleanEmail(body.email),
    zip: body.zip.trim(),
    interests: RUCK_INTERESTS.filter((id) => selected.has(id)),
  };
}

export function ruckDeleteError(body) {
  const record = asObject(body);
  if (!record) return 'Invalid submission.';
  if (extraKeys(record, DELETE_KEYS).length) return 'This form only accepts name and email.';
  const name = cleanName(record.name);
  if (!name || name.length > 100) return 'Enter your name.';
  const email = cleanEmail(record.email);
  if (!EMAIL.test(email) || email.length > 255) return 'Enter a valid email.';
  return null;
}

export function ruckDeleteRecord(body) {
  return {
    name: cleanName(body.name),
    email: cleanEmail(body.email),
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[character]));
}

export function ruckNoticeHtml({ title, message }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} | R.U.C.K. Foundation</title>
  <link rel="stylesheet" href="/ruck/ruck.css">
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/ruck">R.U.C.K. Foundation</a>
      <p class="formation-flag">In formation</p>
    </div>
  </header>
  <main id="content" class="wrap">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="/ruck">Back to the foundation page</a></p>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <p>R.U.C.K. Foundation (in formation)</p>
      <p>${escapeHtml(HOSTING_LINE)}</p>
    </div>
  </footer>
</body>
</html>`;
}
