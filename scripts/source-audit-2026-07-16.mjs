// #4 공식 출처 자동 점검 (2026-07-16) · 리포트 전용
//  - 본문 외부 링크 분류: 공식 1차출처 / 커뮤니티·블로그 only / 무출처
//  - officialDocs 푸터 자동연결 매칭 여부(사이트 레벨 보강분) 반영
//  - 법률·금융·보안 글인데 1차출처 없는 글 플래그
//  - 본문에 실재하는 공식 링크의 HTTP 상태 확인(깨진 링크)
// 출력: SOURCE_AUDIT.csv + 콘솔 요약
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].trim(); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const noindexSet = new Set(JSON.parse(readFileSync(new URL('../src/lib/noindex-slugs.json', import.meta.url))));

const OFFICIAL_HOST = /(docs\.|kubernetes\.io|redis\.io|git-scm\.com|postgresql\.org|dev\.mysql\.com|owasp\.org|learn\.microsoft\.com|cloud\.google\.com|nginx\.org|python\.org|nodejs\.org|man7\.org|web\.dev|kafka\.apache\.org|isms\.kisa\.or\.kr|law\.go\.kr|fsec\.or\.kr|mlflow\.org|pytorch\.org|huggingface\.co|istio\.io|linkerd\.io|prometheus\.io|grafana\.com|elastic\.co|openssl\.org|ansible\.com|hashicorp\.com|spark\.apache\.org|airflow\.apache\.org|onnxruntime\.ai|pinecone\.io|weaviate\.io|ai\.google\.dev|oracle\.com|golang\.org|go\.dev|rust-lang\.org|apache\.org|cncf\.io|ietf\.org|rfc-editor\.org|w3\.org|mozilla\.org|developer\.mozilla\.org|amazonaws\.com|microsoft\.com|kernel\.org)/i;
const COMMUNITY_HOST = /(medium\.com|stackoverflow\.com|stackexchange|reddit\.com|velog\.io|tistory\.com|brunch\.co\.kr|qiita\.com|dev\.to|github\.io|blogspot|wordpress|naver\.com|daum\.net|wikipedia\.org|namu\.wiki)/i;

async function pull() { let a = [], f = 0; for (;;) { const { data } = await sb.from('posts').select('id,slug,title,content,category,tags,published_at').eq('status', 'published').range(f, f + 499); a = a.concat(data); if (data.length < 500) break; f += 500; } return a; }
const posts = await pull();

// officialDocs 푸터 매칭(간이) — 대표 키워드로 사이트 자동연결 여부 판정
const FOOTER_KEYS = /kubernetes|k8s|kubectl|docker|컨테이너|\bgit\b|github|redis|postgres|pgbouncer|mysql|mongodb|terraform|\baws\b|ec2|s3|lambda|azure|\bgcp\b|google cloud|nginx|linux|리눅스|bash|shell|systemd|ssh|python|파이썬|node\.?js|npm|\bjava\b|jvm|jdk|spring|maven|gradle|openai|gpt|claude|langchain|\brag\b|벡터|vector|owasp|취약점|injection|isms|kisa|web vitals|kafka|mlflow|mlops|llmops|wandb|pinecone|weaviate|faiss|hugging\s?face|transformers|파인튜닝|pytorch|tensorflow|tflite|litert|엣지\s?ai|edge\s?ai|\bonnx\b|fastapi|elasticsearch|kibana|istio|service\s?mesh|서비스\s?메시|linkerd|prometheus|grafana|ansible|플레이북|\bvault\b|spark|airflow|openssl|인증서|\bssl\b|\btls\b|pkix|x509|ai act|eu ai|ai 규제|인공지능|gdpr|모델 거버넌스|ai 거버넌스|responsible ai|모델 드리프트|감사 추적|sbom|공급망|개인정보|가명정보|프라이버시|랜섬웨어|침해대응|취약점|악성코드|법령|규정|법률|전자금융|감독규정|컴플라이언스|규제 준수|망분리|csap|nist|보안 통제|보안 표준/i;

const SENSITIVE = /규정|법령|법률|금융|전자금융|컴플라이언스|규제|개인정보|isms|gdpr|망분리|감독규정|인증 의무|보안 정책/i;

const linkRe = /https?:\/\/[^\s)"'\]]+/g;
const rows = [];
const officialUrls = new Set();

for (const p of posts) {
  const c = p.content || '';
  const links = (c.match(linkRe) || []).map(u => u.replace(/[.,)]+$/, ''));
  let officialN = 0, communityN = 0, otherN = 0;
  for (const u of links) {
    if (OFFICIAL_HOST.test(u)) { officialN++; officialUrls.add(u); }
    else if (COMMUNITY_HOST.test(u)) communityN++;
    else otherN++;
  }
  const hay = `${p.title} ${(p.tags || []).join(' ')} ${p.category}`;
  const footer = FOOTER_KEYS.test(hay);
  const sensitive = SENSITIVE.test(hay) || p.category === '보안';

  let cls;
  if (officialN >= 1) cls = '공식 있음(본문)';
  else if (footer) cls = '푸터 자동연결만';
  else if (communityN >= 1 || otherN >= 1) cls = '커뮤니티/기타만';
  else cls = '무출처';

  const flag = sensitive && officialN === 0 && !/law\.go\.kr|isms\.kisa|fsec/i.test(c) ? '⚠법·금융·보안 1차출처 없음' : '';
  rows.push({ id: p.id, slug: p.slug, title: p.title, category: p.category,
    status: noindexSet.has(p.slug) ? 'noindex' : 'index', officialN, communityN, cls, flag,
    sensitive });
}

// 본문 공식 링크 HTTP 상태 확인 (distinct, 최대 120개 배치)
const urlList = [...officialUrls].slice(0, 120);
const broken = [];
async function head(u) { try { const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0' } }); return r.status; } catch { return 0; } }
let done = 0;
await Promise.all(urlList.map(async u => { const s = await head(u); done++; if (s === 0 || s >= 400) broken.push([u, s]); }));

const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
const csv = ['id,slug,제목,카테고리,색인,공식링크수,커뮤니티수,분류,플래그'].concat(
  rows.sort((a, b) => a.officialN - b.officialN).map(r => [r.id, r.slug, r.title, r.category, r.status, r.officialN, r.communityN, r.cls, r.flag].map(esc).join(','))
).join('\n');
writeFileSync('SOURCE_AUDIT.csv', '﻿' + csv);

const by = {};
for (const r of rows) by[r.cls] = (by[r.cls] || 0) + 1;
const byIdx = {};
for (const r of rows) if (r.status === 'index') byIdx[r.cls] = (byIdx[r.cls] || 0) + 1;
console.log(`발행 ${posts.length}편 본문 출처 분류 (괄호=색인 중):`);
for (const k of ['공식 있음(본문)', '푸터 자동연결만', '커뮤니티/기타만', '무출처']) console.log(`  ${k.padEnd(16)} ${String(by[k] || 0).padStart(3)}편  (색인 ${byIdx[k] || 0})`);

const flagged = rows.filter(r => r.flag && r.status === 'index');
console.log(`\n⚠ 법·금융·보안 글인데 1차출처 없음 (색인 중) ${flagged.length}편:`);
flagged.slice(0, 12).forEach(r => console.log(`  #${r.id} ${r.title.slice(0, 50)}`));

console.log(`\n본문 공식링크 HTTP 점검: ${urlList.length}개 중 문제 ${broken.length}개`);
broken.slice(0, 15).forEach(([u, s]) => console.log(`  [${s}] ${u.slice(0, 80)}`));
console.log('\n전체: SOURCE_AUDIT.csv');
