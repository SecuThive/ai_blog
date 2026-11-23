import { redirect } from 'next/navigation';
import { adminUser } from '@/lib/admin-auth';
import AdminWorkspace from './workspace';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const user = await adminUser();
  if (!user) redirect('/admin/login');
  return <AdminWorkspace email={user.email || '관리자'} />;
}
