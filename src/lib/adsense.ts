// AdSense 로더 범위 규칙.
//
// Google 게시자 정책(콘텐츠 없는 화면 11112688)에 맞춰 광고 스크립트는 "게시자 콘텐츠가 있는 화면"에서만
// 서버 렌더링 단계에서 출력한다. 레이아웃 전역 삽입은 하지 않는다. 그래서 다음 화면에는 로더가 없다:
//   404(not-found)·error·존재하지 않는 카테고리/태그/시리즈, 검색(결과 0건 포함)·태그·카테고리·시리즈 목록,
//   북마크, 문의·구독·구독 해지(완료 화면 포함), 개인정보·약관 등 고지 페이지, noindex 글(NOINDEX_POST_SLUGS),
//   본문이 없는 영어 대체 화면. LABS/ENTERPRISE 'COMING SOON'은 별도 화면이 없고 홈 안의 비링크 카드다.
// 허용: 홈, 실재하고 색인 대상인 블로그 글(본문 있음), 실재하는 엔지니어 가이드(본문 있음).
//
// 게시자 ID 값은 기존과 동일하게 NEXT_PUBLIC_ADSENSE_ID(미설정 시 기존 기본값)를 쓴다.
import { NOINDEX_POST_SLUGS } from './noindexPosts';

export function adsenseClientId(): string {
  return process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-2091277631590195';
}

/** 블로그 글 화면에 로더를 둘지. 글이 실제로 조회되고 본문이 렌더링되는 경우에만 호출할 것. */
export function isAdEligiblePost(slug: string, hasRenderedBody: boolean): boolean {
  return hasRenderedBody && !NOINDEX_POST_SLUGS.has(slug);
}
