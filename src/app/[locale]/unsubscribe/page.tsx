import type { Metadata } from 'next';
import UnsubscribeForm from '@/components/UnsubscribeForm';
import { isLocale } from '@/i18n/config';
import { UNSUBSCRIBE_CONTACT } from '@/lib/unsubscribeToken';

// 수신거부 화면: 검색 색인·광고 대상 아님. 토큰 서명 검증은 POST /api/unsubscribe에서만 한다.
export const dynamic = 'force-dynamic';

const COPY = {
  ko: {
    title: '뉴스레터 구독 해지',
    lead: '아래 버튼을 누르면 이 메일 주소로 Nodelog 뉴스레터가 더 이상 발송되지 않습니다.',
    legacy: '예전 메일의 해지 링크는 보안상 더 이상 사용하지 않습니다. 가장 최근에 받은 메일의 해지 링크를 쓰거나, 아래 주소로 해지를 요청해 주세요.',
    missing: '해지 링크가 올바르지 않습니다. 메일의 링크를 다시 열거나, 아래 주소로 해지를 요청해 주세요.',
    contact: '이메일로 요청',
  },
  en: {
    title: 'Unsubscribe from the newsletter',
    lead: 'Press the button below to stop receiving the Nodelog newsletter at this address.',
    legacy: 'Unsubscribe links in older emails are no longer accepted for security reasons. Use the link in the most recent email, or ask us by email below.',
    missing: 'This unsubscribe link is not valid. Open the link from the email again, or ask us by email below.',
    contact: 'Request by email',
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  return { title: COPY[locale].title, robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string | string[]; legacy?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const c = COPY[locale];
  const sp = await searchParams;
  const token = typeof sp.t === 'string' && /^\d{1,15}\.[A-Za-z0-9_-]{32}$/.test(sp.t) ? sp.t : null;
  const mailto = `mailto:${UNSUBSCRIBE_CONTACT}?subject=${encodeURIComponent(locale === 'ko' ? 'Nodelog 뉴스레터 구독 해지 요청' : 'Nodelog newsletter unsubscribe request')}`;

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '72px 24px 96px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-1)' }}>{c.title}</h1>
      {token ? (
        <>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 24px' }}>{c.lead}</p>
          <UnsubscribeForm token={token} locale={locale} />
        </>
      ) : (
        <p style={{ color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 24px' }}>{sp.legacy ? c.legacy : c.missing}</p>
      )}
      <p style={{ marginTop: 32, fontSize: 14, color: 'var(--text-3)' }}>
        <a href={mailto} style={{ color: 'var(--acc-blue)' }}>{c.contact}</a> · {UNSUBSCRIBE_CONTACT}
      </p>
    </main>
  );
}
