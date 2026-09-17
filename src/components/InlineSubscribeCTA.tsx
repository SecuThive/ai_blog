'use client';

import SubscribeForm from './SubscribeForm';
import { useT } from '@/i18n/provider';

// 글·가이드 본문 하단에 놓는 인라인 구독 CTA.
// 목적: 일회성 검색 방문자를 이메일 구독으로 전환해 재방문을 만든다.
// variant로 문맥에 맞는 카피를 쓴다(블로그 글 / 엔지니어 가이드).
export default function InlineSubscribeCTA({
  variant = 'post',
}: {
  variant?: 'post' | 'guide';
}) {
  const { dict } = useT();
  const title = variant === 'guide' ? dict.subscribe.inlineGuideTitle : dict.subscribe.inlinePostTitle;
  const desc = variant === 'guide' ? dict.subscribe.inlineGuideDesc : dict.subscribe.inlinePostDesc;

  return (
    <aside className="inline-cta" aria-label={dict.subscribe.aria}>
      <div className="inline-cta-body">
        <div className="inline-cta-badge">NEWSLETTER</div>
        <h3 className="inline-cta-title">{title}</h3>
        <p className="inline-cta-desc">{desc}</p>
      </div>
      <div className="inline-cta-form">
        <SubscribeForm compact />
      </div>
    </aside>
  );
}
