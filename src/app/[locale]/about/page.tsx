import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { getAbout } from '@/i18n/copy/about';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/about',
    title: 'About',
    description: dict.pages.aboutLead,
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const copy = getAbout(locale);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">ABOUT NODELOG</div>
          <h1 className="page-title" style={{ whiteSpace: 'pre-line' }}>{dict.pages.aboutTitle}</h1>
          <p className="page-lead">{dict.pages.aboutLead}</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div className="grid-3" style={{ marginBottom: 64 }}>
            {copy.stats.map(s => (
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
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>{copy.missionTitle}</h2>
            </div>
            <div>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-2)', margin: '0 0 18px' }}>
                {copy.missionLead}
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--text-3)', margin: 0 }}>
                {copy.missionBody}
              </p>
            </div>
          </div>

          <div className="about-row" style={{ marginBottom: 64 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>HOW IT WORKS</div>
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>{copy.howTitle}</h2>
            </div>
            <div>
              <div style={{ display: 'grid', gap: 14 }}>
                {copy.steps.map(s => (
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
              <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.025em' }}>{copy.principlesTitle}</h2>
            </div>
            <div className="grid-2">
              {copy.principles.map(p => (
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
