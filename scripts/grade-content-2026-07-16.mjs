// AI 콘텐츠 A/B/C/D 등급분류 (2026-07-16) — 리포트 전용(파괴적 조치 없음)
// 기존 score-content-quality.mjs 의 7차원 루브릭을 재사용하고, 등급 밴드 + 근접중복 클러스터를 더한다.
//   A(유지): 점수 높고 공식출처+코드 충분          → 그대로
//   B(보강): 내용 괜찮으나 출처/환경/경험 부족       → 상위 30~50편 집중 보강 대상
//   C(noindex/통합): 일반 설명 재구성 수준(<58)     → 이미 noindex 파이프라인이 커버
//   D(통합+301): 제목 근접중복(≥0.5) 클러스터의 비대표 → 사람 검토 후 병합(과병합 위험)
// 출력: CONTENT_GRADE_AUDIT.csv + 콘솔 요약
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim(); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const noindexSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/noindex-slugs.json', import.meta.url))));
const gscSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/gsc-protected-slugs.json', import.meta.url))));

async function pull() { let a = [], f = 0; for (;;) { const { data } = await sb.from('posts').select('id,slug,title,content,category,tags,views,published_at').eq('status', 'published').range(f, f + 499); a = a.concat(data); if (data.length < 500) break; f += 500; } return a; }
const posts = await pull();

const STOP = new Set(['가이드', '완벽', '실전', '전략', '구축', '방법', '위한', '이해', '활용', '시대', '넘어', '정리', '핵심', '필독', '기반', '대한', '만드는', '에러', '해결', '해결법', '진단', '원인', '런북', '가지', '완전', '정복', '및', '30초', '5분', '복붙', '복구']);
const toks = t => new Set((t || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)));
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const T = posts.map(p => ({ id: p.id, t: toks(p.title), views: p.views, slug: p.slug, title: p.title }));

function score(p) {
  const c = p.content || '';
  const codeN = (c.match(/```/g) || []).length / 2;
  const tableN = (c.match(/\n\|.*\|\n/g) || []).length;
  const stepN = (c.match(/^#{2,3} /gm) || []).length;
  let orig = Math.min(20, codeN * 2.5 + tableN * 2 + Math.min(stepN, 8));
  if (codeN === 0 && tableN === 0) orig = Math.min(orig, 8);
  const offLink = (c.match(/https?:\/\/(docs\.|kubernetes\.io|redis\.io|git-scm|postgresql\.org|dev\.mysql|owasp|learn\.microsoft|cloud\.google|docs\.aws|nginx\.org|python\.org|nodejs\.org|man7\.org|web\.dev|kafka\.apache|isms\.kisa|law\.go\.kr|fsec\.or\.kr)/g) || []).length;
  const refSec = /참고 자료|참고자료|References|공식 문서/i.test(c);
  let src = Math.min(20, offLink * 7 + (refSec ? 6 : 0));
  src = Math.min(20, src + 4);
  const runnable = (c.match(/```(bash|sh|shell|sql|yaml|yml|json|python|js|javascript|ts|typescript|dockerfile|hcl|conf|ini|java|go)/gi) || []).length;
  const repro = Math.min(15, runnable * 3 + (/(예상 (출력|결과)|정상 (출력|결과)|출력 예)/.test(c) ? 3 : 0));
  const mt = toks(p.title); let maxSim = 0, dupWith = null;
  for (const o of T) { if (o.id === p.id) continue; const s = jac(mt, o.t); if (s > maxSim) { maxSim = s; dupWith = o; } }
  const dup = maxSim >= 0.5 ? 3 : maxSim >= 0.35 ? 9 : 15;
  const ver = Math.min(10, ((c.match(/\b\d+\.\d+(\.\d+)?\b/g) || []).length >= 3 ? 6 : 2) + (/(Ubuntu|CentOS|RHEL|Debian|Windows|macOS|버전|v\d)/.test(c) ? 4 : 0));
  const trust = 8 + (/검증 환경|편집자 주/i.test(c) ? 2 : 0);
  const intent = Math.min(10, (stepN >= 4 ? 4 : 2) + (/(재발 방지|예방|체크리스트|FAQ|자주 묻는)/.test(c) ? 3 : 1) + (c.length > 3500 ? 3 : 1));
  const total = Math.round(orig + src + repro + dup + ver + trust + intent);
  return { total, maxSim, dupWith, hasSource: offLink > 0 || refSec, hasCode: codeN > 0 || tableN > 0, hasEnv: ver >= 6, offLink, len: c.replace(/\s/g, '').length };
}

