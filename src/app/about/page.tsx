import type { Metadata } from 'next';
import { makeFreshClient } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export const metadata: Metadata = {
  title: 'About — Nodelog',
  description: 'Nodelog는 AI 에이전트와 사람 편집자가 함께 운영하는 IT 미디어입니다.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About — Nodelog',
    description: 'Nodelog는 AI 에이전트와 사람 편집자가 함께 운영하는 IT 미디어입니다.',
    url: `${SITE_URL}/about`,
    type: 'website',
  },
};

export const revalidate = 3600;

interface SiteStats {
  postCount: number;
  seriesCount: number;
  subscriberCount: number;
  guideCount: number;
  firstPostDate: string;
  avgReadingTime: number;
  totalViews: number;
}

async function getStats(): Promise<SiteStats> {
  const client = makeFreshClient();

  const [postsRes, subscribersRes, guidesRes] = await Promise.all([
    client.from('posts').select('tags, published_at, views, content').eq('status', 'published'),
    client.from('subscribers').select('id', { count: 'exact', head: true }),
    client.from('engineer_guides').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  const posts = (postsRes.data ?? []) as { tags: string[]; published_at: string; views: number; content: string }[];
  const postCount = posts.length;

  const seriesSet = new Set<string>();
  for (const p of posts) {
    const tag = (p.tags ?? []).find((t: string) => t.startsWith('series:'));
    if (tag) seriesSet.add(tag);
  }

  const sortedDates = posts.map(p => p.published_at).filter(Boolean).sort();
  let firstPostDate = '2024년 9월부터';
  if (sortedDates.length) {
    const d = new Date(sortedDates[0]);
    firstPostDate = `${d.getFullYear()}년 ${d.getMonth() + 1}월부터`;
  }

  // reading_time is not a DB column — compute from word count (200 wpm)
  const readingTimes = posts
    .map(p => Math.max(1, Math.round((p.content ?? '').trim().split(/\s+/).length / 200)))
    .filter(t => t > 0);
  const avgReadingTime = readingTimes.length
    ? Math.round(readingTimes.reduce((a, b) => a + b, 0) / readingTimes.length)
    : 14;

  const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  return {
    postCount,
    seriesCount: seriesSet.size,
    subscriberCount: subscribersRes.count ?? 0,
    guideCount: guidesRes.count ?? 0,
    firstPostDate,
    avgReadingTime,
    totalViews,
  };
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const STEPS = [
  { n: '01', t: '주제 선정', d: '공식 문서·릴리스 노트·기술 자료와 독자 검색 수요를 바탕으로 다룰 주제를 정합니다.' },
  { n: '02', t: '자료 확인', d: '주제와 직접 관련된 1차 자료를 우선 확인하고 글의 범위와 핵심 질문을 정리합니다.' },
  { n: '03', t: '초고 생성', d: 'AI 도구로 구조와 초안을 만들고, 참고한 자료는 편집 과정에서 다시 확인합니다.' },
  { n: '04', t: '편집 검토', d: '사실관계·명령어·표현·문맥을 점검하고 불확실하거나 근거가 약한 문장을 수정합니다.' },
  { n: '05', t: '발행', d: '카테고리·시리즈·태그·관련 글 자동 연결. 메타데이터 색인.' },
  { n: '06', t: '보강', d: '오류 제보와 문서 변경을 확인해 필요한 글을 정정하거나 보강합니다.' },
];

const PRINCIPLES = [
  { t: '출처를 확인합니다', d: '핵심 주장에 필요한 공식 문서와 1차 자료를 우선 연결하고, 미비한 기존 글은 순차 보강합니다.' },
  { t: '한계를 함께 적습니다', d: '환경과 버전에 따라 결과가 달라질 수 있는 내용은 적용 조건과 확인 방법을 함께 안내합니다.' },
  { t: '광고는 본문과 섞지 않습니다', d: '제휴 콘텐츠는 별도의 표식과 색상으로 명확히 구분합니다.' },
  { t: '실패도 다룹니다', d: '도입에 실패한 도구, 잘못된 판단의 회고를 거르지 않습니다.' },
];

export default async function AboutPage() {
  const stats = await getStats();

  const STATS = [
    { num: `${stats.postCount}+`, label: 'PUBLISHED POSTS', sub: stats.firstPostDate },
    { num: `${stats.guideCount}+`, label: 'ENGINEER GUIDES', sub: 'Linux · Docker · Git · 보안' },
    { num: String(stats.seriesCount), label: 'ACTIVE SERIES', sub: '학습 경로형 콘텐츠' },
    { num: stats.totalViews > 0 ? `${stats.totalViews.toLocaleString()}+` : '—', label: 'TOTAL VIEWS', sub: '누적 조회수' },
    { num: stats.subscriberCount > 0 ? formatNum(stats.subscriberCount) : '—', label: 'SUBSCRIBERS', sub: '주간 뉴스레터' },
    { num: `${stats.avgReadingTime}분`, label: 'AVG READ TIME', sub: '글당 평균 읽기 시간' },
  ];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ABOUT NODELOG</div>
          <h1 className="page-title">AI가 운영하는 IT 미디어,<br />그러나 결정은 사람이.</h1>
          <p className="page-lead">
            Nodelog는 AI 도구로 초안을 만들고 사람이 자료·명령어·문맥을 검토해 발행하는
            IT·개발·보안 실무 미디어입니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="grid-3" style={{ marginBottom: 64 }}>
            {STATS.map(s => (
              <div key={s.label} className="card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.10em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>MISSION</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>미션</h2>
            </div>
            <div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-2)', margin: '0 0 18px' }}>
                실무자가 신뢰할 수 있는 IT 정보를 만드는 것. 정보의 양이 아니라 <strong style={{ color: 'var(--text-1)' }}>맥락의 밀도</strong>를 높이는 것.
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-3)', margin: 0 }}>
                AI가 정보를 빠르게 수집하고 정리하지만, 어떤 신호가 진짜로 중요한지, 어떤 문장이 오해를 부르는지를 결정하는 일은 여전히 사람의 몫이라고 믿습니다.
                Nodelog는 그 협업 방식을 가장 단순하고 정직하게 보여주는 미디어를 지향합니다.
              </p>
            </div>
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>HOW IT WORKS</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>운영 방식</h2>
            </div>
            <div>
              <div style={{ display: 'grid', gap: 14 }}>
                {STEPS.map(s => (
                  <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 18, padding: '18px 0', borderBottom: '1px dashed var(--line-1)' }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-4)', letterSpacing: '0.06em' }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>{s.t}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>PRINCIPLES</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>편집 원칙</h2>
            </div>
            <div className="grid-2">
              {PRINCIPLES.map(p => (
                <div key={p.t} className="card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span className="badge badge-blue" style={{ width: 28, height: 28, padding: 0, justifyContent: 'center', borderRadius: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <h4 style={{ margin: 0, fontSize: 14.5, letterSpacing: '-0.01em' }}>{p.t}</h4>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.6 }}>{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
