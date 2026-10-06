import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const { createUnsubscribeToken, verifyUnsubscribeToken, unsubscribeHref } = await import('../src/lib/unsubscribeToken.ts');

test('round-trips a subscriber id', () => {
  const t = createUnsubscribeToken(42);
  assert.ok(t && t.startsWith('42.'));
  assert.equal(verifyUnsubscribeToken(t), 42);
});

test('rejects tampered id or signature and raw emails', () => {
  const t = createUnsubscribeToken(42)!;
  assert.equal(verifyUnsubscribeToken(t.replace(/^42\./, '43.')), null);
  assert.equal(verifyUnsubscribeToken(t.slice(0, -1) + (t.endsWith('A') ? 'B' : 'A')), null);
  assert.equal(verifyUnsubscribeToken('someone@example.com'), null);
  assert.equal(verifyUnsubscribeToken(undefined), null);
});

test('link never contains the email', () => {
  assert.match(unsubscribeHref(7), /\/unsubscribe\?t=7\./);
});
