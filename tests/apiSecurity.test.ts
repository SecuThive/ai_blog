import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiKeyValid } from '../src/lib/apiKey.ts';
import { parsePostUpdate } from '../src/lib/postUpdate.ts';

const KEY = 'k'.repeat(32);
const h = (v?: string) => new Headers(v === undefined ? {} : { 'x-api-key': v });

test('api key: exact match only; unset, short, empty and missing never pass', () => {
  assert.equal(apiKeyValid(h(KEY), KEY), true);
  assert.equal(apiKeyValid(h(KEY + 'x'), KEY), false);
  assert.equal(apiKeyValid(h('wrong'), KEY), false);
  assert.equal(apiKeyValid(h(), KEY), false);
  assert.equal(apiKeyValid(h(''), ''), false);
  assert.equal(apiKeyValid(h(), undefined), false);
  assert.equal(apiKeyValid(h('short'), 'short'), false);
});
test('post update: only allow-listed columns pass', () => {
  const r = parsePostUpdate({ title: 'T', content: 'C', tags: ['a'], status: 'draft' });
  assert.equal(r.ok, true);
  for (const bad of ['slug', 'id', 'views', 'published_at', 'updated_at', 'reviewed_at', 'created_at', 'helpful_count', 'role']) {
    const x = parsePostUpdate({ title: 'T', [bad]: 'x' });
    assert.equal(x.ok, false, bad);
  }
});
test('post update: publishing control fields are accepted but never stored as columns', () => {
  const r = parsePostUpdate({ status: 'published', approval_confirmed: true, reviewed_by: 'editor' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(Object.keys(r.update), ['status']);
});
test('post update: type and size validation', () => {
  assert.equal(parsePostUpdate(null).ok, false);
  assert.equal(parsePostUpdate([]).ok, false);
  assert.equal(parsePostUpdate({ status: 'archived' }).ok, false);
  assert.equal(parsePostUpdate({ tags: 'a' }).ok, false);
  assert.equal(parsePostUpdate({ tags: [1] }).ok, false);
  assert.equal(parsePostUpdate({ title: '' }).ok, false);
  assert.equal(parsePostUpdate({ title: 'a'.repeat(301) }).ok, false);
  assert.equal(parsePostUpdate({ title: 5 }).ok, false);
  assert.equal(parsePostUpdate({ content_evidence: 'x' }).ok, false);
  assert.equal(parsePostUpdate({ title_en: null }).ok, true);
});
