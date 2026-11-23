import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = { title: '콘텐츠 관리 · ThiveLab', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
