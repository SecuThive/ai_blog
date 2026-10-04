'use client';

import { useState } from 'react';
import { useT } from '@/i18n/provider';

export default function UnsubscribePage() {
  const { locale } = useT();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('loading');
    try {
      const response = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Request failed');
      setState('ok');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed');
      setState('error');
    }
  }
  return <div className="container" style={{ maxWidth: 560, paddingTop: 80, paddingBottom: 100 }}>
    <h1>{locale === 'ko' ? '뉴스레터 구독 해지' : 'Unsubscribe from newsletter'}</h1>
    <p>{locale === 'ko' ? '구독에 사용한 이메일을 입력하세요. 주소는 페이지 URL에 포함되지 않습니다.' : 'Enter the address you subscribed with. It will not appear in the page URL.'}</p>
    {state === 'ok' ? <p role="status">{locale === 'ko' ? '구독 해지 요청을 처리했습니다.' : 'Your unsubscribe request has been processed.'}</p> : <form onSubmit={submit}>
      <label htmlFor="unsubscribe-email">{locale === 'ko' ? '이메일' : 'Email'}</label>
      <input id="unsubscribe-email" className="input" type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
      {state === 'error' && <p role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={state === 'loading'}>{locale === 'ko' ? '구독 해지' : 'Unsubscribe'}</button>
    </form>}
  </div>;
}
