import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import FaqAccordion from './FaqAccordion';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { getFaq } from '@/i18n/copy/faq';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const faq = getFaq(locale);
  return pageMetadata({
    locale,
    path: '/faq',
    title: dict.pages.faqTitle,
    description: faq.lead,
  });
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  const faq = getFaq(locale);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: faq.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div>
      <JsonLd data={faqSchema} />

      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">FAQ</div>
          <h1 className="page-title">{dict.pages.faqTitle}</h1>
          <p className="page-lead">{faq.lead}</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <FaqAccordion />
        </div>
      </section>
    </div>
  );
}
