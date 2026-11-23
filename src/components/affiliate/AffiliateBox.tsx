import { affiliatePrograms } from '@/lib/affiliate-map';
import AffiliateLink from './AffiliateLink';

export default function AffiliateBox({ category, tags, slug, locale }: {
  category: string; tags: string[]; slug: string; locale: 'ko' | 'en';
}) {
  const programs = affiliatePrograms(category, tags);
  if (!programs.length) return null;
  return <aside className="affiliate-box" aria-label={locale === 'en' ? 'Affiliate recommendations' : '제휴 추천'}>
    <div className="affiliate-box-heading">TOOLS FOR THIS WORKFLOW</div>
    <p>{locale === 'en' ? 'Tools related to this article' : '이 글과 함께 쓰는 도구'}</p>
    {programs.map(program => <div key={program.id} className="affiliate-box-item">
      <strong>{program.name}</strong><span>{program.pitch}</span>
      <AffiliateLink href={program.url} program={program.id} slug={slug}>자세히 보기 ↗</AffiliateLink>
    </div>)}
    <p className="affiliate-disclosure">{locale === 'en'
      ? 'This article contains affiliate links. THIVELAB may receive a commission if you sign up or buy through them. Commissions do not affect our evaluations or rankings.'
      : '이 글에는 제휴 링크가 포함되어 있으며, 링크를 통한 가입·구매 시 thivelab이 일정 수수료를 받습니다. 글의 평가와 순위는 수수료와 무관합니다.'}</p>
  </aside>;
}
