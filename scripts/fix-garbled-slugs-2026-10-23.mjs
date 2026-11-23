// 깨진 slug 복구 — slug의 한글이 UTF-8 hex 문자열(예: ec9790...)로 치환된 글을 디코딩한 한글 slug로 바꾼다.
// 기본은 dry-run(읽기 전용). 실제 반영은 --apply. 반영 전 postRedirects.ts의 구→신 308 매핑이
// 운영에 배포돼 있어야 구 URL이 404 없이 이전된다(동작 순서는 docs/GARBLED_SLUG_FIX_2026-10-23.md).
//   node scripts/fix-garbled-slugs-2026-10-23.mjs            # 점검 + redirect 매핑 출력
//   node scripts/fix-garbled-slugs-2026-10-23.mjs --apply    # DB 반영(백업 JSON 저장)
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, ''); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const HEX = /(?:e[a-d][0-9a-f]{4})+/g;
const decode = (s) => s.replace(HEX, (m) => Buffer.from(m, 'hex').toString('utf8'));
const isGarbled = (s) => /(?:^|-)[0-9]*(?:e[a-d][0-9a-f]{4}){2,}/.test(s) && /[가-힣]/.test(decode(s));

const rows = [];
for (let o = 0; ; o += 1000) {
  const { data, error } = await sb.from('posts').select('id,slug,status,title').range(o, o + 999);
  if (error) { console.error(error); process.exit(1); }
  rows.push(...data); if (data.length < 1000) break;
}
const taken = new Set(rows.map((r) => r.slug));
const plan = rows.filter((r) => isGarbled(r.slug)).map((r) => ({ id: r.id, status: r.status, from: r.slug, to: decode(r.slug) }));
const problems = [];
const seen = new Set();
for (const p of plan) {
  if (taken.has(p.to)) problems.push(`충돌: ${p.to}`);
  if (seen.has(p.to)) problems.push(`중복 대상: ${p.to}`);
  if (!/^[a-z0-9가-힣-]+$/.test(p.to)) problems.push(`허용 밖 문자: ${p.to}`);
  seen.add(p.to);
}
console.log(`대상 ${plan.length}건 (전체 ${rows.length}건)`);
for (const p of plan) console.log(`#${p.id} [${p.status}] ${p.from}\n     -> ${p.to}`);
if (problems.length) { console.error('중단:', problems); process.exit(1); }
if (!APPLY) { console.log('\n(dry-run) --apply 로 반영'); process.exit(0); }

const stamp = new Date().toISOString().slice(0, 10);
writeFileSync(new URL(`./garbled-slugs-backup-${stamp}.json`, import.meta.url), JSON.stringify(plan, null, 2));
for (const p of plan) {
  const { data, error } = await sb.from('posts').update({ slug: p.to }).eq('id', p.id).eq('slug', p.from).select('id,slug');
  if (error || data?.length !== 1) { console.error('실패', p.id, error?.message ?? `영향 행 ${data?.length}`); process.exit(1); }
  console.log('반영', p.id);
}
const { data: after } = await sb.from('posts').select('id,slug').in('id', plan.map((p) => p.id));
const ok = after.every((r) => plan.find((p) => p.id === r.id).to === r.slug);
console.log(ok ? '검증 OK' : '검증 실패');
process.exit(ok ? 0 : 1);
