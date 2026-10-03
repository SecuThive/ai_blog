import { adsenseClientId } from '@/lib/adsense';

/**
 * AdSense 로더(서버 컴포넌트). 콘텐츠가 확인된 페이지(홈·실재하는 색인 글·가이드)에서만 렌더링한다.
 * 범위 규칙은 src/lib/adsense.ts 참고. React 19는 async <script src>를 <head>로 올리고 중복 제거한다.
 * 수동 광고 단위(<ins>)는 두지 않는다.
 */
export default function AdSenseLoader() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId()}`}
      crossOrigin="anonymous"
    />
  );
}
