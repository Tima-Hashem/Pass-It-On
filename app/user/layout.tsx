import Link from 'next/link';
import { getSession, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
      <nav className="bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-white tracking-tight">PassItOn</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/user/dashboard" className="border-transparent text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/user/search" className="border-transparent text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Search Skills
                </Link>
                <Link href="/user/profile" className="border-transparent text-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <form action={async () => {
                'use server';
                await logout();
                redirect('/login');
              }}>
                <button type="submit" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
