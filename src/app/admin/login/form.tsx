'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign('/admin');
    } catch (err) { setError(err instanceof Error ? err.message : '연결하지 못했습니다. 다시 시도해 주세요.'); setBusy(false); }
  }}><label>아이디<input type="text" name="email" autoComplete="username" required maxLength={254} autoFocus /></label><label>비밀번호<input type="password" name="password" autoComplete="current-password" required maxLength={1024} /></label>{error && <p className="notice error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button><p className="hint">공용 기기에서는 사용 후 반드시 로그아웃해 주세요.</p></form>;
}
