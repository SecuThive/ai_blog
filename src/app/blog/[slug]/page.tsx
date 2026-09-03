import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone, publicTags, DEFAULT_ROBOTS, MIN_DISPLAY_VIEWS } from '@/lib/utils';
import { rankRelated, isStronglyRelated } from '@/lib/related';
import type { Post } from '@/lib/types';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { POST_REDIRECTS } from '@/lib/postRedirects';
import { findOfficialDocs } from '@/lib/officialDocs';
import { NOINDEX_POST_SLUGS } from '@/lib/noindexPosts';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import RelatedContent, { type RelatedItem } from '@/components/RelatedContent';
import TrackedLink from '@/components/TrackedLink';
import TrackedExternalLink from '@/components/TrackedExternalLink';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import { ProgressBar, TableOfContents, CopyLinkBtn, ScrollToTopBtn, ShareBtn, MobileActionBar, ArticleFeedback, ViewTracker, BookmarkBtn, ReadingPositionTracker } from './ArticleClient';
import Comments, { type CommentRow } from '@/components/Comments';
import InlineSubscribeCTA from '@/components/InlineSubscribeCTA';

export const revalidate = 60;

// 아래 보조 데이터(댓글·이전/다음글·시리즈·관련 콘텐츠)는 전부 try/catch로 감싼다 —
// 하나라도 unhandled로 throw하면 Promise.all 전체가 실패해 ISR 재생성 렌더가 통째로
// 죽고, Next/Vercel은 마지막으로 성공한 캐시를 그대로 계속 서빙한다(에러가 겉으로
// 안 보이고 페이지가 몇 시간~며칠씩 그대로 굳어버리는 원인). 실패해도 빈 값으로
// 폴백해 본문(핵심 콘텐츠)만은 항상 최신으로 재생성되게 한다.
async function getComments(slugKey: string): Promise<CommentRow[]> {
  try {
    const { data } = await makeFreshClient()
      .from('comments')
      .select('id,name,content,created_at,parent_id,likes')
      .eq('post_slug', slugKey)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    return (data ?? []) as CommentRow[];
  } catch (e) {
    console.error('getComments 실패:', e);
    return [];
  }
}

async function getAdjacentPosts(publishedAt: string, id: number): Promise<{ prev: { title: string; slug: string } | null; next: { title: string; slug: string } | null }> {
  try {
    const client = makeFreshClient();
    const [prevResult, nextResult] = await Promise.all([
      client.from('posts').select('title,slug').eq('status', 'published').lt('published_at', publishedAt).neq('id', id).order('published_at', { ascending: false }).limit(1),
      client.from('posts').select('title,slug').eq('status', 'published').gt('published_at', publishedAt).neq('id', id).order('published_at', { ascending: true }).limit(1),
    ]);
    return {
      prev: prevResult.data?.[0] ?? null,
      next: nextResult.data?.[0] ?? null,
    };
  } catch (e) {
    console.error('getAdjacentPosts 실패:', e);
    return { prev: null, next: null };
  }
}

interface SeriesContext {
  seriesName: string;
  posts: { id: number; title: string; slug: string }[];
  currentIndex: number;
}

async function getSeriesContext(tags: string[], currentId: number): Promise<SeriesContext | null> {
  const seriesTag = tags.find(t => t.startsWith('series:'));
  if (!seriesTag) return null;
  const seriesName = seriesTag.replace('series:', '');
  try {
    const { data } = await makeFreshClient()
      .from('posts')
      .select('id,title,slug,tags,published_at')
      .eq('status', 'published')
      .contains('tags', [`series:${seriesName}`])
      .order('published_at', { ascending: true });
    // ep:N 태그 기준 정렬 (엔진이 부여한 에피소드 번호 존중) — /series 페이지와 일관성 유지.
    const rows = (data ?? []) as { id: number; title: string; slug: string; tags: string[]; published_at: string }[];
    const ep = (t: string[]) => { const m = (t ?? []).find(x => /^ep:\d+$/.test(x)); return m ? parseInt(m.slice(3), 10) : null; };
    rows.sort((a, b) => (ep(a.tags) ?? 1e9) - (ep(b.tags) ?? 1e9) || a.published_at.localeCompare(b.published_at));
    const posts = rows.map(({ id, title, slug }) => ({ id, title, slug }));
    const currentIndex = posts.findIndex(p => p.id === currentId);
    if (currentIndex === -1) return null;
    return { seriesName, posts, currentIndex };
  } catch (e) {
    console.error('getSeriesContext 실패:', e);
    return null;
  }
}

