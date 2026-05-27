'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQ_ITEMS, FAQ_CATEGORIES } from './data';

export default function FaqAccordion() {
  const [open, setOpen] = useState<string | null>(`0-0`);
  const [activeTab, setActiveTab] = useState<string>('all');

  const tabs = [{ id: 'all', label: '전체', icon: '📋' }, ...FAQ_CATEGORIES];

  const filtered = activeTab === 'all'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter(item => item.category === activeTab);

  return (
    <>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setOpen(null); }}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: `1px solid ${activeTab === tab.id ? 'var(--acc-blue)' : 'var(--line-2)'}`,
              background: activeTab === tab.id ? 'color-mix(in oklch, var(--acc-blue) 10%, var(--bg-1))' : 'var(--bg-2)',
              color: activeTab === tab.id ? 'var(--acc-blue)' : 'var(--text-2)',
              fontSize: 13.5,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 140ms',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Accordion items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((it, i) => {
          const key = `${activeTab}-${i}`;
          const isOpen = open === key;
          const cat = FAQ_CATEGORIES.find(c => c.id === it.category);
          return (
            <div key={key} className={`faq-item${isOpen ? ' open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => setOpen(isOpen ? null : key)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${key}`}
              >
                <span>{it.q}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {activeTab === 'all' && cat && (
                    <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em', display: 'none' }} className="faq-cat-label">
                      {cat.icon} {cat.label}
                    </span>
                  )}
                  <span className="ic" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {isOpen
                        ? <line x1="5" y1="12" x2="19" y2="12" />
                        : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
                    </svg>
                  </span>
                </div>
              </button>
              <div id={`faq-answer-${key}`} className="faq-a" role="region" aria-label={it.q}>
                {it.a}
              </div>
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
