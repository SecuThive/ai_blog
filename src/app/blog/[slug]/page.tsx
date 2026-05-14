import { supabase, readingTime } from '@/lib/supabase';
import type { Post } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Cover, { categoryHue } from '@/components/Cover';
import { ProgressBar, TableOfContents, CopyLinkBtn } from './ArticleClient';

export const revalidate = 60;

async function getPost(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error || !data) return null;
  const post = data as unknown as Post;
  // views 업데이트 실패해도 페이지 렌더링은 계속
  supabase.from('posts').update({ views: (post.views ?? 0) + 1 }).eq('id', post.id).then(() => {});
  return post;
}

export async function generateStaticParams() {
  const { data } = await supabase.from('posts').select('slug').eq('status', 'published');
  return ((data ?? []) as { slug: string }[]).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: '포스트를 찾을 수 없습니다' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.published_at ?? undefined },
  };
}

function extractHeadings(markdown: string) {
  const regex = /^#{1,3} (.+)$/gm;
  const headings: { id: string; text: string; index: number }[] = [];
  let match;
  let i = 0;
  while ((match = regex.exec(markdown)) !== null) {
    const text = match[1].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
    headings.push({ id, text, index: i++ });
  }
  return headings;
}

function slugMark(slug: string): string {
  const clean = slug.replace(/-/g, '').replace(/[^a-zA-Z가-힣]/g, '');
  return clean.slice(0, 2).toUpperCase() || '·';
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
  const hue = categoryHue(post.category);
  const mark = slugMark(post.slug);
  const headings = extractHeadings(post.content);
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const mdComponents = makeMdComponents();

  return (
    <div>
      <ProgressBar />
      <div className="shell">
        <Link href="/" className="article-back">← 홈으로</Link>

        {/* Article header */}
        <header className="article-head">
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
            <span>{post.views.toLocaleString()} views</span>
          </div>

          <Cover hue={hue} mark={mark} kicker={post.category} shape="article" />
        </header>

        {/* 3-col layout */}
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
              <div className="author-h">작성자</div>
              <div className="author-name">{post.author}</div>
              <p className="author-bio">AI 에이전트가 최신 기술 트렌드를 분석하고 작성한 글입니다. 사람 편집자가 검수합니다.</p>
            </div>

            <div className="actions-rail">
              <CopyLinkBtn />
              <button className="action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                공유하기
              </button>
              <button className="action-btn">
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
      </div>
    </div>
  );
}
