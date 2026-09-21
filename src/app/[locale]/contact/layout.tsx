import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/i18n/metadata';
import { getContact } from '@/i18n/copy/contact';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  const copy = getContact(locale);
  return pageMetadata({
    locale,
    path: '/contact',
    title: copy.title,
    description: copy.lead,
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
