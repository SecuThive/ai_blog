'use client';

import { useState } from 'react';
import Link from 'next/link';

const ITEMS = [
  {
    q: '이 블로그는 어떤 주제를 다루나요?',
    a: 'AI 자동화, 개발, 보안, 클라우드/인프라, 생산성, SaaS 리뷰, 그리고 실무 가이드. 총 8개 카테고리를 중심으로 운영됩니다. 단순 뉴스가 아니라, 변화의 의미와 실무 적용 방법까지 다루는 것을 원칙으로 합니다.',
  },
  {
    q: 'AI가 운영한다는 게 정확히 무슨 뜻인가요?',
    a: '4,128개의 IT 소스를 24시간 모니터링하는 AI 에이전트가 신호를 감지하고, 1차 초고를 작성합니다. 이후 사람 편집자가 사실관계와 톤을 점검한 뒤 발행합니다. AI 단독으로는 어떤 글도 발행되지 않으며, 모든 글에는 어떤 단계에서 어떤 주체가 작업했는지 표기됩니다.',
  },
  {
    q: '글은 어떻게 작성되나요?',
    a: '수집 → 신호 점수화 → 초고 생성 → 편집자 검토 → 발행 → 피드백 학습의 6단계를 거칩니다. 자세한 다이어그램은 About 페이지의 운영 방식 섹션을 참고하세요.',
  },
  {
    q: '제휴 / 광고 / 콘텐츠 문의는 어디로 하나요?',
    a: 'partners@nodelog.kr 로 메일을 보내주시거나, Contact 페이지의 폼을 이용해주세요. 평균 답변 시간은 영업일 기준 36시간입니다.',
  },
  {
    q: '콘텐츠는 얼마나 자주 업데이트되나요?',
    a: '평일 기준 일 평균 2~3편, 주말에는 시리즈 깊이 글 1편을 발행합니다. 트렌딩과 AI 추천 위젯은 실시간으로 갱신됩니다.',
  },
  {
    q: '검색과 카테고리 탐색은 어떻게 사용하나요?',
    a: '상단의 검색 버튼(또는 ⌘K)으로 전체 글·카테고리·태그를 한 번에 탐색할 수 있습니다. 카테고리별로 좁히려면 헤더의 메뉴, 시간순으로 보려면 아카이브 페이지를 사용하세요.',
  },
  {
    q: 'AI가 생성한 내용에 오류가 있다면?',
    a: 'tips@nodelog.kr 로 알려주시면 24시간 내에 검토 후 정정합니다. 정정된 내용은 글 상단에 명시되며, 어떤 부분이 어떻게 수정되었는지 기록됩니다.',
  },
  {
    q: '뉴스레터는 어떻게 구독하나요?',
    a: '홈 페이지 하단 또는 모든 페이지의 우측 상단 "구독하기" 버튼으로 신청할 수 있습니다. 매주 화요일 오전 8시(KST) 발송되며, 언제든 해지 가능합니다.',
  },
];

export { ITEMS };

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ITEMS.map((it, i) => (
          <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
              <span>{it.q}</span>
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {open === i ? <line x1="5" y1="12" x2="19" y2="12" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
                </svg>
              </span>
            </button>
            <div className="faq-a">{it.a}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 48, padding: 28, border: '1px dashed var(--line-2)', borderRadius: 12, textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 16 }}>찾으시는 답이 없나요?</h4>
        <p style={{ color: 'var(--text-3)', margin: '0 0 16px' }}>직접 문의해주시면 빠르게 답변드립니다.</p>
        <Link href="/contact" className="btn btn-primary">
          문의하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>
    </>
  );
}
