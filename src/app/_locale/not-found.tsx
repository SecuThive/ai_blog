import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="err">
      <div>
        <div className="err-code">404</div>
        <p style={{ color: 'var(--text-3)', fontSize: 18, margin: '16px 0 28px' }}>
          페이지를 찾을 수 없습니다
        </p>
        <Link href="/" className="btn btn-ghost">← 홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
