import type { Metadata } from 'next';

export const metadata: Metadata = { title: '편집 정책 — Nodelog' };

const SECTIONS = [
  ['1. AI 사용 범위', '모든 글의 1차 초고는 AI가 작성합니다. 발행 전 사람 편집자의 검토를 거치며, 어떤 단계에서 어떤 주체가 작업했는지 글 상단에 표기됩니다.'],
  ['2. 사실 확인', '인용된 모든 수치·릴리스 정보는 1차 출처를 다시 확인합니다. 출처가 불명확한 정보는 사용하지 않습니다.'],
  ['3. 후원 콘텐츠', '스폰서가 있는 글은 상단에 "후원"이라는 명확한 표기와 함께 별도의 색상으로 구분됩니다. 후원사는 글의 내용에 개입할 수 없습니다.'],
  ['4. 정정', '오류가 확인되면 24시간 이내 정정하며, 정정 내역을 글 하단에 명시합니다.'],
  ['5. 익명 출처', '익명을 요구한 출처의 경우 그 사유와 신뢰도 판단 근거를 편집자가 별도로 기록합니다.'],
];

export default function PolicyPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <a href="/">홈</a><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>편집 정책</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>EDITORIAL POLICY</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>편집 정책</h1>
          <p className="page-lead">Nodelog가 콘텐츠를 만들고 검토하는 원칙을 외부에 공개합니다.</p>
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
              편집 정책에 대한 문의는 <a style={{ color: 'var(--acc-blue)' }} href="mailto:tips@nodelog.kr">tips@nodelog.kr</a> 로 보내주세요.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
