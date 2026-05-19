import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime, makeFreshClient } from '@/lib/supabase';
import { catTone } from '@/lib/utils';
import PostThumb from '@/components/PostThumb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: '큐레이션 컬렉션 — Nodelog',
  description: '한 가지 목적을 가지고 모아둔 글 묶음.',
  alternates: { canonical: `${SITE_URL}/curated` },
  openGraph: {
    title: '큐레이션 컬렉션 — Nodelog',
    description: '한 가지 목적을 가지고 모아둔 글 묶음.',
    url: `${SITE_URL}/curated`,
    type: 'website',
  },
};

export const revalidate = 60;

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; reading_time: number;
  cover_image?: string;
}

async function getPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,cover_image,category,published_at,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number, title: p.title as string, slug: p.slug as string,
    excerpt: p.excerpt as string, category: p.category as string,
    published_at: p.published_at as string, cover_image: p.cover_image as string | undefined,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

const GROUPS = [
  { id: 'starter', t: '입문자 추천', s: 'IT 분야에 막 들어선 분이 길을 잃지 않도록.', tone: 'mint' },
  { id: 'practitioner', t: '실무자 추천', s: '도구와 패턴을 더 깊게 다듬고 싶은 시니어를 위해.', tone: 'blue' },
  { id: 'dev', t: '개발자 추천', s: '코드를 쓰는 시간을 더 똑똑하게 만들어줄 글들.', tone: 'purple' },
  { id: 'prod', t: '생산성 추천', s: '시간과 에너지를 쓰는 방식을 점검하고 싶다면.', tone: 'amber' },
];

export default async function CuratedPage() {
  const posts = await getPosts();

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">CURATED · 큐레이션</div>
          <h1 className="page-title">큐레이션 컬렉션</h1>
          <p className="page-lead">한 가지 목적을 가지고 모아둔 글 묶음. 단편이 아니라 연결된 흐름으로 읽으세요.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {GROUPS.map((g, gi) => {
              const groupPosts = posts.slice(gi * 3, gi * 3 + 3);
              return (
                <div key={g.id}>
                  <div className="section-head" style={{ marginBottom: 20 }}>
                    <div>
                      <div className="section-eyebrow" style={{ color: `var(--acc-${g.tone})` }}>COLLECTION</div>
                      <h2 style={{ margin: '0 0 6px', fontSize: 24, letterSpacing: '-0.02em' }}>{g.t}</h2>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 14 }}>{g.s}</p>
                    </div>
                  </div>
                  <div className="grid-3">
                    {groupPosts.map(p => {
                      const tone = catTone(p.category);
                      return (
                        <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link">
                          <PostThumb slug={p.slug} title={p.title} coverImage={p.cover_image} category={p.category} />
                          <div className="card-body">
                            <div className="card-meta">
                              <span className={`badge badge-${tone}`}>{p.category}</span>
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
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
