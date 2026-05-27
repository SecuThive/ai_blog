import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseAdmin, readingTime } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '큐레이션 컬렉션 — Nodelog',
  description: '카테고리별로 엄선한 추천 글 묶음. 단편이 아니라 연결된 흐름으로 읽으세요.',
  alternates: { canonical: `${SITE_URL}/curated` },
  openGraph: {
    title: '큐레이션 컬렉션 — Nodelog',
    description: '카테고리별로 엄선한 추천 글 묶음.',
    url: `${SITE_URL}/curated`,
    type: 'website',
  },
};

export const revalidate = 3600;

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; reading_time: number;
  cover_image?: string; views: number;
}

const COLLECTIONS = [
  { id: 'security',  category: '보안',        t: '보안 필독선', s: '랜섬웨어·CVE·침해사고 분석. 실무 보안 담당자가 놓쳐선 안 될 글.', tone: 'rose', icon: '🔐' },
  { id: 'ai',        category: 'AI & 자동화',  t: 'AI & 자동화 베스트', s: 'LLM, 에이전트, DevOps 자동화. 변화의 속도를 따라잡는 필수 콘텐츠.', tone: 'purple', icon: '🤖' },
  { id: 'infra',     category: '인프라',       t: '인프라 & 클라우드', s: 'Kubernetes, Terraform, AWS/GCP. 현장에서 바로 쓸 수 있는 실전 가이드.', tone: 'blue', icon: '⚙️' },
  { id: 'dev',       category: '개발',         t: '개발자 추천', s: '코드를 더 깊고, 빠르고, 안전하게 만들어 줄 글들.', tone: 'mint', icon: '💻' },
];

async function getPostsByCategory(category: string): Promise<PostRow[]> {
  const { data } = await supabaseAdmin()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,published_at,views,content')
    .eq('status', 'published')
    .eq('category', category)
    .order('views', { ascending: false })
    .limit(3);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number,
    title: p.title as string,
    slug: p.slug as string,
    excerpt: p.excerpt as string,
    category: p.category as string,
    published_at: p.published_at as string,
    cover_image: p.cover_image as string | undefined,
    views: (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

export default async function CuratedPage() {
  const collections = await Promise.all(
    COLLECTIONS.map(async col => ({
      ...col,
      posts: await getPostsByCategory(col.category),
    }))
  );

  const nonEmpty = collections.filter(c => c.posts.length > 0);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">CURATED · 큐레이션</div>
          <h1 className="page-title">큐레이션 컬렉션</h1>
          <p className="page-lead">카테고리별 조회수 상위 글을 엄선했습니다. 단편이 아니라 연결된 흐름으로 읽으세요.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {nonEmpty.length === 0 ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-3)' }}>아직 발행된 글이 없습니다.</p>
              <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>홈으로 가기</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
              {nonEmpty.map(col => (
                <div key={col.id}>
                  <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                      <div className="section-eyebrow" style={{ color: `var(--acc-${col.tone})` }}>
                        {col.icon} COLLECTION
                      </div>
                      <h2 style={{ margin: '4px 0 6px', fontSize: 24, letterSpacing: '-0.02em' }}>{col.t}</h2>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 14 }}>{col.s}</p>
                    </div>
                    <Link
                      href={`/category/${encodeURIComponent(col.category)}`}
                      className="btn btn-ghost btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      전체 보기 →
                    </Link>
                  </div>
                  <div className="grid-3">
                    {col.posts.map(p => {
                      const tone = catTone(p.category);
                      return (
                        <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                          <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} category={p.category} />
                          <div className="card-body">
                            <div className="card-meta">
                              <span className={`badge badge-${tone}`}>{p.category}</span>
                              {p.views > 0 && (
                                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)' }}>
                                  조회 {p.views.toLocaleString()}
                                </span>
                              )}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
