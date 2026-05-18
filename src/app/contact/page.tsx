'use client';

import Link from 'next/link';
import { useState } from 'react';

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
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48, alignItems: 'start' }}>
            {state === 'ok' ? (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>문의가 접수되었습니다</h3>
                <p style={{ color: 'var(--text-3)', margin: 0 }}>영업일 기준 36시간 내에 답변드리겠습니다.</p>
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
                    <select
                      className="input"
                      value={type}
                      onChange={e => setType(e.target.value)}
                      disabled={state === 'loading'}
                    >
                      <option value="">선택해주세요</option>
                      <option>기사 제보 / 정정 요청</option>
                      <option>콘텐츠 제휴 / 협업</option>
                      <option>광고 / 스폰서십</option>
                      <option>채용 / 운영 참여</option>
                      <option>일반 문의</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>회사 / 소속 (선택)</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.04em' }}>평균 답변 시간 · 영업일 기준 36시간</div>
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

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="widget">
                <h5>DIRECT</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 2 }}>일반 문의</div>
                    <a href="mailto:hello@nodelog.kr" style={{ color: 'var(--acc-blue)' }}>hello@nodelog.kr</a>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 2 }}>제휴 / 광고</div>
                    <a href="mailto:thive8564@gmail.com" style={{ color: 'var(--acc-blue)' }}>thive8564@gmail.com</a>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 2 }}>제보 / 정정</div>
                    <a href="mailto:thive8564@gmail.com" style={{ color: 'var(--acc-blue)' }}>thive8564@gmail.com</a>
                  </div>
                </div>
              </div>

              <div className="ai-widget">
                <span className="ai-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  자주 묻는 질문
                </span>
                <p style={{ margin: '12px 0', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.55 }}>
                  문의 전에 FAQ를 한 번 확인해보세요. 가장 자주 받는 질문은 미리 정리되어 있습니다.
                </p>
                <Link href="/faq" className="btn btn-sm">
                  FAQ 보기
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
