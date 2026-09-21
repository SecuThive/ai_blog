import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import type { Metadata } from 'next';
import { VENDORS, CATEGORIES, categoryLabel, type SecurityCategory } from './data';
import SecurityCatalog from './SecurityCatalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.thivelab.com';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: '/security',
    title: dict.pages.securityTitle,
    description: locale === 'en'
      ? 'Catalog of major Korean security vendors — firewall, EDR, SIEM, WAF, MFA, and more.'
      : '방화벽, EDR, SIEM, WAF, MFA 등 국내 주요 보안 벤더와 솔루션 카탈로그.',
  });
}

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  void dict;
  const totalVendors = VENDORS.length;
  const totalCategories = CATEGORIES.length;

  const catCounts: Record<string, number> = {};
  for (const v of VENDORS) for (const c of v.categories) catCounts[c] = (catCounts[c] ?? 0) + 1;
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {locale === 'en' ? 'SECURITY · KOREA VENDORS' : 'SECURITY · 국내 보안 솔루션'}
          </div>
          <h1 className="page-title">{locale === 'en' ? 'Korean security solutions catalog' : '국내 보안 솔루션 카탈로그'}</h1>
          <p className="page-lead">{locale === 'en'
              ? 'Major Korean security vendors by category — firewall, EDR, SIEM, WAF, MFA, and more.'
              : '방화벽, EDR, SIEM, WAF, MFA 등 분야별 국내 주요 보안 벤더 솔루션을 한눈에.'}</p>

          {/* 통계 */}
          <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{totalVendors}</strong>
              {' '}VENDORS
            </div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              <strong style={{ color: 'var(--text-1)' }}>{totalCategories}</strong>
              {' '}CATEGORIES
            </div>
            {topCat && (
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
                TOP <strong style={{ color: 'var(--text-1)' }}>{categoryLabel(topCat[0] as SecurityCategory, locale)}</strong>
                {' '}· {topCat[1]}{locale === 'en' ? ' vendors' : '개 벤더'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SecurityCatalog />
        </div>
      </section>
    </div>
  );
}
