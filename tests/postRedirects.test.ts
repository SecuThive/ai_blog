// node --test --experimental-strip-types tests/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST_REDIRECTS, postRedirectPath } from '../src/lib/postRedirects.ts';

test('no redirect target is itself a redirect key (single hop)', () => {
  for (const [from, to] of Object.entries(POST_REDIRECTS)) {
    assert.notEqual(from, to, `self redirect: ${from}`);
    if (!to.startsWith('/')) assert.ok(!Object.hasOwn(POST_REDIRECTS, to), `chain: ${from} -> ${to} -> ${POST_REDIRECTS[to]}`);
  }
});

test('path targets are internal paths without locale prefix', () => {
  for (const to of Object.values(POST_REDIRECTS)) {
    if (!to.startsWith('/')) continue;
    assert.ok(!to.startsWith('//') && !/^\/(en|ko)(\/|$)/.test(to), `bad path target: ${to}`);
  }
});

test('postRedirectPath encodes slugs and keeps paths', () => {
  assert.equal(postRedirectPath('a-b'), '/blog/a-b');
  assert.equal(postRedirectPath('한글'), `/blog/${encodeURIComponent('한글')}`);
  assert.equal(postRedirectPath('/engineer/x'), '/engineer/x');
});
