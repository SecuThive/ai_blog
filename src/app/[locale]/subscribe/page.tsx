import type { Metadata } from 'next';
import SubscribeForm from '@/components/SubscribeForm';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: '뉴스레터 구독 — Nodelog',
  description: '매주 화요일, AI가 정리한 한 주의 IT. 보안·인프라·AI 최신 트렌드를 6분 분량으로 받아보세요.',
};

export const revalidate = 3600;

async function getSubscriberCount(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('active', true);
  return count ?? 0;
}

const BENEFITS = [
  {
    icon: '🔐',
    title: '보안 위협 브리핑',
    desc: '한 주간 발생한 주요 CVE, 랜섬웨어, 침해사고를 실무 관점으로 요약합니다.',
  },
  {
    icon: '⚙️',
    title: '인프라 & 클라우드',
    desc: 'Kubernetes, Terraform, AWS/GCP/Azure 최신 업데이트와 실전 팁을 전달합니다.',
  },
  {
    icon: '🤖',
    title: 'AI & 자동화 트렌드',
    desc: 'LLM, 에이전트, DevOps 자동화 분야의 가장 중요한 변화를 짚어드립니다.',
  },
  {
    icon: '🛠️',
    title: '개발자 도구 큐레이션',
    desc: '이번 주 주목할 오픈소스와 SaaS 툴, 바로 써볼 수 있는 실전 가이드 포함.',
  },
];

const SOCIAL_PROOF = [
  { role: 'DevSecOps 엔지니어', text: '매주 보안 트렌드를 따로 찾아볼 필요가 없어졌어요.' },
  { role: '클라우드 아키텍트', text: 'AI가 정리해주는 인프라 뉴스는 다른 뉴스레터와 차원이 달라요.' },
  { role: '스타트업 CTO', text: '6분 만에 한 주 IT 흐름을 파악할 수 있어서 즐겨 읽습니다.' },
];

export default async function SubscribePage() {
  const count = await getSubscriberCount();
  const displayCount = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count > 0 ? String(count) : null;

  return (
    <div className="subscribe-page">

      {/* ── 히어로 ── */}
      <section className="subscribe-hero">
        <div className="container">
          <div className="subscribe-hero-inner">
            <div className="subscribe-hero-badge">
              <span className="subscribe-live-dot" />
              WEEKLY NEWSLETTER
            </div>
            <h1 className="subscribe-hero-title">
              매주 화요일,<br />
              <span className="subscribe-hero-accent">AI가 정리한</span> 한 주의 IT
            </h1>
            <p className="subscribe-hero-desc">
              보안·인프라·AI 분야의 가장 중요한 변화 5개,
              실무에 바로 쓸 수 있는 도구 3개, 깊이 있는 분석 1편.<br />
              평균 <strong>6분</strong> 분량으로 핵심만 전달합니다.
            </p>

            {/* 폼 */}
            <div className="subscribe-hero-form">
              <SubscribeForm />
              <div className="subscribe-hero-meta">
                <span>🔒 스팸 없음</span>
                <span>·</span>
                <span>언제든 해지 가능</span>
                {displayCount && (
                  <>
                    <span>·</span>
                    <span><strong>{displayCount}명</strong> 구독 중</span>
                  </>
                )}
              </div>
            </div>

            {/* 소셜 프루프 */}
            <div className="subscribe-testimonials">
              {SOCIAL_PROOF.map((s, i) => (
                <div key={i} className="subscribe-testimonial">
                  <div className="subscribe-testimonial-stars">★★★★★</div>
                  <p className="subscribe-testimonial-text">&ldquo;{s.text}&rdquo;</p>
                  <p className="subscribe-testimonial-role">{s.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="subscribe-hero-glow subscribe-hero-glow--1" />
        <div className="subscribe-hero-glow subscribe-hero-glow--2" />
      </section>

      {/* ── 혜택 ── */}
      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="subscribe-section-header">
            <div className="section-eyebrow">WHAT YOU GET</div>
            <h2 className="subscribe-section-title">매주 화요일 인박스에 담기는 것들</h2>
          </div>
          <div className="subscribe-benefits">
            {BENEFITS.map((b, i) => (
              <div key={i} className="subscribe-benefit-card">
                <div className="subscribe-benefit-icon">{b.icon}</div>
                <div>
                  <h3 className="subscribe-benefit-title">{b.title}</h3>
                  <p className="subscribe-benefit-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA 하단 ── */}
      <section className="section" style={{ paddingBottom: 96 }}>
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>
            지금 바로 시작하세요
          </h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 32, lineHeight: 1.6 }}>
            무료입니다. 언제든 해지할 수 있습니다.
          </p>
          <SubscribeForm />
        </div>
      </section>

    </div>
  );
}
