// AdSense 로더 범위 규칙.
//
// Google 게시자 정책(콘텐츠 없는 화면 11112688)에 맞춰 광고 스크립트는 "게시자 콘텐츠가 있는 화면"에서만
// 서버 렌더링 단계에서 출력한다. 레이아웃 전역 삽입은 하지 않는다. 그래서 다음 화면에는 로더가 없다:
//   404(not-found)·error·존재하지 않는 카테고리/태그/시리즈, 검색(결과 0건 포함)·태그·카테고리·시리즈 목록,
//   북마크, 문의·구독·구독 해지(완료 화면 포함), 개인정보·약관 등 고지 페이지, noindex 글(NOINDEX_POST_SLUGS),
//   본문이 없는 영어 대체 화면. LABS/ENTERPRISE 'COMING SOON'은 별도 화면이 없고 홈 안의 비링크 카드다.
// 허용: 홈, 실재하고 색인 대상인 블로그 글(본문 있음), 실재하는 엔지니어 가이드(본문 있음).
//
// 게시자 ID: NEXT_PUBLIC_ADSENSE_ID(ca-pub-숫자). 미설정이거나 형식이 틀리면 기존 기본값을 쓴다.
// 로더(<script ?client=>)와 /ads.txt가 모두 이 함수 하나에서 값을 받으므로 두 곳의 게시자 ID가 어긋날 수 없다.
//
// 승인 게이트(NEXT_PUBLIC_ADSENSE_APPROVED)는 두지 않는다. main 10971e6이 넣었던 게이트는 Vercel에 그 변수가
// 없어 심사 중인 사이트의 모든 페이지에서 AdSense 코드를 없앴다(2026-10-06 재점검 0절 2번). 심사·사이트 확인에는
// 콘텐츠 페이지에 코드가 있어야 하므로, 노출 범위는 아래 페이지 규칙으로만 제한한다.
import { NOINDEX_POST_SLUGS } from './noindexPosts';

const DEFAULT_ADSENSE_CLIENT_ID = 'ca-pub-2091277631590195';
const CLIENT_ID_RE = /^ca-pub-\d{10,20}$/;

export function adsenseClientId(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ADSENSE_ID ?? '').trim();
  return CLIENT_ID_RE.test(fromEnv) ? fromEnv : DEFAULT_ADSENSE_CLIENT_ID;
}

/** ads.txt용 게시자 ID(pub-숫자). 로더와 같은 값에서 'ca-'만 뗀다. */
export function adsensePublisherId(): string {
  return adsenseClientId().replace(/^ca-/, '');
}

/** 블로그 글 화면에 로더를 둘지. 글이 실제로 조회되고 본문이 렌더링되는 경우에만 호출할 것. */
export function isAdEligiblePost(slug: string, hasRenderedBody: boolean): boolean {
  return hasRenderedBody && !NOINDEX_POST_SLUGS.has(slug);
}
