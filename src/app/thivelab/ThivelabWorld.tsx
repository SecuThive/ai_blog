'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThivelabScene from './ThivelabScene';

const chapters = [
  { id: 'intro', label: 'INTRO' },
  { id: 'nodelog', label: 'NODELOG' },
  { id: 'tools', label: 'TOOLS' },
  { id: 'explore', label: 'EXPLORE' },
] as const;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function ThivelabWorld() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = chapters.map(chapter => document.getElementById(chapter.id)).filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(sections.indexOf(visible.target as HTMLElement));
    }, { threshold: [0.25, 0.5, 0.75] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="thive-world" data-chapter={chapters[active].id}>
      <a className="thive-skip" href="#intro">본문으로 건너뛰기</a>
      <header className="thive-header">
        <Link className="thive-brand" href="/thivelab" aria-label="THIVELAB 홈">
          <span className="thive-brand-mark" aria-hidden="true"><span /></span>
          <span>THIVE<span className="thive-brand-light">LAB</span></span>
        </Link>
        <nav className="thive-header-nav" aria-label="THIVELAB 서비스">
          <Link href="/">NODELOG</Link>
          <a href="https://tools.thivelab.com/">TOOLS</a>
          <a href="https://moa.thivelab.com/">MOA</a>
        </nav>
        <a className="thive-header-action" href="#explore">EXPLORE <span aria-hidden="true">↓</span></a>
      </header>

      <main id="thivelab-story" className="thive-story">
        <div className="thive-scene" aria-hidden="true">
          <div className="thive-scene-aura" />
          <div className="thive-fallback"><span /><span /><i /></div>
          <ThivelabScene />
          <div className="thive-scene-orbit thive-scene-orbit-a" />
          <div className="thive-scene-orbit thive-scene-orbit-b" />
          <div className="thive-scene-grid" />
          <div className="thive-scene-vignette" />
        </div>

        <div className="thive-progress" aria-hidden="true"><span /></div>
        <div className="thive-scene-hud" aria-hidden="true">
          <span>THIVELAB / DIGITAL UNIVERSE</span>
          <strong>0{active + 1} <i>/ 04</i></strong>
          <span>{chapters[active].label} · SCROLL EXPERIENCE</span>
        </div>

        <nav className="thive-rail" aria-label="장면 이동">
          {chapters.map((chapter, index) => (
            <a key={chapter.id} href={`#${chapter.id}`} className={active === index ? 'is-active' : ''} aria-label={`${chapter.label} 장면`} aria-current={active === index ? 'location' : undefined}>
              <span className="thive-rail-index">0{index + 1}</span><span className="thive-rail-line" /><span className="thive-rail-label">{chapter.label}</span>
            </a>
          ))}
        </nav>

        <div className="thive-chapters">
          <section id="intro" className="thive-chapter thive-chapter-intro" aria-labelledby="thive-intro-title" data-index="00">
            <div className="thive-chapter-inner thive-intro-copy">
              <p className="thive-kicker"><span className="thive-kicker-line" /> INDEPENDENT TECHNOLOGY LAB / 001</p>
              <h1 id="thive-intro-title">아이디어가<br /><em>움직이는</em> 곳.</h1>
              <p className="thive-lead">읽고 이해한 것을 직접 써보고, 새로운 가능성으로 이어갑니다. THIVELAB의 네 가지 서비스가 하나의 세계에서 만납니다.</p>
              <div className="thive-intro-actions">
                <a className="thive-button thive-button-primary" href="#nodelog">세계 탐색하기 <span aria-hidden="true">↓</span></a>
                <Link className="thive-text-link" href="/">NODELOG 바로가기 <Arrow /></Link>
              </div>
              <div className="thive-intro-signature" aria-hidden="true"><span>READ</span><i /><span>MAKE</span><i /><span>EXPLORE</span></div>
            </div>
            <div className="thive-intro-foot" aria-hidden="true"><span>SCROLL TO EXPLORE</span><span className="thive-scroll-line" /></div>
          </section>

          <section id="nodelog" className="thive-chapter thive-chapter-service" aria-labelledby="thive-nodelog-title" data-index="01">
            <div className="thive-chapter-inner thive-copy-left">
              <span className="thive-chapter-number">01 / KNOWLEDGE</span>
              <span className="thive-service-symbol">N<span>↗</span></span>
              <h2 id="thive-nodelog-title">문제를 읽는<br />깊이를 더하다.</h2>
              <p>NODELOG는 기술 문제를 이해하고 다음 확인 지점을 찾기 위한 글과 엔지니어 가이드를 제공합니다.</p>
              <Link className="thive-service-link" href="/">NODELOG 글 읽기 <Arrow /></Link>
              <span className="thive-chapter-coordinate">THIVELAB / NODE 01</span>
            </div>
          </section>

          <section id="tools" className="thive-chapter thive-chapter-service" aria-labelledby="thive-tools-title" data-index="02">
            <div className="thive-chapter-inner thive-copy-right">
              <span className="thive-chapter-number">02 / UTILITY</span>
              <span className="thive-service-symbol">T<span>✳</span></span>
              <h2 id="thive-tools-title">필요한 작업을<br />바로 실행하다.</h2>
              <p>TOOLS에서 이미지 크기·형식, PDF, 글자 수 작업을 처리하세요. 선택한 파일과 입력한 글은 브라우저에서 다룹니다.</p>
              <a className="thive-service-link" href="https://tools.thivelab.com/">무료 TOOLS 사용하기 <Arrow /></a>
              <span className="thive-chapter-coordinate">THIVELAB / NODE 02</span>
            </div>
          </section>

          <section id="explore" className="thive-chapter thive-chapter-explore" aria-labelledby="thive-explore-title" data-index="03">
            <div className="thive-chapter-inner">
              <span className="thive-chapter-number">03 / EXPLORE</span>
              <h2 id="thive-explore-title">다른 방식으로<br /><em>시도해 보세요.</em></h2>
              <div className="thive-explore-grid">
                <a className="thive-explore-card" href="https://moa.thivelab.com/">
                  <span>02 / CREATE</span><strong>MOA</strong>
                  <p>홍보물·메뉴판·쿠폰·리뷰 답변을 만드는 크리에이티브 도구.</p>
                  <span className="thive-explore-action">MOA 사용하기 <Arrow /></span>
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
      <footer className="thive-footer">
        <span>THIVELAB © 2026</span>
        <span>READ · MAKE · EXPLORE</span>
        <a href="mailto:thive@thivelab.com">CONTACT <Arrow /></a>
      </footer>
    </div>
  );
}
