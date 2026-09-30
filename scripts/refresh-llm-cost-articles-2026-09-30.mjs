// Replace stale, unsourced price claims in #102 and #103 with a dated method.
// Usage: node scripts/refresh-llm-cost-articles-2026-09-30.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
function section(body, start, end, replacement) {
  const a = body.indexOf(start), b = body.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error(`Section marker missing: ${start}`);
  return body.slice(0, a) + replacement.trim() + '\n\n' + body.slice(b);
}
function refresh102(body, en) {
  body = section(body,
    en ? '## Cost and Performance Comparison of Major Models (as of 2025)' : '## 주요 모델 비용·성능 비교 (2025년 기준)',
    en ? '## Recommended Models by Task Type' : '## 태스크 유형별 추천 모델',
    en ? `## Compare Current Models, Then Measure Your Workload

Model names, availability, limits, and prices change. As checked on 2026-09-30, use each provider's current model catalog and price page before selecting candidates. Keep the model version and price date with every evaluation result.

- [OpenAI model catalog](https://developers.openai.com/api/docs/models/all) · [pricing](https://developers.openai.com/api/docs/pricing)
- [Anthropic model overview](https://docs.anthropic.com/en/docs/about-claude/models/overview) · [pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Google Gemini models](https://ai.google.dev/gemini-api/docs/models) · [pricing](https://ai.google.dev/gemini-api/docs/pricing)

Compare quality, format compliance, p95 latency, and cost per 1,000 requests on the same representative test set. The model IDs below illustrate routing only; verify availability in your account before calling them.`
      : `## 현재 모델을 확인하고 실제 요청으로 비교하기

모델 이름·지원 범위·단가는 바뀝니다. 2026-09-30 확인 기준, 후보를 고르기 전에 각 공급사의 모델 목록과 가격표를 다시 확인하고 평가 결과에 모델 버전과 가격 확인일을 함께 기록하세요.

- [OpenAI 모델 목록](https://developers.openai.com/api/docs/models/all) · [가격표](https://developers.openai.com/api/docs/pricing)
- [Anthropic 모델 목록](https://docs.anthropic.com/en/docs/about-claude/models/overview) · [가격표](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Google Gemini 모델 목록](https://ai.google.dev/gemini-api/docs/models) · [가격표](https://ai.google.dev/gemini-api/docs/pricing)

같은 평가 세트에서 품질·형식 준수율·p95 지연·1,000건당 비용을 비교합니다. 아래 모델 ID는 라우팅 구조 예시이며 계정에서의 사용 가능 여부를 확인한 뒤 호출해야 합니다.`);
  body = body.replace(/[^\n]*17(?:배|x) [^\n]*/g, (line) => line.replace(/17(?:배|x) [^\n]*/, en ? '— verify the price difference on the current price pages' : '— 가격 차이는 현재 가격표로 확인'));
  body = body.replace(/[^\n]*(?:월 수백만 원 절감|millions of won per month)[^\n]*\n?/g, '');
  body = body.replace(/[^\n]*(?:40~60%|40–60%|40-60%)[^\n]*\n?/g, '');
  body = section(body, en ? '## Cost Monitoring' : '## 비용 모니터링',
    en ? '## Comparing Candidate Models on Your Own Data' : '## 후보 모델을 우리 데이터로 비교하는 평가 절차',
    en ? `## Cost Monitoring

Store current input and output rates outside the article and record the source and check date. Do not silently treat an unknown model as free.

\x60\x60\x60python
def calculate_cost(input_tokens, output_tokens, input_rate_per_m, output_rate_per_m):
    return (input_tokens * input_rate_per_m + output_tokens * output_rate_per_m) / 1_000_000
\x60\x60\x60`
      : `## 비용 모니터링

현재 입력·출력 단가를 글 밖의 설정에 보관하고 출처와 확인일을 기록합니다. 알 수 없는 모델의 비용을 0으로 처리하지 마세요.

\x60\x60\x60python
def calculate_cost(input_tokens, output_tokens, input_rate_per_m, output_rate_per_m):
    return (input_tokens * input_rate_per_m + output_tokens * output_rate_per_m) / 1_000_000
\x60\x60\x60`);
  return body;
}
function refresh103(body, en) {
  return section(body,
    en ? '## Cost Structure Comparison' : '## 비용 구조 비교',
    en ? '## When to Choose What' : '## 언제 무엇을 선택할 것인가',
    en ? `## Compare Costs with Your Own Inputs

As checked on 2026-09-30, published token prices and fine-tuning availability vary by provider and model. OpenAI announced in May 2026 that its fine-tuning platform is closed to new users. Confirm eligibility before planning a fine-tuning project. The older fixed figures in this article have been removed.

For each option, record: input and output tokens per request, monthly request volume, retrieval and storage cost, evaluation labor, and any training and retraining cost. Calculate token cost as \x60(input_tokens × input_rate + output_tokens × output_rate) / 1,000,000\x60 using a dated official price list. Measure retrieval and prompt overhead on the same evaluation set.

Sources: [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [OpenAI fine-tuning availability update](https://openai.com/index/gpt-4o-fine-tuning/), [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing). No model API or workload cost was tested for this comparison.`
      : `## 실제 사용량으로 비용 비교하기

2026-09-30 확인 기준, 토큰 단가와 파인튜닝 사용 가능 여부는 공급사·모델별로 다릅니다. OpenAI는 2026년 5월 신규 사용자의 파인튜닝 플랫폼 접근 종료를 공지했습니다. 도입 계획 전에 계정의 이용 자격을 확인하세요. 이 글의 근거 없는 고정 금액 예시는 제거했습니다.

각 방안에 대해 요청당 입력·출력 토큰, 월 요청량, 검색·저장 비용, 평가 인건비, 학습·재학습 비용을 기록합니다. 토큰 비용은 확인일이 있는 공식 단가를 사용해 \x60(입력 토큰 × 입력 단가 + 출력 토큰 × 출력 단가) / 1,000,000\x60으로 계산합니다. 같은 평가 세트에서 검색과 프롬프트의 추가 토큰도 측정하세요.

출처: [OpenAI 가격표](https://developers.openai.com/api/docs/pricing), [OpenAI 파인튜닝 이용 변경 공지](https://openai.com/index/gpt-4o-fine-tuning/), [Anthropic 가격표](https://docs.anthropic.com/en/docs/about-claude/pricing). 이 비교에서 모델 API 호출이나 실제 업무 비용 측정은 수행하지 않았습니다.`);
}
const rows = [];
for (const id of [102, 103]) {
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,content,content_evidence,updated_at');
  url.searchParams.set('id', `eq.${id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read #${id}: ${response.status}`);
  const [before] = await response.json();
  const evidence = structuredClone(before.content_evidence);
  const edit = id === 102 ? refresh102 : refresh103;
  const content = edit(before.content, false);
  evidence.en.content = edit(evidence.en.content, true);
  rows.push({ before, after: { content, content_evidence: evidence } });
  console.log(`#${id}: KO ${before.content.length}→${content.length}; EN ${before.content_evidence.en.content.length}→${evidence.en.content.length}`);
}
const backup = '/tmp/nodelog-llm-cost-backup-2026-09-30.json';
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
