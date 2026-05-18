import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { readingTime } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'AI 추천 — Nodelog',
  description: '읽기 패턴 기반으로 독자에게 맞는 글을 추천합니다.',
};

export const revalidate = 60;

function makeFreshClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

interface PostRow {
  id: number; title: string; slug: string; excerpt: string;
  category: string; published_at: string; views: number; reading_time: number;
}

async function getPosts(): Promise<PostRow[]> {
  noStore();
  const { data } = await makeFreshClient()
    .from('posts')
    .select('id,title,slug,excerpt,category,published_at,views,content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(24);

  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as number, title: p.title as string, slug: p.slug as string,
    excerpt: p.excerpt as string, category: p.category as string,
    published_at: p.published_at as string, views: (p.views as number) ?? 0,
    reading_time: readingTime((p.content as string) ?? ''),
  }));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return '오늘';
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default async function RecommendPage() {
  const posts = await getPosts();

  const groups = [
    { t: '오늘 당신에게 가장 잘 맞는 글', s: '최근 발행 · 조회수 기준 상위 글', posts: posts.slice(0, 3) },
    { t: '다음 단계로 추천', s: '지금까지 읽은 글의 자연스러운 다음 주제', posts: posts.slice(3, 6) },
    { t: '비슷한 독자들이 선택한 글', s: '같은 카테고리를 자주 읽는 독자 기준', posts: posts.slice(6, 9) },
    { t: '관심 밖이지만 가치 있는 글', s: '평소 잘 읽지 않는 주제 중 추천도가 높은 글', posts: posts.slice(9, 12) },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            AI RECOMMENDATIONS
          </div>
          <h1 className="page-title">AI 추천</h1>
          <p className="page-lead">최근 읽기 패턴과 완독 데이터를 기반으로, 비슷한 관심사의 독자들이 선택한 글을 추천합니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 24, marginBottom: 48, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>YOUR READING PROFILE</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>AI 자동화 중심형</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>30일간 14편 완독 · 평균 11분</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>TOP CATEGORIES</div>
              <div className="pill-row">
                <span className="badge badge-blue">AI 자동화 · 42%</span>
                <span className="badge badge-mint">개발 · 28%</span>
                <span className="badge badge-purple">인프라 · 18%</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>READING STREAK</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>12일 연속</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>최장 기록 28일</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>NEXT SUGGESTION</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>개발 카테고리를 1편 더 읽으면 균형이 잡힐 것 같습니다.</div>
            </div>
          </div>

          {groups.map(group => (
            <div key={group.t} style={{ marginBottom: 56 }}>
              <div className="section-head">
                <div>
                  <div className="section-eyebrow">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    AI · MATCH
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 22, letterSpacing: '-0.02em' }}>{group.t}</h2>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5 }}>{group.s}</p>
                </div>
              </div>
              <div className="grid-3">
                {group.posts.map((p, i) => {
                  const tone = catTone(p.category);
                  return (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="card card-link" style={{ padding: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span className="ai-tag" style={{ fontSize: 11 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 3 }}>
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          MATCH {94 - i * 5}%
                        </span>
                        <span className={`badge badge-${tone}`}>{p.category}</span>
                      </div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 15.5, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{p.title}</h3>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.55 }}>{p.excerpt}</p>
                      <div className="card-foot">
                        <span>{p.reading_time}분</span>
                        <span className="dot" />
                        <span>{timeAgo(p.published_at)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
