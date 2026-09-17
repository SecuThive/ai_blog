import { permanentRedirect } from 'next/navigation';

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // /blog 목록은 홈(/)으로 영구 통합 — 308로 SEO 신호 명확화
  permanentRedirect(locale === 'en' ? '/en' : '/');
}
