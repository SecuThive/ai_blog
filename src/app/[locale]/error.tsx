'use client';

import { useEffect } from 'react';
import Link from '@/i18n/link';
import { useT } from '@/i18n/provider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict } = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="err">
      <div>
        <div className="err-code">500</div>
        <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>
          {dict.common.errorTitle}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} className="btn btn-ghost">{dict.common.retry}</button>
          <Link href="/" className="btn btn-ghost">{dict.common.backHomeLong}</Link>
        </div>
      </div>
    </div>
  );
}
