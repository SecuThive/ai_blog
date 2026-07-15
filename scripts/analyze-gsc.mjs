// GSC 실적 분석 — 근접키워드(8~20위) 보강 기회 도출
// 사용법:
//   1) Search Console → 실적 → 우상단 '내보내기' → CSV(ZIP) 다운로드 → 압축 해제
//   2) Queries.csv / Pages.csv 를 이 스크립트에 전달:
//        node scripts/analyze-gsc.mjs <내려받은폴더 or Queries.csv 경로>
// GSC UI 언어에 따라 컬럼명이 한글/영문 다를 수 있어 양쪽 모두 처리.
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const arg = process.argv[2];
if (!arg) { console.error('경로 인자 필요: node scripts/analyze-gsc.mjs <GSC export 폴더 or Queries.csv>'); process.exit(1); }

function findCsv(base, names) {
  if (existsSync(base) && base.toLowerCase().endsWith('.csv')) return base;
  for (const n of names) { const p = join(base, n); if (existsSync(p)) return p; }
  // 폴더 내 부분일치
  if (existsSync(base)) { const f = readdirSync(base).find(x => names.some(n => x.toLowerCase() === n.toLowerCase())); if (f) return join(base, f); }
  return null;
}
// 간이 CSV 파서(따옴표/쉼표 처리)
function parseCsv(text) {
  const rows = []; let i = 0, field = '', row = [], q = false;
  const pushF = () => { row.push(field); field = ''; };
  const pushR = () => { pushF(); rows.push(row); row = []; };
  text = text.replace(/^﻿/, '');
  while (i < text.length) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else { if (c === '"') q = true; else if (c === ',') pushF(); else if (c === '\n') pushR(); else if (c === '\r') {} else field += c; }
    i++;
  }
  if (field.length || row.length) pushR();
  return rows.filter(r => r.length > 1);
}
const num = v => Number(String(v ?? '').replace(/[%,]/g, '').replace(/["']/g, '').trim()) || 0;
// 헤더 → 표준키
function cols(header) {
  const idx = {};
  header.forEach((h, i) => {
    const k = h.trim().toLowerCase();
    if (/query|검색어|쿼리/.test(k)) idx.query = i;
    else if (/top pages|페이지|주소|url/.test(k)) idx.page = i;
    else if (/click|클릭/.test(k)) idx.clicks = i;
    else if (/impress|노출/.test(k)) idx.impr = i;
    else if (/ctr/.test(k)) idx.ctr = i;
    else if (/position|순위|게재/.test(k)) idx.pos = i;
  });
  return idx;
}

const qPath = findCsv(arg, ['Queries.csv', '쿼리.csv', '검색어.csv']);
if (!qPath) { console.error('Queries.csv 를 찾지 못함. GSC 실적 내보내기 CSV 폴더를 지정하세요.'); process.exit(1); }
const rows = parseCsv(readFileSync(qPath, 'utf8'));
const idx = cols(rows[0]);
const data = rows.slice(1).map(r => ({
  query: r[idx.query], clicks: num(r[idx.clicks]), impr: num(r[idx.impr]),
  ctr: num(r[idx.ctr]), pos: num(r[idx.pos]),
})).filter(d => d.query);

console.log(`GSC 쿼리 ${data.length}개 로드 (${qPath})\n`);
const totClicks = data.reduce((s, d) => s + d.clicks, 0);
const totImpr = data.reduce((s, d) => s + d.impr, 0);
console.log(`총 클릭 ${totClicks} / 총 노출 ${totImpr} / 평균 CTR ${(100*totClicks/(totImpr||1)).toFixed(2)}%\n`);

// ① 근접키워드: 8~20위 + 노출 있음 → 살짝 밀면 1페이지
const near = data.filter(d => d.pos >= 8 && d.pos <= 20 && d.impr >= 5).sort((a, b) => b.impr - a.impr);
console.log(`━━━ ① 근접키워드(8~20위, 노출≥5) — 보강 1순위: ${near.length}개 ━━━`);
near.slice(0, 30).forEach(d => console.log(`  ${d.pos.toFixed(1)}위 노출${d.impr} 클릭${d.clicks} CTR${d.ctr}%  ${d.query}`));

// ② 제목/메타 최적화: 상위권(≤7위)인데 CTR 낮음 → 노출은 되는데 클릭 안 됨
const lowCtr = data.filter(d => d.pos <= 7 && d.impr >= 20 && d.ctr < 2).sort((a, b) => b.impr - a.impr);
console.log(`\n━━━ ② 상위노출인데 CTR<2% (제목·메타 개선): ${lowCtr.length}개 ━━━`);
lowCtr.slice(0, 15).forEach(d => console.log(`  ${d.pos.toFixed(1)}위 노출${d.impr} CTR${d.ctr}%  ${d.query}`));

// ③ 신규 콘텐츠 갭: 노출 높은데 20위 밖 → 전용 글 부재 가능성
const gap = data.filter(d => d.pos > 20 && d.impr >= 15).sort((a, b) => b.impr - a.impr);
console.log(`\n━━━ ③ 노출은 높은데 20위 밖 (전용 글 신규 기획 후보): ${gap.length}개 ━━━`);
gap.slice(0, 15).forEach(d => console.log(`  ${d.pos.toFixed(1)}위 노출${d.impr}  ${d.query}`));

console.log(`\n다음 단계: ①의 각 쿼리 → 어떤 발행글이 걸려있는지(Pages.csv 대조) 확인 후, 그 글에 해당 키워드 섹션·비교표·FAQ 보강. ③은 신규 글 기획(엔진 content_planner에 키워드 전달).`);
