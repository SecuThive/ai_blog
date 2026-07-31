import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: 'About',
  description: 'Nodelog가 IT 실무 정보를 조사하고 검토하며 지속적으로 업데이트하는 운영 원칙을 소개합니다.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About | Nodelog',
    description: 'Nodelog가 IT 실무 정보를 조사하고 검토하며 지속적으로 업데이트하는 운영 원칙을 소개합니다.',
    url: `${SITE_URL}/about`,
    type: 'website',
  },
};

const STEPS = [
  { n: '01', t: '주제 선정', d: '공식 문서·릴리스 노트·기술 자료와 독자 검색 수요를 바탕으로 다룰 주제를 정합니다.' },
  { n: '02', t: '자료 확인', d: '주제와 직접 관련된 1차 자료를 우선 확인하고 글의 범위와 핵심 질문을 정리합니다.' },
  { n: '03', t: '초안 준비', d: 'AI 도구를 구조화와 초안 작성의 보조 수단으로 활용하고, 참고 자료는 편집 과정에서 다시 확인합니다.' },
  { n: '04', t: '편집 검토', d: '사실관계·명령어·표현·문맥을 점검하고 불확실하거나 근거가 약한 문장을 수정합니다.' },
  { n: '05', t: '발행', d: '카테고리·시리즈·태그·관련 글 자동 연결. 메타데이터 색인.' },
  { n: '06', t: '보강', d: '오류 제보와 문서 변경을 확인해 필요한 글을 정정하거나 보강합니다.' },
];

const PRINCIPLES = [
  { t: '출처를 확인합니다', d: '핵심 주장에 필요한 공식 문서와 1차 자료를 우선 연결하고, 미비한 기존 글은 순차 보강합니다.' },
  { t: '한계를 함께 적습니다', d: '환경과 버전에 따라 결과가 달라질 수 있는 내용은 적용 조건과 확인 방법을 함께 안내합니다.' },
  { t: '광고는 본문과 섞지 않습니다', d: '제휴 콘텐츠는 별도의 표식과 색상으로 명확히 구분합니다.' },
  { t: '실패도 다룹니다', d: '도입에 실패한 도구, 잘못된 판단의 회고를 거르지 않습니다.' },
];

export default function AboutPage() {
  // 공개 소개에서는 발행 규모 대신 콘텐츠의 성격과 운영 원칙을 보여준다.
  const STATS = [
    { num: 'PRACTICAL', label: 'TECHNICAL GUIDES', sub: 'Linux · Docker · Network · Security' },
    { num: 'REVIEWED', label: 'EDITORIAL PROCESS', sub: '자료 확인 · 문맥 검토 · 발행 판단' },
    { num: 'UPDATED', label: 'LIVING CONTENT', sub: '오류 정정 · 문서 변경 반영 · 지속 보강' },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ABOUT NODELOG</div>
          <h1 className="page-title">검토하고 바로잡으며,<br />계속 업데이트합니다.</h1>
          <p className="page-lead">
            Nodelog는 공식 문서와 기술 자료를 확인하고, 실무자가 판단에 활용할 수 있도록
            내용을 검토·정리하는 IT·개발·보안 실무 미디어입니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="grid-3" style={{ marginBottom: 64 }}>
            {STATS.map(s => (
              <div key={s.label} className="card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>MISSION</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>미션</h2>
            </div>
            <div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-2)', margin: '0 0 18px' }}>
                실무자가 신뢰할 수 있는 IT 정보를 만드는 것. 정보의 양이 아니라 <strong style={{ color: 'var(--text-1)' }}>맥락의 밀도</strong>를 높이는 것.
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-3)', margin: 0 }}>
                AI 도구는 자료 조사와 정리를 보조할 수 있지만, 어떤 신호가 중요한지와 어떤 문장이 오해를 부르는지를 판단하는 일은 사람의 몫이라고 믿습니다.
                Nodelog는 그 협업 방식을 가장 단순하고 정직하게 보여주는 미디어를 지향합니다.
              </p>
            </div>
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>HOW IT WORKS</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>운영 방식</h2>
            </div>
            <div>
              <div style={{ display: 'grid', gap: 14 }}>
                {STEPS.map(s => (
                  <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 18, padding: '18px 0', borderBottom: '1px dashed var(--line-1)' }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.06em' }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>{s.t}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>PRINCIPLES</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>편집 원칙</h2>
            </div>
            <div className="grid-2">
              {PRINCIPLES.map(p => (
                <div key={p.t} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span className="badge badge-blue" style={{ width: 28, height: 28, padding: 0, justifyContent: 'center', borderRadius: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <h4 style={{ margin: 0, fontSize: 14.5, letterSpacing: '-0.01em' }}>{p.t}</h4>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.6 }}>{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
