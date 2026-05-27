import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: '편집자 · AI 운영 모델 — Nodelog',
  description: 'Nodelog의 AI 에이전트와 사람 편집자의 협업 방식을 투명하게 공개합니다.',
};

export const revalidate = 3600;

const SOURCE_COUNT = '4,128';

const STAGES = [
  { t: '소스 색인', s: `${SOURCE_COUNT} sources`, tone: 'blue',   icon: '🌐', desc: '24시간 IT 소스 모니터링' },
  { t: '신호 점수화', s: 'AI · 변화율 분석', tone: 'purple', icon: '📊', desc: '중요도·트렌드 가중치 산출' },
  { t: '초고 생성', s: 'AI · 출처 동시 기록', tone: 'purple', icon: '✍️', desc: '출처 인라인 기록 포함' },
  { t: '편집자 검토', s: 'Human · 사실/톤', tone: 'mint',   icon: '🔍', desc: '사실 확인·톤·맥락 검토' },
  { t: '발행 & 학습', s: 'AI + Human', tone: 'amber',  icon: '🚀', desc: '발행 후 피드백 반영' },
];

const PRINCIPLES = [
  { icon: '🔍', t: '투명성', d: '모든 글에 AI·편집자 기여 비율을 명시합니다. 사용된 모델명과 버전도 공개합니다.' },
  { icon: '✅', t: '사실 검증', d: '편집자가 핵심 사실을 원문 소스와 대조합니다. 오류 발견 시 24시간 내 정정합니다.' },
  { icon: '🚫', t: 'AI 단독 발행 없음', d: '어떤 글도 사람 검토 없이는 발행되지 않습니다. 편집자의 최종 승인이 필수입니다.' },
  { icon: '📚', t: '출처 공개', d: '모든 초고 작성 시 사용된 소스 링크를 기록합니다. 주요 클레임에는 원문을 연결합니다.' },
];

async function getAuthorStats() {
  const [{ count: publishedCount }, { count: totalCount }, { data: categories }] = await Promise.all([
    supabaseAdmin().from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin().from('posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin().from('posts').select('category').eq('status', 'published'),
  ]);

  const published = publishedCount ?? 0;
  const total = totalCount ?? 0;
  const publishRate = total > 0 ? Math.round((published / total) * 100) : 68;

  const catCounts: Record<string, number> = {};
  (categories ?? []).forEach((p: { category: string }) => {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return { publishRate, rejectRate: 100 - publishRate, publishedCount: published, topCat };
}

export default async function AuthorPage() {
  const { publishRate, rejectRate, publishedCount, topCat } = await getAuthorStats();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">EDITORIAL · 운영</div>
          <h1 className="page-title">편집자 · AI 운영 모델</h1>
          <p className="page-lead">
            Nodelog는 AI가 초고를 작성하고, 사람이 검증합니다. 두 주체가 어떤 방식으로 협업하는지 투명하게 공개합니다.
          </p>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              { label: '발행 글', value: publishedCount.toLocaleString() + '편' },
              { label: '에디터 승인율', value: `${publishRate}%` },
              { label: '모니터링 소스', value: SOURCE_COUNT },
              { label: '최다 카테고리', value: topCat },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author cards */}
      <section className="section">
        <div className="container">
          <div className="section-eyebrow" style={{ marginBottom: 20 }}>WHO WE ARE</div>
          <div className="grid-2" style={{ marginBottom: 56 }}>
            {/* AI card */}
            <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'linear-gradient(135deg, oklch(0.65 0.16 245 / 0.07), oklch(0.55 0.18 290 / 0.12))', borderRadius: '0 0 0 120px' }} />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.65 0.16 245), oklch(0.55 0.18 290))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 600, color: 'white', fontSize: 22, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>N</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Nodelog AI</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>CURATION · DRAFTING</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
                Claude Sonnet 4.5와 GPT-5를 조합한 에이전트 시스템. {SOURCE_COUNT}개 소스를 24시간 모니터링하고
                변화 신호를 점수화합니다. 초고 작성, 관련 글 매칭, 1차 사실 점검을 담당합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {[
                  { k: '1차 초고 작성 비율', v: '100%' },
                  { k: '최종 발행 반영 비율', v: `~ ${publishRate}%` },
                  { k: '사용 모델', v: 'claude-4.5 / gpt-5', mono: true },
                ].map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-3)' }}>
                    <span>{row.k}</span>
                    <strong style={{ color: 'var(--text-1)', fontFamily: row.mono ? 'var(--ff-mono)' : undefined, fontSize: row.mono ? 12 : undefined }}>{row.v}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Human editor card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-1)', fontSize: 20, border: '1px solid var(--line-2)', flexShrink: 0 }}>편</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>편집자</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>REVIEW · EDITORIAL JUDGMENT</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
                10년 차 IT 미디어 편집자가 모든 글을 발행 전 검토합니다. 사실 확인, 톤 점검,
                맥락의 적절성 판단, 그리고 새 시리즈 기획을 맡습니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {[
                  { k: '검토 소요', v: '편당 25 ~ 60분' },
                  { k: '리젝트 비율', v: `~ ${rejectRate}%` },
                  { k: '경력', v: '10y · 시니어 에디터' },
                ].map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-3)' }}>
                    <span>{row.k}</span>
                    <strong style={{ color: 'var(--text-1)' }}>{row.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline diagram */}
          <h3 style={{ margin: '0 0 20px', fontSize: 20, letterSpacing: '-0.02em' }}>협업 파이프라인</h3>
          <div className="card" style={{ padding: 32, marginBottom: 56 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignItems: 'stretch' }}>
              {STAGES.map((s, i) => (
                <div key={s.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '18px 12px', border: '1px solid var(--line-2)', borderRadius: 12, background: `color-mix(in oklch, var(--acc-${s.tone}) 6%, var(--bg-3))`, position: 'relative' }}>
                  {i < STAGES.length - 1 && (
                    <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-5)', fontSize: 14, zIndex: 1 }}>›</div>
                  )}
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: `var(--acc-${s.tone})`, letterSpacing: '0.10em', marginBottom: 6 }}>STAGE {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', lineHeight: 1.4 }}>{s.s}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial principles */}
          <h3 style={{ margin: '0 0 20px', fontSize: 20, letterSpacing: '-0.02em' }}>편집 원칙</h3>
          <div className="grid-2">
            {PRINCIPLES.map(p => (
              <div key={p.t} className="card" style={{ padding: 22, display: 'flex', gap: 16 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em' }}>{p.t}</div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
