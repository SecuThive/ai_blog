// One-time editorial correction. Run with: node --env-file=.env.local scripts/fix-llm-2024-retrospective.mjs
// Keep the original published_at. The database trigger sets updated_at for the real content edit.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const id = 400;
const slug = '2024년-llm-모델-선택-가이드-gpt-4o부터-claude-35까지-산업별-최적-ai-엔진-고르는-법';
const currentGuide = '/blog/llm-모델-선택-가이드-비용-대비-성능으로-최적-모델-찾기';
const sources = [
  { label: 'OpenAI — Hello GPT-4o (2024-05-13)', url: 'https://openai.com/index/hello-gpt-4o/' },
  { label: 'Anthropic — Claude 3.5 Sonnet (2024-06)', url: 'https://www.anthropic.com/news/claude-3-5-sonnet' },
  { label: 'Meta — Introducing Llama 3 (2024-04-18)', url: 'https://ai.meta.com/blog/meta-llama-3/' },
];
const title = '2024년 출시 LLM 비교 자료: GPT-4o·Claude 3.5 Sonnet·Llama 3';
const excerpt = '2024년에 공개된 세 모델의 발표 시점과 공개 자료를 돌아보는 자료입니다. 현재 모델 선택에는 공급사 최신 문서와 자체 평가가 필요합니다.';
const content = `# ${title}

> **기록의 성격**: 2024년에 공개된 모델을 돌아보는 자료입니다. 이 글의 최초 발행 표시는 **2026년 5월 31일**입니다. Claude 3.5 Sonnet은 그 뒤인 2024년 6월에 공개됐으므로, 이 글을 2024년 당시 작성된 비교나 2026년 현재의 추천으로 읽어서는 안 됩니다. 최초 게시본에 있던 우열·산업별 성공 사례는 근거가 없어 이번 편집에서 삭제했습니다. 실제 API 호출이나 성능 시험은 수행하지 않았습니다.

현재 후보 모델을 고르는 절차는 [LLM 모델 선택 가이드](${currentGuide})에서 확인하고, 최종 모델 ID·지원 기능·요금·지원 종료일은 각 공급사의 최신 문서에서 다시 확인하세요.

## 공개 시점과 확인 가능한 범위

| 모델 | 2024년 공개 자료에서 확인되는 내용 | 이 표만으로 판단할 수 없는 것 |
| --- | --- | --- |
| GPT-4o | OpenAI가 2024년 5월 13일 텍스트·음성·이미지를 다루는 모델로 소개 | 현재 API 기능, 지역별 제공, 업무별 정확도 |
| Claude 3.5 Sonnet | Anthropic이 2024년 6월 Claude 3.5 계열의 첫 모델로 소개 | 현재 사용 가능한 버전, 실제 문서 처리 품질 |
| Llama 3 | Meta가 2024년 4월 Llama 3 계열을 발표 | 호스팅 비용, 배포 조건, 특정 장비의 처리량 |

위 항목은 각 회사의 **출시 발표**를 요약한 것입니다. 발표 자료는 동일한 입력과 조건으로 실행한 독립 비교가 아닙니다. 따라서 이 자료에서 '가장 정확하다', '가장 저렴하다', '규제에 적합하다'는 순위를 만들 수 없습니다. 특히 자체 호스팅은 인프라·운영 인력·보안 비용을 포함해야 하며, 모델이 로컬에서 실행된다는 사실만으로 규제 준수가 입증되지 않습니다.

## 지금 선택할 때 재사용할 수 있는 평가 절차

1. **업무와 실패 기준을 정의합니다.** 예를 들어 계약서 조항 추출이라면 누락·잘못된 인용·개인정보 노출 중 어느 오류가 허용 불가인지 먼저 정합니다.
2. **후보와 버전을 고정합니다.** 공급사의 현재 모델 목록, API 기능, 데이터 처리 조건, 가격표와 확인일을 기록합니다. 2024년 발표 모델을 그대로 후보로 가정하지 않습니다.
3. **같은 입력으로 비교합니다.** 실제 업무를 대표하는 허가된 샘플을 준비해 동일한 프롬프트·출력 형식·재시도 조건을 적용합니다. 평가 자료에 개인정보가 있으면 먼저 처리 근거와 보안 설정을 검토합니다.
4. **결과를 분리해 기록합니다.** 정답률, 필수 형식 준수율, 지연, 입력·출력 토큰, 실패 유형을 각각 기록합니다. 평균만 보지 말고 실패 사례를 검토합니다.
5. **월 비용을 계산합니다.** API 비용의 기본식은 월 호출 수 × ((호출당 평균 입력 토큰 × 입력 단가/100만 토큰) + (호출당 평균 출력 토큰 × 출력 단가/100만 토큰))입니다. 저장, 검색, 네트워크, 운영 인력 등은 별도 항목입니다. 단가와 기능은 변하므로 이 글에 수치를 고정하지 않습니다.
6. **전환과 복구를 준비합니다.** 모델 ID를 설정에서 관리하고, 새 버전은 기존 평가 세트로 재평가한 뒤 단계적으로 전환합니다. 형식 오류나 지연이 기준을 넘으면 이전 구성으로 되돌릴 조건을 정합니다.

## 출처와 한계

- [OpenAI, GPT-4o 발표](https://openai.com/index/hello-gpt-4o/) — 2024년 5월 13일
- [Anthropic, Claude 3.5 Sonnet 발표](https://www.anthropic.com/news/claude-3-5-sonnet) — 2024년 6월
- [Meta, Llama 3 발표](https://ai.meta.com/blog/meta-llama-3/) — 2024년 4월 18일

이 글은 발표 시점과 선택 방법을 정리한 문헌 검토입니다. 특정 산업의 적합성, 보안 인증, 성능 또는 비용 우위는 검증하지 않았습니다.
`;
const enTitle = '2024 LLM releases: GPT-4o, Claude 3.5 Sonnet, and Llama 3';
const enExcerpt = 'A retrospective on three 2024 model announcements, with a method for evaluating current candidates. It is not a current model ranking.';
const enContent = `# ${enTitle}

> **Historical scope:** This article was first published on **31 May 2026** and looks back at models announced in 2024. Claude 3.5 Sonnet was announced in June 2024. This is neither a comparison written in 2024 nor a current model recommendation. Unsupported rankings and hypothetical industry success stories from the previous version have been removed. No API or performance tests were run for this revision.

For a current selection process, see the [LLM model selection guide](${currentGuide}). Check model IDs, features, prices and retirement dates in each provider's current documentation before making a decision.

## What the 2024 announcements establish

| Model | Announcement | What it does not establish |
| --- | --- | --- |
| GPT-4o | OpenAI introduced it on 13 May 2024 for text, audio and vision | Current API availability or accuracy on your task |
| Claude 3.5 Sonnet | Anthropic introduced the first Claude 3.5 model in June 2024 | Current version or performance on your documents |
| Llama 3 | Meta announced the family on 18 April 2024 | Your hosting cost, throughput or deployment conditions |

These are vendor announcements, not results of an independent test under shared conditions. They cannot justify a ranking for accuracy, cost or regulatory suitability. Self-hosting also incurs hardware, operations and security costs; it does not by itself establish compliance.

## A repeatable selection method

1. Define the task and unacceptable errors, such as missed clauses, unsupported citations or disclosure of personal information.
2. Fix candidate model versions and record when you checked their current documentation, data terms and prices.
3. Use the same authorized representative inputs, prompts, output format and retry rules for every candidate.
4. Record accuracy, format compliance, latency, input and output tokens, and failure cases separately.
5. Estimate API cost as monthly calls × ((mean input tokens × input price per million) + (mean output tokens × output price per million)) / 1,000,000. Account for storage, retrieval and operations separately.
6. Keep model IDs in configuration. Re-evaluate before switching and define a rollback threshold for errors or latency.

## Primary sources and limits

- [OpenAI: GPT-4o announcement](https://openai.com/index/hello-gpt-4o/)
- [Anthropic: Claude 3.5 Sonnet announcement](https://www.anthropic.com/news/claude-3-5-sonnet)
- [Meta: Llama 3 announcement](https://ai.meta.com/blog/meta-llama-3/)

This is a review of announcements and an evaluation method. It does not verify industry fitness, certification, benchmark performance or cost advantage.
`;

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: previous, error: readError } = await client.from('posts').select('*').eq('id', id).single();
if (readError || previous?.slug !== slug) throw new Error(`Unexpected source row: ${readError?.message ?? previous?.slug}`);
if (previous.title === title) { console.log('Already corrected.'); process.exit(0); }
if (!previous.title.startsWith('2024년 LLM 모델 선택 가이드:')) throw new Error('Source title changed; review manually.');
writeFileSync('/tmp/nodelog-post-400-before-correction.json', JSON.stringify(previous, null, 2), { mode: 0o600 });
const evidence = { ...(previous.content_evidence ?? {}), en: { title: enTitle, excerpt: enExcerpt, content: enContent }, officialSources: sources, reviewScope: 'Primary announcement dates and comparison method; no model test or industry validation', verifiedAt: '2026-10-02', changeSummary: 'Reframed as a retrospective; removed unsupported rankings and example outcomes' };
const { data: changed, error } = await client.from('posts').update({ title, excerpt, content, content_evidence: evidence }).eq('id', id).eq('slug', slug).eq('published_at', previous.published_at).select('id,slug,title,published_at,updated_at').single();
if (error || !changed) throw new Error(`Update failed: ${error?.message}`);
console.log(changed);
