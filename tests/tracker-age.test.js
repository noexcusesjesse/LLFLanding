import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { age18ConfirmedError } from '../lib/tracker-age.js';

function read(name) {
  return readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
}

describe('tracker 18+ confirmation', () => {
  test('only an explicit true confirmation is accepted', () => {
    assert.equal(age18ConfirmedError({ age18Confirmed: true }), null);
    for (const body of [undefined, null, {}, { age18Confirmed: false }, { age18Confirmed: 'true' }, []]) {
      assert.match(age18ConfirmedError(body) || '', /Confirm that you are 18 or older/);
    }
  });

  test('the access request form requires the checkbox and sends it', () => {
    const html = read('tracker.html');
    const client = read('tracker.js');
    assert.match(html, /<label class="disclaimer-check" id="req-age18-label" for="reqAge18">/);
    assert.match(html, /<input type="checkbox" id="reqAge18" name="age18">/);
    assert.match(html, /I am 18 or older/);
    assert.match(client, /Confirm that you are 18 or older\./);
    assert.match(client, /age18Confirmed: true/);
    assert.match(client, /if \(!age18Confirmed\)/);
  });

  test('tracker signup requires the same confirmation on the client and the server', () => {
    const admin = read('tracker-admin.html');
    const server = read('server.js');
    assert.match(admin, /<label class="age-check" id="new-age18-label" for="newAge18">/);
    assert.match(admin, /<input type="checkbox" id="newAge18" name="age18">/);
    assert.match(admin, /I am 18 or older/);
    assert.match(admin, /age18Confirmed: true/);
    assert.match(admin, /Confirm that you are 18 or older\./);
    assert.match(server, /age18ConfirmedError\(req\.body\)/);
    assert.equal(server.split('age18ConfirmedError(req.body)').length - 1, 3);
  });
});
