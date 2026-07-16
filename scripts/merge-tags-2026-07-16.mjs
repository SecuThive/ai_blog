// 태그 통합 (2026-07-16) — 같은 개념의 표기 변형만 병합, 별개 주제는 절대 병합 안 함.
//  (1) 자동: 정규화 키(소문자+공백/기호 제거)가 같은 변형 그룹 (대소문자·공백·하이픈 차이)
//  (2) 큐레이션: 언어 교차 동의어(쿠버네티스↔Kubernetes 등) 소수만 명시적으로 union
// canonical = PREFERRED(고정 표기) 우선, 없으면 최다 사용 표기(동률 시 긴 문자열→localeCompare).
// 병합으로 비워진(글 0) 색인 태그는 canonical로 301 리다이렉트하도록 TAG_REDIRECTS 생성.
// 실행: node scripts/merge-tags-2026-07-16.mjs [--apply]
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');

const MIN_TAG_POSTS = 3; // tag/[tag] noindex 임계값과 동일 — 이 이상이면 색인됐던 태그

// 고정 표기(있으면 canonical로 강제) — 고유명사·약어 표기 통일
const PREFERRED = new Set(['Kubernetes', 'DevOps', 'Istio', 'Kafka', 'PostgreSQL', 'PgBouncer', 'Node.js', 'SRE', 'RBAC', 'ChatGPT', 'Spring Boot', 'Zero Trust', 'Golang', 'Poetry', 'RAGAS', 'Responsible AI', 'Multi-Agent', 'ONNX Runtime', 'TensorFlow Lite', 'Docker Compose', 'Prompt Engineering', 'Service Mesh']);

// 언어 교차 동의어(같은 개념) — 명시적으로만 union (자동 정규화로는 안 묶임)
const CONCEPT_SYNONYMS = [
  ['Kubernetes', 'kubernetes', 'k8s', 'K8s', '쿠버네티스'],
  ['벡터DB', '벡터 DB', 'VectorDB', 'Vector DB'],
  ['ServiceMesh', 'Service Mesh', 'service mesh', 'service-mesh', '서비스메시', '서비스 메시'],
  ['AI거버넌스', 'AI 거버넌스', 'AIGovernance', 'AI Governance'],
  ['엣지AI', '엣지 AI', 'EdgeAI', 'Edge AI'],
  ['데이터메시', '데이터 메시', 'DataMesh', 'Data Mesh'],
];

const norm = s => s.toLowerCase().replace(/[\s\-_.·/]/g, '');

const { data: posts } = await sb.from('posts').select('id,tags,status');
const counts = new Map();
for (const p of posts) {
  if (p.status !== 'published') continue;
  for (const t of (p.tags || [])) { if (t.startsWith('series:') || /^ep:\d+$/.test(t)) continue; counts.set(t, (counts.get(t) || 0) + 1); }
}
const allTags = [...counts.keys()];

// union-find
const parent = new Map(allTags.map(t => [t, t]));
const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
const union = (a, b) => { if (!parent.has(a) || !parent.has(b)) return; const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };

// (1) 자동: 같은 정규화 키끼리 union
const byNorm = new Map();
for (const t of allTags) { const k = norm(t); if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(t); }
for (const g of byNorm.values()) for (let i = 1; i < g.length; i++) union(g[0], g[i]);
// (2) 큐레이션 동의어 union (존재하는 태그만)
for (const syn of CONCEPT_SYNONYMS) { const present = syn.filter(t => parent.has(t)); for (let i = 1; i < present.length; i++) union(present[0], present[i]); }

// 컴포넌트별 canonical 결정
const comps = new Map();
for (const t of allTags) { const r = find(t); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(t); }
function pickCanonical(members) {
  const pref = members.filter(m => PREFERRED.has(m));
  const pool = pref.length ? pref : members;
  return pool.slice().sort((a, b) =>
    (counts.get(b) - counts.get(a)) || (b.length - a.length) || a.localeCompare(b)
  )[0];
}

const map = new Map(); // variant -> canonical (변경되는 것만)
const mergedComps = [];
for (const members of comps.values()) {
  if (members.length < 2) continue;
  const canon = pickCanonical(members);
  const changed = members.filter(m => m !== canon);
  if (!changed.length) continue;
  for (const m of changed) map.set(m, canon);
  mergedComps.push({ canon, canonCount: counts.get(canon), changed });
}

// 리다이렉트: 비워질(=canonical로 흡수) 변형 중 색인됐던(≥3) 것 → canonical
const tagRedirects = {};
for (const [variant, canon] of map) if ((counts.get(variant) || 0) >= MIN_TAG_POSTS) tagRedirects[variant] = canon;

// 영향받는 글 수
let affected = 0;
for (const p of posts) { if (!(p.tags || []).some(t => map.has(t))) continue; affected++; }

console.log(`발행 태그 ${allTags.length}개 → 병합 후 ${allTags.length - map.size}개  (변형 ${map.size}개 흡수)`);
console.log(`병합 그룹 ${mergedComps.length}개 · 영향받는 글 ${affected}편 · 301 리다이렉트 대상(색인됐던 변형) ${Object.keys(tagRedirects).length}개`);
console.log(`\n=== 병합 그룹 상위 25 (canonical ← 흡수되는 변형) ===`);
mergedComps.sort((a, b) => b.canonCount - a.canonCount);
for (const c of mergedComps.slice(0, 25)) console.log(`  ${c.canon}(${c.canonCount})  ← ${c.changed.map(m => `${m}(${counts.get(m)})`).join(', ')}`);

if (!APPLY) { console.log('\n(dry-run) --apply 로 실제 반영. 리다이렉트 대상:', JSON.stringify(tagRedirects, null, 0).slice(0, 400)); process.exit(0); }

// --- 적용 ---
const backup = [];
let updated = 0;
for (const p of posts) {
  const tags = p.tags || [];
  if (!tags.some(t => map.has(t))) continue;
  backup.push({ id: p.id, tags });
  const seen = new Set();
  const next = [];
  for (const t of tags) { const nt = map.get(t) || t; if (!seen.has(nt)) { seen.add(nt); next.push(nt); } }
  const { error } = await sb.from('posts').update({ tags: next }).eq('id', p.id);
  if (error) { console.error(`✗ #${p.id}:`, error.message); process.exit(1); }
  updated++;
}
writeFileSync('scripts/merge-tags-backup-2026-07-16.json', JSON.stringify(backup, null, 2));
writeFileSync('scripts/tag-redirects-2026-07-16.json', JSON.stringify(tagRedirects, null, 2));
console.log(`\n✓ ${updated}편 태그 갱신 완료. 백업: scripts/merge-tags-backup-2026-07-16.json`);
console.log(`✓ 리다이렉트 맵: scripts/tag-redirects-2026-07-16.json (${Object.keys(tagRedirects).length}개) → src/lib/tagRedirects.ts 에 반영 필요`);
