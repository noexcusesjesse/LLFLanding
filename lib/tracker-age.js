/**
 * 18+ confirmation for tracker signup and access requests.
 * Matches the Plan Builder rule: the field must be exactly true.
 */

export function age18ConfirmedError(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.age18Confirmed !== true) {
    return 'Confirm that you are 18 or older.';
  }
  return null;
}
