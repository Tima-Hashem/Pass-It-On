import Link from 'next/link';
import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function UserNav() {
  return (
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
              <button type="submit" className="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
