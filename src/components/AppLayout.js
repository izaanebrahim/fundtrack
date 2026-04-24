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
  const [showRescue, setShowRescue] = useState(false);
  useEffect(() => {
    let t;
    if (loading && !user) {
      t = setTimeout(() => setShowRescue(true), 4000);
    } else {
      setShowRescue(false);
    }
    return () => clearTimeout(t);
  }, [loading, user]);

  const forceRecovery = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  if (loading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">Loading FundTrack...</p>
            {showRescue && (
              <button 
                onClick={forceRecovery}
                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg text-xs hover:bg-red-900/50 transition-all animate-in fade-in slide-in-from-bottom-2"
              >
                Taking too long? Force Reset App
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show login page only
  if (!user || pathname === '/login') {
    return <>{children}</>;
  }

  // Logged in but profile still loading - show shell but with a loading state inside
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
            className="p-2 text-gray-400 hover:text-white font-bold"
          >
            MENU
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {!profile && !profileError ? (
            <div className="flex h-full items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : profileError ? (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
               <h3 className="font-bold text-lg mb-2">Connection Error</h3>
               <p className="text-sm">{profileError}</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
