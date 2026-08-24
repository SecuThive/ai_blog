/**
 * 얇은 analytics 추상화 — 이미 layout.tsx에 설치된 GA4(gtag)로 이벤트를 전달한다.
 * 별도 분석 서비스는 추가하지 않는다. gtag가 없거나(광고 차단, SSR 등) 실패해도
 * 절대 예외를 던지지 않는다 — 링크 이동·복사 같은 실제 기능은 analytics 유무와 무관하게 동작해야 한다.
 *
 * 개인정보 원칙: 현재 경로, 대상 slug/카테고리, 링크 위치, 코드 언어 등 "무엇을 클릭했는지"를
 * 식별하는 데 필요한 최소 정보만 전송한다. 검색어 원문, 코드 내용, 이메일, IP, 사용자 식별자는
 * 절대 포함하지 않는다.
 */

export type AnalyticsEvent =
  | { name: 'related_post_click'; path: string; target_slug: string; position: number }
  | { name: 'toc_click'; path: string; heading_id: string }
  | { name: 'code_copy'; path: string; language: string }
  | { name: 'category_click'; path: string; category: string; position?: string }
  | { name: 'outbound_link_click'; path: string; domain: string };

type Gtag = (...args: unknown[]) => void;

export function trackEvent(event: AnalyticsEvent): void {
  try {
    if (typeof window === 'undefined') return;
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag !== 'function') return;
    const { name, ...params } = event;
    gtag('event', name, params);
  } catch {
    // analytics 실패가 실제 기능(내비게이션·복사 등)을 막아서는 안 된다.
  }
}
