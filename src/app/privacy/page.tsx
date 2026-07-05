import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 — Nodelog',
};

const SECTIONS = [
  ['1. 수집하는 정보', '① 뉴스레터: 구독 신청 시 이메일 주소를 수집합니다. ② 댓글: 작성 시 입력한 이름(별명 가능)과 댓글 내용, 도배 방지를 위한 IP 주소의 일방향 해시값을 수집합니다. ③ 문의 폼: 이름, 이메일, 소속(선택), 문의 내용을 수집합니다. ④ 이용 분석·광고: 익명화된 페이지뷰·체류 시간·기기/브라우저 정보가 수집됩니다. 그 외 항목은 수집하지 않습니다.'],
  ['2. 정보의 사용 목적', '뉴스레터 이메일은 발송과 동의 이력 기록에만 사용됩니다. 댓글 정보는 댓글 표시와 어뷰징 방지에, 문의 정보는 답변과 이력 관리에 사용됩니다. 분석 데이터는 콘텐츠 추천, 사이트 품질 개선, 광고 게재 및 성과 측정에 사용됩니다.'],
  ['3. 보관 기간', '뉴스레터 구독 이메일은 구독 해지 시 14일 이내에 영구 삭제됩니다. 댓글은 삭제 요청 시 확인 후 삭제합니다. 문의 내역은 처리 완료 후 1년간 보관 후 삭제합니다. 분석 데이터는 90일이 지나면 통계 집계 후 원본이 삭제됩니다. 광고·분석 쿠키의 보관 기간은 각 제공업체(Google 등)의 정책을 따릅니다.'],
  ['4. 제3자 제공 및 처리 위탁', '당사는 사용자의 개인정보를 판매하지 않습니다. 다만 서비스 운영을 위해 다음의 사업자에게 처리를 위탁하거나, 해당 사업자가 자체 쿠키를 통해 익명화된 이용 데이터를 처리할 수 있습니다 — 광고: Google AdSense, 분석: Google Analytics·Vercel Analytics, 데이터 보관: Supabase, 메일 발송: 뉴스레터·문의 알림 인프라(Resend). 각 사업자는 자체 개인정보처리방침에 따라 데이터를 처리하며, 일부 처리는 국외(미국 등) 서버에서 이루어질 수 있습니다.'],
  ['5. 사용자의 권리', '사용자는 자신의 정보에 대한 열람, 정정, 삭제, 처리 정지를 언제든 요청할 수 있으며 thive8564@gmail.com 로 요청 시 7일 이내에 처리됩니다.'],
  ['6. 쿠키 및 광고', '본 사이트는 사이트 작동에 필요한 세션 쿠키와, 이용 분석·광고 게재를 위한 쿠키를 사용합니다. 특히 Google을 포함한 제3자 광고 사업자는 쿠키(예: DoubleClick 쿠키 및 광고 식별자)를 사용하여 사용자가 본 사이트 및 다른 웹사이트를 방문한 기록을 기반으로 맞춤형 광고를 게재할 수 있습니다. 사용자는 Google 광고 설정(google.com/settings/ads) 또는 www.aboutads.info 에서 맞춤형 광고를 비활성화(opt-out)할 수 있으며, 브라우저 설정에서 쿠키를 직접 차단할 수도 있습니다. 단, 쿠키를 차단하면 일부 기능이 제한될 수 있습니다.'],
  ['7. AI 콘텐츠 처리', '발행되는 글은 AI가 1차 작성한 뒤 사람 편집자가 사실 확인과 톤·맥락을 검토하여 발행합니다. 사용자가 콘텐츠에 제공한 피드백은 추천 모델 학습을 위해 익명화된 형태로 사용됩니다.'],
  ['8. 정책 변경', '이 정책이 변경될 경우 본 페이지 상단에 변경 사실과 변경 시점이 명시되며, 뉴스레터 구독자에게는 이메일로도 안내됩니다.'],
];

export default function PrivacyPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="crumbs">
            <Link href="/">홈</Link><span className="sep">/</span>
            <span style={{ color: 'var(--text-1)' }}>개인정보처리방침</span>
          </div>
          <div className="page-eyebrow" style={{ marginTop: 12 }}>PRIVACY POLICY</div>
          <h1 className="page-title" style={{ marginBottom: 16 }}>개인정보처리방침</h1>
          <p className="page-lead">Nodelog(thivelab.com)가 수집하는 정보의 범위, 사용 방식, 그리고 사용자의 권리를 명확하게 안내합니다.</p>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--text-4)', letterSpacing: '0.06em', marginTop: 18 }}>
            최종 업데이트 · 2026.07.03 (댓글·문의 수집 항목 명시) · 최초 적용일 2026.06.02
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {SECTIONS.map(([t, body]) => (
              <div key={t}>
                <h2 style={{ margin: '0 0 12px', fontSize: 19, letterSpacing: '-0.015em', color: 'var(--text-1)' }}>{t}</h2>
                <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15.5, lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, padding: 24, border: '1px solid var(--line-1)', borderRadius: 12, background: 'var(--bg-2)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
              이 정책에 대해 궁금한 점이 있다면 <a style={{ color: 'var(--acc-blue)' }} href="mailto:thive8564@gmail.com">thive8564@gmail.com</a> 로 문의해주세요.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
