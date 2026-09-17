'use client';

import Link from '@/i18n/link';
import { useT } from '@/i18n/provider';

export default function NotFound() {
  const { dict } = useT();
  return (
    <div className="err">
      <div>
        <div className="err-code">404</div>
        <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>
          {dict.common.notFoundTitle}
        </p>
        <Link href="/" className="btn btn-ghost">{dict.common.backHomeLong}</Link>
      </div>
    </div>
  );
}
