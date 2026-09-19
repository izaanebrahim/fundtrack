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
  History, 
  Settings,
  Users,
  LogOut,
  Landmark
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

const clientNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Fund Performance', href: '/fund-performance', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'NAV History', href: '/nav-history', icon: History },
  { name: 'Portfolio Holdings', href: '/holdings', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Manage Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Manage Holdings', href: '/admin/holdings', icon: Briefcase },
  { name: 'Fund Performance', href: '/fund-performance', icon: TrendingUp },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'NAV History', href: '/admin/nav-history', icon: History },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  if (!profile) return null;

  const navigation = profile.role === 'admin' ? adminNav : clientNav;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-[#07100E] border-r border-white/5 text-[#7E8D91]">
      <div className="flex h-20 items-center justify-between px-6 border-b border-white/5">
        <Link href={navigation[0].href} className="w-full flex items-center justify-start cursor-pointer transition-opacity hover:opacity-80">
          <img src="/logo-wide-transparent.png" alt="Barakah Capital" className="w-[170px] h-auto object-contain" />
        </Link>
        <button 
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-white lg:hidden font-bold"
        >
          X
        </button>
      </div>
      
      <nav className="flex-1 space-y-2 px-3 py-6">
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
                'group flex items-center px-4 py-3 text-sm font-semibold transition-all duration-200'
              )}
            >
              <Icon
                className={clsx(
                  isActive ? 'text-[#12C98B]' : 'text-[#7E8D91] group-hover:text-[#F3F1E8]',
                  'h-5 w-5 flex-shrink-0'
                )}
              />
              <span className="ml-3">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-6 bg-[#091411]">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-[#12C98B]/20 flex items-center justify-center text-[#12C98B] font-black border border-[#12C98B]/30">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-bold text-[#F3F1E8] leading-none">{profile.name}</p>
            <p className="text-[10px] text-[#7E8D91] mt-1 uppercase tracking-widest">{profile.role}</p>
          </div>
        </div>
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
