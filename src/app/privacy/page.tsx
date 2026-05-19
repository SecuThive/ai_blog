import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 — Nodelog',
};

const SECTIONS = [
  ['1. 수집하는 정보', '뉴스레터 구독을 신청한 경우 이메일 주소만 수집합니다. 사이트 이용 분석을 위해 익명화된 페이지뷰·체류 시간이 수집되며, 개인 식별 정보는 포함되지 않습니다.'],
  ['2. 정보의 사용 목적', '수집한 이메일은 뉴스레터 발송과 발송 동의 이력 기록 외 용도로 사용되지 않습니다. 분석 데이터는 콘텐츠 추천 모델 학습과 사이트 품질 개선에만 사용됩니다.'],
  ['3. 보관 기간', '뉴스레터 구독 이메일은 구독 해지 시 14일 이내에 영구 삭제됩니다. 분석 데이터는 90일이 지나면 통계 집계 후 원본이 삭제됩니다.'],
  ['4. 제3자 제공', '법적 요청을 제외하고 어떠한 경우에도 사용자의 정보를 제3자에게 제공하지 않습니다. 메일 발송에 사용되는 인프라에 대해서는 별도의 데이터 처리 계약이 체결되어 있습니다.'],
  ['5. 사용자의 권리', '사용자는 자신의 정보에 대한 열람, 정정, 삭제, 처리 정지를 언제든 요청할 수 있으며 privacy@thivelab.com 로 요청 시 7일 이내에 처리됩니다.'],
  ['6. 쿠키', '사이트 작동에 필요한 최소한의 세션 쿠키만 사용합니다. 광고 트래킹 쿠키, 크로스사이트 추적 쿠키는 사용하지 않습니다.'],
  ['7. AI 콘텐츠 처리', '발행되는 글은 AI가 1차 작성한 뒤 사람 편집자가 검토합니다. 사용자가 콘텐츠에 제공한 피드백은 추천 모델 학습을 위해 익명화된 형태로 사용됩니다.'],
  ['8. 정책 변경', '이 정책이 변경될 경우 본 페이지 상단에 변경 사실과 변경 시점이 명시되며, 뉴스레터 구독자에게는 이메일로도 안내됩니다.'],
];

export default function PrivacyPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <a href="/">홈</a><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>개인정보처리방침</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>PRIVACY POLICY</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>개인정보처리방침</h1>
          <p className="page-lead">Nodelog가 수집하는 정보의 범위, 사용 방식, 그리고 사용자의 권리를 명확하게 안내합니다.</p>
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
                <h2 style={{ margin: '0 0 12px', fontSize: 19, letterSpacing: '-0.015em', color: 'var(--text-1)' }}>{t}</h2>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15.5, lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: 24, border: '1px solid var(--line-1)', borderRadius: 12, background: 'var(--bg-2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              이 정책에 대해 궁금한 점이 있다면 <a style={{ color: 'var(--acc-blue)' }} href="mailto:privacy@thivelab.com">privacy@thivelab.com</a> 로 문의해주세요.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
