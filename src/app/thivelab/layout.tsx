import type { ReactNode } from 'react';
import './thivelab.css';

export default function ThivelabLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
