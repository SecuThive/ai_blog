import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
