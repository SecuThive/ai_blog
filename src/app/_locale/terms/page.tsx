import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '이용안내 — Nodelog',
  description: 'Nodelog 서비스 이용에 관한 기본 정책과 조건을 안내합니다.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: '이용안내 — Nodelog',
    description: 'Nodelog 서비스 이용에 관한 기본 정책과 조건을 안내합니다.',
    url: `${SITE_URL}/terms`,
    type: 'website',
  },
};

const SECTIONS = [
  ['1. 서비스 범위', 'Nodelog는 IT 분야의 큐레이션 콘텐츠를 제공하는 디지털 미디어입니다. 모든 콘텐츠는 정보 제공 목적이며, 특정 의사결정에 대한 법적·전문적 자문이 아닙니다.'],
  ['2. 콘텐츠 이용', '본 사이트의 콘텐츠는 개인 학습과 공유를 위해 자유롭게 인용 가능합니다(출처 표기 필수). 상업적 재배포는 별도 허락이 필요합니다.'],
  ['3. 저작권', '명시되지 않은 모든 콘텐츠의 저작권은 Nodelog와 원 저자에게 있습니다.'],
  ['4. 면책', 'Nodelog의 콘텐츠는 작성 시점의 정보에 기반하며, 시간 경과에 따른 변화로 발생하는 결과에 대해 책임지지 않습니다.'],
  ['5. 사이트 변경', 'Nodelog는 사전 통지 없이 사이트 구조, 디자인, 기능을 변경할 수 있습니다.'],
];

export default function TermsPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>이용안내</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>TERMS OF USE</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>이용안내</h1>
          <p className="page-lead">Nodelog를 이용하시는 데 있어 알아두셔야 할 기본 정책과 이용 조건입니다.</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.06em', marginTop: 18 }}>
            최종 업데이트 · 2026.04.30 · 적용 시작일 2026.05.01
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {SECTIONS.map(([t, body]) => (
              <div key={t}>
                <h2 style={{ margin: '0 0 12px', fontSize: 19, letterSpacing: '-0.015em' }}>{t}</h2>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15.5, lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: 24, border: '1px solid var(--line-1)', borderRadius: 12, background: 'var(--bg-2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              이용 약관에 대해 궁금한 점이 있다면 <a style={{ color: 'var(--acc-blue)' }} href="mailto:hello@thivelab.com">hello@thivelab.com</a> 로 문의해주세요.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