const scored = posts.map(p => ({ p, s: score(p) }));

// D 클러스터: maxSim≥0.5 쌍에서 대표(views→점수→최신) 하나만 남기고 나머지 D
const byId = new Map(scored.map(x => [x.p.id, x]));
function isNonKeeper(x) {
  if (x.s.maxSim < 0.5 || !x.s.dupWith) return false;
  const partner = byId.get(x.s.dupWith.id);
  if (!partner) return false;
  // 대표 결정: views 우선, 동률이면 점수, 그다음 최신
  const a = x, b = partner;
  const aWins = a.p.views !== b.p.views ? a.p.views > b.p.views
    : a.s.total !== b.s.total ? a.s.total > b.s.total
    : a.p.published_at > b.p.published_at;
  return !aWins; // 지면 비대표(D)
}

function grade(x) {
  const { s, p } = x;
  if (isNonKeeper(x)) return 'D';
  if (s.total < 58) return 'C';
  if (s.total >= 72 && s.hasSource && s.hasCode && s.hasEnv) return 'A';
  return 'B';
}

const rows = scored.map(x => {
  const g = grade(x);
  const { p, s } = x;
  const status = noindexSet.has(p.slug) ? 'noindex' : gscSet.has(p.slug) ? 'GSC보호' : 'index';
  let action;
  if (g === 'A') action = '유지';
  else if (g === 'B') action = status === 'noindex' ? '보강 후 재색인' : '출처·환경·경험 보강';
  else if (g === 'C') action = status === 'noindex' ? '이미 noindex(완료)' : 'noindex 또는 통합';
  else action = `통합 검토 → 301 (대표 후보: #${s.dupWith?.id} ${s.dupWith?.title?.slice(0, 30)})`;
  return { id: p.id, slug: p.slug, title: p.title, category: p.category, grade: g, score: s.total, sim: s.maxSim >= 0.35 ? (s.maxSim * 100 | 0) + '%' : '', status, views: p.views, action };
});

// 정렬: 등급(A<B<C<D는 관심순 B→D→C→A) — 보강 대상 먼저 보이게
const order = { B: 0, D: 1, C: 2, A: 3 };
rows.sort((a, b) => order[a.grade] - order[b.grade] || b.score - a.score);

const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const csv = ['id,slug,제목,카테고리,등급,점수,중복도,색인상태,조회,권장조치']
  .concat(rows.map(r => [r.id, r.slug, r.title, r.category, r.grade, r.score, r.sim, r.status, r.views, r.action].map(esc).join(',')))
  .join('\n');
writeFileSync('CONTENT_GRADE_AUDIT.csv', '﻿' + csv);

// 요약
const dist = { A: 0, B: 0, C: 0, D: 0 };
rows.forEach(r => dist[r.grade]++);
const idxDist = { A: 0, B: 0, C: 0, D: 0 };
rows.forEach(r => { if (r.status === 'index') idxDist[r.grade]++; });

console.log(`발행 ${posts.length}편 등급분포:`);
console.log(`  A(유지)  ${dist.A}편   (색인중 ${idxDist.A})`);
console.log(`  B(보강)  ${dist.B}편   (색인중 ${idxDist.B})  ← 집중 보강 대상`);
console.log(`  C(일반)  ${dist.C}편   (색인중 ${idxDist.C})  ← 이미 대부분 noindex`);
console.log(`  D(중복)  ${dist.D}편   (색인중 ${idxDist.D})  ← 병합 검토`);

console.log(`\n[B급 · 색인중 · 조회수 높은 순] 우선 보강 후보 상위 15:`);
rows.filter(r => r.grade === 'B' && r.status === 'index').sort((a, b) => b.views - a.views).slice(0, 15)
  .forEach(r => console.log(`  #${r.id} (${r.score}점, 조회${r.views}) ${r.title.slice(0, 46)}`));

console.log(`\n[D급 · 색인중] 병합 검토 후보 상위 12 (과병합 주의 — 사람 확인 필수):`);
rows.filter(r => r.grade === 'D' && r.status === 'index').slice(0, 12)
  .forEach(r => console.log(`  #${r.id} (${r.sim}) ${r.title.slice(0, 40)}  →  ${r.action.replace('통합 검토 → 301 (대표 후보: ', '').replace(')', '')}`));

console.log('\n전체 리포트: CONTENT_GRADE_AUDIT.csv');
