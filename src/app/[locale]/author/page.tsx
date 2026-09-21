import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { EDITORS, editorInitials } from '@/lib/editors';
import JsonLd from '@/components/JsonLd';
import { isLocale } from '@/i18n/config';
import { interpolate } from '@/i18n/messages';
import { pageMetadata, siteUrl } from '@/i18n/metadata';
import { getAuthor } from '@/i18n/copy/author';
import { categoryLabel } from '@/i18n/categories';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const copy = getAuthor(locale);
  return pageMetadata({
    locale,
    path: '/author',
    title: copy.title,
    description: copy.description,
  });
}

async function getAuthorStats() {
  const [{ count: guideCount }, { data: categories }] = await Promise.all([
    supabaseAdmin().from('engineer_guides').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin().from('posts').select('category').eq('status', 'published'),
  ]);

  const catCounts: Record<string, number> = {};
  (categories ?? []).forEach((p: { category: string }) => {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    guideCount: guideCount ?? 0,
    categoryCount: Object.keys(catCounts).length,
    topCat,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const copy = getAuthor(locale);
  const { guideCount, categoryCount, topCat } = await getAuthorStats();
  const authorUrl = siteUrl('/author', locale);

  const profileSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: authorUrl,
    inLanguage: locale,
    mainEntity: {
      '@type': 'Organization',
      name: locale === 'en' ? 'Nodelog editorial team' : 'Nodelog 기술 편집팀',
      url: authorUrl,
      description: copy.description,
      knowsAbout: copy.areas,
      parentOrganization: { '@type': 'Organization', name: 'Nodelog', url: siteUrl('/', locale) },
    },
  };

  const personSchemas = EDITORS.map(e => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: e.name,
    jobTitle: e.title,
    knowsAbout: e.expertise,
    description: e.bio,
    url: authorUrl,
    worksFor: { '@type': 'Organization', name: 'Nodelog', url: siteUrl('/', locale) },
    ...(e.links && e.links.length > 0 ? { sameAs: e.links.map(l => l.url) } : {}),
  }));

  const stats = [
    { label: copy.statsGuidesLabel, value: interpolate(copy.statsGuides, { count: guideCount.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR') }) },
    { label: copy.areasLabel, value: interpolate(copy.statsAreas, { count: copy.areas.length }) },
    { label: interpolate(copy.statsTopCat, { count: categoryCount }), value: categoryLabel(topCat, locale) },
  ];

  return (
    <div>
      <JsonLd data={[profileSchema, ...personSchemas]} />
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">EDITORIAL</div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-lead">{copy.lead}</p>

          <div style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-eyebrow" style={{ marginBottom: 20 }}>WHO WE ARE</div>
          <div className="grid-2" style={{ marginBottom: 56 }}>
            <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'linear-gradient(135deg, oklch(0.65 0.16 245 / 0.07), oklch(0.55 0.18 290 / 0.12))', borderRadius: '0 0 0 120px' }} />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, oklch(0.65 0.16 245), oklch(0.55 0.18 290))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 600, color: 'white', fontSize: 22, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>N</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{copy.aiTitle}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>RESEARCH · STRUCTURING · DRAFT ASSISTANCE</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
                {copy.aiBody}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {copy.aiRows.map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-3)' }}>
                    <span>{row.k}</span>
                    <strong style={{ color: 'var(--text-1)', fontFamily: row.mono ? 'var(--ff-mono)' : undefined, fontSize: row.mono ? 12 : undefined }}>{row.v}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-1)', fontSize: 20, border: '1px solid var(--line-2)', flexShrink: 0 }}>
                  {locale === 'en' ? 'Ed' : '편'}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{copy.editorTitle}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>REVIEW · EDITORIAL JUDGMENT</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 20px' }}>
                {copy.editorBody}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {copy.editorRows.map(row => (
                  <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'var(--text-3)' }}>
                    <span>{row.k}</span>
                    <strong style={{ color: 'var(--text-1)' }}>{row.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28, marginBottom: 56 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6 }}>{copy.teamTitle}</div>
            <p style={{ color: 'var(--text-3)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 22px' }}>
              {copy.teamLead}
            </p>
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 10 }}>{copy.areasLabel}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {copy.areas.map(a => <span key={a} className="badge" style={{ fontSize: 11.5 }}>{a}</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 10 }}>{copy.checksLabel}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {copy.checks.map(c => <span key={c} className="badge" style={{ fontSize: 11.5 }}>{c}</span>)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-1)' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--acc-blue)', letterSpacing: '0.06em', marginBottom: 8 }}>{copy.opsLabel}</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
                {copy.opsBody}
              </p>
            </div>
          </div>

          {EDITORS.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <div className="section-eyebrow" style={{ marginBottom: 20 }}>EDITORIAL TEAM</div>
              <div className="grid-2">
                {EDITORS.map(e => (
                  <div key={e.name} className="card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-1)', fontSize: 19, border: '1px solid var(--line-2)', flexShrink: 0 }}>{editorInitials(e)}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {e.name}
                          {e.penName && <span style={{ fontSize: 10.5, fontFamily: 'var(--ff-mono)', color: 'var(--text-4)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '1px 6px' }}>{copy.penName}</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{e.title}</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 16px' }}>{e.bio}</p>
                    {e.expertise.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {e.expertise.map(x => (
                          <span key={x} className="badge" style={{ fontSize: 11 }}>{x}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                      {e.reviews.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span>{copy.reviewsLabel}</span>
                          <strong style={{ color: 'var(--text-1)' }}>{e.reviews.join(' · ')}</strong>
                        </div>
                      )}
                      {e.links && e.links.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <span>{copy.profileLabel}</span>
                          <span style={{ display: 'flex', gap: 12 }}>
                            {e.links.map(l => (
                              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer me" style={{ color: 'var(--acc-blue)', fontWeight: 500 }}>{l.label} ↗</a>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={{ margin: '0 0 20px', fontSize: 20, letterSpacing: '-0.02em' }}>{copy.pipelineTitle}</h3>
          <div className="card" style={{ padding: 32, marginBottom: 56 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignItems: 'stretch' }}>
              {copy.stages.map((s, i) => (
                <div key={s.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '18px 12px', border: '1px solid var(--line-2)', borderRadius: 12, background: `color-mix(in oklch, var(--acc-${s.tone}) 6%, var(--bg-3))`, position: 'relative' }}>
                  {i < copy.stages.length - 1 && (
                    <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-5)', fontSize: 14, zIndex: 1 }}>›</div>
                  )}
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: `var(--acc-${s.tone})`, letterSpacing: '0.10em', marginBottom: 6 }}>STAGE {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', lineHeight: 1.4 }}>{s.s}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ margin: '0 0 20px', fontSize: 20, letterSpacing: '-0.02em' }}>{copy.principlesTitle}</h3>
          <div className="grid-2">
            {copy.principles.map(p => (
              <div key={p.t} className="card" style={{ padding: 22, display: 'flex', gap: 16 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.01em' }}>{p.t}</div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.6 }}>{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
