'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="err">
      <div>
        <div className="err-code">500</div>
        <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>
          일시적인 오류가 발생했습니다
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} className="btn btn-ghost">다시 시도</button>
          <Link href="/" className="btn btn-ghost">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
