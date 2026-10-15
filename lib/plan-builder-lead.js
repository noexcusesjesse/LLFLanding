/**
 * Plan Builder leads stored through POST /api/leads.
 * Accepts only name, email, marketing consent, the disclaimer timestamp,
 * 18+ confirmation, and the source tag. Body metrics are rejected.
 */

export const PLAN_BUILDER_LEAD_KEYS = [
  'name',
  'email',
  'marketingConsent',
  'disclaimerAcknowledgedAt',
  'age18Confirmed',
  'source',
];

const ALLOWED = new Set(PLAN_BUILDER_LEAD_KEYS);

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;

export function planBuilderLeadError(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Invalid lead.';
  const extra = Object.keys(body).filter((key) => !ALLOWED.has(key));
  if (extra.length) return 'This form only accepts your name, email, and consent.';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100 || /[\r\n]/.test(name)) return 'Enter your first name.';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return 'Enter a valid email.';
  if (body.age18Confirmed !== true) return 'Confirm that you are 18 or older.';
  if (typeof body.disclaimerAcknowledgedAt !== 'string' || !TIMESTAMP.test(body.disclaimerAcknowledgedAt)) {
    return 'Disclaimer acknowledgment is required.';
  }
  if (body.marketingConsent !== true && body.marketingConsent !== false) {
    return 'Marketing consent must be true or false.';
  }
  if (body.source !== 'plan-builder') return 'Invalid source.';
  return null;
}

export function planBuilderLeadRecord(body) {
  const name = String(body.name).trim().replace(/[\r\n]+/g, ' ');
  const email = String(body.email).trim();
  const consent = body.marketingConsent === true;
  const acknowledged = String(body.disclaimerAcknowledgedAt).trim();
  return {
    type: 'plan-builder',
    name,
    email,
    phone: null,
    message: [
      'Source: plan-builder',
      `Marketing consent: ${consent ? 'yes' : 'no'}`,
      '18 or older: yes',
      `Disclaimer acknowledged: ${acknowledged}`,
    ].join('\n'),
  };
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[character]));
}
