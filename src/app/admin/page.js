'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Users, Landmark, FileText, IndianRupee, PieChart as PieIcon } from 'lucide-react';
import Link from 'next/link';
import AllocationChart from '@/components/AllocationChart';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState({
    totalAum: 0,
    totalClients: 0,
    currentNav: 0,
    totalUnits: 0,
    navChange: 0,
    navChangePercentage: 0,
    categoryData: [],
    sectorData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      if (!profile || profile.role !== 'admin') return;
      
      try {
        // 1. Fetch live Total AUM from holdings
        const { data: holdingsData } = await supabase.from('holdings').select('quantity, current_price, category, sector');
        const liveAum = holdingsData?.reduce((sum, h) => sum + (h.quantity * h.current_price), 0) || 0;

        // 2. Fetch live Total Units from transactions
        const { data: txData } = await supabase.from('transactions').select('type, units');
        let liveUnits = 0;
        if (txData) {
          txData.forEach(t => {
            if (t.type === 'INVEST') liveUnits += Number(t.units);
            else if (t.type === 'WITHDRAW') liveUnits -= Number(t.units);
          });
        }

        // 3. Fetch total clients
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client');

        const liveNav = liveUnits > 0 ? (liveAum / liveUnits) : 10;

        // 3.5 Fetch latest official NAV for 1-day change
        const { data: lastNavData } = await supabase
          .from('fund')
          .select('nav')
          .order('date', { ascending: false })
          .limit(1);
        
        const lastOfficialNav = lastNavData?.[0]?.nav || liveNav;
        const navChange = liveNav - lastOfficialNav;
        const navChangePercentage = lastOfficialNav > 0 ? (navChange / lastOfficialNav) * 100 : 0;

        // 4. Prepare Allocation Data
        const categoryMap = {};
        const sectorMap = {};

        holdingsData?.forEach(h => {
          const value = h.quantity * h.current_price;
          // Category
          categoryMap[h.category] = (categoryMap[h.category] || 0) + value;
          // Sector
          const sector = h.sector || 'Others / Cash';
          sectorMap[sector] = (sectorMap[sector] || 0) + value;
        });

        const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
        const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

        setData({
          totalAum: liveAum,
          totalClients: clientsCount || 0,
          currentNav: liveNav,
          totalUnits: liveUnits,
          navChange,
          navChangePercentage,
          categoryData,
          sectorData,
        });

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [profile]);

  if (loading) {
     return <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <IndianRupee className="w-4 h-4 mr-1" />
            Total AUM
          </div>
          <div className="text-3xl font-bold text-white">
            ₹{data.totalAum.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <Landmark className="w-4 h-4 mr-1" />
            Current NAV
          </div>
          <div className="text-3xl font-bold text-indigo-400">
            ₹{data.currentNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <FileText className="w-4 h-4 mr-1" />
            Total Units
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
            <Users className="w-4 h-4 mr-1" />
            Total Clients
          </div>
          <div className="text-3xl font-bold text-white">
            {data.totalClients}
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart data={data.categoryData} title="Asset Allocation" />
        <AllocationChart data={data.sectorData} title="Sector Diversification" />
      </div>

      {/* Action shortcuts */}
      <div>
        <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/transactions" className="flex flex-col items-center justify-center p-8 bg-indigo-900/20 border border-indigo-500/30 rounded-xl hover:bg-indigo-900/40 transition-colors">
             <IndianRupee className="w-8 h-8 text-indigo-400 mb-3" />
             <span className="text-indigo-100 font-medium">Add/Manage Transactions</span>
          </Link>
          
          <Link href="/admin/fund" className="flex flex-col items-center justify-center p-8 bg-emerald-900/20 border border-emerald-500/30 rounded-xl hover:bg-emerald-900/40 transition-colors">
             <Landmark className="w-8 h-8 text-emerald-400 mb-3" />
             <span className="text-emerald-100 font-medium">Update Fund Value / NAV</span>
          </Link>

          <Link href="/admin/clients" className="flex flex-col items-center justify-center p-8 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:bg-blue-900/40 transition-colors">
             <Users className="w-8 h-8 text-blue-400 mb-3" />
             <span className="text-blue-100 font-medium">Manage Clients</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
