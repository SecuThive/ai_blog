import Link from '@/i18n/link';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import LoadMore from '@/components/LoadMore';
import JsonLd from '@/components/JsonLd';
import type { PostSummary } from '@/lib/types';
import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { localizePost, titleForLocale } from '@/i18n/content';
import { categoryLabel, categoryHref, toKoreanCategory, CAT_TO_SLUG } from '@/i18n/categories';
import { languageAlternates, siteUrl } from '@/i18n/metadata';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; cat: string }> }): Promise<Metadata> {
  const { cat: rawCat, locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : 'ko';
  const cat = toKoreanCategory(rawCat);
  const label = categoryLabel(cat, locale);
  const path = categoryHref(cat, locale);
  const url = siteUrl(path, locale);
  const description = locale === 'en'
    ? `Practical write-ups on ${label}: real problems, technical choices, and how to operate them.`
    : `${label} 분야의 실무 문제, 기술 선택과 운영 방법을 검토해 정리한 글입니다.`;
  return {
    title: label,
    description,
    alternates: { canonical: url, languages: languageAlternates(categoryHref(cat, 'ko')) },
    openGraph: {
      title: `${label} | Nodelog`,
      description,
      url,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export async function generateStaticParams() {
  const korean = ['AI & 자동화', '개발', '툴 리뷰', 'IT 트렌드', '보안', '인프라'];
  return [
    ...korean.map(cat => ({ cat })),
    ...korean.map(cat => ({ cat: CAT_TO_SLUG[cat] })),
  ];
}


function allCats(locale: 'ko' | 'en', dict: ReturnType<typeof getDictionary>) {
  const rows: { label: string; href: string; cat: string }[] = [
    { label: locale === 'en' ? 'All' : '전체', href: '/', cat: '' },
    { label: categoryLabel('AI & 자동화', locale), href: '/category/AI & 자동화', cat: 'AI & 자동화' },
    { label: categoryLabel('IT 트렌드', locale), href: '/category/IT 트렌드', cat: 'IT 트렌드' },
    { label: categoryLabel('개발', locale), href: '/category/개발', cat: '개발' },
    { label: categoryLabel('툴 리뷰', locale), href: '/category/툴 리뷰', cat: '툴 리뷰' },
    { label: categoryLabel('보안', locale), href: '/category/보안', cat: '보안' },
    { label: categoryLabel('인프라', locale), href: '/category/인프라', cat: '인프라' },
  ];
  void dict;
  return rows;
}

const CATEGORY_INTRO: Record<string, { ko: { desc: string; audience: string; start: string }; en: { desc: string; audience: string; start: string } }> = {
  'AI & 자동화': {
    ko: {
      desc: 'LLM·RAG·AI 에이전트 아키텍처와 업무 자동화를 다룹니다. 프롬프트 설계부터 프로덕션 LLMOps까지, 개념 소개보다 구축·운영 관점에 집중합니다.',
      audience: 'AI 기능을 실제 서비스에 붙이려는 개발자·엔지니어, 업무 자동화를 설계하는 실무자',
      start: '많이 읽은 글에서 시작해 시리즈(RAG·에이전트)로 이어 읽는 것을 추천합니다.',
    },
    en: {
      desc: 'LLM, RAG, and AI agent architecture plus workflow automation — from prompt design to production LLMOps, with a build-and-operate focus.',
      audience: 'Developers and engineers shipping AI features, and practitioners designing automation.',
      start: 'Start with popular posts, then continue into the RAG and agent series.',
    },
  },
  '개발': {
    ko: {
      desc: '빌드 실패, 의존성 충돌, 런타임 에러 같은 개발 중 실제로 마주치는 문제의 진단·해결 절차를 다룹니다. 에러 메시지 원문 기준으로 정리합니다.',
      audience: '에러 메시지를 검색해서 들어온 백엔드·풀스택 개발자',
      start: '지금 겪는 에러 메시지와 같은 제목의 글부터 확인하세요. 진단 → 해결 → 재발 방지 순서로 구성되어 있습니다.',
    },
    en: {
      desc: 'Diagnose and fix build failures, dependency conflicts, and runtime errors using the real error text as the starting point.',
      audience: 'Backend and full-stack developers who land here from an error message search.',
      start: 'Open the post whose title matches your error, then follow diagnose → fix → prevent.',
    },
  },
  '인프라': {
    ko: {
      desc: 'Kubernetes·Docker·클라우드·DB 운영에서 발생하는 장애와 성능 문제를 다룹니다. 임시 조치와 영구 해결을 구분해 안내합니다.',
      audience: '컨테이너·클라우드 환경을 운영하는 DevOps·SRE·백엔드 엔지니어',
      start: '장애 상황이라면 많이 읽은 글의 진단 절차부터, 학습 목적이라면 시리즈를 순서대로 읽는 것을 추천합니다.',
    },
    en: {
      desc: 'Incidents and performance issues in Kubernetes, Docker, cloud, and databases — with temporary mitigations separated from lasting fixes.',
      audience: 'DevOps, SRE, and backend engineers running containers and cloud.',
      start: 'In an incident, start with popular diagnostic posts; for learning, read the related series in order.',
    },
  },
  '보안': {
    ko: {
      desc: '취약점 대응, 보안 설정, 인증·인가, ISMS-P 같은 보안 실무를 다룹니다. 확정적 법률 해석 대신 공식 기관 자료 확인을 함께 안내합니다.',
      audience: '서비스 보안을 담당하는 개발자·보안 실무자',
      start: '설정·구현 가이드는 바로 적용 가능하며, 규정 관련 글은 반드시 원문 링크를 함께 확인하세요.',
    },
    en: {
      desc: 'Vulnerability response, hardening, authn/authz, and practical security work — with pointers to official sources rather than definitive legal takes.',
      audience: 'Developers and security practitioners responsible for service security.',
      start: 'Apply configuration guides directly; for compliance topics, always check the linked primary sources.',
    },
  },
  'IT 트렌드': {
    ko: {
      desc: '기술 생태계의 의미 있는 변화를 실무 영향 중심으로 해석합니다. 단순 뉴스 요약이 아니라 "우리 팀에 무엇이 바뀌는가"를 다룹니다.',
      audience: '기술 의사결정을 하는 리드·시니어 엔지니어',
      start: '관심 주제의 최신 글부터 읽고, 연결된 심층 가이드로 이어가세요.',
    },
    en: {
      desc: 'Meaningful shifts in the tech ecosystem, interpreted for impact on real teams — not just news summaries.',
      audience: 'Leads and senior engineers who make technical decisions.',
      start: 'Read the latest on your topic, then follow into the deeper linked guides.',
    },
  },
  '툴 리뷰': {
    ko: {
      desc: '개발·운영 도구를 실제 사용 시나리오 기준으로 비교합니다. 선택 기준표와 상황별 추천을 제공합니다.',
      audience: '팀 도구 도입을 검토하는 개발자·엔지니어링 매니저',
      start: '비교표에서 자신의 요구사항 행을 먼저 확인하세요.',
    },
    en: {
      desc: 'Compare developer and ops tools against real usage scenarios, with criteria tables and situation-based picks.',
      audience: 'Developers and engineering managers evaluating team tooling.',
      start: 'Find your requirements row in the comparison table first.',
    },
  },
};

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; cat: string }> }) {
  noStore();
  const { cat: rawCat, locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const dict = getDictionary(locale);
  const cat = toKoreanCategory(rawCat);
  const label = categoryLabel(cat, locale);
  const intro = CATEGORY_INTRO[cat]?.[locale];

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
      .select('title,slug,views,tags,content_evidence')
      .eq('status', 'published')
      .eq('category', cat)
      .order('views', { ascending: false })
      .limit(3),
  ]);

  const posts: PostSummary[] = (data ?? []).map((p: Record<string, unknown>) => {
    const localized = localizePost({
      title: String(p.title ?? ''),
      excerpt: String(p.excerpt ?? ''),
      tags: p.tags as string[] | null,
      content: String(p.content ?? ''),
    }, locale);
    return {
      ...p,
      title: localized.title,
      excerpt: localized.excerpt,
      content: undefined,
      reading_time: readingTime((p.content as string) ?? ''),
    };
  }) as unknown as PostSummary[];
  const topPosts = ((topData ?? []) as { title: string; slug: string; views: number; tags?: string[] | null; content_evidence?: unknown }[]).map((p) => ({
    ...p,
    title: titleForLocale(locale, p.title, { tags: p.tags, content_evidence: p.content_evidence }),
  }));

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${label} — Nodelog`,
    description: locale === 'en' ? `In-depth pieces on ${label}` : `${label} 관련 심층 분석글 모음`,
    url: siteUrl(categoryHref(cat, locale), locale),
    inLanguage: locale,
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
          <div className="page-eyebrow">{label}</div>
          <h1 className="page-title">{label}</h1>
          <p className="page-lead">{intro?.desc ?? (locale === 'en' ? `In-depth pieces on ${label}.` : `${label} 관련 심층 분석글을 모았습니다.`)}</p>
          {intro && (
            <div style={{ display: 'grid', gap: 10, marginTop: 20, maxWidth: 720 }}>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{locale === 'en' ? 'Who this is for · ' : '이런 분을 위한 섹션 · '}</strong>{intro.audience}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{locale === 'en' ? 'How to read · ' : '읽는 순서 · '}</strong>{intro.start}
              </div>
            </div>
          )}
          {topPosts.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed var(--line-1)' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 10 }}>
                {locale === 'en' ? 'Most read' : '많이 읽은 글'}
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
          <span className="label">{locale === 'en' ? 'Category' : '카테고리'}</span>
          {allCats(locale, dict).map(c => {
            const isActive = c.cat === cat;
            const tabLabel = c.cat ? categoryLabel(c.cat, locale) : dict.home.filterAll;
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`filter-tab${isActive ? ' active' : ''}`}
              >
                {isActive ? `● ${tabLabel}` : tabLabel}
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
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>{dict.pages.categoryEmpty}</p>
            <Link href="/" className="btn btn-ghost">{dict.common.backHome}</Link>
          </div>
        ) : (
          <LoadMore
            initialPosts={posts}
            fetchUrl={`/api/posts?category=${encodeURIComponent(cat)}&limit=12&locale=${locale}`}
            pageSize={12}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}
