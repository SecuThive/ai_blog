import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/messages';
import { pageMetadata } from '@/i18n/metadata';
import { getPrivacy } from '@/i18n/copy/legal';
import LegalDocPage from '@/components/LegalDocPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const doc = getPrivacy(locale);
  return pageMetadata({ locale, path: '/privacy', title: doc.title, description: doc.lead });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const dict = getDictionary(locale);
  return <><LegalDocPage homeLabel={dict.common.home} doc={getPrivacy(locale)} /><div className="container" style={{ paddingBottom: 40, fontSize: 13 }}><a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google {locale === 'ko' ? '광고 설정' : 'Ad Center'} ↗</a>{' · '}<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google {locale === 'ko' ? '광고 개인정보 안내' : 'Advertising privacy'} ↗</a></div></>;
}
