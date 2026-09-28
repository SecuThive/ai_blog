// Content hardening round 3 (2026-09-29) — AdSense re-review prep.
// Enrich thin indexed posts (KO body 2,500–2,999 non-ws chars → 3,000+) with
// cause/repro/verification/fix/prevention sections (KO + matching EN in
// content_evidence.en.content), and rewrite SEO-bait titles (KO title + EN
// i18n.title: tag, which is what drives /en). Slugs are never changed.
// Usage: node scripts/content-hardening-r3-2026-09-29.mjs <batch.json> [--apply]
//   Saves a before-snapshot of every touched row to
//   scripts/content-hardening-r3-backup-2026-09-29-<batch>.json before writing.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const file = process.argv[2];
const APPLY = process.argv.includes('--apply');
const batch = JSON.parse(readFileSync(file, 'utf8'));
const tag = basename(file).replace(/\.json$/, '');
const START = '<!--NodelogEN';

function splitKo(c) {
  let s = c.indexOf('\n\n' + START); if (s === -1) s = c.indexOf(START);
  return s === -1 ? [c, ''] : [c.slice(0, s).trimEnd(), c.slice(s)];
}
const KO_ANCHOR = /^## .*(참고 자료|참고: 공식|참고 문헌|자주 묻는 질문|FAQ|검증 환경|편집자 주|에디터 노트)/m;
const EN_ANCHOR = /^## .*(References|Reference|Official Doc|Frequently Asked|FAQ|Verification Environment|Editor)/im;
function insertBefore(body, add, anchor) {
  const m = body.match(anchor);
  const block = add.trim();
  if (!m) return { out: body.trimEnd() + '\n\n' + block + '\n', at: '(end)' };
  const i = m.index;
  return { out: body.slice(0, i).trimEnd() + '\n\n' + block + '\n\n' + body.slice(i), at: m[0].slice(0, 50) };
}
const nws = s => s.replace(/\s/g, '').length;
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ids = batch.map(b => b.id);
const { data: rows, error } = await sb.from('posts').select('id,slug,title,content,tags,content_evidence,status,updated_at').in('id', ids);
if (error) throw error;
const byId = Object.fromEntries(rows.map(r => [r.id, r]));
const backupPath = `scripts/content-hardening-r3-backup-2026-09-29-${tag}.json`;
if (APPLY) {
  if (existsSync(backupPath)) { console.error('backup exists, refusing to overwrite:', backupPath); process.exit(1); }
  writeFileSync(backupPath, JSON.stringify(rows, null, 1));
  console.log('backup saved', backupPath, rows.length);
}
let problems = 0;
for (const b of batch) {
  const r = byId[b.id];
  if (!r) { console.log('MISSING', b.id); problems++; continue; }
  if (b.slug && b.slug !== r.slug) { console.log('SLUG MISMATCH', b.id); problems++; continue; }
  if (r.status !== 'published') { console.log('NOT PUBLISHED', b.id); problems++; continue; }
  const patch = {};
  let [ko, tail] = splitKo(r.content || '');
  const ev = r.content_evidence && typeof r.content_evidence === 'object' ? JSON.parse(JSON.stringify(r.content_evidence)) : null;
  let evChanged = false;
  let tags = [...(r.tags || [])];
  const before = nws(ko);
  let log = `#${b.id} ko ${before}`;
  if (b.ko_add) {
    const res = insertBefore(ko, b.ko_add, KO_ANCHOR);
    ko = res.out; log += `→${nws(ko)} @[${res.at}]`;
    if (nws(ko) < 3000) { log += ' !!UNDER3000'; problems++; }
    if (!b.en_add && ev?.en?.content) { log += ' !!MISSING_EN'; problems++; }
  }
  if (b.en_add) {
    if (!ev?.en?.content) { log += ' !!NO_EN_BODY'; problems++; }
    else { const res = insertBefore(ev.en.content, b.en_add, EN_ANCHOR); ev.en.content = res.out; evChanged = true; log += ` en@[${res.at}]`; }
  }
  if (b.title_ko && b.title_ko !== r.title) {
    // also fix an in-body H2 that just repeats the old title
    ko = ko.replace(new RegExp('^## ' + escRe(r.title) + '\\s*$', 'm'), '## ' + b.title_ko);
    patch.title = b.title_ko; log += `\n   KO: ${r.title}\n    → ${b.title_ko}`;
  }
  if (b.title_en) {
    const i = tags.findIndex(t => t.startsWith('i18n.title:'));
    const old = i >= 0 ? tags[i].slice(11) : (ev?.en?.title || '');
    if (i >= 0) tags[i] = 'i18n.title:' + b.title_en; else tags.push('i18n.title:' + b.title_en);
    if (ev?.en) {
      if (ev.en.content && old) ev.en.content = ev.en.content.replace(new RegExp('^## ' + escRe(old) + '\\s*$', 'm'), '## ' + b.title_en);
      if (ev.en.title !== undefined) ev.en.title = b.title_en;
      evChanged = true;
    }
    patch.tags = tags; log += `\n   EN: ${old}\n    → ${b.title_en}`;
  }
  const newContent = tail ? ko + '\n\n' + tail.replace(/^\s+/, '') : ko;
  if (newContent !== r.content) patch.content = newContent;
  if (evChanged) patch.content_evidence = ev;
  if (!Object.keys(patch).length) { console.log(log, '(no change)'); continue; }
  patch.updated_at = new Date().toISOString();
  console.log(log);
  if (APPLY) {
    const { data: upd, error: e } = await sb.from('posts').update(patch).eq('id', b.id).eq('updated_at', r.updated_at).select('id');
    if (e || !upd?.length) { console.log('   UPDATE ERROR', e?.message || 'no row updated (concurrent edit?)'); problems++; }
  }
}
console.log(APPLY ? 'APPLIED' : 'DRY-RUN', 'problems:', problems);
if (problems) process.exitCode = 2;
