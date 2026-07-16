import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { EDITORS, editorInitials } from '@/lib/editors';
import JsonLd from '@/components/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '편집자 · AI 운영 모델 — Nodelog',
  description: 'Nodelog의 AI 에이전트와 사람 편집자의 협업 방식, 편집 검토 범위와 기준을 투명하게 공개합니다.',
  alternates: { canonical: `${SITE_URL}/author` },
};

export const revalidate = 3600;

// 편집 검토 범위·기준 — 실제 콘텐츠 커버리지에 부합하는 프로세스 설명(가공 인물 아님).
const REVIEW_SCOPE = {
  areas: ['Linux · 서버', '네트워크', '데이터베이스', '보안 · 인증', '컨테이너 · 클라우드', 'AI · 자동화'],
  checks: ['공식 문서 대조', '명령어 · 설정 검증', '버전 · 환경 조건', '적용 조건 · 주의점', '보안 위험'],
};

const STAGES = [
  { t: '소스 추적', s: '공식 문서 · 기술 소스', tone: 'blue',   icon: '🌐', desc: '주요 기술 소스·공식 문서 변화 추적' },
  { t: '신호 점수화', s: 'AI · 변화율 분석', tone: 'purple', icon: '📊', desc: '중요도·트렌드 가중치 산출' },
  { t: '초고 생성', s: 'AI 초안 작성', tone: 'purple', icon: '✍️', desc: '구조화된 기술 가이드 초안 생성' },
  { t: '편집자 검토', s: 'Human · 사실/톤', tone: 'mint',   icon: '🔍', desc: '사실 확인·톤·맥락 검토' },
  { t: '발행 & 개선', s: 'AI + Human', tone: 'amber',  icon: '🚀', desc: '발행 후 정정·보강 반영' },
];

const PRINCIPLES = [
  { icon: '🔍', t: '투명성', d: 'AI 도구가 초안 작성에 사용되고 사람이 편집 검토한다는 운영 방식을 공개합니다.' },
  { icon: '✅', t: '사실 확인', d: '핵심 사실과 명령어를 관련 문서와 대조하고, 오류 제보를 받으면 확인 후 정정합니다.' },
  { icon: '🚫', t: '사람의 발행 판단', d: 'AI가 만든 초안을 그대로 자동 발행하지 않고, 공개 여부와 수정 범위를 사람이 결정합니다.' },
  { icon: '📚', t: '출처 연결', d: '관련 공식 문서·1차 출처를 글과 함께 안내하는 것을 원칙으로 하며, 미비한 글은 순차적으로 보강하고 있습니다.' },
];

