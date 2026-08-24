import type { CSSProperties, ReactNode } from 'react';
import TrackedLink from '@/components/TrackedLink';
import PostThumb from '@/components/PostThumb';

export interface RelatedItem {
  id: number | string;
  href: string;
  /** 분석 이벤트의 target_slug로 쓰이는 값 — href에서 마지막 세그먼트를 쓰려면 생략 가능. */
  slug?: string;
  title: string;
  description?: string;
  category?: string;
  /** 카드 하단 부가 정보(예: "5분 읽기", "GUIDE · 실전 레퍼런스") */
  meta?: string;
  badgeTone?: string;
  /** post 카드에는 자동 썸네일(PostThumb)을, guide 등에는 텍스트 전용 카드를 사용 */
  thumb?: { coverImage?: string };
}

interface Props {
  title: string;
  icon?: ReactNode;
  items: RelatedItem[];
  currentPath: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  style?: CSSProperties;
}

function slugFromHref(href: string): string {
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? href;
}

/**
 * 게시글/가이드 하단(및 사이드 위젯)에서 재사용하는 "관련 콘텐츠" 영역.
 * 시맨틱 <nav>로 감싸 검색엔진이 탐색 가능한 일반 링크로 노출하고,
 * 클릭 시 related_post_click 이벤트를 남긴다(analytics 차단 시에도 링크는 정상 동작).
 */
export default function RelatedContent({ title, icon, items, currentPath, viewAllHref, viewAllLabel, className, style }: Props) {
  if (items.length === 0) return null;

  return (
    <nav className={`related${className ? ` ${className}` : ''}`} aria-label={title} style={style}>
      <div className="related-h" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{icon}{title}</span>
        {viewAllHref && (
          <TrackedLink
            href={viewAllHref}
            event={{ name: 'category_click', path: currentPath, category: viewAllLabel ?? title, position: 'related-view-all' }}
            style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em', textDecoration: 'none' }}
          >
            {viewAllLabel ?? '전체 보기'} →
          </TrackedLink>
        )}
      </div>
      {/* 카드 그리드 자체는 원래 마크업과 동일한 div 그리드를 유지해 기존 CSS/시각 디자인을
          그대로 보존한다 — <nav> 랜드마크 + 실 링크(<a>)만으로 시맨틱/크롤 가능성 요건을 충족. */}
      <div className="related-grid">
        {items.map((item, i) => (
          <TrackedLink
            key={item.id}
            href={item.href}
            className="card card-link"
            event={{ name: 'related_post_click', path: currentPath, target_slug: item.slug ?? slugFromHref(item.href), position: i }}
            style={item.thumb ? undefined : { padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {item.thumb && (
              <PostThumb slug={item.slug ?? slugFromHref(item.href)} title={item.title} coverImage={item.thumb.coverImage} category={item.category} />
            )}
            <div className={item.thumb ? 'card-body' : undefined}>
              {item.category && (
                <div className={item.thumb ? 'card-meta' : undefined}>
                  <span className={`badge${item.badgeTone ? ` badge-${item.badgeTone}` : ''}`} style={item.thumb ? undefined : { fontSize: 10.5, alignSelf: 'flex-start' }}>
                    {item.category}
                  </span>
                </div>
              )}
              <h3 className="card-title" style={item.thumb ? undefined : { fontSize: 14.5, margin: 0 }}>{item.title}</h3>
              {item.description && (
                <p
                  className={item.thumb ? 'card-excerpt' : undefined}
                  style={item.thumb ? undefined : {
                    margin: 0, color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}
                >
                  {item.description}
                </p>
              )}
              {item.meta && (
                <div className={item.thumb ? 'card-foot' : undefined} style={item.thumb ? undefined : { fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', marginTop: 4 }}>
                  <span>{item.meta}</span>
                </div>
              )}
            </div>
          </TrackedLink>
        ))}
      </div>
    </nav>
  );
}
