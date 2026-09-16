import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Footer from '@/components/navigation/Footer';
import AdminNav from '@/components/navigation/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN') {
    redirect('/user/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AdminNav />
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
