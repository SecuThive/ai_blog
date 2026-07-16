import SubscribeForm from './SubscribeForm';

// 글·가이드 본문 하단에 놓는 인라인 구독 CTA.
// 목적: 일회성 검색 방문자를 이메일 구독으로 전환해 재방문을 만든다.
// variant로 문맥에 맞는 카피를 쓴다(블로그 글 / 엔지니어 가이드).
export default function InlineSubscribeCTA({
  variant = 'post',
}: {
  variant?: 'post' | 'guide';
}) {
  const title = variant === 'guide'
    ? '실무에 바로 쓰는 가이드, 놓치지 마세요'
    : '이런 글을 매주 인박스로';
  const desc = variant === 'guide'
    ? '새 엔지니어 가이드와 트러블슈팅 레시피를 이메일로 먼저 받아보세요. 광고 없이, 언제든 해지 가능합니다.'
    : 'IT·개발·보안·AI 인사이트를 매주 화요일 정리해 보내드립니다. 스팸 없이, 언제든 해지 가능합니다.';

  return (
    <aside className="inline-cta" aria-label="뉴스레터 구독">
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
