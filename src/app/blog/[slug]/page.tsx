import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import type { Post } from '@/lib/types';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { POST_REDIRECTS } from '@/lib/postRedirects';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PostThumb from '@/components/PostThumb';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import { ProgressBar, TableOfContents, CopyLinkBtn, ScrollToTopBtn, ShareBtn, MobileActionBar, ArticleFeedback, ViewTracker, BookmarkBtn, ReadingPositionTracker } from './ArticleClient';
import Comments from '@/components/Comments';

export const revalidate = 60;

async function getAdjacentPosts(publishedAt: string, id: number): Promise<{ prev: { title: string; slug: string } | null; next: { title: string; slug: string } | null }> {
  noStore();
  const client = makeFreshClient();
  const [prevResult, nextResult] = await Promise.all([
    client.from('posts').select('title,slug').eq('status', 'published').lt('published_at', publishedAt).neq('id', id).order('published_at', { ascending: false }).limit(1),
    client.from('posts').select('title,slug').eq('status', 'published').gt('published_at', publishedAt).neq('id', id).order('published_at', { ascending: true }).limit(1),
  ]);
  return {
    prev: prevResult.data?.[0] ?? null,
    next: nextResult.data?.[0] ?? null,
  };
}

interface SeriesContext {
  seriesName: string;
  posts: { id: number; title: string; slug: string }[];
  currentIndex: number;
}

async function getSeriesContext(tags: string[], currentId: number): Promise<SeriesContext | null> {
  noStore();
  const seriesTag = tags.find(t => t.startsWith('series:'));
  if (!seriesTag) return null;
  const seriesName = seriesTag.replace('series:', '');
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
}

const CAT_TO_GUIDE_CAT: Record<string, string[]> = {
  '인프라': ['Linux / Shell', 'Docker / 컨테이너', '네트워킹 / 서버', 'OS / 시스템', '클라우드', '데이터베이스'],
  '보안': ['보안 설정'],
  '개발': ['Git / CI·CD', 'Docker / 컨테이너'],
  'AI & 자동화': ['Linux / Shell', 'Docker / 컨테이너', 'Git / CI·CD', '클라우드'],
  'IT 트렌드': ['클라우드', '데이터베이스', '네트워킹 / 서버'],
};

async function getRelatedGuides(category: string, tags: string[]): Promise<import('@/lib/types').EngineerGuide[]> {
  noStore();
  const guideCats = CAT_TO_GUIDE_CAT[category] ?? [];
  if (guideCats.length === 0) return [];
  const client = makeFreshClient();
  const { data } = await client
    .from('engineer_guides')
    .select('id,title,slug,summary,category,difficulty,views')
    .eq('status', 'published')
    .in('category', guideCats)
    .order('views', { ascending: false })
    .limit(3);
  return (data ?? []) as import('@/lib/types').EngineerGuide[];
}

async function getRelatedPosts(category: string, excludeId: number): Promise<import('@/lib/types').PostSummary[]> {
  noStore();
  const client = makeFreshClient();
  const { data } = await client
    .from('posts')
    .select('id,title,slug,excerpt,category,tags,author,agent_role,views,published_at,content,cover_image')
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(3);
  return (data ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    content: undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  })) as unknown as import('@/lib/types').PostSummary[];
}