async function getAuthorStats() {
  // 발행 수·보류 수 같은 원시 카운트는 노출하지 않는다 — 자동생성 인상 완화(#8).
  const [{ count: guideCount }, { data: categories }] = await Promise.all([
    supabaseAdmin().from('engineer_guides').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin().from('posts').select('category').eq('status', 'published'),
  ]);

  const catCounts: Record<string, number> = {};
  (categories ?? []).forEach((p: { category: string }) => {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    guideCount: guideCount ?? 0,
    categoryCount: Object.keys(catCounts).length,
    topCat,
  };
}

export default async function AuthorPage() {
  const { guideCount, categoryCount, topCat } = await getAuthorStats();

  // 편집 조직(편집팀)을 주체로 한 ProfilePage 스키마 — 실제 검토 범위를 knowsAbout에 노출.
  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_URL}/author`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Nodelog 편집팀',
      url: `${SITE_URL}/author`,
      description: 'AI 초안 작성과 사람 편집 검토를 결합해 IT·개발·보안·인프라 기술 콘텐츠를 검증·발행하는 편집 조직.',
      knowsAbout: REVIEW_SCOPE.areas,
      parentOrganization: { '@type': 'Organization', name: 'Nodelog', url: SITE_URL },
    },
  };

  // 실제 편집자가 등록된 경우에만 Person 스키마도 함께 노출 (E-E-A-T)
  const personSchemas = EDITORS.map(e => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: e.name,
    jobTitle: e.title,
    knowsAbout: e.expertise,
    description: e.bio,
    url: `${SITE_URL}/author`,
    worksFor: { '@type': 'Organization', name: 'Nodelog', url: SITE_URL },
    ...(e.links && e.links.length > 0 ? { sameAs: e.links.map(l => l.url) } : {}),
  }));

  return (
    <div>
      <JsonLd data={[profileSchema, ...personSchemas]} />
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">EDITORIAL · 운영</div>
          <h1 className="page-title">편집자 · AI 운영 모델</h1>
          <p className="page-lead">
            Nodelog는 AI가 초고를 작성하고, 사람이 검증합니다. 두 주체가 어떤 방식으로 협업하는지 투명하게 공개합니다.
          </p>

          {/* Stats bar — 원시 발행/보류 수는 노출하지 않음(#8). 큐레이션 자산·범위만. */}
          <div style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              { label: '엔지니어 가이드', value: guideCount.toLocaleString() + '편' },
              { label: '검토 분야', value: `${REVIEW_SCOPE.areas.length}개 영역` },
              { label: `${categoryCount}개 카테고리 중 최다`, value: topCat },
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
                주제 조사와 글의 구조화, 초고 작성, 관련 글 매칭을 돕는 AI 도구입니다.
                최종 공개 여부와 수정 범위는 사람이 판단합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {[
                  { k: '주요 역할', v: '조사 보조 · 구조화 · 초안' },
                  { k: '공개 결정', v: '사람 편집 검토 후' },
                  { k: '모델', v: '작업에 따라 변경', mono: true },
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
                운영자가 발행 전 초안을 읽고 사실관계, 명령어, 문맥과 표현을 점검합니다.
                오류 제보와 공식 문서 변경 사항도 확인해 기존 글을 보강합니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {[
                  { k: '역할', v: 'Nodelog Technical Editor' },
                  { k: '주요 역할', v: '자료 확인 · 편집 · 발행 판단' },
                  { k: '정정 문의', v: 'thive8564@gmail.com' },
                ].map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-3)' }}>
                    <span>{row.k}</span>
                    <strong style={{ color: 'var(--text-1)' }}>{row.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 편집 검토 범위·기준 — 실제 콘텐츠 커버리지에 부합하는 프로세스 공개(E-E-A-T) */}
          <div className="card" style={{ padding: 28, marginBottom: 56 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6 }}>Nodelog Technical Editor</div>
            <p style={{ color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 22px' }}>
              특정 개인의 이력이 아니라, Nodelog의 기술 편집 검토가 어떤 범위와 기준으로 이뤄지는지 공개합니다.
            </p>
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 10 }}>검토 분야</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {REVIEW_SCOPE.areas.map(a => <span key={a} className="badge" style={{ fontSize: 11.5 }}>{a}</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 10 }}>검토 항목</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {REVIEW_SCOPE.checks.map(c => <span key={c} className="badge" style={{ fontSize: 11.5 }}>{c}</span>)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-1)' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 8 }}>콘텐츠 운영</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
                AI가 자료 조사와 초안 작성을 보조하고, <strong style={{ color: 'var(--text-1)' }}>최종 공개 여부와 수정 범위는 사람 편집자가 결정</strong>합니다.
                각 글 하단에 편집 검토 표기와 관련 공식 문서를 함께 제공합니다.
              </p>
            </div>
          </div>

          {/* 편집자 소개 — EDITORS(src/lib/editors.ts)에 실제 항목이 있을 때만 노출 */}
          {EDITORS.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <div className="section-eyebrow" style={{ marginBottom: 20 }}>EDITORIAL TEAM · 편집진</div>
              <div className="grid-2">
                {EDITORS.map(e => (
                  <div key={e.name} className="card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-1)', fontSize: 19, border: '1px solid var(--line-2)', flexShrink: 0 }}>{editorInitials(e)}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {e.name}
                          {e.penName && <span style={{ fontSize: 10.5, fontFamily: 'var(--ff-mono)', color: 'var(--text-4)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '1px 6px' }}>필명</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{e.title}</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 16px' }}>{e.bio}</p>
                    {e.expertise.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {e.expertise.map(x => (
                          <span key={x} className="badge" style={{ fontSize: 11 }}>{x}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                      {e.reviews.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span>주로 검토</span>
                          <strong style={{ color: 'var(--text-1)' }}>{e.reviews.join(' · ')}</strong>
                        </div>
                      )}
                      {e.links && e.links.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <span>프로필</span>
                          <span style={{ display: 'flex', gap: 12 }}>
                            {e.links.map(l => (
                              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer me" style={{ color: 'var(--acc-blue)', fontWeight: 500 }}>{l.label} ↗</a>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
