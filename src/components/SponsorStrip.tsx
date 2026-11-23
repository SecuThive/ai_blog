import Link from '@/i18n/link';
import { VENDORS } from '@/app/[locale]/security/data';

export default function SponsorStrip({ locale }: { locale: 'ko' | 'en' }) {
  const sponsor = VENDORS.find(v => v.sponsored && v.bannerUrl);
  if (sponsor) return <div className="sponsor-strip">
    <span>{locale === 'en' ? 'AD' : '광고'}</span>
    <a href={sponsor.profileUrl ?? sponsor.url} target="_blank" rel="sponsored nofollow noopener">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sponsor.bannerUrl} alt={locale === 'en' ? sponsor.nameEn : sponsor.name} style={{ maxHeight: 64, maxWidth: '100%' }} />
    </a>
  </div>;
  return <div className="sponsor-strip">
    <span>{locale === 'en' ? 'SPONSORSHIP' : '스폰서'}</span>
    <Link href="/security/advertise">{locale === 'en'
      ? 'Category sponsorship is available — inquire about listings'
      : '이 카테고리 스폰서 자리입니다 — 등재·스폰서 문의'}</Link>
  </div>;
}
