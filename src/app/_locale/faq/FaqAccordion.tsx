'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQ_ITEMS } from './data';

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQ_ITEMS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`faq-item${isOpen ? ' open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
              >
                <span>{it.q}</span>
                <span className="ic" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isOpen ? <line x1="5" y1="12" x2="19" y2="12" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
                  </svg>
                </span>
              </button>
              <div id={`faq-answer-${i}`} className="faq-a" role="region" aria-label={it.q}>{it.a}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 48, padding: 28, border: '1px dashed var(--line-2)', borderRadius: 12, textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>찾으시는 답이 없나요?</h4>
        <p style={{ color: 'var(--text-3)', margin: '0 0 16px' }}>직접 문의해주시면 빠르게 답변드립니다.</p>
        <Link href="/contact" className="btn btn-primary">
          문의하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>
    </>
  );
}
