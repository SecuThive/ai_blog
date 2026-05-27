import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import type { EngineerGuide } from '@/lib/types';
import { makeFreshClient } from '@/lib/supabase';
import { engCatTone, diffLabel } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import JsonLd from '@/components/JsonLd';
import { TableOfContents, ProgressBar, ScrollToTopBtn, CopyLinkBtn, ShareBtn } from '@/app/blog/[slug]/ArticleClient';

export const revalidate = 60;

async function getGuide(slug: string): Promise<EngineerGuide | null> {
  noStore();
  try {
    const { data, error } = await makeFreshClient()
      .from('engineer_guides')
      .select('*')
      .eq('slug', decodeURIComponent(slug))
      .eq('status', 'published')
      .single();
    if (error || !data) return null;
    const guide = data as unknown as EngineerGuide;
    makeFreshClient()
      .from('engineer_guides')
      .update({ views: (guide.views ?? 0) + 1 })
      .eq('id', guide.id)
      .then(() => {});
    return guide;
  } catch {
    return null;
  }
}

const GUIDE_TO_POST_CAT: Record<string, string[]> = {
  'Linux / Shell':       ['인프라', '개발'],
  'Docker / 컨테이너':   ['인프라', '개발'],
  'Git / CI·CD':         ['개발'],
  '네트워킹 / 서버':     ['인프라'],
  'OS / 시스템':         ['인프라'],
  '보안 설정':           ['보안'],
  '클라우드':            ['인프라', 'IT 트렌드'],
  '데이터베이스':        ['개발', '인프라'],
  '트러블슈팅':          ['인프라', '개발'],
};

async function getRelatedBlogPosts(category: string): Promise<{ id: number; title: string; slug: string; excerpt: string; category: string }[]> {
  noStore();
  const cats = GUIDE_TO_POST_CAT[category] ?? [];
  if (cats.length === 0) return [];
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category')
    .eq('status', 'published')
    .in('category', cats)
    .order('views', { ascending: false })
    .limit(3);
  return (data ?? []) as { id: number; title: string; slug: string; excerpt: string; category: string }[];
}

function extractHowToSteps(md: string): { name: string }[] {
  const regex = /^## (.+)$/gm;
  const steps: { name: string }[] = [];
  let m;
  while ((m = regex.exec(md)) !== null) {
    const name = m[1].trim();
    if (!name.match(/^(개요|소개|정리|마무리|요약)/)) {
      steps.push({ name });
    }
  }
  return steps;
}

async function getRelated(category: string, excludeId: number): Promise<EngineerGuide[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('engineer_guides')
    .select('id,title,slug,summary,category,difficulty,tags')
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(4);
  return (data ?? []) as unknown as EngineerGuide[];
}

