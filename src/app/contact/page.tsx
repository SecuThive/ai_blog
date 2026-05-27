'use client';

import Link from 'next/link';
import { useState } from 'react';

const CONTACT_TYPES = [
  { value: '기사 제보 / 정정 요청',  label: '기사 제보 / 정정 요청',  icon: '📰' },
  { value: '콘텐츠 제휴 / 협업',    label: '콘텐츠 제휴 / 협업',    icon: '🤝' },
  { value: '광고 / 스폰서십',       label: '광고 / 스폰서십',       icon: '📣' },
  { value: '채용 / 운영 참여',      label: '채용 / 운영 참여',      icon: '🧑‍💻' },
  { value: '일반 문의',             label: '일반 문의',             icon: '💬' },
];

const TRUST_ITEMS = [
  { icon: '⏱', label: '평균 답변', value: '36시간 이내' },
  { icon: '🔒', label: '개인정보', value: '제3자 미제공' },
  { icon: '📬', label: '직접 답변', value: '담당자 직접 회신' },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, company, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('ok');
      } else {
        setState('error');
        setErrorMsg(data.error ?? '오류가 발생했습니다.');
      }
    } catch {
      setState('error');
      setErrorMsg('네트워크 오류가 발생했습니다.');
    }
  }

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="page-eyebrow">CONTACT</div>
          <h1 className="page-title">문의 · 제휴</h1>
          <p className="page-lead">기사 제보, 콘텐츠 제휴, 협업, 또는 단순한 피드백 — 어떤 메시지든 환영합니다.</p>

          {/* Trust bar */}
          <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {TRUST_ITEMS.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>{t.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40, alignItems: 'start' }}>

            {/* Main form / success */}
            {state === 'ok' ? (
              <div className="card" style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in oklch, var(--acc-mint) 15%, var(--bg-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 22, letterSpacing: '-0.02em' }}>문의가 접수되었습니다</h3>
                <p style={{ color: 'var(--text-3)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  영업일 기준 36시간 내에 <strong>{email}</strong>으로 답변드리겠습니다.
                </p>
                <Link href="/" className="btn btn-ghost">홈으로 돌아가기</Link>
              </div>
            ) : (
              <form className="card" style={{ padding: 32 }} onSubmit={handleSubmit}>
                <h3 style={{ margin: '0 0 24px', fontSize: 18, letterSpacing: '-0.015em' }}>메시지 보내기</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="field">
                      <label>이름</label>
                      <input
                        className="input"
                        placeholder="홍길동"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={state === 'loading'}
                      />
                    </div>
                    <div className="field">
                      <label>이메일</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="you@company.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={state === 'loading'}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>문의 유형</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {CONTACT_TYPES.map(ct => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => setType(ct.value)}
                          disabled={state === 'loading'}
                          style={{
                            padding: '7px 13px',
                            borderRadius: 8,
                            border: `1px solid ${type === ct.value ? 'var(--acc-blue)' : 'var(--line-2)'}`,
                            background: type === ct.value ? 'color-mix(in oklch, var(--acc-blue) 10%, var(--bg-1))' : 'var(--bg-2)',
                            color: type === ct.value ? 'var(--acc-blue)' : 'var(--text-2)',
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 140ms',
                            fontWeight: type === ct.value ? 600 : 400,
                          }}
                        >
                          {ct.icon} {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label>회사 / 소속 <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(선택)</span></label>
                    <input
                      className="input"
                      placeholder="Company name"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      disabled={state === 'loading'}
                    />
                  </div>

                  <div className="field">
                    <label>메시지</label>
                    <textarea
                      className="input"
                      rows={5}
                      placeholder="구체적으로 알려주시면 빠른 답변에 도움이 됩니다."
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={state === 'loading'}
                      style={{ resize: 'vertical', minHeight: 120 }}
                    />
                  </div>

                  {state === 'error' && (
                    <p style={{ color: 'var(--acc-rose)', fontSize: 13, margin: 0 }}>{errorMsg}</p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.03em' }}>
                      🔒 메시지는 암호화되어 전송됩니다
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={state === 'loading'}>
                      {state === 'loading' ? '전송 중…' : '메시지 보내기'}
                      {state !== 'loading' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17L17 7M7 7h10v10" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 22 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--text-4)', letterSpacing: '0.08em', marginBottom: 14 }}>DIRECT CONTACT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
                  {[
                    { label: '일반 문의', mail: 'thive8564@gmail.com' },
                    { label: '제휴 / 광고', mail: 'thive8564@gmail.com' },
                    { label: '제보 / 정정', mail: 'thive8564@gmail.com' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ color: 'var(--text-3)', fontSize: 11.5, marginBottom: 3, fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>{item.label}</div>
                      <a href={`mailto:${item.mail}`} style={{ color: 'var(--acc-blue)', fontWeight: 500 }}>{item.mail}</a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-widget">
                <span className="ai-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  자주 묻는 질문
                </span>
                <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.55 }}>
                  문의 전에 FAQ를 확인해보세요. 가장 자주 받는 질문은 미리 정리되어 있습니다.
                </p>
                <Link href="/faq" className="btn btn-sm">
                  FAQ 보기
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </Link>
              </div>

              <div className="card" style={{ padding: 22, background: 'color-mix(in oklch, var(--acc-purple) 5%, var(--bg-2))' }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--acc-purple)', letterSpacing: '0.08em', marginBottom: 10 }}>NEWSLETTER</div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                  매주 화요일, 보안·AI·인프라 핵심 뉴스를 6분 분량으로 받아보세요.
                </p>
                <Link href="/subscribe" className="btn btn-sm btn-primary">무료 구독하기 →</Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
