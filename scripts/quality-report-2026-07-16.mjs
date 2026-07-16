// #3 전체 게시물 품질 자동평가 — 지정 배점/구간 (2026-07-16) · 리포트 전용
// 배점: 분량·정보깊이20 + 공식출처20 + 코드·표·체크리스트15 + 고유분석15
//       + 유사중복도15 + 제목·설명·본문일치10 + 최신성·정확성5  (= 100)
// 구간: 80+ 정상색인 / 60-79 보강 / 40-59 noindex후보강 / <40 통합후보
// 출력: CONTENT_QUALITY_REPORT.csv + 콘솔 분포
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim(); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const noindexSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/noindex-slugs.json', import.meta.url))));
const gscSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/gsc-protected-slugs.json', import.meta.url))));

// 발행일 기준 최신성 계산용 고정 기준일(스크립트 재현성) — 실행 시점
const NOW = new Date('2026-07-16T00:00:00Z').getTime();

async function pull() { let a = [], f = 0; for (;;) { const { data } = await sb.from('posts').select('id,slug,title,excerpt,content,category,tags,published_at').eq('status', 'published').range(f, f + 499); a = a.concat(data); if (data.length < 500) break; f += 500; } return a; }
const posts = await pull();

const OFFICIAL = /https?:\/\/(docs\.|kubernetes\.io|redis\.io|git-scm|postgresql\.org|dev\.mysql|owasp|learn\.microsoft|cloud\.google|docs\.aws|nginx\.org|python\.org|nodejs\.org|man7\.org|web\.dev|kafka\.apache|isms\.kisa|law\.go\.kr|fsec\.or\.kr|mlflow\.org|pytorch\.org|huggingface\.co|istio\.io|prometheus\.io|grafana\.com|elastic\.co|openssl\.org|ansible\.com|hashicorp\.com|spark\.apache|airflow\.apache|onnxruntime\.ai|pinecone\.io|weaviate\.io|ai\.google\.dev)/gi;
const STOP = new Set(['가이드', '완벽', '실전', '전략', '구축', '방법', '위한', '이해', '활용', '정리', '핵심', '완전', '및', '30초', '5분', '복붙']);
const toks = t => new Set((t || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)));
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
const T = posts.map(p => ({ id: p.id, t: toks(p.title) }));

