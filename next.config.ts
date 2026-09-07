import type { NextConfig } from "next";

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
          // 현재 레이아웃의 GA4·AdSense·Pretendard를 허용하면서 기본 실행·임베드 범위를 닫는다.
          // inline은 Next/GA 초기화 스니펫에 필요하며, 데이터·코드에는 inline HTML을 실행하지 않는다.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://*.googlesyndication.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "font-src 'self' https://cdn.jsdelivr.net data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.vercel-analytics.com https://*.supabase.co",
              "frame-src 'self' https://googleads.g.doubleclick.net https://*.googlesyndication.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