const CAT_TO_GUIDE_CAT: Record<string, string[]> = {
  '인프라': ['Linux / Shell', 'Docker / 컨테이너', '네트워킹 / 서버', 'OS / 시스템', '클라우드', '데이터베이스'],
  '보안': ['보안 설정'],
  '개발': ['Git / CI·CD', 'Docker / 컨테이너'],
  'AI & 자동화': ['Linux / Shell', 'Docker / 컨테이너', 'Git / CI·CD', '클라우드'],
  'IT 트렌드': ['클라우드', '데이터베이스', '네트워킹 / 서버'],
};

async function getRelatedGuides(category: string): Promise<import('@/lib/types').EngineerGuide[]> {
  const guideCats = CAT_TO_GUIDE_CAT[category] ?? [];
  if (guideCats.length === 0) return [];
  try {
    const client = makeFreshClient();
    const { data } = await client
      .from('engineer_guides')
      .select('id,title,slug,summary,category,difficulty,views')
      .eq('status', 'published')
      .in('category', guideCats)
      .order('views', { ascending: false })
      .limit(3);
    return (data ?? []) as import('@/lib/types').EngineerGuide[];
  } catch (e) {
    console.error('getRelatedGuides 실패:', e);
    return [];
  }
}

const RELATED_POST_SELECT = 'id,title,slug,excerpt,category,tags,author,agent_role,views,published_at,content,cover_image';

interface RankablePost { id: number; category: string; tags: string[] }

