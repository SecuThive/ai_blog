import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import LoadMore from '@/components/LoadMore';
import JsonLd from '@/components/JsonLd';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  // canonical은 sitemap과 동일하게 percent-encoding(encodeURIComponent)으로 생성한다.
  // raw 파라미터를 그대로 쓰면 '&'·공백이 인코딩되지 않아(예: "AI & 자동화") canonical이
  // 깨지고 sitemap URL과 불일치 → GSC가 다른 canonical로 오인한다.
  const url = `${SITE_URL}/category/${encodeURIComponent(cat)}`;
  return {
    title: `${cat} — Nodelog`,
    description: `${cat} 카테고리의 AI 분석 포스트`,
    alternates: { canonical: url },
    openGraph: {
      title: `${cat} — Nodelog`,
      description: `${cat} 카테고리의 AI 분석 포스트`,
      url,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export async function generateStaticParams() {
  return ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드', '보안', '인프라'].map(cat => ({ cat }));
}


const ALL_CATS = [
  { label: '전체', href: '/', cat: '' },
  { label: 'AI 자동화', href: '/category/AI & 자동화', cat: 'AI & 자동화' },
  { label: 'IT 트렌드', href: '/category/IT 트렌드', cat: 'IT 트렌드' },
  { label: '개발', href: '/category/개발', cat: '개발' },
  { label: '툴 리뷰', href: '/category/툴 리뷰', cat: '툴 리뷰' },
  { label: '보안', href: '/category/보안', cat: '보안' },
  { label: '인프라', href: '/category/인프라', cat: '인프라' },
];

// 카테고리별 편집 소개 — 단순 글 목록이 아니라 "누구를 위한, 무엇을 다루는" 섹션인지 안내.
const CATEGORY_INTRO: Record<string, { desc: string; audience: string; start: string }> = {
  'AI & 자동화': {
    desc: 'LLM·RAG·AI 에이전트 아키텍처와 업무 자동화를 다룹니다. 프롬프트 설계부터 프로덕션 LLMOps까지, 개념 소개보다 구축·운영 관점에 집중합니다.',
    audience: 'AI 기능을 실제 서비스에 붙이려는 개발자·엔지니어, 업무 자동화를 설계하는 실무자',
    start: '많이 읽은 글에서 시작해 시리즈(RAG·에이전트)로 이어 읽는 것을 추천합니다.',
  },
  '개발': {
    desc: '빌드 실패, 의존성 충돌, 런타임 에러 같은 개발 중 실제로 마주치는 문제의 진단·해결 절차를 다룹니다. 에러 메시지 원문 기준으로 정리합니다.',
    audience: '에러 메시지를 검색해서 들어온 백엔드·풀스택 개발자',
    start: '지금 겪는 에러 메시지와 같은 제목의 글부터 확인하세요. 진단 → 해결 → 재발 방지 순서로 구성되어 있습니다.',
  },
  '인프라': {
    desc: 'Kubernetes·Docker·클라우드·DB 운영에서 발생하는 장애와 성능 문제를 다룹니다. 임시 조치와 영구 해결을 구분해 안내합니다.',
    audience: '컨테이너·클라우드 환경을 운영하는 DevOps·SRE·백엔드 엔지니어',
    start: '장애 상황이라면 많이 읽은 글의 진단 절차부터, 학습 목적이라면 시리즈를 순서대로 읽는 것을 추천합니다.',
  },
  '보안': {
    desc: '취약점 대응, 보안 설정, 인증·인가, ISMS-P 같은 보안 실무를 다룹니다. 확정적 법률 해석 대신 공식 기관 자료 확인을 함께 안내합니다.',
    audience: '서비스 보안을 담당하는 개발자·보안 실무자',
    start: '설정·구현 가이드는 바로 적용 가능하며, 규정 관련 글은 반드시 원문 링크를 함께 확인하세요.',
  },
  'IT 트렌드': {
    desc: '기술 생태계의 의미 있는 변화를 실무 영향 중심으로 해석합니다. 단순 뉴스 요약이 아니라 "우리 팀에 무엇이 바뀌는가"를 다룹니다.',
    audience: '기술 의사결정을 하는 리드·시니어 엔지니어',
    start: '관심 주제의 최신 글부터 읽고, 연결된 심층 가이드로 이어가세요.',
  },
  '툴 리뷰': {
    desc: '개발·운영 도구를 실제 사용 시나리오 기준으로 비교합니다. 선택 기준표와 상황별 추천을 제공합니다.',
    audience: '팀 도구 도입을 검토하는 개발자·엔지니어링 매니저',
    start: '비교표에서 자신의 요구사항 행을 먼저 확인하세요.',
  },
};

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  noStore();
  const { cat: rawCat } = await params;
  const cat = decodeURIComponent(rawCat);
  const intro = CATEGORY_INTRO[cat];

  const client = makeFreshClient();
  const [{ data }, { data: topData }] = await Promise.all([
    client
      .from('posts')
      .select('id,title,slug,excerpt,cover_image,category,tags,author,agent_role,views,published_at,content')
      .eq('status', 'published')
      .eq('category', cat)
      .order('published_at', { ascending: false })
      .limit(24),
    client
      .from('posts')
      .select('title,slug,views')
      .eq('status', 'published')
      .eq('category', cat)
      .order('views', { ascending: false })
      .limit(3),
  ]);

  const posts: PostSummary[] = (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as PostSummary[];
  const topPosts = (topData ?? []) as { title: string; slug: string; views: number }[];

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat} — Nodelog`,
    description: `${cat} 관련 심층 분석글 모음`,
    url: `${SITE_URL}/category/${rawCat}`,
    inLanguage: 'ko',
    publisher: {
      '@type': 'Organization',
      name: 'Nodelog',
      url: SITE_URL,
    },
    hasPart: posts.slice(0, 10).map(p => ({
      '@type': 'Article',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      description: p.excerpt,
    })),
  };

  return (
    <div>
      <JsonLd data={collectionSchema} />
      {/* Page hero */}
      <div className="page-hero">
        <div className="container">
          <div className="page-eyebrow">{cat}</div>
          <h1 className="page-title">{cat}</h1>
          <p className="page-lead">{intro?.desc ?? `${cat} 관련 심층 분석글을 모았습니다.`}</p>
          {intro && (
            <div style={{ display: 'grid', gap: 10, marginTop: 20, maxWidth: 720 }}>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>이런 분을 위한 섹션 · </strong>{intro.audience}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>읽는 순서 · </strong>{intro.start}
              </div>
            </div>
          )}
          {topPosts.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--line-1)' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>
                많이 읽은 글
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topPosts.map((p, i) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--text-4)', marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {/* Filter tabs */}
        <div className="filter-row" style={{ marginTop: 0 }}>
          <span className="label">카테고리</span>
          {ALL_CATS.map(c => {
            const isActive = c.cat === cat;
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`filter-tab${isActive ? ' active' : ''}`}
              >
                {isActive ? `● ${c.label}` : c.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
            {posts.length} POSTS
          </span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              NO POSTS
            </div>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>이 카테고리에 아직 포스트가 없습니다.</p>
            <Link href="/" className="btn btn-ghost">← 홈으로</Link>
          </div>
        ) : (
          <LoadMore
            initialPosts={posts}
            fetchUrl={`/api/posts?category=${encodeURIComponent(cat)}&limit=12`}
            pageSize={12}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}
