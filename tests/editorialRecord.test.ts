// node --test --experimental-strip-types tests/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readEditorialRecord, hasVerificationRecord, substantiveUpdate } from '../src/lib/editorialRecord.ts';
import { HISTORICAL_POST_SLUGS, historicalNote } from '../src/lib/historicalPosts.ts';

test('translation-only content_evidence yields no record, no badge, no update date', () => {
  const r = readEditorialRecord({ en: { title: 'x', content: 'y' } });
  assert.equal(hasVerificationRecord(r), false);
  assert.equal(substantiveUpdate(r, '2026-05-31T17:09:02Z'), null);
  assert.deepEqual(r.sources, []);
});

test('null / malformed evidence is safe', () => {
  for (const ev of [null, undefined, 'str', 42, [], { verifiedAt: 'yesterday', officialSources: 'x' }]) {
    const r = readEditorialRecord(ev);
    assert.equal(hasVerificationRecord(r), false);
    assert.equal(r.verifiedAt, null);
  }
});

test('badge requires verifiedAt + reviewScope + at least one https source', () => {
  const base = { verifiedAt: '2026-10-02', reviewScope: 'announcement dates only' };
  assert.equal(hasVerificationRecord(readEditorialRecord(base)), false);
  assert.equal(hasVerificationRecord(readEditorialRecord({ ...base, officialSources: [{ label: 'a', url: 'http://insecure.example' }] })), false);
  assert.equal(hasVerificationRecord(readEditorialRecord({ ...base, officialSources: [{ label: 'a', url: 'https://openai.com/index/hello-gpt-4o/' }] })), true);
  assert.equal(hasVerificationRecord(readEditorialRecord({ verifiedAt: '2026-10-02', officialSources: [{ label: 'a', url: 'https://a.example' }] })), false);
});

test('update date needs contentUpdatedAt AND changeSummary, and must be after publish', () => {
  const pub = '2026-05-31T17:09:02Z';
  assert.equal(substantiveUpdate(readEditorialRecord({ contentUpdatedAt: '2026-10-02' }), pub), null);
  assert.equal(substantiveUpdate(readEditorialRecord({ contentUpdatedAt: '2026-10-02', changeSummary: 'reframed' }), pub), '2026-10-02');
  assert.equal(substantiveUpdate(readEditorialRecord({ contentUpdatedAt: '2026-05-01', changeSummary: 'x' }), pub), null);
  // verifiedAt alone never becomes an "updated" date
  assert.equal(substantiveUpdate(readEditorialRecord({ verifiedAt: '2026-10-02', changeSummary: 'x' }), pub), null);
});

test('historical list contains the 2024 LLM post and links to current sources', () => {
  const slug = '2024년-llm-모델-선택-가이드-gpt-4o부터-claude-35까지-산업별-최적-ai-엔진-고르는-법';
  assert.ok(HISTORICAL_POST_SLUGS.has(slug));
  const note = historicalNote(slug);
  assert.equal(note?.asOf, '2024');
  assert.ok(note && note.currentSources.length > 0 && note.currentSources.every(s => s.url.startsWith('https://')));
});