/** 태그·카테고리 유사도 기반 관련 글. 3개 미만이면 조회수 상위 글로 폴백해 채운다. */
async function getRelatedPosts(post: { id: number; category: string; tags: string[] }): Promise<import('@/lib/types').PostSummary[]> {
  try {
    const client = makeFreshClient();
    const cleanTags = publicTags(post.tags);

    const [tagRes, catRes] = await Promise.all([
      cleanTags.length > 0
        ? client.from('posts').select(RELATED_POST_SELECT).eq('status', 'published').neq('id', post.id).overlaps('tags', cleanTags).order('published_at', { ascending: false }).limit(8)
        : Promise.resolve({ data: [] as unknown[] }),
      client.from('posts').select(RELATED_POST_SELECT).eq('status', 'published').eq('category', post.category).neq('id', post.id).order('published_at', { ascending: false }).limit(8),
    ]);

    let ranked = rankRelated<RankablePost & Record<string, unknown>>(post, [
      (tagRes.data ?? []) as (RankablePost & Record<string, unknown>)[],
      (catRes.data ?? []) as (RankablePost & Record<string, unknown>)[],
    ]);

    if (ranked.length < 3) {
      const { data: fallback } = await client
        .from('posts')
        .select(RELATED_POST_SELECT)
        .eq('status', 'published')
        .neq('id', post.id)
        .order('views', { ascending: false })
        .limit(10);
      ranked = rankRelated(post, [ranked, (fallback ?? []) as (RankablePost & Record<string, unknown>)[]]);
    }

    return ranked.slice(0, 3).map((p) => ({
      ...p,
      content: undefined,
      reading_time: readingTime((p.content as string) ?? ''),
    })) as unknown as import('@/lib/types').PostSummary[];
  } catch (e) {
    console.error('getRelatedPosts 실패:', e);
    return [];
  }
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const decoded = decodeURIComponent(slug);
    const client = makeFreshClient();
    const { data, error } = await client
      .from('posts')
      .select('*')
      .eq('slug', decoded)
      .eq('status', 'published')
      .single();
    if (error || !data) return null;
    const post = data as unknown as Post;

    return post;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const { data } = await makeFreshClient().from('posts').select('slug').eq('status', 'published');
  return ((data ?? []) as { slug: string }[]).map(p => ({ slug: p.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '포스트를 찾을 수 없습니다', robots: { index: false, follow: false } };
  const url = `${SITE_URL}/blog/${post.slug}`;
  const cleanTags = publicTags(post.tags);
  return {
    title: post.title,
    description: post.excerpt,
    keywords: cleanTags.join(', '),
    authors: [{ name: 'Nodelog 기술 편집팀', url: `${SITE_URL}/author` }],
    alternates: { canonical: url },
    // 품질 감사에서 보강 대상으로 분류된 글은 보강 완료까지 색인 제외
    robots: NOINDEX_POST_SLUGS.has(post.slug) ? { index: false, follow: true } : DEFAULT_ROBOTS,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url,
      publishedTime: post.published_at ?? undefined,
      authors: ['Nodelog 기술 편집팀'],
      tags: cleanTags,
      images: post.cover_image
        ? [{ url: post.cover_image, width: 1200, height: 630 }]
        : [{ url: `${SITE_URL}/blog/${post.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

function extractHeadings(markdown: string) {
  const regex = /^(#{2,3}) (.+)$/gm;
  const headings: { id: string; text: string; index: number; level: number }[] = [];
  let match;
  let i = 0;
  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
    headings.push({ id, text, index: i++, level });
  }
  return headings;
}

function makeMdComponents() {
  let paragraphCount = 0;
  return {
    p: ({ children }: { children?: React.ReactNode }) => {
      const isFirst = paragraphCount === 0;
      paragraphCount++;
      return <p className={isFirst ? 'lede' : ''}>{children}</p>;
    },
    // 본문 markdown의 `# 제목`은 h2로 강등 — 페이지 h1(.article-title)과의
    // H1 중복을 방지한다(대부분의 초안이 제목을 # 로 반복 포함).
    h1: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      return <h2 id={id}>{children}</h2>;
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      return <h3 id={id}>{children}</h3>;
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="prose-callout">{children}</blockquote>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="prose-table-wrap"><table>{children}</table></div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead>{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr>{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => <th>{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td>{children}</td>,
    pre: ({ children }: { children?: React.ReactNode }) => {
      const child = Array.isArray(children) ? children[0] : children;
      if (child && typeof child === 'object' && 'props' in (child as object)) {
        const { className, children: code } = (child as React.ReactElement<{ className?: string; children?: React.ReactNode }>).props;
        // language-ts:filename.ts 형식 지원
        const raw = /language-([^\s]+)/.exec(className ?? '')?.[1] ?? '';
        const [langPart, filenamePart] = raw.split(':');
        const lang = langPart || undefined;
        const filename = filenamePart || undefined;
        const content = String(code ?? '').replace(/\n$/, '');
        return <CodeBlock code={content} lang={lang} filename={filename} />;
      }
      return <pre>{children}</pre>;
    },
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      if (className?.startsWith('language-')) return <code>{children}</code>;
      return <code>{children}</code>;
    },
    hr: () => <hr />,
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <figure className="prose-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src ?? ''} alt={alt ?? ''} loading="lazy" />
        {alt && <figcaption className="prose-caption">{alt}</figcaption>}
      </figure>
    ),
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    // 중복 정리로 강등된 글의 구 URL은 유지된 글로 308 영구 리다이렉트 — 링크 가치 이전
    const target = POST_REDIRECTS[decodeURIComponent(slug)];
    if (target) permanentRedirect(`/blog/${encodeURIComponent(target)}`);
    // 발행 취소·삭제된 글: soft 404(200) 대신 진짜 404 반환 — GSC Soft 404 / AdSense low-value 방지
    notFound();
  }

  const mins = readingTime(post.content);
  const wordCount = post.content.trim().split(/\s+/).length;
  const tone = catTone(post.category);
  const headings = extractHeadings(post.content);
  const authorInitials = 'NT';
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const modifiedDate = post.updated_at ?? post.published_at;
  const modifiedDateStr = modifiedDate
    ? new Date(modifiedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const hasMeaningfulUpdate = Boolean(
    post.updated_at
    && post.published_at
    && new Date(post.updated_at).getTime() > new Date(post.published_at).getTime() + 60_000
  );

  const [relatedPosts, adjacent, seriesCtx, relatedGuides, comments] = await Promise.all([
    getRelatedPosts(post),
    getAdjacentPosts(post.published_at ?? '', post.id),
    getSeriesContext(post.tags, post.id),
    getRelatedGuides(post.category),
    getComments(post.slug),
  ]);
  const mdComponents = makeMdComponents();
  const officialDocs = findOfficialDocs(post.title, post.tags, post.category);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  // 콘텐츠 성격에 맞는 스키마 타입 — 이 글들은 뉴스가 아니라 상시 참고용 기술/분석 글이므로
  // NewsArticle을 쓰지 않는다. 기술 카테고리는 TechArticle, 그 외는 일반 Article.
  const articleType = ['인프라', '개발', '보안'].includes(post.category) ? 'TechArticle' : 'Article';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    datePublished: post.published_at,
    dateModified: modifiedDate,
    // author를 가공의 Person으로 표기하지 않는다 — 실제 작성 주체는
    // 가공의 Person이 아닌 실제 운영 주체인 기술 편집 조직을 표시한다.
    author: { '@type': 'Organization', name: 'Nodelog 기술 편집팀', url: `${SITE_URL}/author` },
    editor: { '@type': 'Organization', name: 'Nodelog 기술 편집팀', url: `${SITE_URL}/author` },
    publisher: {
      '@type': 'Organization',
      name: 'Nodelog',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/opengraph-image` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    image: post.cover_image
      ? { '@type': 'ImageObject', url: post.cover_image, width: 1200, height: 630 }
      : { '@type': 'ImageObject', url: `${SITE_URL}/blog/${post.slug}/opengraph-image`, width: 1200, height: 630 },
    keywords: publicTags(post.tags).join(', '),
    articleSection: post.category,
    inLanguage: 'ko',
    wordCount,
    timeRequired: `PT${mins}M`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-title', '.article-deck', '.lede'],
    },
    // 독자 댓글을 구조화 데이터로 노출 — AI/검색이 실제 반응·Q&A를 인용 가능(GEO)
    ...(comments.length > 0 ? {
      commentCount: comments.length,
      comment: comments.filter(c => c.parent_id == null).slice(0, 20).map(c => ({
        '@type': 'Comment',
        author: { '@type': 'Person', name: c.name },
        datePublished: c.created_at,
        text: c.content,
      })),
    } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: post.category, item: `${SITE_URL}/category/${encodeURIComponent(post.category)}` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <div>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      <ViewTracker postId={post.id} table="posts" />
      <ReadingPositionTracker slug={post.slug} />
      <ProgressBar />
      <ScrollToTopBtn />
      <MobileActionBar />

      {/* Article hero */}
      <div className="article-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link>
            <span className="sep">/</span>
            <Link href={`/category/${post.category}`}>{post.category}</Link>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px', display: 'inline-block', verticalAlign: 'bottom' }}>{post.title}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span className={`badge badge-${tone}`}>{post.category}</span>
            {publicTags(post.tags).slice(0, 2).map(tag => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>

          <h1 className="article-title">{post.title}</h1>
          <p className="article-deck">{post.excerpt}</p>

          <div className="article-byline">
            <Link href="/author" className="meta-item" title="작성·검토 방식 보기">
              <span className="author-pip">{authorInitials}</span>
              Nodelog 기술 편집팀
            </Link>
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time dateTime={post.published_at ?? undefined}>{dateStr}</time>
            </span>
            {hasMeaningfulUpdate && (
              <span className="meta-item">
                업데이트 <time dateTime={post.updated_at ?? undefined}>{modifiedDateStr}</time>
              </span>
            )}
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {mins}분 읽기
            </span>
            {post.views >= MIN_DISPLAY_VIEWS && (
              <span className="meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
                {post.views.toLocaleString()} 조회
              </span>
            )}
          </div>

          {/* 핵심 요약(TL;DR) — content_evidence처럼 선택적 필드(key_points)가 실제로 있을 때만 노출.
              데이터가 없으면 임의로 채우지 않고 섹션 자체를 렌더링하지 않는다. */}
          {post.key_points && post.key_points.length > 0 && (
            <div className="key-points">
              <div className="key-points-head">핵심 요약</div>
              <ul>
                {post.key_points.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
          )}

          {/* Cover image — real image or auto-generated OG image as cover */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image || `/blog/${post.slug}/opengraph-image`}
            alt={post.title}
            style={{ marginTop: 32, width: '100%', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-1)', aspectRatio: '16/7', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
        </div>
      </div>

      {/* Series banner */}
      {seriesCtx && (
        <div style={{ borderBottom: '1px solid var(--line-1)', background: 'var(--bg-2)' }}>
          <div className="container" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href={`/series/${encodeURIComponent(seriesCtx.seriesName)}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}
              >
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-4)', textTransform: 'uppercase' }}>시리즈</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{seriesCtx.seriesName}</span>
                <span className="badge" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}>
                  {seriesCtx.currentIndex + 1} / {seriesCtx.posts.length}
                </span>
              </Link>
              <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {seriesCtx.currentIndex > 0 && (
                  <Link
                    href={`/blog/${seriesCtx.posts[seriesCtx.currentIndex - 1].slug}`}
                    className="btn btn-sm"
                  >
                    ← EP {String(seriesCtx.currentIndex).padStart(2, '0')}
                  </Link>
                )}
                {seriesCtx.currentIndex < seriesCtx.posts.length - 1 && (
                  <Link
                    href={`/blog/${seriesCtx.posts[seriesCtx.currentIndex + 1].slug}`}
                    className="btn btn-sm"
                  >
                    EP {String(seriesCtx.currentIndex + 2).padStart(2, '0')} →
                  </Link>
                )}
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {seriesCtx.posts.map((ep, i) => (
                <Link
                  key={ep.id}
                  href={`/blog/${ep.slug}`}
                  title={ep.title}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontFamily: 'var(--ff-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: '1px solid var(--line-2)',
                    background: i === seriesCtx.currentIndex ? `var(--acc-${tone})` : 'var(--bg-3)',
                    color: i === seriesCtx.currentIndex ? '#fff' : 'var(--text-3)',
                    transition: 'background 0.15s',
                  }}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3-column article body */}
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="article-wrap">
          {/* TOC */}
          <TableOfContents headings={headings}>
            {/* 실제로 강하게 연관된 글이 있을 때만 노출 — 모든 글에 기계적으로 삽입하지 않는다. */}
            {relatedPosts[0] && isStronglyRelated(post, relatedPosts[0]) && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--line-1)' }}>
                <div className="toc-title">바로 이어보기</div>
                <TrackedLink
                  href={`/blog/${relatedPosts[0].slug}`}
                  event={{ name: 'related_post_click', path: `/blog/${post.slug}`, target_slug: relatedPosts[0].slug, position: -1 }}
                  style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}
                >
                  → {relatedPosts[0].title}
                </TrackedLink>
              </div>
            )}
          </TableOfContents>

          {/* Prose */}
          <article className="prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents as Record<string, unknown>}
            >
              {post.content}
            </ReactMarkdown>

            {post.content_evidence && (
              <section className="editorial-note" aria-labelledby="verification-evidence-title">
                <div className="editorial-note-head" id="verification-evidence-title">확인 정보</div>
                {post.content_evidence.testEnvironment && (
                  <div>
                    <strong>테스트 환경</strong>
                    <p className="editorial-note-body">
                      {[
                        post.content_evidence.testEnvironment.os,
                        ...(post.content_evidence.testEnvironment.software ?? []),
                        post.content_evidence.testEnvironment.testedAt
                          ? `확인일 ${post.content_evidence.testEnvironment.testedAt}`
                          : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
                {post.content_evidence.verification?.commands?.length ? (
                  <div>
                    <strong>직접 확인한 명령</strong>
                    <CodeBlock code={post.content_evidence.verification.commands.join('\n')} lang="shell" />
                    {post.content_evidence.verification.result && <p>{post.content_evidence.verification.result}</p>}
                  </div>
                ) : null}
                {(post.content_evidence.beforeAfter?.before || post.content_evidence.beforeAfter?.after) && (
                  <div className="grid-2">
                    <div><strong>해결 전</strong><p>{post.content_evidence.beforeAfter.before}</p></div>
                    <div><strong>해결 후</strong><p>{post.content_evidence.beforeAfter.after}</p></div>
                  </div>
                )}
                {post.content_evidence.cautions?.length ? (
                  <div><strong>주의사항</strong><ul>{post.content_evidence.cautions.map(item => <li key={item}>{item}</li>)}</ul></div>
                ) : null}
                {post.content_evidence.officialSources?.length ? (
                  <div className="editorial-note-refs">
                    <span className="refs-label">공식 문서</span>
                    {post.content_evidence.officialSources.map(source => (
                      <TrackedExternalLink key={source.url} href={source.url} path={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">{source.label} ↗</TrackedExternalLink>
                    ))}
                  </div>
                ) : null}
              </section>
            )}

            {publicTags(post.tags).length > 0 && (
              <div className="end-tags">
                {publicTags(post.tags).map(tag => (
                  <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="end-tag">#{tag}</Link>
                ))}
              </div>
            )}

            <div className="endmark">✦ ✦ ✦</div>

            {/* AI 보조 도구 활용과 사람의 편집 판단을 투명하게 안내한다. */}
            <div className="editorial-note">
              <div className="editorial-note-head">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                편집 검토 · Editorial Review
              </div>
              <p className="editorial-note-body">
                AI 도구는 자료 조사와 초안 작성의 보조 수단으로 사용될 수 있습니다.
                Nodelog는 공개 전 내용과 출처를 검토하고, 환경(OS·버전)에 따라 결과가 달라질 수 있는 기술 정보는 공식 문서를 함께 확인하도록 안내합니다.
                오류를 발견하시면 <a href="mailto:thive8564@gmail.com">이메일로 제보</a>해 주세요 — 확인 후 신속히 정정합니다.
              </p>
              <div className="editorial-note-meta">
                <span>편집 책임 · {post.reviewed_by || 'Nodelog 기술 편집팀'}</span>
                <span className="sep">·</span>
                <span>발행 · <time dateTime={post.published_at ?? undefined}>{dateStr}</time></span>
                {hasMeaningfulUpdate && <><span className="sep">·</span><span>업데이트 · <time dateTime={post.updated_at ?? undefined}>{modifiedDateStr}</time></span></>}
              </div>
              {officialDocs.length > 0 && (
                <div className="editorial-note-refs">
                  <span className="refs-label">관련 공식 문서</span>
                  {officialDocs.map(d => (
                    <TrackedExternalLink key={d.url} href={d.url} path={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">{d.name} ↗</TrackedExternalLink>
                  ))}
                </div>
              )}
              <div className="editorial-note-links">
                <Link href="/author">운영·검토 방식 자세히 보기 →</Link>
                <Link href="/policy">편집 정책 →</Link>
              </div>
            </div>

            <ArticleFeedback postSlug={post.slug} />

            <InlineSubscribeCTA variant="post" />

            <Comments slugKey={post.slug} initialComments={comments} />

            {(adjacent.prev || adjacent.next) && (
              <nav className="article-nav">
                {adjacent.prev ? (
                  <Link href={`/blog/${adjacent.prev.slug}`} className="article-nav-link prev">
                    <div className="article-nav-dir">← 이전 글</div>
                    <div className="article-nav-title">{adjacent.prev.title}</div>
                  </Link>
                ) : <div />}
                {adjacent.next ? (
                  <Link href={`/blog/${adjacent.next.slug}`} className="article-nav-link next">
                    <div className="article-nav-dir">다음 글 →</div>
                    <div className="article-nav-title">{adjacent.next.title}</div>
                  </Link>
                ) : <div />}
              </nav>
            )}
          </article>

          {/* Aside rail */}
          <aside className="aside-rail">
            <div className="author-card">
              <div className="author-avatar">{authorInitials}</div>
              <div className="author-h">편집 책임</div>
              <div className="author-name">Nodelog 기술 편집팀</div>
              <p className="author-bio">AI 기반 자료 조사 보조 · 편집 검토. 오류 제보와 문서 변경을 반영해 콘텐츠를 정정·보강합니다.</p>
            </div>

            <div className="article-info">
              <div className="article-info-h">이 글에 대해</div>
              <div className="article-info-row"><span>읽기 시간</span><span>{mins}분</span></div>
              <div className="article-info-row"><span>단어 수</span><span>{wordCount.toLocaleString()}</span></div>
              <div className="article-info-row"><span>섹션</span><span>{headings.filter(h => h.level === 2).length}</span></div>
              <div className="article-info-row"><span>발행일</span><span style={{ fontSize: 11 }}>{dateStr}</span></div>
              {hasMeaningfulUpdate && <div className="article-info-row"><span>업데이트</span><span style={{ fontSize: 11 }}>{modifiedDateStr}</span></div>}
            </div>

            <div className="actions-rail">
              <CopyLinkBtn />
              <ShareBtn />
              <BookmarkBtn slug={post.slug} title={post.title} />
            </div>
          </aside>
        </div>

        {/* Related engineer guides */}
        <RelatedContent
          title="관련 엔지니어 가이드"
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 6 }}>
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          }
          className="related--guides"
          style={{ marginBottom: 24 }}
          currentPath={`/blog/${post.slug}`}
          viewAllHref="/engineer"
          viewAllLabel="전체 가이드"
          items={relatedGuides.map((g): RelatedItem => ({
            id: g.id,
            href: `/engineer/${g.slug}`,
            slug: g.slug,
            title: g.title,
            description: g.summary,
            category: g.category,
            meta: 'GUIDE · 실전 레퍼런스',
          }))}
        />

        {/* Related posts */}
        <RelatedContent
          title="같은 주제의 글"
          icon={<span className="num" style={{ marginRight: 8 }}>✦</span>}
          currentPath={`/blog/${post.slug}`}
          items={relatedPosts.map((p): RelatedItem => ({
            id: p.id,
            href: `/blog/${p.slug}`,
            slug: p.slug,
            title: p.title,
            description: p.excerpt,
            category: p.category,
            badgeTone: catTone(p.category),
            meta: `${p.reading_time}분 읽기`,
            thumb: { coverImage: p.cover_image },
          }))}
        />
      </div>
    </div>
  );
}