export async function generateStaticParams() {
  const { data } = await makeFreshClient()
    .from('engineer_guides')
    .select('slug')
    .eq('status', 'published');
  return ((data ?? []) as { slug: string }[]).map(g => ({ slug: g.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: '가이드를 찾을 수 없습니다' };
  const url = `${SITE_URL}/engineer/${guide.slug}`;
  return {
    title: `${guide.title} — Nodelog Engineer`,
    description: guide.summary,
    keywords: guide.tags.join(', '),
    authors: [{ name: guide.author }],
    alternates: { canonical: url },
    openGraph: {
      title: `${guide.title} — Nodelog Engineer`,
      description: guide.summary,
      type: 'article',
      url,
      images: [{ url: `${SITE_URL}/engineer/${guide.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.summary },
  };
}

function extractHeadings(md: string) {
  const regex = /^(#{2,3}) (.+)$/gm;
  const out: { id: string; text: string; level: number; index: number }[] = [];
  let m;
  while ((m = regex.exec(md)) !== null) {
    const text = m[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
    out.push({ id, text, level: m[1].length, index: out.length });
  }
  return out;
}

function makeMdComponents() {
  return {
    // 코드 블록: pre를 가로채 CodeBlock으로 교체
    pre: ({ children }: { children?: React.ReactNode }) => {
      const child = Array.isArray(children) ? children[0] : children;
      if (child && typeof child === 'object' && 'props' in (child as object)) {
        const { className, children: code } = (child as React.ReactElement<{ className?: string; children?: React.ReactNode }>).props;
        const match = /language-(\w+)/.exec(className ?? '');
        const lang = match?.[1];
        const content = String(code ?? '').replace(/\n$/, '');
        return <CodeBlock code={content} lang={lang} />;
      }
      return <pre>{children}</pre>;
    },
    // 인라인 코드 (백틱 한 개)
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      if (className?.startsWith('language-')) return <code>{children}</code>;
      return <code className="prose-inline-code">{children}</code>;
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      return <h2 id={id}>{children}</h2>;
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const id = String(children).toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '');
      return <h3 id={id}>{children}</h3>;
    },
    // blockquote → callout 박스 (팁/주의)
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <div className="eng-callout">
        <div className="eng-callout-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="eng-callout-body">{children}</div>
      </div>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="prose-table-wrap"><table>{children}</table></div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead>{children}</thead>,
    tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
    tr: ({ children }: { children?: React.ReactNode }) => <tr>{children}</tr>,
    th: ({ children }: { children?: React.ReactNode }) => <th>{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td>{children}</td>,
    hr: () => <hr className="eng-hr" />,
  };
}

export default async function EngineerGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    return (
      <div className="err">
        <div>
          <div className="err-code">404</div>
          <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>가이드를 찾을 수 없습니다</p>
          <Link href="/engineer" className="btn btn-ghost">← 엔지니어 가이드로</Link>
        </div>
      </div>
    );
  }

  const tone = engCatTone(guide.category);
  const headings = extractHeadings(guide.content);
  const [related, relatedPosts] = await Promise.all([
    getRelated(guide.category, guide.id),
    getRelatedBlogPosts(guide.category),
  ]);
  const mdComponents = makeMdComponents();

  const dateStr = new Date(guide.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const updatedStr = guide.updated_at !== guide.created_at
    ? new Date(guide.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  const guideUrl = `${SITE_URL}/engineer/${guide.slug}`;
  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.title,
    description: guide.summary,
    url: guideUrl,
    datePublished: guide.created_at,
    dateModified: guide.updated_at,
    author: { '@type': 'Organization', name: guide.author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Nodelog',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/opengraph-image` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': guideUrl },
    keywords: guide.tags.join(', '),
    articleSection: guide.category,
    proficiencyLevel: guide.difficulty === 'beginner' ? 'Beginner' : guide.difficulty === 'advanced' ? 'Expert' : 'Intermediate',
    inLanguage: 'ko',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '엔지니어', item: `${SITE_URL}/engineer` },
      { '@type': 'ListItem', position: 3, name: guide.category, item: `${SITE_URL}/engineer?cat=${encodeURIComponent(guide.category)}` },
      { '@type': 'ListItem', position: 4, name: guide.title, item: guideUrl },
    ],
  };

  const howToSteps = extractHowToSteps(guide.content);
  const howToSchema = howToSteps.length >= 2 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.summary,
    url: guideUrl,
    inLanguage: 'ko',
    step: howToSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
    })),
  } : null;

  return (
    <div>
      <ProgressBar />
      <ScrollToTopBtn />
      <JsonLd data={[techArticleSchema, breadcrumbSchema, ...(howToSchema ? [howToSchema] : [])]} />
      {/* Hero */}
      <div className="article-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link>
            <span className="sep">/</span>
            <Link href="/engineer">엔지니어</Link>
            <span className="sep">/</span>
            <Link href={`/engineer?cat=${encodeURIComponent(guide.category)}`}>{guide.category}</Link>
            <span className="sep">/</span>
            <span style={{ color: 'var(--text-5)' }}>{guide.title.slice(0, 28)}…</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <span className={`badge badge-${tone}`}>{guide.category}</span>
            <span className={`eng-diff eng-diff-${guide.difficulty}`}>{diffLabel(guide.difficulty)}</span>
            {guide.os_compat.map(os => (
              <span key={os} className="eng-os-tag">{os}</span>
            ))}
            {guide.tags.slice(0, 3).map(t => (
              <span key={t} className="badge">{t}</span>
            ))}
          </div>

          <h1 className="article-title">{guide.title}</h1>
          {guide.summary && <p className="article-deck">{guide.summary}</p>}

          <div className="article-byline">
            <span className="meta-item">
              <span className="author-pip">{guide.author.slice(0, 2).toUpperCase()}</span>
              {guide.author}
            </span>
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateStr}
            </span>
            {updatedStr && (
              <span className="meta-item" style={{ color: 'var(--text-4)' }}>
                수정 {updatedStr}
              </span>
            )}
            <span className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {guide.views.toLocaleString()} 조회
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="article-wrap">
          {/* TOC */}
          <div>
            <TableOfContents headings={headings} />
            <div style={{ marginTop: 28 }}>
              <Link href="/engineer" className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                ← 가이드 목록
              </Link>
            </div>
          </div>

          {/* Prose */}
          <article className="prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents as Record<string, unknown>}
            >
              {guide.content}
            </ReactMarkdown>

            {guide.tags.length > 0 && (
              <div className="end-tags">
                {guide.tags.map(t => (
                  <span key={t} className="end-tag">#{t}</span>
                ))}
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="aside-rail">
            <div className="widget">
              <h5>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                가이드 정보
              </h5>
              <div className="article-info-row"><span>카테고리</span><span className={`badge badge-${tone}`}>{guide.category}</span></div>
              <div className="article-info-row"><span>난이도</span><span className={`eng-diff eng-diff-${guide.difficulty}`}>{diffLabel(guide.difficulty)}</span></div>
              <div className="article-info-row"><span>작성자</span><span>{guide.author}</span></div>
              <div className="article-info-row"><span>발행일</span><span style={{ fontSize: 11 }}>{dateStr}</span></div>
              {guide.os_compat.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', marginBottom: 8 }}>OS 호환</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {guide.os_compat.map(os => (
                      <span key={os} className="eng-os-tag">{os}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {related.length > 0 && (
              <div className="widget">
                <h5>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  관련 가이드
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {related.map(r => (
                    <Link key={r.id} href={`/engineer/${r.slug}`} style={{ display: 'block' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>{diffLabel(r.difficulty)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="widget">
              <h5>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                전체 카테고리
              </h5>
              <Link href="/engineer" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                가이드 허브
              </Link>
            </div>

            <div className="widget">
              <h5>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                공유
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CopyLinkBtn />
                <ShareBtn />
              </div>
            </div>
          </aside>
        </div>

        {/* Related blog posts */}
        {relatedPosts.length > 0 && (
          <div className="related" style={{ marginTop: 0 }}>
            <div className="related-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 6 }}>
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
                </svg>
                이 가이드와 연관된 블로그 글
              </span>
              <Link href="/blog" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                전체 글 →
              </Link>
            </div>
            <div className="related-grid">
              {relatedPosts.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="badge" style={{ fontSize: 10.5, alignSelf: 'flex-start' }}>{p.category}</span>
                  <h3 className="card-title" style={{ fontSize: 14.5, margin: 0 }}>{p.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
