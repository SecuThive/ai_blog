// Differentiate overlapping published RAG and prompt articles without changing URLs.
// Usage: node scripts/scope-rag-prompt-articles-2026-09-30.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
const plan = {
  289: { ko: 'RAG 개념과 환각 유형별 대응: 검색 증강 생성 입문', en: 'RAG Fundamentals: Retrieval-Augmented Generation and Hallucination Types',
    koScope: 'RAG의 기본 흐름과 환각 유형별 대응을 설명합니다. 실행 가능한 파이프라인 구성은 LangChain·ChromaDB 실습 글에서 다룹니다.',
    enScope: 'This article explains the RAG flow and how to respond to different hallucination types. The LangChain and ChromaDB hands-on article covers implementation.' },
  404: { ko: 'LangChain·ChromaDB RAG 실습: 청킹·임베딩·검색 점검', en: 'LangChain and ChromaDB RAG Lab: Chunking, Embeddings, and Retrieval Checks',
    koScope: '문서 로딩부터 검색 결과 점검까지 구현 단계에 집중합니다. RAG의 개념과 환각 분류는 입문 글에서 먼저 확인하세요.',
    enScope: 'This lab focuses on implementation from document loading to retrieval checks. Start with the RAG fundamentals article for concepts and hallucination types.' },
  676: { ko: '사내 문서 챗봇 도입 로드맵: RAG 구축 범위와 운영 준비', en: 'Internal-Document Chatbot Roadmap: RAG Scope and Operational Readiness',
    koScope: '사내 문서를 활용할 때의 도입 범위와 운영 체크리스트를 다룹니다. 검색 알고리즘과 재순위화는 별도의 검색 설계 글에서 다룹니다.',
    enScope: 'This roadmap covers adoption scope and operational checks for internal documents. Retrieval design and reranking are covered in separate articles.' },
  683: { ko: '사내 문서 RAG 아키텍처: 하이브리드 검색 설계', en: 'Internal-Document RAG Architecture: Hybrid Retrieval Design',
    koScope: '벡터 검색과 키워드 검색을 결합하는 설계 선택에 집중합니다. 도입 순서와 조직 준비는 사내 문서 챗봇 로드맵에서 다룹니다.',
    enScope: 'This article focuses on combining vector and keyword search. The internal-document chatbot roadmap covers adoption and organizational readiness.' },
  708: { ko: 'RAG 검색 품질 점검: 청킹·재순위화·출처 표시', en: 'RAG Retrieval Quality Checks: Chunking, Reranking, and Citations',
    koScope: '검색 결과가 엉뚱하거나 근거를 제시하지 못할 때 확인할 청킹·재순위화·출처 표시를 정리합니다. RAG 도입 계획 자체는 로드맵 글에서 다룹니다.',
    enScope: 'Use this checklist when retrieval misses relevant evidence or answers omit citations. The chatbot roadmap covers adoption planning.' },
  672: { ko: 'R-C-T-F 프롬프트 템플릿: 역할·맥락·작업·형식', en: 'R-C-T-F Prompt Template: Role, Context, Task, and Format',
    koScope: '복사해 수정할 수 있는 R-C-T-F 템플릿의 각 요소에 집중합니다. 답변 실패 원인을 진단하는 순서는 별도 글에서 다룹니다.',
    enScope: 'This article explains each part of the reusable R-C-T-F template. A separate guide covers diagnosis when an answer misses the target.' },
  677: { ko: '프롬프트 작성 원칙: 역할·예시·출력 형식', en: 'Prompt Writing Principles: Roles, Examples, and Output Formats',
    koScope: '역할 지정, 예시 제공, 출력 형식 지정의 원칙과 적용 시점을 설명합니다. 완성형 템플릿은 R-C-T-F 글에서, 실패 진단은 수정 순서 글에서 다룹니다.',
    enScope: 'This article explains when to use roles, examples, and output formats. See the R-C-T-F guide for a template and the troubleshooting guide for failed outputs.' },
  720: { ko: 'ChatGPT 답변이 어긋날 때: 프롬프트 진단과 수정 순서', en: 'When ChatGPT Misses the Target: A Prompt Diagnosis and Revision Sequence',
    koScope: '원하는 답변이 나오지 않을 때 요청의 맥락·예시·출력 조건을 순서대로 점검합니다. 처음부터 작성하는 템플릿은 R-C-T-F 글에서 다룹니다.',
    enScope: 'When an answer misses the target, check context, examples, and output constraints in sequence. The R-C-T-F article covers drafting a template from scratch.' },
};
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
const rows = [];
function addScope(body, heading, scope) {
  body = body.replace(/^# [^\n]*\n\n?/, '');
  if (body.includes(heading)) throw new Error(`Scope already exists: ${heading}`);
  return `${heading}\n\n${scope}\n\n${body}`;
}
for (const [idText, edit] of Object.entries(plan)) {
  const id = Number(idText);
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,title,excerpt,content,tags,content_evidence,updated_at');
  url.searchParams.set('id', `eq.${id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read #${id}: ${response.status}`);
  const [before] = await response.json();
  const evidence = structuredClone(before.content_evidence);
  const tags = [...before.tags];
  const titleTag = tags.findIndex((tag) => tag.startsWith('i18n.title:'));
  const excerptTag = tags.findIndex((tag) => tag.startsWith('i18n.excerpt:'));
  if (titleTag < 0 || excerptTag < 0 || !evidence?.en?.content) throw new Error(`Translation missing #${id}`);
  tags[titleTag] = `i18n.title:${edit.en}`;
  tags[excerptTag] = `i18n.excerpt:${edit.enScope}`;
  evidence.en.title = edit.en;
  evidence.en.excerpt = edit.enScope;
  evidence.en.content = addScope(evidence.en.content, '## Scope', edit.enScope);
  const after = { title: edit.ko, excerpt: edit.koScope, tags, content: addScope(before.content, '## 이 글의 범위', edit.koScope), content_evidence: evidence };
  rows.push({ before, after });
  console.log(`#${id} ${before.title} → ${edit.ko}`);
}
const backup = '/tmp/nodelog-rag-prompt-scope-backup-2026-09-30.json';
if (apply) writeFileSync(backup, JSON.stringify(rows.map(({ before }) => before), null, 2), { flag: 'wx' });
for (const { before, after } of rows) {
  if (!apply) continue;
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('id', `eq.${before.id}`);
  url.searchParams.set('updated_at', `eq.${before.updated_at}`);
  const response = await fetch(url, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(after) });
  if (!response.ok || (await response.json()).length !== 1) throw new Error(`Update failed #${before.id}: ${response.status}`);
}
console.log(apply ? `Updated ${rows.length}. Backup: ${backup}` : 'Dry run');