async function getPost(slug: string): Promise<Post | null> {
  noStore();
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
  const cleanTags = post.tags.filter(t => !t.startsWith('series:'));
  return {
    title: post.title,
    description: post.excerpt,
    keywords: cleanTags.join(', '),
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url,
      publishedTime: post.published_at ?? undefined,
      authors: [post.author],
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
  const authorInitials = post.author.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 2).toUpperCase() || 'AI';
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const [relatedPosts, adjacent, seriesCtx, relatedGuides] = await Promise.all([
    getRelatedPosts(post.category, post.id),
    getAdjacentPosts(post.published_at ?? '', post.id),
    getSeriesContext(post.tags, post.id),
    getRelatedGuides(post.category, post.tags),
  ]);
  const mdComponents = makeMdComponents();

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { '@type': 'Person', name: post.author },
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
    keywords: post.tags.filter(t => !t.startsWith('series:')).join(', '),
    articleSection: post.category,
    inLanguage: 'ko',
    wordCount,
    timeRequired: `PT${mins}M`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-title', '.article-deck', '.lede'],
    },
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
            {post.tags.filter(t => !t.startsWith('series:')).slice(0, 2).map(tag => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>

          <h1 className="article-title">{post.title}</h1>
          <p className="article-deck">{post.excerpt}</p>

          <div className="article-byline">
            <span className="meta-item">
              <span className="author-pip">{authorInitials}</span>
              {post.author}
            </span>
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateStr}
            </span>
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {mins}분 읽기
            </span>
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {post.views.toLocaleString()} 조회
            </span>
          </div>

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
          <TableOfContents headings={headings} />

          {/* Prose */}
          <article className="prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents as Record<string, unknown>}
            >
              {post.content}
            </ReactMarkdown>

            {post.tags.filter(t => !t.startsWith('series:')).length > 0 && (
              <div className="end-tags">
                {post.tags.filter(t => !t.startsWith('series:')).map(tag => (
                  <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className="end-tag">#{tag}</Link>
                ))}
              </div>
            )}

            <div className="endmark">✦ ✦ ✦</div>

            {/* 편집 검토 신뢰 블록 — AI 작성 + 사람 편집자 검토 과정을 본문에서 명시 (E-E-A-T) */}
            <div className="editorial-note">
              <div className="editorial-note-head">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                편집 검토 · Editorial Review
              </div>
              <p className="editorial-note-body">
                이 글은 AI 에이전트가 1차 초안을 작성한 뒤, <strong>사람 편집자가 사실관계·출처·톤과 맥락을 검토</strong>하여 발행했습니다.
                오류나 부정확한 내용이 확인되면 24시간 이내에 정정합니다.
              </p>
              <div className="editorial-note-meta">
                <span>작성 · {post.author}</span>
                <span className="sep">·</span>
                <span>검토 · 사람 편집자</span>
                <span className="sep">·</span>
                <span>발행 · {dateStr}</span>
              </div>
              <div className="editorial-note-links">
                <Link href="/author">운영·검토 방식 자세히 보기 →</Link>
                <Link href="/policy">편집 정책 →</Link>
              </div>
            </div>

            <ArticleFeedback postSlug={post.slug} />

            <Comments postSlug={post.slug} />

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
              <div className="author-h">작성자</div>
              <div className="author-name">{post.author}</div>
              <p className="author-bio">AI 에이전트가 최신 기술 트렌드를 분석하고 작성했습니다. 사람 편집자가 검수합니다.</p>
            </div>

            <div className="article-info">
              <div className="article-info-h">이 글에 대해</div>
              <div className="article-info-row"><span>읽기 시간</span><span>{mins}분</span></div>
              <div className="article-info-row"><span>단어 수</span><span>{wordCount.toLocaleString()}</span></div>
              <div className="article-info-row"><span>섹션</span><span>{headings.filter(h => h.level === 2).length}</span></div>
              <div className="article-info-row"><span>발행일</span><span style={{ fontSize: 11 }}>{dateStr}</span></div>
            </div>

            <div className="actions-rail">
              <CopyLinkBtn />
              <ShareBtn />
              <BookmarkBtn slug={post.slug} title={post.title} />
            </div>
          </aside>
        </div>

        {/* Related engineer guides */}
        {relatedGuides.length > 0 && (
          <div className="related" style={{ marginBottom: 24 }}>
            <div className="related-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 6 }}>
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                관련 엔지니어 가이드
              </span>
              <Link href="/engineer" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                전체 가이드 →
              </Link>
            </div>
            <div className="related-grid">
              {relatedGuides.map(g => (
                <Link key={g.id} href={`/engineer/${g.slug}`} className="card card-link" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="badge" style={{ fontSize: 10.5, alignSelf: 'flex-start' }}>{g.category}</span>
                  <h3 className="card-title" style={{ fontSize: 14.5, margin: 0 }}>{g.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.5 }}>{g.summary}</p>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 4 }}>GUIDE · 실전 레퍼런스</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="related">
            <div className="related-h">
              <span className="num">✦</span> 같은 주제의 글
            </div>
            <div className="related-grid">
              {relatedPosts.map(p => {
                const rt = catTone(p.category);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                    <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} category={p.category} />
                    <div className="card-body">
                      <div className="card-meta">
                        <span className={`badge badge-${rt}`}>{p.category}</span>
                      </div>
                      <h3 className="card-title">{p.title}</h3>
                      <p className="card-excerpt">{p.excerpt}</p>
                      <div className="card-foot">
                        <span>{p.reading_time}분 읽기</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
