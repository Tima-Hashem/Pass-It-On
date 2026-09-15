import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserNav from '@/components/navigation/UserNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <UserNav />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
