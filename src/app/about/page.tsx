import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Nodelog',
  description: 'Nodelog는 AI 에이전트와 사람 편집자가 함께 운영하는 IT 미디어입니다.',
};

const STATS = [
  { num: '957', label: 'PUBLISHED POSTS', sub: '2024년 9월부터' },
  { num: '4,128', label: 'SOURCES MONITORED', sub: '뉴스 · 릴리스 · 논문 · 변경 로그' },
  { num: '38', label: 'ACTIVE SERIES', sub: '학습 경로형 콘텐츠' },
  { num: '92%', label: 'FACT-CHECK PASS', sub: '편집자 1차 검토 기준' },
  { num: '4.2K', label: 'SUBSCRIBERS', sub: '주간 뉴스레터' },
  { num: '14분', label: 'AVG READ TIME', sub: '실제 체류 데이터' },
];

const STEPS = [
  { n: '01', t: '수집', d: '4,128개 소스 (공식 블로그·릴리스 노트·논문·OSS 커밋·X 신호)를 실시간 색인.' },
  { n: '02', t: '신호 분석', d: '단순 빈도가 아닌 변화율·중요도·맥락 점수를 계산. 일·주·월 단위로 추세화.' },
  { n: '03', t: '초고 생성', d: 'Claude·GPT-5 기반 에이전트가 1차 정리. 모든 출처가 함께 기록됩니다.' },
  { n: '04', t: '편집자 검토', d: '사실관계, 톤, 맥락의 적절성을 사람이 점검. 출처를 재확인.' },
  { n: '05', t: '발행', d: '카테고리·시리즈·태그·관련 글 자동 연결. 메타데이터 색인.' },
  { n: '06', t: '피드백 학습', d: '독자의 완독·체류·피드백 데이터가 다음 추천 모델로 환류됩니다.' },
];

const PRINCIPLES = [
  { t: '출처를 숨기지 않습니다', d: 'AI가 어떤 자료를 참고했는지, 어떤 부분이 사람의 판단인지 항상 명시합니다.' },
  { t: '단정하지 않습니다', d: '아직 확정되지 않은 변화에 대해서는 신호의 강도와 한계를 함께 표기합니다.' },
  { t: '광고는 본문과 섞지 않습니다', d: '제휴 콘텐츠는 별도의 표식과 색상으로 명확히 구분합니다.' },
  { t: '실패도 다룹니다', d: '도입에 실패한 도구, 잘못된 판단의 회고를 거르지 않습니다.' },
];

export default function AboutPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ABOUT NODELOG</div>
          <h1 className="page-title">AI가 운영하는 IT 미디어,<br />그러나 결정은 사람이.</h1>
          <p className="page-lead">
            Nodelog는 4,128개의 IT 소스를 24시간 모니터링하는 AI 큐레이션 시스템과,
            매일 그 결과를 검토하는 한 명의 편집자가 함께 운영하는 디지털 미디어입니다.
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
                AI가 정보를 빠르게 수집하고 정리하지만, 어떤 신호가 진짜로 중요한지, 어떤 문장이 오해를 부르는지를 결정하는 일은 여전히 사람의 몫이라고 믿습니다.
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
