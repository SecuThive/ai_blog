import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import type { EngineerGuide } from '@/lib/types';
import { makeFreshClient } from '@/lib/supabase';
import { engCatTone } from '@/lib/utils';
import EngineerSearch from './EngineerSearch';
import JsonLd from '@/components/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '엔지니어 가이드 — Nodelog',
  description: 'Linux, Docker, Git, 네트워킹, 보안 등 실무 엔지니어를 위한 기술 레퍼런스 모음.',
  keywords: 'Linux, Docker, Git, 네트워킹, 보안, 클라우드, 데이터베이스, 엔지니어 가이드',
  alternates: { canonical: `${SITE_URL}/engineer` },
  openGraph: {
    title: '엔지니어 가이드 — Nodelog',
    description: 'Linux, Docker, Git, 네트워킹, 보안 등 실무 엔지니어를 위한 기술 레퍼런스 모음.',
    url: `${SITE_URL}/engineer`,
    type: 'website',
  },
};

export const revalidate = 60;

const CATEGORIES = [
  {
    name: 'Linux / Shell',
    desc: '명령어·파일시스템·프로세스·셸 스크립트 실무 레퍼런스',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <polyline points="8 21 12 21 16 21" /><line x1="12" y1="17" x2="12" y2="21" />
        <polyline points="6 8 8 10 6 12" /><line x1="11" y1="12" x2="13" y2="12" />
      </svg>
    ),
  },
  {
    name: 'Docker / 컨테이너',
    desc: '이미지 빌드·Compose·네트워크·레지스트리 운영 가이드',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    name: 'Git / CI·CD',
    desc: '브랜치 전략·GitHub Actions·파이프라인 구성 방법',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
        <path d="M6 9v6M15.1 6.5A9 9 0 0 1 18 15" />
      </svg>
    ),
  },
  {
    name: '네트워킹 / 서버',
    desc: 'IP·DNS·방화벽·Nginx·SSL 설정 핵심 레퍼런스',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    name: 'OS / 시스템',
    desc: '시스템 설정·서비스 관리·부팅·성능 튜닝',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    ),
  },
  {
    name: '보안 설정',
    desc: 'SSH 강화·방화벽·인증·취약점 대응 방법',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    name: '클라우드',
    desc: 'AWS·GCP·Azure 핵심 서비스 설정과 패턴',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
  {
    name: '데이터베이스',
    desc: 'PostgreSQL·MySQL·Redis 설치·운영·쿼리 최적화',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    name: '트러블슈팅',
    desc: '에러 메시지별 원인 진단·SSH 오류·502·디스크·포트 충돌 해결',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

async function getGuides(category?: string): Promise<EngineerGuide[]> {
  noStore();
  let q = makeFreshClient()
    .from('engineer_guides')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data } = await q;
  return (data ?? []) as EngineerGuide[];
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  noStore();
  const { data } = await makeFreshClient()
    .from('engineer_guides')
    .select('category')
    .eq('status', 'published');
  const counts: Record<string, number> = {};
  for (const row of (data ?? [])) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return counts;
}

export default async function EngineerPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat: rawCat } = await searchParams;
  const activeCat = rawCat ? decodeURIComponent(rawCat) : undefined;

  const [guides, counts] = await Promise.all([getGuides(activeCat), getCategoryCounts()]);
  const totalGuides = Object.values(counts).reduce((a, b) => a + b, 0);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: activeCat ? `${activeCat} 가이드 — Nodelog Engineer` : '엔지니어 가이드 — Nodelog',
    description: activeCat
      ? CATEGORIES.find(c => c.name === activeCat)?.desc
      : 'Linux, Docker, Git, 네트워킹, 보안 설정 등 실무에서 바로 써먹는 기술 가이드 모음.',
    url: `${SITE_URL}/engineer${activeCat ? `?cat=${encodeURIComponent(activeCat)}` : ''}`,
    numberOfItems: guides.length,
    itemListElement: guides.slice(0, 20).map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/engineer/${g.slug}`,
      name: g.title,
    })),
  };

  return (
    <div>
      <JsonLd data={[itemListSchema]} />
      {/* Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ENGINEER · 엔지니어 가이드</div>
          <h1 className="page-title">{activeCat ?? '엔지니어 레퍼런스'}</h1>
          <p className="page-lead">
            {activeCat
              ? CATEGORIES.find(c => c.name === activeCat)?.desc ?? '해당 카테고리의 가이드 모음.'
              : 'Linux, Docker, Git, 네트워킹, 보안 설정 등 실무에서 바로 써먹는 기술 가이드 모음.'}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{totalGuides}</strong>
              {' '}GUIDES · {CATEGORIES.length} CATEGORIES
            </div>
            {activeCat && (
              <Link href="/engineer" className="btn btn-sm btn-ghost">← 전체 보기</Link>
            )}
          </div>
        </div>
      </section>

      {/* Category hub */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div style={{ marginBottom: 20 }}>
            <div className="section-eyebrow">CATEGORIES</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20, letterSpacing: '-0.02em' }}>분야별 탐색</h2>
          </div>
          <div className="eng-cat-grid">
            {CATEGORIES.map(cat => {
              const tone = engCatTone(cat.name);
              const count = counts[cat.name] ?? 0;
              const isActive = activeCat === cat.name;
              return (
                <Link
                  key={cat.name}
                  href={isActive ? '/engineer' : `/engineer?cat=${encodeURIComponent(cat.name)}`}
                  className={`eng-cat-card eng-cat-${tone}${isActive ? ' eng-cat-active' : ''}`}
                >
                  <div className="eng-cat-icon">{cat.icon}</div>
                  <div className="eng-cat-name">{cat.name}</div>
                  <div className="eng-cat-desc">{cat.desc}</div>
                  <div className="eng-cat-count">{count} 가이드</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guide list with search */}
      <section className="section">
        <div className="container">
          <EngineerSearch guides={guides} activeCat={activeCat} />
        </div>
      </section>
    </div>
  );
}
