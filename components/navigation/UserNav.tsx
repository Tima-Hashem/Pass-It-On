'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { handleLogout } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

export default function UserNav() {
  const pathname = usePathname();

  // Helper to check if a link is currently active
  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            
            {/* Custom Brand Logo */}
            <Link href="/user/dashboard" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <svg className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">
                PassItOn
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
              <Link 
                href="/user/dashboard" 
                className={`inline-flex items-center px-4 py-2 mt-1 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/user/dashboard') 
                    ? 'bg-slate-800 text-indigo-400 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/user/search" 
                className={`inline-flex items-center px-4 py-2 mt-1 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/user/search') 
                    ? 'bg-slate-800 text-indigo-400 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Search Skills
              </Link>
              <Link 
                href="/user/profile" 
                className={`inline-flex items-center px-4 py-2 mt-1 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive('/user/profile') 
                    ? 'bg-slate-800 text-indigo-400 shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Profile
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <form action={handleLogout}>
              <SubmitButton 
                className="text-sm font-bold text-slate-400 hover:text-white bg-slate-800/0 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all cursor-pointer"
                loadingText="Out..."
              >
                Logout
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
