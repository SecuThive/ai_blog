// #5 의미 기반 중복 탐지 (2026-07-16) · 리포트 전용 (자동 통합 없음)
// 임베딩 API 없이 TF-IDF 코사인으로 "본문 의미"가 유사한 글 쌍을 찾는다.
// (제목 유사 위주였던 기존 방식이 못 잡는 본문 중복 — PostgreSQL 연결초과 계열 등)
// 대표글 = 조회수 → 본문 길이. 301 후보 = 비대표. 서로 다른 검색의도면 유지 권장.
// 출력: SEMANTIC_DUP_REPORT.csv + 콘솔 상위 쌍
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim(); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const noindexSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/noindex-slugs.json', import.meta.url))));

async function pull() { let a = [], f = 0; for (;;) { const { data } = await sb.from('posts').select('id,slug,title,content,category,views,published_at').eq('status', 'published').range(f, f + 499); a = a.concat(data); if (data.length < 500) break; f += 500; } return a; }
const posts = await pull();

const STOP = new Set('그리고 하지만 그러나 또한 이런 저런 그런 위한 위해 통해 통한 대한 관련 다양한 여러 각각 모든 어떤 있는 없는 하는 되는 이다 있다 없다 한다 된다 것을 것이 것은 수를 수가 등을 때문 경우 예를 들어 the and for with that this from are was were will can you your our not but has have how what when which more your into out over than then them they'.split(' '));
function tokens(text) {
  const body = (text || '').replace(/```[\s\S]*?```/g, ' ').toLowerCase();
  return body.replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !STOP.has(w));
}

// TF (상위항목만 유지) + DF
const N = posts.length;
const df = new Map();
const tfList = posts.map(p => {
  const tf = new Map();
  for (const w of tokens(p.content)) tf.set(w, (tf.get(w) || 0) + 1);
  for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
  return tf;
});
// TF-IDF 벡터(상위 40항목) + 정규화 + 역색인
const vecs = tfList.map(tf => {
  const arr = [];
  for (const [w, f] of tf) {
    const d = df.get(w);
    if (d < 2 || d > N * 0.5) continue;      // 너무 희귀/흔한 항목 제외
    arr.push([w, (1 + Math.log(f)) * Math.log(N / d)]);
  }
  arr.sort((a, b) => b[1] - a[1]);
  const top = arr.slice(0, 40);
  const norm = Math.sqrt(top.reduce((s, [, v]) => s + v * v, 0)) || 1;
  return new Map(top.map(([w, v]) => [w, v / norm]));
});
const inv = new Map();
vecs.forEach((v, i) => { for (const w of v.keys()) { if (!inv.has(w)) inv.set(w, []); inv.get(w).push(i); } });

// 후보 쌍만 코사인 (공유 항목 있는 쌍)
const seen = new Set();
const pairs = [];
for (let i = 0; i < N; i++) {
  const cand = new Set();
  for (const w of vecs[i].keys()) for (const j of inv.get(w)) if (j > i) cand.add(j);
  for (const j of cand) {
    let dot = 0;
    const [a, b] = vecs[i].size < vecs[j].size ? [vecs[i], vecs[j]] : [vecs[j], vecs[i]];
    for (const [w, v] of a) { const u = b.get(w); if (u) dot += v * u; }
    if (dot >= 0.45) pairs.push([i, j, dot]);
  }
}
pairs.sort((a, b) => b[2] - a[2]);

function keeper(pi, pj) {
  const a = posts[pi], b = posts[pj];
  const aWin = a.views !== b.views ? a.views > b.views : (a.content || '').length >= (b.content || '').length;
  return aWin ? [a, b] : [b, a];
}

const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const out = [];
for (const [i, j, sim] of pairs) {
  const [keep, drop] = keeper(i, j);
  const sameCat = posts[i].category === posts[j].category;
  out.push({ sim: (sim * 100).toFixed(0) + '%', sameCat: sameCat ? 'Y' : 'N',
    keepId: keep.id, keepTitle: keep.title, keepViews: keep.views,
    dropId: drop.id, dropTitle: drop.title, dropStatus: noindexSet.has(drop.slug) ? 'noindex' : 'index',
    dropSlug: drop.slug, keepSlug: keep.slug });
}
const csv = ['유사도,동일카테고리,대표ID,대표제목,대표조회,통합후보ID,통합후보제목,후보색인,후보slug,대표slug'].concat(
  out.map(r => [r.sim, r.sameCat, r.keepId, r.keepTitle, r.keepViews, r.dropId, r.dropTitle, r.dropStatus, r.dropSlug, r.keepSlug].map(esc).join(','))
).join('\n');
writeFileSync('SEMANTIC_DUP_REPORT.csv', '﻿' + csv);

const strong = out.filter(r => parseInt(r.sim) >= 60);
console.log(`발행 ${N}편 · 본문 TF-IDF 코사인 유사 쌍: ${out.length}개 (≥45%)  · 강한 후보(≥60%): ${strong.length}개`);
console.log(`색인 중인 통합후보(대표는 유지, 이 글을 301) 상위 20:`);
out.filter(r => r.dropStatus === 'index').slice(0, 20).forEach(r =>
  console.log(`  ${r.sim} ${r.sameCat === 'Y' ? '同' : '異'}  #${r.dropId} "${r.dropTitle.slice(0, 34)}"  →  #${r.keepId} "${r.keepTitle.slice(0, 30)}"`));
console.log('\n※ 서로 다른 검색의도(예: 원인해결 vs 설정튜닝)면 유지. 실제 통합·301은 사람 검토 후.');
console.log('전체: SEMANTIC_DUP_REPORT.csv');
