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
      <p style={{ color: 'var(--acc-mint)', fontFamily: 'var(--ff-mono)', fontSize: 13, letterSpacing: '0.04em' }}>
        ✓ 구독 완료! 매주 화요일 받아보세요.
      </p>
    );
  }

  return (
    <>
      <form className="subscribe-form" onSubmit={submit}>
        <input
          className="input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          disabled={state === 'loading'}
        />
        <button type="submit" className="btn btn-primary" disabled={state === 'loading'}>
          {state === 'loading' ? '처리 중…' : compact ? '구독' : '구독하기'}
        </button>
      </form>
      {state === 'error' && (
        <p style={{ color: 'var(--acc-rose)', fontSize: 12, marginTop: 8 }}>{msg}</p>
      )}
    </>
  );
}
