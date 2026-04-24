'use client';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function AppLayout({ children }) {
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Close sidebar on route change
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in - go to login
      if (pathname !== '/login') router.replace('/login');
      return;
    }

    // Logged in but no profile yet (shouldn't happen after our fix, but just in case)
    if (!profile) return;

    // On login page but already authenticated - redirect to correct dashboard
    if (pathname === '/login') {
      router.replace(profile.role === 'admin' ? '/admin' : '/dashboard');
      return;
    }

    // Client trying to access admin routes
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, profile, loading, pathname, router]);

  // Full page loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-400 text-sm">Loading FundTrack...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login page only
  if (!user || pathname === '/login') {
    return <>{children}</>;
  }

  // No profile yet - show spinner or error
  if (!profile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 bg-gray-900 border border-gray-800 rounded-xl">
          {profileError ? (
            <>
              <div className="text-red-500 text-xl font-bold">Connection Error</div>
              <p className="text-gray-300 text-sm">Failed to load profile data from the database. Please check your Supabase Row Level Security (RLS) policies and Environment Variables.</p>
              <div className="bg-black/50 p-3 rounded text-red-400 text-xs font-mono w-full break-words">
                {profileError}
              </div>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="text-gray-400 text-sm">Loading profile...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 lg:hidden">
          <h1 className="text-lg font-bold text-white tracking-widest uppercase">FundTrack</h1>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