function score(p) {
  const c = p.content || '';
  const body = c.replace(/```[\s\S]*?```/g, ' ').replace(/\s+/g, ' ');
  const chars = c.replace(/\s/g, '').length;
  const codeN = (c.match(/```/g) || []).length / 2;
  const tableN = (c.match(/\n\|.*\|\n/g) || []).length;
  const stepN = (c.match(/^#{2,3} /gm) || []).length;
  const checklist = (c.match(/^\s*[-*] \[[ x]\]/gim) || []).length + (c.match(/^\s*\d+\.\s/gm) || []).length;

  // 1) 분량·정보깊이 20
  let depth = 0;
  depth += chars >= 4500 ? 10 : chars >= 3000 ? 8 : chars >= 1800 ? 5 : chars >= 1000 ? 3 : 1;
  depth += Math.min(6, stepN);
  depth += stepN >= 5 ? 4 : stepN >= 3 ? 2 : 0;
  depth = Math.min(20, depth);

  // 2) 공식 출처 20
  const off = (c.match(OFFICIAL) || []).length;
  const refSec = /참고 자료|참고자료|References|공식 문서/i.test(c);
  let src = Math.min(20, off * 7 + (refSec ? 4 : 0));
  // 사이트 레벨 '관련 공식 문서' 자동 연결분(officialDocs) 반영 — 대부분의 기술글에 노출
  if (off === 0) src = Math.min(src + 4, 8);

  // 3) 코드·표·체크리스트 15
  const code = Math.min(15, codeN * 3 + tableN * 2.5 + Math.min(6, checklist));

  // 4) 고유 분석 15 (비교·의사결정·트레이드오프·주의/실패 언어)
  let uniq = 0;
  uniq += tableN >= 1 ? 4 : 0;
  uniq += /\bvs\.?\b|비교|차이|대안|선택 기준|언제 (쓰|사용)|트레이드오프|장단점/i.test(body) ? 4 : 0;
  uniq += /주의|함정|실패|하지 말|안티패턴|흔한 실수|권장하지/i.test(body) ? 3 : 0;
  uniq += /의사결정|결정 표|기준표|체크리스트|재발 방지|예방/i.test(body) ? 2 : 0;
  uniq += chars > 4000 && stepN >= 5 ? 2 : 0;
  uniq = Math.min(15, uniq);

  // 5) 유사 중복도 15 (제목 유사 최대치 → 벌점)
  const mt = toks(p.title); let maxSim = 0;
  for (const o of T) { if (o.id === p.id) continue; const s = jac(mt, o.t); if (s > maxSim) maxSim = s; }
  const dup = maxSim >= 0.55 ? 3 : maxSim >= 0.4 ? 7 : maxSim >= 0.3 ? 11 : 15;

  // 6) 제목·설명·본문 일치 10 (제목/발췌 키워드가 본문에 실제 등장하는 비율)
  const titleTok = [...toks(p.title + ' ' + (p.excerpt || ''))];
  const bodyLow = body.toLowerCase();
  const hit = titleTok.filter(w => bodyLow.includes(w)).length;
  const match = titleTok.length ? Math.round((hit / titleTok.length) * 10) : 5;

  // 7) 최신성·정확성 5 (발행 최근성 + 버전 구체성)
  const ageDays = (NOW - new Date(p.published_at || NOW).getTime()) / 86400000;
  let fresh = ageDays <= 120 ? 3 : ageDays <= 365 ? 2 : 1;
  fresh += /\b\d+\.\d+(\.\d+)?\b/.test(c) ? 2 : 0;
  fresh = Math.min(5, fresh);

  const total = Math.round(depth + src + code + uniq + dup + match + fresh);
  return { total, depth, src, code, uniq, dup, match, fresh, maxSim, off, chars };
}

const rows = posts.map(p => {
  const s = score(p);
  const status = noindexSet.has(p.slug) ? 'noindex' : gscSet.has(p.slug) ? 'GSC보호' : 'index';
  const band = s.total >= 80 ? 'A 정상색인' : s.total >= 60 ? 'B 보강' : s.total >= 40 ? 'C noindex후보강' : 'D 통합후보';
  return { id: p.id, slug: p.slug, title: p.title, category: p.category, status,
    total: s.total, 분량: s.depth, 출처: s.src, 코드: s.code, 고유: s.uniq, 중복: s.dup, 일치: s.match, 최신: s.fresh,
    sim: s.maxSim >= 0.3 ? (s.maxSim * 100 | 0) + '%' : '', band };
});
rows.sort((a, b) => a.total - b.total);

const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const header = 'id,slug,제목,카테고리,색인상태,총점,분량20,출처20,코드15,고유15,중복15,일치10,최신5,중복도,구간';
const csv = [header].concat(rows.map(r => [r.id, r.slug, r.title, r.category, r.status, r.total, r.분량, r.출처, r.코드, r.고유, r.중복, r.일치, r.최신, r.sim, r.band].map(esc).join(','))).join('\n');
writeFileSync('CONTENT_QUALITY_REPORT.csv', '﻿' + csv);

const dist = { 'A 정상색인': 0, 'B 보강': 0, 'C noindex후보강': 0, 'D 통합후보': 0 };
const idx = { 'A 정상색인': 0, 'B 보강': 0, 'C noindex후보강': 0, 'D 통합후보': 0 };
rows.forEach(r => { dist[r.band]++; if (r.status === 'index') idx[r.band]++; });
console.log(`발행 ${posts.length}편 · 지정 배점/구간 품질 분포 (괄호=색인 중):`);
for (const b of Object.keys(dist)) console.log(`  ${b.padEnd(16)} ${String(dist[b]).padStart(3)}편  (색인 ${idx[b]})`);
const avg = Math.round(rows.reduce((s, r) => s + r.total, 0) / rows.length);
console.log(`\n평균 점수: ${avg}`);
console.log(`\n[색인 중 · 60~79 보강 대상] 조회 무관 상위 결핍 항목 예시 10:`);
rows.filter(r => r.status === 'index' && r.total >= 60 && r.total < 80).slice(0, 10)
  .forEach(r => console.log(`  #${r.id} ${r.total}점 (출처${r.출처}/고유${r.고유}) ${r.title.slice(0, 44)}`));
console.log('\n전체: CONTENT_QUALITY_REPORT.csv');
