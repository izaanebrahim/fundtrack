'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  ArrowLeftRight, 
  TrendingUp, 
  FileText, 
  Settings,
  Users,
  LogOut,
  Inbox,
  Megaphone,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getNoticesSeenAt } from '../lib/notices';

const clientNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Performance', href: '/fund-performance', icon: TrendingUp },
  { name: 'Notices', href: '/notices', icon: Megaphone },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Requests', href: '/admin/requests', icon: Inbox },
  { name: 'Manage Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Manage Holdings', href: '/admin/holdings', icon: Briefcase },
  { name: 'Performance', href: '/fund-performance', icon: TrendingUp },
  { name: 'Notices', href: '/admin/notices', icon: Megaphone },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [openRequests, setOpenRequests] = useState(0);
  const isAdmin = profile?.role === 'admin';

  // Badge on the admin Requests link; refreshed on navigation
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING', 'CONTACTED'])
      .then(({ count, error }) => {
        if (!error) setOpenRequests(count || 0);
      });
  }, [isAdmin, pathname]);

  // Badge on the client Notices link: notices posted since this browser last opened the tab
  const [unreadNotices, setUnreadNotices] = useState(0);
  useEffect(() => {
    if (!profile || isAdmin) return;
    function countUnread() {
      let query = supabase.from('notices').select('id', { count: 'exact', head: true });
      const seenAt = getNoticesSeenAt();
      if (seenAt) query = query.gt('created_at', seenAt);
      query.then(({ count, error }) => {
        if (!error) setUnreadNotices(count || 0);
      });
    }
    countUnread();
    window.addEventListener('notices-seen', countUnread);
    return () => window.removeEventListener('notices-seen', countUnread);
  }, [profile, isAdmin, pathname]);
  
  if (!profile) return null;

  const navigation = profile.role === 'admin' ? adminNav : clientNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-[100dvh] w-64 max-w-[85vw] flex-col bg-[#07100E] border-r border-white/5 text-[#7E8D91]">
      <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-white/5">
        <Link href={navigation[0].href} className="w-full flex items-center justify-start cursor-pointer transition-opacity hover:opacity-80">
          <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[170px] h-auto object-contain" />
        </Link>
        <button 
          onClick={onClose}
          className="p-2 -mr-2 text-gray-500 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3 py-4 [@media(min-height:700px)]:space-y-2 [@media(min-height:700px)]:py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                isActive
                  ? 'bg-[#12C98B]/10 text-[#F3F1E8] border-l-4 border-[#12C98B] rounded-r-xl'
                  : 'text-[#7E8D91] hover:bg-[#101917] hover:text-[#F3F1E8] border-l-4 border-transparent rounded-r-xl',
                'group flex items-center px-4 py-2.5 [@media(min-height:700px)]:py-3 text-sm font-semibold transition-all duration-200'
              )}
            >
              <Icon
                className={clsx(
                  isActive ? 'text-[#12C98B]' : 'text-[#7E8D91] group-hover:text-[#F3F1E8]',
                  'h-5 w-5 flex-shrink-0'
                )}
              />
              <span className="ml-3">{item.name}</span>
              {item.href === '/admin/requests' && openRequests > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                  {openRequests}
                </span>
              )}
              {item.href === '/notices' && unreadNotices > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#12C98B]/20 text-[#12C98B] text-[10px] font-black flex items-center justify-center">
                  {unreadNotices}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/5 px-6 py-4 [@media(min-height:700px)]:py-6 bg-[#091411]">
        <div className="flex items-center mb-3 [@media(min-height:700px)]:mb-6">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#12C98B]/20 flex items-center justify-center text-[#12C98B] font-black border border-[#12C98B]/30">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-bold text-[#F3F1E8] leading-none truncate">{profile.name}</p>
            <p className="text-[10px] text-[#7E8D91] mt-1 uppercase tracking-widest">{profile.role}</p>
          </div>
        </div>
        {!isAdmin && (
          <Link
            href="/settings"
            className={clsx(
              pathname === '/settings' ? 'bg-[#12C98B]/10 text-[#F3F1E8]' : 'text-[#7E8D91] hover:bg-[#101917] hover:text-[#F3F1E8]',
              'group flex w-full items-center rounded-xl px-3 py-3 mb-1 text-sm font-bold transition-all'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            <span className="ml-3">Settings</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-xl px-3 py-3 text-sm font-bold text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
}
