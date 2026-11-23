import type { Metadata } from 'next';
import Link from '@/i18n/link';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/i18n/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'ko';
  return pageMetadata({ locale, path: '/security/advertise',
    title: locale === 'en' ? 'Security catalog sponsorship' : '보안 카탈로그 등재·스폰서 문의',
    description: locale === 'en' ? 'Inquire about security catalog listings and sponsorship.' : 'Nodelog 보안 솔루션 카탈로그의 등재와 스폰서십을 문의하세요.' });
}

export default async function AdvertisePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const en = raw === 'en';
  return <div>
    <section className="page-hero"><div className="container">
      <div className="page-eyebrow">SECURITY · PARTNERSHIPS</div>
      <h1 className="page-title">{en ? 'Catalog listings & sponsorship' : '보안 카탈로그 등재·스폰서십'}</h1>
      <p className="page-lead">{en ? 'Reach readers researching Korean security solutions.' : '국내 보안 솔루션을 살펴보는 IT 실무 독자에게 제품을 소개하세요.'}</p>
    </div></section>
    <section className="section"><div className="container" style={{ maxWidth: 850 }}>
      <div className="card" style={{ padding: 32 }}>
        <h2>{en ? 'What we offer' : '무엇을 제공하나'}</h2>
        <p>{en ? 'Category placement, vendor profiles, inquiry links and monthly reports of views, clicks and inquiries.' : '카테고리 상단 노출, 벤더 상세 프로필, 도입 문의 연결, 월간 노출·클릭·문의 리포트를 제공합니다.'}</p>
        <h2>{en ? 'Audience' : '노출 규모'}</h2>
        <p>{en ? 'Nodelog is a practical IT publication with a catalog of 36 vendors across 11 categories.' : 'Nodelog는 IT 실무 미디어이며, 카탈로그에 현재 36개 벤더와 11개 카테고리가 있습니다.'}</p>
        <h2>{en ? 'Process' : '진행 절차'}</h2>
        <p>{en ? 'Inquiry → one month trial → agreement.' : '문의 → 1개월 무료 체험 → 계약 순서로 진행합니다.'}</p>
        <p>{en ? 'Paid listings carry an “Ad” label. Pricing depends on placement and duration.' : '유료 등재 콘텐츠에는 “광고” 라벨을 표시합니다. 가격은 노출 위치와 기간에 따라 협의합니다.'}</p>
        <h2>{en ? 'Contact' : '문의'}</h2>
        <p><a href="mailto:thive@thivelab.com">thive@thivelab.com</a> · <Link href="/contact?type=catalog">{en ? 'Inquiry form' : '문의 양식'}</Link></p>
      </div>
    </div></section>
  </div>;
}
