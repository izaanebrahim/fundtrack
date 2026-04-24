'use client';

import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }) {
  const { user, profile, loading, profileError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
