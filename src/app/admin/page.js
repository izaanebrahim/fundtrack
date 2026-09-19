'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Users, Landmark, FileText, IndianRupee, ArrowRight } from 'lucide-react';
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
          .limit(2);
        
        const lastOfficialNav = lastNavData?.[1]?.nav || lastNavData?.[0]?.nav || liveNav;
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
     return <div className="space-y-8">
        <div className="h-10 w-72 bg-[#101917] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#101917] rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-96 bg-[#101917] rounded-[16px] animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[#101917] rounded-[16px] animate-pulse"></div>
          <div className="h-80 bg-[#101917] rounded-[16px] animate-pulse"></div>
        </div>
      </div>
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8]">Portfolio Overview</h1>
          <p className="text-[#7E8D91] text-sm font-medium mt-1">Fund management overview</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 transition-all hover:border-[#12C98B]/20 shadow-sm shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#7E8D91] uppercase tracking-widest">Total AUM</span>
            <IndianRupee className="w-4 h-4 text-[#12C98B]" />
          </div>
          <div className="text-3xl font-black text-[#F3F1E8] tracking-tighter">
            ₹{data.totalAum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 transition-all hover:border-[#D6B875]/20 shadow-sm shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#7E8D91] uppercase tracking-widest">Current NAV</span>
            <Landmark className="w-4 h-4 text-[#D6B875]" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-[#F3F1E8] tracking-tighter">
              ₹{data.currentNav.toFixed(4)}
            </div>
          </div>
          <div className={`mt-1 text-xs font-bold ${data.navChange >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
            {data.navChange >= 0 ? '+' : ''}{data.navChangePercentage.toFixed(2)}% today
          </div>
        </div>

        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10 shadow-sm shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#7E8D91] uppercase tracking-widest">Total Units</span>
            <FileText className="w-4 h-4 text-[#7E8D91]" />
          </div>
          <div className="text-3xl font-black text-[#F3F1E8] tracking-tighter">
            {data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10 shadow-sm shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#7E8D91] uppercase tracking-widest">Total Clients</span>
            <Users className="w-4 h-4 text-[#7E8D91]" />
          </div>
          <div className="text-3xl font-black text-[#F3F1E8] tracking-tighter">
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
        <h2 className="text-xs font-black text-[#7E8D91] uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/transactions" className="bg-[#101917] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-white/[0.02] hover:border-white/10 group shadow-sm shadow-black/20">
             <div className="h-10 w-10 rounded-xl bg-[#12C98B]/10 flex items-center justify-center text-[#12C98B] flex-shrink-0 group-hover:bg-[#12C98B]/20 transition-colors">
               <IndianRupee className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <span className="text-[#F3F1E8] font-bold text-sm block">Manage Transactions</span>
               <span className="text-[#7E8D91] text-xs font-medium mt-0.5 block">Add investments & withdrawals</span>
             </div>
             <ArrowRight className="w-4 h-4 text-[#7E8D91] group-hover:text-[#F3F1E8] transition-colors" />
          </Link>
          
          <Link href="/admin/fund" className="bg-[#101917] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-white/[0.02] hover:border-white/10 group shadow-sm shadow-black/20">
             <div className="h-10 w-10 rounded-xl bg-[#D6B875]/10 flex items-center justify-center text-[#D6B875] flex-shrink-0 group-hover:bg-[#D6B875]/20 transition-colors">
               <Landmark className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <span className="text-[#F3F1E8] font-bold text-sm block">Update Fund / NAV</span>
               <span className="text-[#7E8D91] text-xs font-medium mt-0.5 block">Record daily fund values</span>
             </div>
             <ArrowRight className="w-4 h-4 text-[#7E8D91] group-hover:text-[#F3F1E8] transition-colors" />
          </Link>

          <Link href="/admin/clients" className="bg-[#101917] border border-white/5 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-white/[0.02] hover:border-white/10 group shadow-sm shadow-black/20">
             <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#7E8D91] flex-shrink-0 group-hover:bg-white/10 group-hover:text-[#F3F1E8] transition-colors">
               <Users className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <span className="text-[#F3F1E8] font-bold text-sm block">Manage Clients</span>
               <span className="text-[#7E8D91] text-xs font-medium mt-0.5 block">View & manage accounts</span>
             </div>
             <ArrowRight className="w-4 h-4 text-[#7E8D91] group-hover:text-[#F3F1E8] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
