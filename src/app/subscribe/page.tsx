import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '구독하기 — Nodelog',
  description: '매주 화요일, AI가 정리한 한 주의 IT. 가장 의미 있는 변화 5개, 실무에 적용 가능한 도구 3개.',
};

const BENEFITS = [
  { icon: '⚡', t: '매주 화요일 오전 8시', d: '가장 의미 있는 변화 5개, 실무 도구 3개, 깊이 있는 시리즈 1편.' },
  { icon: '🔍', t: '4,128개 소스 요약', d: 'AI가 전주 발생한 IT 이슈를 분류하고 중요도 순으로 정리합니다.' },
  { icon: '📊', t: '트렌드 점수', d: '주간 상승/하락 키워드와 신호 강도 변화를 수치로 제공합니다.' },
  { icon: '✦', t: '스팸 없음', d: '언제든 한 클릭으로 해지 가능. 광고 메일은 발송하지 않습니다.' },
];

export default function SubscribePage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">SUBSCRIBE · 뉴스레터</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>
            매주 화요일,<br />AI가 정리한 한 주의 IT.
          </h1>
          <p className="page-lead" style={{ marginBottom: 32 }}>
            가장 의미 있는 변화 5개, 실무에 적용 가능한 도구 3개, 깊이 있는 시리즈 1편. 평균 6분 분량.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="subscribe" style={{ marginBottom: 56 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 12 }}>이메일 구독</div>
              <h3 style={{ margin: '0 0 10px' }}>지금 구독하기</h3>
              <p style={{ color: 'var(--text-3)', margin: 0, fontSize: 14 }}>4,200명이 이미 구독 중입니다.</p>
            </div>
            <div>
              <form className="subscribe-form" action="#" method="post">
                <input className="input" type="email" name="email" placeholder="email@example.com" required />
                <button type="submit" className="btn btn-primary">구독하기</button>
              </form>
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>
                NO SPAM · 언제든 해지 가능 · 4,200명 구독 중
              </p>
            </div>
          </div>

          <div className="grid-2">
            {BENEFITS.map(b => (
              <div key={b.t} className="card" style={{ padding: 22 }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{b.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 6, letterSpacing: '-0.01em' }}>{b.t}</div>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.6 }}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
