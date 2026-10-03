// 특정 시점의 자료로만 읽어야 하는 글(회고·과거 기준 비교).
//
// - 글 상단에 기준 시점 안내와 현재 자료 링크를 코드로 표시한다(본문 DB 상태와 무관하게 동일).
// - 홈 큐레이션(최신 글·리딩 레인)에서는 제외한다. 아카이브·카테고리·검색·직접 URL로는 그대로 열린다.
//   크롤러와 사용자에게 같은 내용을 보여준다(클로킹 없음).
// - 원래 발행일은 바꾸지 않는다. 날짜만 바꿔 현재 글처럼 보이게 하지 말 것.
//
// 새 항목은 실제로 기준 시점이 지난 글에만 추가하고 docs/adsense-audit/README.md의 목록과 맞춘다.

export interface HistoricalNote {
  /** 본문이 근거로 삼는 기준 시점(예: '2024'). */
  asOf: string;
  /** 같은 주제의 현재형 글(사이트 내부). 없으면 생략. */
  currentSlug?: string;
  /** 현재 상태를 확인할 1차 자료. */
  currentSources: { label: string; url: string }[];
}

export const HISTORICAL_POSTS: Record<string, HistoricalNote> = {
  // posts.id 400 — 2026-05-31 발행, 2024년 발표 모델(GPT-4o·Claude 3.5 Sonnet·Llama 3) 기준.
  '2024년-llm-모델-선택-가이드-gpt-4o부터-claude-35까지-산업별-최적-ai-엔진-고르는-법': {
    asOf: '2024',
    currentSlug: 'llm-모델-선택-가이드-비용-대비-성능으로-최적-모델-찾기',
    currentSources: [
      { label: 'OpenAI models', url: 'https://developers.openai.com/api/docs/models' },
      { label: 'Anthropic (Claude) models', url: 'https://platform.claude.com/docs/en/models/overview' },
      { label: 'Gemini models', url: 'https://ai.google.dev/gemini-api/docs/models' },
      { label: 'Meta Llama models', url: 'https://dev.meta.ai/llama/docs/model-cards-and-prompt-formats' },
    ],
  },
};

export const HISTORICAL_POST_SLUGS = new Set(Object.keys(HISTORICAL_POSTS));

export function historicalNote(slug: string): HistoricalNote | null {
  return HISTORICAL_POSTS[slug] ?? null;
}
