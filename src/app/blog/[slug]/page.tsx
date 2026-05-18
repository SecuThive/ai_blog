import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import type { Post } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import PostThumb from '@/components/PostThumb';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProgressBar, TableOfContents, CopyLinkBtn, ScrollToTopBtn, ShareBtn, MobileActionBar, ArticleFeedback } from './ArticleClient';

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
    client.from('posts').update({ views: (post.views ?? 0) + 1 }).eq('id', post.id).then(() => {});
    return post;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const { data } = await makeFreshClient().from('posts').select('slug').eq('status', 'published');
  return ((data ?? []) as { slug: string }[]).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '포스트를 찾을 수 없습니다' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image
        ? [{ url: post.cover_image, width: 1200, height: 630 }]
        : [],
    },
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
    return (
      <div className="err">
        <div>
          <div className="err-code">404</div>
          <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>포스트를 찾을 수 없습니다</p>
          <Link href="/" className="btn btn-ghost">← 홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const mins = readingTime(post.content);
  const wordCount = post.content.trim().split(/\s+/).length;
  const tone = catTone(post.category);
  const headings = extractHeadings(post.content);
  const authorInitials = post.author.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 2).toUpperCase() || 'AI';
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const [relatedPosts, adjacent] = await Promise.all([
    getRelatedPosts(post.category, post.id),
    getAdjacentPosts(post.published_at ?? '', post.id),
  ]);
  const mdComponents = makeMdComponents();

  return (
    <div>
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
            <span style={{ color: 'var(--text-5)' }}>{post.title.slice(0, 32)}…</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span className={`badge badge-${tone}`}>{post.category}</span>
            {post.tags.slice(0, 2).map(tag => (
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

          {/* Cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image ?? `/blog/${encodeURIComponent(post.slug)}/opengraph-image`}
            alt={post.title}
            style={{ marginTop: 32, width: '100%', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-1)', aspectRatio: '16/7', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

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

            {post.tags.length > 0 && (
              <div className="end-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="end-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="endmark">✦ ✦ ✦</div>

            <ArticleFeedback />

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
            </div>
          </aside>
        </div>

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
                    <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} />
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
