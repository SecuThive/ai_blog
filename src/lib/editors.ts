// 고정 편집자 프로필 (E-E-A-T 강화용).
//
// ⚠️ 여기에는 반드시 "실제" 정보만 넣으세요. 가짜 이름·경력을 넣으면
//    지금 개선하려는 신뢰성 문제를 오히려 악화시키고 Google 정책에도 어긋납니다.
//    실명이 부담되면 "고정 필명"은 괜찮습니다(단 실제 담당 분야·경험은 사실이어야 함).
//
// 배열이 비어 있으면 /author 의 "편집자 소개" 섹션과 Person 스키마는 렌더되지 않습니다.
// 실제 항목을 추가하면 프로필 카드 + JSON-LD(Person)가 자동으로 노출됩니다.
//
export interface Editor {
  /** 실명 또는 고정 필명 */
  name: string;
  /** 필명이면 true (화면에 "필명" 표기) */
  penName?: boolean;
  /** 한 줄 직함 — 예: "인프라·인증·보안 편집자" */
  title: string;
  /** 담당/검토 분야 태그 — 예: ["Linux 서버", "IAM", "네트워크 장애 분석"] */
  expertise: string[];
  /** 실무 경험 한두 문장 (사실만) */
  bio: string;
  /** 주로 검토하는 콘텐츠 카테고리 — posts.category / 가이드 카테고리와 맞추면 좋음 */
  reviews: string[];
  /** 아바타 이니셜(2자). 없으면 name 앞 2자 사용 */
  initials?: string;
  /** 외부 프로필 (선택) — Person 스키마 sameAs 로도 쓰임 */
  links?: { label: string; url: string }[];
}

// 실제 편집자를 여기에 추가하세요. 비어 있으면 섹션이 노출되지 않습니다.
export const EDITORS: Editor[] = [];

export function editorInitials(e: Editor): string {
  return (e.initials ?? e.name.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 2)).toUpperCase();
}
