import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '편집 정책 — Nodelog' };

const SECTIONS = [
  ['1. AI 사용 범위', 'AI 도구는 주제 조사 보조, 글 구조화, 초고 작성과 관련 콘텐츠 연결에 사용됩니다. 생성된 초안은 자동 공개하지 않으며, 사람이 검토한 뒤 발행 여부와 수정 범위를 결정합니다.'],
  ['2. 사실 확인', '핵심 주장과 명령어는 관련 공식 문서와 1차 자료를 우선 확인합니다. 적용 환경이나 버전에 따라 달라질 수 있는 내용은 조건과 확인 방법을 함께 안내하며, 출처가 미비한 기존 글은 순차적으로 보강하거나 검색 색인에서 제외합니다.'],
  ['3. 후원 콘텐츠', '스폰서가 있는 글은 상단에 "후원"이라는 명확한 표기와 함께 별도의 색상으로 구분됩니다. 후원사는 글의 내용에 개입할 수 없습니다.'],
  ['4. 정정', '오류 제보가 접수되면 관련 자료를 확인합니다. 내용에 영향을 주는 오류는 정정하고, 필요한 경우 수정일과 정정 사실을 글에 표시합니다.'],
  ['5. 콘텐츠 품질 관리', '중복되거나 독자에게 제공하는 고유 정보가 부족한 글은 통합·보강하거나 검색 색인에서 제외합니다. 발행 후에도 공식 문서 변경과 독자 피드백을 반영해 콘텐츠를 수정할 수 있습니다.'],
];

export default function PolicyPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>편집 정책</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>EDITORIAL POLICY</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>편집 정책</h1>
          <p className="page-lead">Nodelog가 콘텐츠를 만들고 검토하는 원칙을 외부에 공개합니다.</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.06em', marginTop: 18 }}>
            최종 업데이트 · 2026.07.13 · 적용 시작일 2026.05.01
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
              편집 정책에 대한 문의는 <a style={{ color: 'var(--acc-blue)' }} href="mailto:thive8564@gmail.com">thive8564@gmail.com</a> 로 보내주세요.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
