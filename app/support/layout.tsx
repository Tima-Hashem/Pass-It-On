import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserNav from '@/components/navigation/UserNav';
import AdminNav from '@/components/navigation/AdminNav';
import Footer from '@/components/navigation/Footer';

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {session.role === 'ADMIN' ? <AdminNav /> : <UserNav />}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
