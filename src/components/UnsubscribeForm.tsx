'use client';

import { useState } from 'react';

const TEXT = {
  ko: { button: '구독 해지', working: '처리 중…', done: '구독이 해지되었습니다. 더 이상 뉴스레터가 발송되지 않습니다.', failed: '링크가 올바르지 않거나 처리 중 오류가 발생했습니다. 아래 이메일로 요청해 주세요.' },
  en: { button: 'Unsubscribe', working: 'Working…', done: 'You have been unsubscribed. No more newsletters will be sent.', failed: 'The link is invalid or something went wrong. Please ask us by email below.' },
} as const;

export default function UnsubscribeForm({ token, locale }: { token: string; locale: 'ko' | 'en' }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');
  const t = TEXT[locale];

  async function submit() {
    setState('working');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? 'done' : 'failed');
    } catch {
      setState('failed');
    }
  }

  if (state === 'done') return <p role="status" style={{ color: 'var(--text-1)', lineHeight: 1.7 }}>{t.done}</p>;
  return (
    <div>
      <button
        type="button"
        onClick={submit}
        disabled={state === 'working'}
        style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--line-1, #ccc)', background: 'var(--text-1)', color: 'var(--bg-1, #fff)', fontWeight: 600, cursor: 'pointer' }}
      >
        {state === 'working' ? t.working : t.button}
      </button>
      {state === 'failed' && <p role="alert" style={{ marginTop: 16, color: 'var(--text-2)', lineHeight: 1.7 }}>{t.failed}</p>}
    </div>
  );
}
