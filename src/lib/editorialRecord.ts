// 글별 편집·검증 기록 해석기.
//
// 기록은 posts.content_evidence(jsonb)에 둔다 — 스키마 변경 없이 배포 순서와 무관하게 동작한다.
//   {
//     "verifiedAt": "2026-10-02",            // 사람이 실제로 확인한 날짜(YYYY-MM-DD)
//     "reviewScope": "공식 발표일과 비교 방법만 확인; 모델 시험 없음", // 무엇을 확인했고 무엇은 안 했는지
//     "environment": "Kubernetes 1.31 (kind) · kubectl 1.31",      // 명령을 실제로 실행한 환경(없으면 비움)
//     "changeSummary": "회고 자료로 재구성, 근거 없는 순위 삭제",     // 실질적 본문 변경 요약
//     "contentUpdatedAt": "2026-10-02",      // 실질적 본문 변경일(편집자가 명시할 때만)
//     "officialSources": [{ "label": "...", "url": "https://..." }]
//   }
//
// 원칙
// - posts.updated_at은 행이 바뀐 시각일 뿐이다. 번역(content_evidence.en) 일괄 추가·태그 정리 같은
//   배치 작업에서도 트리거(set_post_content_updated_at)가 갱신하므로, 독자에게 "업데이트"로
//   보여주거나 sitemap lastmod/dateModified로 쓰지 않는다. 대신 contentUpdatedAt만 쓴다.
// - 배지·검증 블록은 필드가 실제로 채워진 글에만 노출한다. 비어 있으면 아무것도 표시하지 않는다.
// - 이 모듈은 값을 만들어내지 않는다. 기록을 생성·추정·일괄 스탬프하지 말 것.

export interface SourceRef { label: string; url: string }

export interface EditorialRecord {
  verifiedAt: string | null;
  reviewScope: string | null;
  environment: string | null;
  changeSummary: string | null;
  contentUpdatedAt: string | null;
  sources: SourceRef[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ][0-9:.+\-Z]*)?$/;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function date(v: unknown): string | null {
  const s = str(v);
  if (!s || !ISO_DATE.test(s)) return null;
  return Number.isNaN(new Date(s).getTime()) ? null : s;
}

function sources(v: unknown): SourceRef[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const { label, url } = item as { label?: unknown; url?: unknown };
    const u = str(url);
    if (!u || !/^https:\/\//.test(u)) return [];
    return [{ label: str(label) ?? u.replace(/^https:\/\//, '').split('/')[0], url: u }];
  });
}

export function readEditorialRecord(evidence: unknown): EditorialRecord {
  const e = (evidence && typeof evidence === 'object' ? evidence : {}) as Record<string, unknown>;
  return {
    verifiedAt: date(e.verifiedAt),
    reviewScope: str(e.reviewScope),
    environment: str(e.environment),
    changeSummary: str(e.changeSummary),
    contentUpdatedAt: date(e.contentUpdatedAt),
    sources: sources(e.officialSources),
  };
}

/** 검증 기록 배지: 확인일 + 확인 범위 + 1개 이상의 출처가 모두 있을 때만. */
export function hasVerificationRecord(r: EditorialRecord): boolean {
  return Boolean(r.verifiedAt && r.reviewScope && r.sources.length > 0);
}

/**
 * 독자에게 보여줄 "실질 업데이트" 날짜. 편집자가 contentUpdatedAt과 changeSummary를 함께
 * 남긴 경우에만 반환한다(무엇이 바뀌었는지 설명 없는 날짜 표시는 하지 않는다).
 */
export function substantiveUpdate(r: EditorialRecord, publishedAt: string | null | undefined): string | null {
  if (!r.contentUpdatedAt || !r.changeSummary) return null;
  if (publishedAt && new Date(r.contentUpdatedAt).getTime() <= new Date(publishedAt).getTime()) return null;
  return r.contentUpdatedAt;
}
