import { permanentRedirect } from 'next/navigation';

export default function BlogPage() {
  // /blog 목록은 홈(/)으로 영구 통합 — 308로 SEO 신호 명확화
  permanentRedirect('/');
}
