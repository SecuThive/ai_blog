import { supabase, readingTime } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import type { Post } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Cover, { categoryHue } from '@/components/Cover';
import { ProgressBar, TableOfContents, CopyLinkBtn, ScrollToTopBtn, ShareBtn, MobileActionBar } from './ArticleClient';

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
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
    // views 업데이트 실패해도 페이지 렌더링은 계속
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
      images: post.cover_image ? [{ url: post.cover_image, width: 1200, height: 630 }] : [{ url: '/og-default.png', width: 1200, height: 630 }],
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
      <div className="shell" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 900 }}>404</h1>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--muted)' }}>포스트를 찾을 수 없습니다</p>
        <Link href="/" className="article-back" style={{ justifyContent: 'center', marginTop: 24 }}>← 홈으로 돌아가기</Link>
      </div>
    );
  }

  const mins = readingTime(post.content);
  const wordCount = post.content.trim().split(/\s+/).length;
  const hue = categoryHue(post.category);
  const mark = String(post.id).padStart(2, '0');
  const headings = extractHeadings(post.content);
  const authorInitials = post.author.replace(/[^a-zA-Z가-힣]/g, '').slice(0, 2).toUpperCase() || 'AI';
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const relatedPosts = await getRelatedPosts(post.category, post.id);
  const mdComponents = makeMdComponents();

  return (
    <div>
      <ProgressBar />
      <ScrollToTopBtn />
      <MobileActionBar />
      <div className="shell">
        <Link href="/" className="article-back">← 홈으로</Link>

        {/* Article header */}
        <header className="article-head">
          {/* Full-width banner cover */}
          <div className="article-banner">
            <Cover hue={hue} mark={mark} kicker={post.category} shape="banner" />
          </div>

          <div className="article-kicker">
            <span className="cat">{post.category}</span>
            <span className="rule" />
            <span className="num">Nº {String(post.id).padStart(2, '0')}</span>
          </div>
          <h1 className="article-h1">{post.title}</h1>
          <p className="article-deck">{post.excerpt}</p>
          <div className="article-meta">
            <span className="byline-ai">AI 작성 · 사람 검수</span>
            <span className="dot">·</span>
            <span>{dateStr}</span>
            <span className="dot">·</span>
            <span>{mins}분 읽기</span>
            <span className="dot">·</span>
            <span>{post.views.toLocaleString()} 조회</span>
          </div>
        </header>

        {/* 3-column layout */}
        <div className="article-shell">
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

            {/* In-article ad */}
            <div className="ad-in-article">
              <div className="ad-in-article-tag">광고</div>
              <p className="ad-in-article-body">Google AdSense · In-Article · Fluid</p>
              <div className="ad-in-article-meta">자동 매칭 광고가 이 위치에 표시됩니다</div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="end-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="end-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="endmark">✦ ✦ ✦</div>
          </article>

          {/* Sidebar */}
          <aside className="article-side">
            <div className="author-card">
              <div className="author-avatar">{authorInitials}</div>
              <div className="author-h">작성자</div>
              <div className="author-name">{post.author}</div>
              <p className="author-bio">AI 에이전트가 최신 기술 트렌드를 분석하고 작성한 글입니다. 사람 편집자가 검수합니다.</p>
            </div>

            <div className="article-info">
              <div className="article-info-h">이 글에 대해</div>
              <div className="article-info-row">
                <span>읽기 시간</span>
                <span>{mins}분</span>
              </div>
              <div className="article-info-row">
                <span>단어 수</span>
                <span>{wordCount.toLocaleString()}</span>
              </div>
              <div className="article-info-row">
                <span>섹션</span>
                <span>{headings.filter(h => h.level === 2).length}</span>
              </div>
              <div className="article-info-row">
                <span>발행일</span>
                <span>{dateStr}</span>
              </div>
            </div>

            <div className="actions-rail">
              <CopyLinkBtn />
              <ShareBtn />
              <button type="button" className="action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                북마크
              </button>
            </div>

            {/* Article ad */}
            <div className="ad-in-article" style={{ margin: '0 0 24px' }}>
              <div className="ad-in-article-tag">광고</div>
              <p className="ad-in-article-body" style={{ fontSize: 14 }}>300 × 250</p>
              <div className="ad-in-article-meta">Rectangle Ad</div>
            </div>
          </aside>
        </div>

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <div className="related">
            <div className="related-h">
              <span className="num">¶</span> 같은 주제의 글
            </div>
            <div className="related-grid">
              {relatedPosts.map((p) => {
                const rHue = categoryHue(p.category);
                const rMark = String(p.id).padStart(2, '0');
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="card">
                    <Cover hue={rHue} mark={rMark} kicker={p.category} shape="card" />
                    <div className="card-cat">{p.category}</div>
                    <h3 className="card-title">{p.title}</h3>
                    <p className="card-sub">{p.excerpt}</p>
                    <div className="card-foot">
                      <span className="ai-mini">AI · 작성</span>
                      <span>{p.reading_time}분</span>
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
