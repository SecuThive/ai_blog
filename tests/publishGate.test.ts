// Guards the editorial approval gate (docs/adsense-audit/pipeline.md):
// scripts that write to the DB must not publish directly or pre-date published_at.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCRIPT_DIR = join(ROOT, 'scripts');
// Report-only scripts that build CSV rows (no DB writes) may contain the literal.
const REPORT_ONLY = new Set(['score-content-quality.mjs']);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(mjs|js|ts|cjs)$/.test(name) ? [p] : [];
  });
}

const scripts = walk(SCRIPT_DIR).filter((p) => !REPORT_ONLY.has(p.split('/').pop()!));

test('no script writes status: "published" directly', () => {
  const offenders = scripts.filter((p) => /status\s*:\s*['"]published['"]/.test(readFileSync(p, 'utf8')));
  assert.deepEqual(offenders.map((p) => p.slice(ROOT.length)), []);
});

test('insert scripts do not copy a preset published_at into the insert payload', () => {
  // Only insert/upsert scripts; backup/report rows built with .push(...) are fine.
  const offenders = scripts.filter((p) => {
    const src = readFileSync(p, 'utf8');
    if (!/\.(insert|upsert)\(/.test(src)) return false;
    return src.split('\n').some((line) => !line.includes('.push(') && /published_at\s*:\s*(p|ep|g|post)\.published_at/.test(line));
  });
  assert.deepEqual(offenders.map((p) => p.slice(ROOT.length)), []);
});

test('phase-2 SQL installs the publish gate on posts and engineer_guides without COMMIT', () => {
  const sql = readFileSync(join(ROOT, 'docs/adsense-audit/sql/2026-10-03-phase2-triggers.sql'), 'utf8');
  assert.match(sql, /CREATE TRIGGER posts_enforce_review_before_publish/);
  assert.match(sql, /CREATE TRIGGER engineer_guides_enforce_review_before_publish/);
  assert.match(sql, /ALTER COLUMN status SET DEFAULT 'draft'/);
  // Translation-only edits (content_evidence.en, i18n.* tags) must not bump updated_at.
  assert.match(sql, /content_evidence, '\{\}'::jsonb\) - 'en'/);
  assert.match(sql, /not like 'i18n\.%'/);
  assert.doesNotMatch(sql.replace(/--.*$/gm, ''), /\bCOMMIT\b/i);
});

test('publish gate never assigns status/published_at and has a DB regression script', () => {
  const sql = readFileSync(join(ROOT, 'docs/adsense-audit/sql/2026-10-03-phase2-triggers.sql'), 'utf8');
  const code = sql.replace(/--.*$/gm, '');
  // The gate may only raise; it must never unpublish (or publish) a row by itself.
  assert.doesNotMatch(code, /new\.status\s*:?=/i);
  assert.doesNotMatch(code, /new\.published_at\s*:?=/i);
  // Upserts onto an existing published row must not be treated as a new publish.
  assert.match(code, /if old\.status = 'published' then/);
  assert.match(code, /status = ''published''/);
  // The executable cases live here (run on a throwaway restore; ends in ROLLBACK).
  const t = readFileSync(join(ROOT, 'docs/adsense-audit/sql/tests/publish-gate-regression.sql'), 'utf8');
  assert.match(t, /\\ir \.\.\/2026-10-03-phase2-triggers\.sql/);
  assert.match(t, /^ROLLBACK;\s*$/m);
});
