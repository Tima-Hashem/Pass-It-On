'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { handleLogout } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

export default function AdminNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-white tracking-tight">PassItOn <span className="text-indigo-400">Admin</span></span>
            </Link>
            
            <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
              <Link 
                href="/admin/dashboard" 
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-75 ${
                  isActive('/admin/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                User Management
              </Link>
              <Link 
                href="/admin/project-review" 
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-75 ${
                  isActive('/admin/project-review') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Project Review
              </Link>
              <Link 
                href="/support" 
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-75 ${
                  isActive('/support') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Support
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={handleLogout} className="hidden sm:block">
              <SubmitButton 
                className="text-sm font-bold text-slate-400 hover:text-white bg-slate-800/0 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all duration-75 cursor-pointer"
                loadingText="Out..."
              >
                Logout
              </SubmitButton>
            </form>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-75"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Backdrop */}
      <div 
        className={`sm:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Navigation Drawer Panel */}
      <div 
        className={`sm:hidden fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 flex-shrink-0">
          <span className="text-xl font-bold text-white tracking-tight">
            PassItOn <span className="text-indigo-400">Admin</span>
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="sr-only">Close menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-6 space-y-2 flex-1 overflow-y-auto">
          <Link 
            href="/admin/dashboard" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-base font-bold transition-all duration-75 ${
              isActive('/admin/dashboard') ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            User Management
          </Link>
          <Link 
            href="/admin/project-review" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-base font-bold transition-all duration-75 ${
              isActive('/admin/project-review') ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Project Review
          </Link>
          <Link 
            href="/support" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-base font-bold transition-all duration-75 ${
              isActive('/support') ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Support
          </Link>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
          <form action={handleLogout}>
            <SubmitButton 
              className="w-full text-center justify-center px-4 py-3 text-base font-bold text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200"
              loadingText="Logging out..."
            >
              Logout
            </SubmitButton>
          </form>
        </div>
      </div>
    </nav>
  );
}
