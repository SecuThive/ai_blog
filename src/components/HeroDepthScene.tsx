'use client';

import { useRef } from 'react';
import Link from '@/i18n/link';
import type { Locale } from '@/i18n/config';
import HeroDepthCanvas from './HeroDepthCanvas';

interface ScenePost {
  slug: string;
  title: string;
  category: string;
}

/** Real article links arranged in a small CSS 3D scene. The links remain ordinary HTML anchors. */
export default function HeroDepthScene({ posts, locale }: { posts: ScenePost[]; locale: Locale }) {
  const sceneRef = useRef<HTMLElement>(null);

  function move(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || !sceneRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    sceneRef.current.style.setProperty('--depth-tilt-x', `${x * 10}deg`);
    sceneRef.current.style.setProperty('--depth-tilt-y', `${y * -8}deg`);
  }

  function reset() {
    sceneRef.current?.style.setProperty('--depth-tilt-x', '0deg');
    sceneRef.current?.style.setProperty('--depth-tilt-y', '0deg');
  }

  return (
    <nav
      className="hero-depth"
      ref={sceneRef}
      onPointerMove={move}
      onPointerLeave={reset}
      aria-label={locale === 'en' ? 'Recent NODELOG articles' : '최근 NODELOG 글'}
    >
      <div className="hero-depth-grid" aria-hidden="true" />
      <HeroDepthCanvas />
      <div className="hero-depth-world">
        <div className="hero-depth-halo hero-depth-halo--outer" aria-hidden="true" />
        <div className="hero-depth-halo hero-depth-halo--inner" aria-hidden="true" />

        <div className="hero-depth-core" aria-hidden="true">
          <span className="hero-depth-core-top">THIVELAB / KNOWLEDGE SYSTEM</span>
          <span className="hero-depth-core-orb"><span /></span>
          <strong>NODELOG</strong>
          <span className="hero-depth-core-bottom">READ · TRACE · RESOLVE <b>↗</b></span>
        </div>

        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={`hero-depth-card hero-depth-card--story-${index + 1}`}
          >
            <span className="hero-depth-card-kicker"><i /> {locale === 'en' ? 'RECENT ARTICLE' : '최근 글'} / 0{index + 1}</span>
            <strong>{post.title}</strong>
            <span className="hero-depth-card-foot"><span>{post.category}</span><span aria-hidden="true">↗</span></span>
          </Link>
        ))}

        <span className="hero-depth-coordinate hero-depth-coordinate--top" aria-hidden="true">KNOWLEDGE MAP / 001</span>
        <span className="hero-depth-coordinate hero-depth-coordinate--bottom" aria-hidden="true">{locale === 'en' ? 'SELECT A STORY TO READ' : '글을 선택해 읽어보세요'}</span>
      </div>
    </nav>
  );
}
