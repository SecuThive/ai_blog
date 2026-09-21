import Link from '@/i18n/link';
import type { LegalDoc } from '@/i18n/copy/legal';
import { interpolate } from '@/i18n/messages';

const EMAIL = 'thive8564@gmail.com';

export default function LegalDocPage({
  homeLabel,
  doc,
}: {
  homeLabel: string;
  doc: LegalDoc;
}) {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">{homeLabel}</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>{doc.title}</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>{doc.eyebrow}</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>{doc.title}</h1>
          <p className="page-lead">{doc.lead}</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.06em', marginTop: 18 }}>
            {doc.updated}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {doc.sections.map((section) => (
              <div key={section.title}>
                <h2 style={{ margin: '0 0 12px', fontSize: 19, letterSpacing: '-0.015em', color: 'var(--text-1)' }}>{section.title}</h2>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15.5, lineHeight: 1.75 }}>{section.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: 24, border: '1px solid var(--line-1)', borderRadius: 12, background: 'var(--bg-2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              {interpolate(doc.contact, { email: EMAIL }).split(EMAIL).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <a style={{ color: 'var(--acc-blue)' }} href={`mailto:${EMAIL}`}>{EMAIL}</a>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
