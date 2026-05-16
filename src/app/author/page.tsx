import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '편집자 · AI 운영 모델 — Nodelog',
  description: 'Nodelog의 AI 에이전트와 사람 편집자의 협업 방식을 투명하게 공개합니다.',
};

const STAGES = [
  { t: '소스 색인', s: '4,128 sources', tone: 'blue' },
  { t: '신호 점수화', s: 'AI · 변화율 분석', tone: 'purple' },
  { t: '초고 생성', s: 'AI · 출처 동시 기록', tone: 'purple' },
  { t: '편집자 검토', s: 'Human · 사실/톤', tone: 'mint' },
  { t: '발행 & 학습', s: 'AI + Human', tone: 'amber' },
];

export default function AuthorPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">EDITORIAL · 운영</div>
          <h1 className="page-title">편집자 · AI 운영 모델</h1>
          <p className="page-lead">
            Nodelog의 글에는 매번 같은 두 이름이 나옵니다 — Nodelog AI와 사람 편집자.
            두 주체가 어떤 방식으로 협업하는지 투명하게 공개합니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ marginBottom: 56 }}>
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.65 0.16 245), oklch(0.55 0.18 290))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 600, color: 'white', fontSize: 22, border: '1px solid rgba(255,255,255,0.15)' }}>N</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Nodelog AI</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>CURATION · DRAFTING</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>
                Claude Sonnet 4.5와 GPT-5를 조합한 에이전트 시스템. 4,128개 소스를 24시간 모니터링하고,
                변화 신호를 점수화합니다. 초고 작성, 관련 글 매칭, 1차 사실 점검을 담당합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1차 초고 작성 비율</span><strong style={{ color: 'var(--text-1)' }}>100%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>최종 발행 반영 비율</span><strong style={{ color: 'var(--text-1)' }}>~ 68%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>사용 모델</span><strong style={{ color: 'var(--text-1)', fontFamily: 'var(--ff-mono)' }}>claude-4.5 / gpt-5</strong></div>
              </div>
            </div>

            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-1)', fontSize: 20, border: '1px solid var(--line-2)' }}>편</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>편집자</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>REVIEW · EDITORIAL JUDGMENT</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>
                10년 차 IT 미디어 편집자가 모든 글을 발행 전 검토합니다. 사실 확인, 톤 점검,
                맥락의 적절성 판단, 그리고 새 시리즈 기획을 맡습니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>검토 소요</span><strong style={{ color: 'var(--text-1)' }}>편당 25 ~ 60분</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>리젝트 비율</span><strong style={{ color: 'var(--text-1)' }}>~ 32%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>경력</span><strong style={{ color: 'var(--text-1)' }}>10y · 시니어 에디터</strong></div>
              </div>
            </div>
          </div>

          <h3 style={{ margin: '0 0 24px', fontSize: 20, letterSpacing: '-0.02em' }}>협업 다이어그램</h3>
          <div className="card" style={{ padding: 36 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, alignItems: 'center' }}>
              {STAGES.map((s, i) => (
                <div key={s.t} style={{ textAlign: 'center', padding: 14, border: '1px solid var(--line-2)', borderRadius: 10, background: `color-mix(in oklch, var(--acc-${s.tone}) 6%, var(--bg-3))` }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: `var(--acc-${s.tone})`, letterSpacing: '0.10em', marginBottom: 6 }}>STAGE {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)' }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
