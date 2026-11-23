import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminUser } from '@/lib/admin-auth';
import LoginForm from './form';

export default async function LoginPage() {
  if (await adminUser()) redirect('/admin');
  return <main className="login-page"><section className="login-panel"><Link className="brand" href="/">ThiveLab<span>콘텐츠 관리</span></Link><h1>관리자 로그인</h1><p>글을 다듬고, 독자의 이야기를 확인하세요.</p><LoginForm /><p className="hint">관리자 권한이 부여된 계정만 접근할 수 있습니다.<br />계정 발급·비밀번호 재설정은 사이트 운영자에게 요청해 주세요.</p><Link href="/">사이트로 돌아가기 ↗</Link></section></main>;
}
