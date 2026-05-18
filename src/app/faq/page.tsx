import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import FaqAccordion from './FaqAccordion';
import { FAQ_ITEMS } from './data';

export const metadata: Metadata = {
  title: 'FAQ — Nodelog',
  description: 'Nodelog 운영 방식, AI 콘텐츠 생성 프로세스, 뉴스레터 구독, 제휴 문의에 대해 자주 묻는 질문을 정리했습니다.',
  alternates: { canonical: 'https://nodelog.kr/faq' },
  openGraph: {
    title: 'FAQ — Nodelog',
    description: 'Nodelog 운영 방식과 사용법에 대해 가장 많이 받는 질문들을 정리했습니다.',
    url: 'https://nodelog.kr/faq',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

export default function FAQPage() {
  return (
    <div>
      <JsonLd data={faqSchema} />

      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">FAQ</div>
          <h1 className="page-title">자주 묻는 질문</h1>
          <p className="page-lead">Nodelog 운영 방식과 사용법에 대해 가장 많이 받는 질문들을 정리했습니다.</p>
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
