'use client';

import { useState } from 'react';

export default function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState('ok');
      } else {
        setState('error');
        setMsg(data.error ?? '오류가 발생했습니다.');
      }
    } catch {
      setState('error');
      setMsg('네트워크 오류가 발생했습니다.');
    }
  }

  if (state === 'ok') {
    return (
      <div className="subscribe-success">
        <span className="subscribe-success-icon">✓</span>
        <div>
          <p className="subscribe-success-title">구독 완료!</p>
          <p className="subscribe-success-desc">확인 메일을 보내드렸습니다. 매주 화요일 인박스에서 만나요.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form className={`subscribe-form${compact ? ' subscribe-form--compact' : ''}`} onSubmit={submit}>
        <div className="subscribe-input-wrap">
          <svg className="subscribe-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <input
            className="input subscribe-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={compact ? 'your@email.com' : '이메일 주소를 입력하세요'}
            required
            disabled={state === 'loading'}
          />
        </div>
        <button type="submit" className="btn btn-primary subscribe-btn" disabled={state === 'loading'}>
          {state === 'loading'
            ? <span className="subscribe-btn-loading"><span className="subscribe-spinner" />처리 중</span>
            : compact ? '구독' : '무료 구독하기 →'}
        </button>
      </form>
      {state === 'error' && (
        <p className="subscribe-error">{msg}</p>
      )}
    </div>
  );
}
