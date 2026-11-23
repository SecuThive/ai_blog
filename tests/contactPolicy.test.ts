import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, parseContact, clientIp, sameSiteOrigin } from '../src/lib/contactPolicy.ts';

const ok = { name: '홍길동', email: 'A@Example.com ', type: 'general', company: '', message: '안녕하세요', privacy_consent: true };

test('valid input is normalized', () => {
  const r = parseContact(ok);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.email, 'a@example.com');
});
test('missing fields, consent, bad email and overlong values are rejected', () => {
  assert.equal(parseContact({ ...ok, privacy_consent: false }).ok, false);
  assert.equal(parseContact({ ...ok, name: '  ' }).ok, false);
  assert.equal(parseContact({ ...ok, email: 'x@' }).ok, false);
  assert.equal(parseContact({ ...ok, email: 'a b@example.com' }).ok, false);
  assert.equal(parseContact({ ...ok, message: 'a'.repeat(5001) }).ok, false);
  assert.equal(parseContact({ ...ok, name: 'a'.repeat(101) }).ok, false);
  assert.equal(parseContact(null).ok, false);
  assert.equal(parseContact({ ...ok, name: 123 }).ok, false);
});
test('control characters are stripped (header injection)', () => {
  const r = parseContact({ ...ok, name: 'a\u0000b', type: 'x\u001by' });
  assert.equal(r.ok && r.value.name, 'ab');
  assert.equal(r.ok && r.value.type, 'xy');
});
test('rate limiter blocks after the limit and recovers after the window', () => {
  const allow = createRateLimiter(2, 1000);
  assert.equal(allow('ip', 0), true);
  assert.equal(allow('ip', 10), true);
  assert.equal(allow('ip', 20), false);
  assert.equal(allow('other', 20), true);
  assert.equal(allow('ip', 1100), true);
});
test('client ip prefers cloudflare header', () => {
  assert.equal(clientIp(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })), '1.1.1.1');
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' })), '2.2.2.2');
  assert.equal(clientIp(new Headers()), 'unknown');
});
test('same-site origin check compares host only, works behind http tunnel', () => {
  assert.equal(sameSiteOrigin(new Headers({ origin: 'https://www.thivelab.com', host: 'www.thivelab.com' })), true);
  assert.equal(sameSiteOrigin(new Headers({ origin: 'https://www.thivelab.com', host: 'www.thivelab.com', 'x-forwarded-proto': 'https' })), true);
  assert.equal(sameSiteOrigin(new Headers({ origin: 'https://evil.test', host: 'www.thivelab.com' })), false);
  assert.equal(sameSiteOrigin(new Headers({ origin: 'https://www.thivelab.com.evil.test', host: 'www.thivelab.com' })), false);
  assert.equal(sameSiteOrigin(new Headers({ host: 'www.thivelab.com' })), false);
  assert.equal(sameSiteOrigin(new Headers({ origin: 'null', host: 'www.thivelab.com' })), false);
});
