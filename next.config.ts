import type { NextConfig } from "next";

// AdSense(광고 코드·프레임·트래픽 품질·동의 메시지), GA4, Cloudflare Web Analytics, Vercel Analytics.
const ADSENSE_SCRIPT = [
  "https://pagead2.googlesyndication.com",
  "https://tpc.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://partner.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://www.google.com",
  "https://www.gstatic.com",
];
const ADSENSE_FRAME = [
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://www.google.com",
];
const ADSENSE_CONNECT = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://www.google.com",
];
const GA = ["https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com"];

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ["script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com", ...ADSENSE_SCRIPT, "https://static.cloudflareinsights.com"].join(' '),
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  ["connect-src 'self'", ...GA, ...ADSENSE_CONNECT, "https://cloudflareinsights.com", "https://*.supabase.co"].join(' '),
  ["frame-src 'self'", ...ADSENSE_FRAME].join(' '),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

const nextConfig: NextConfig = {
  // 응답에서 프레임워크 버전을 공개하지 않는다.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // 피드 경로 별칭. 정식 피드는 /rss 하나뿐이지만, 디렉토리·RSS 애그리게이터·
  // 리더 상당수가 /rss.xml 이나 /feed 를 관례적으로 먼저 조회한다.
  // 별칭이 없으면 그런 제출처에서 "피드 없음"으로 판정돼 등재가 막힌다.
  async redirects() {
    return [
      { source: "/rss.xml", destination: "/rss", permanent: true },
      { source: "/feed", destination: "/rss", permanent: true },
      { source: "/feed.xml", destination: "/rss", permanent: true },
      { source: "/atom.xml", destination: "/rss", permanent: true },
      // nginx 502 블로그 중복 → /engineer/nginx-502-bad-gateway-fix 는 src/lib/postRedirects.ts에서 처리한다.
      // (여기 있던 한글 source 규칙은 프로덕션에서 매칭되지 않아 404였다. 2026-10-06)
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // 현재 레이아웃의 GA4·AdSense·Cloudflare Web Analytics·Pretendard를 허용하면서 기본 실행·임베드 범위를 닫는다.
          // inline은 Next/GA 초기화 스니펫에 필요하며, 데이터·코드에는 inline HTML을 실행하지 않는다.
          // AdSense 도메인 목록은 Google의 CSP 안내(support.google.com/adsense/answer/16283098)를 기준으로 한다.
          // 그 안내는 nonce 기반 strict CSP만 공식 지원하고 도메인 목록은 바뀔 수 있다고 밝힌다.
          // nonce는 요청마다 렌더링을 강제해 ISR 캐시를 잃으므로 지금은 목록 방식을 쓰고,
          // 배포 뒤 브라우저 콘솔·Report-Only로 위반을 확인한다(docs/adsense-audit/decisions.md).
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
