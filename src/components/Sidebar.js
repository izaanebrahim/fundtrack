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
    <div className="flex h-screen w-64 flex-col bg-gray-900 border-r border-gray-800 text-gray-300">
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-widest uppercase">FundTrack</h1>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white lg:hidden font-bold"
        >
          X
        </button>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors'
              )}
            >
              <Icon
                className={clsx(
                  isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300',
                  'mr-3 h-5 w-5 flex-shrink-0'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{profile.name}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}
