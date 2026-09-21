import type { Metadata } from 'next';
import SubscribeForm from '@/components/SubscribeForm';
import { supabaseAdmin } from '@/lib/supabase';
import { isLocale } from '@/i18n/config';
import { getDictionary, interpolate } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/subscribe',
    title: dict.pages.subscribeTitle.replace('\n', ' '),
    description: dict.pages.subscribeLead,
  });
}

async function getSubscriberCount(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .eq('active', true);
  return count ?? 0;
}

export default async function SubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const count = await getSubscriberCount();
  const displayCount = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count > 0 ? String(count) : null;

  const benefits = [
    { icon: '🔐', title: dict.pages.subscribeB1Title, desc: dict.pages.subscribeB1Desc },
    { icon: '⚙️', title: dict.pages.subscribeB2Title, desc: dict.pages.subscribeB2Desc },
    { icon: '🤖', title: dict.pages.subscribeB3Title, desc: dict.pages.subscribeB3Desc },
    { icon: '🛠️', title: dict.pages.subscribeB4Title, desc: dict.pages.subscribeB4Desc },
  ];
  const quotes = [
    { role: dict.pages.subscribeQ1Role, text: dict.pages.subscribeQ1Text },
    { role: dict.pages.subscribeQ2Role, text: dict.pages.subscribeQ2Text },
    { role: dict.pages.subscribeQ3Role, text: dict.pages.subscribeQ3Text },
  ];

  const titleLines = dict.pages.subscribeTitle.split('\n');

  return (
    <div className="subscribe-page">
      <section className="subscribe-hero">
        <div className="container">
          <div className="subscribe-hero-inner">
            <div className="subscribe-hero-badge">
              <span className="subscribe-live-dot" />
              {dict.pages.subscribeEyebrow}
            </div>
            <h1 className="subscribe-hero-title">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === titleLines.length - 1 && titleLines.length > 1 ? (
                    <span className="subscribe-hero-accent">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
            <p className="subscribe-hero-desc">{dict.pages.subscribeLead}</p>

            <div className="subscribe-hero-form">
              <SubscribeForm />
              <div className="subscribe-hero-meta">
                <span>🔒 {dict.pages.subscribeNoSpam}</span>
                <span>·</span>
                <span>{dict.pages.subscribeCancel}</span>
                {displayCount && (
                  <>
                    <span>·</span>
                    <span>
                      <strong>
                        {interpolate(dict.pages.subscribeCount, { count: displayCount })}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="subscribe-testimonials">
              {quotes.map((s, i) => (
                <div key={i} className="subscribe-testimonial">
                  <div className="subscribe-testimonial-stars">★★★★★</div>
                  <p className="subscribe-testimonial-text">&ldquo;{s.text}&rdquo;</p>
                  <p className="subscribe-testimonial-role">{s.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="subscribe-hero-glow subscribe-hero-glow--1" />
        <div className="subscribe-hero-glow subscribe-hero-glow--2" />
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="subscribe-section-header">
            <div className="section-eyebrow">WHAT YOU GET</div>
            <h2 className="subscribe-section-title">{dict.pages.subscribeWhatTitle}</h2>
          </div>
          <div className="subscribe-benefits">
            {benefits.map((b, i) => (
              <div key={i} className="subscribe-benefit-card">
                <div className="subscribe-benefit-icon">{b.icon}</div>
                <div>
                  <h3 className="subscribe-benefit-title">{b.title}</h3>
                  <p className="subscribe-benefit-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 96 }}>
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>
            {dict.pages.subscribeCtaTitle}
          </h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 32, lineHeight: 1.6 }}>
            {dict.pages.subscribeCtaLead}
          </p>
          <SubscribeForm />
        </div>
      </section>
    </div>
  );
}
