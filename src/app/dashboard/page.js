'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Layers, PieChart as PieIcon } from 'lucide-react';
import { format } from 'date-fns';
import AllocationChart from '@/components/AllocationChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    totalUnits: 0,
    currentNav: 0,
    investedAmount: 0,
    portfolioValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    navChange: 0,
    navChangePercentage: 0,
    categoryData: [],
    sectorData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      try {
        // Fetch live Total AUM and Units for real-time NAV calculation
        const { data: holdingsData } = await supabase.from('holdings').select('quantity, current_price, category, sector');
        const liveAum = holdingsData?.reduce((sum, h) => sum + (h.quantity * h.current_price), 0) || 0;
        
        const { data: allTxData } = await supabase.from('transactions').select('type, units');
        let totalSystemUnits = 0;
        if (allTxData) {
          allTxData.forEach(t => {
            if (t.type === 'INVEST') totalSystemUnits += Number(t.units);
            else if (t.type === 'WITHDRAW') totalSystemUnits -= Number(t.units);
          });
        }

        // 3. Fetch user-specific transactions to calculate their ownership
        const { data: userTransactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('client_id', user.id);

        let totalUnits = 0;
        let investedAmount = 0;

        if (userTransactions && userTransactions.length > 0) {
          userTransactions.forEach(t => {
            if (t.type === 'INVEST') {
              totalUnits += Number(t.units);
              investedAmount += Number(t.amount);
            } else if (t.type === 'WITHDRAW') {
              totalUnits -= Number(t.units);
              investedAmount -= Number(t.amount);
            }
          });
        }

        const currentNav = totalSystemUnits > 0 ? (liveAum / totalSystemUnits) : 10;
        const portfolioValue = totalUnits * currentNav;
        const profitLoss = portfolioValue - investedAmount;
        const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

        // 3.5 Fetch latest official NAV for 1-day change
        const { data: lastNavData } = await supabase
          .from('fund')
          .select('nav')
          .order('date', { ascending: false })
          .limit(1);
        
        const lastOfficialNav = lastNavData?.[0]?.nav || currentNav;
        const navChange = currentNav - lastOfficialNav;
        const navChangePercentage = lastOfficialNav > 0 ? (navChange / lastOfficialNav) * 100 : 0;

        // 4. Prepare Allocation Data
        const categoryMap = {};
        const sectorMap = {};

        holdingsData?.forEach(h => {
          const value = h.quantity * h.current_price;
          categoryMap[h.category] = (categoryMap[h.category] || 0) + value;
          const sector = h.sector || 'Others / Cash';
          sectorMap[sector] = (sectorMap[sector] || 0) + value;
        });

        const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
        const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

        setData({ 
          totalUnits, 
          currentNav, 
          investedAmount, 
          portfolioValue, 
          profitLoss, 
          profitLossPercentage,
          navChange,
          navChangePercentage,
          categoryData,
          sectorData
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const isProfit = data.profitLoss >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">My Portfolio</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">2024 - 2025 Investment Overview</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 glass-card text-[10px] font-bold uppercase tracking-widest text-gray-400">
             Updated: {format(new Date(), 'hh:mm a')}
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] glass-card animate-pulse"></div>
          <div className="h-[400px] glass-card animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Investment Chart Area */}
            <div className="lg:col-span-2 glass-card p-8 glass-card-hover relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="text-xl font-black text-white tracking-tight">Portfolio Performance</h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maximum</span>
                    <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">Average</span>
                  </div>
               </div>
               <div className="h-[300px] w-full relative z-10">
                  <AllocationChart data={data.categoryData} hideTitle />
               </div>
            </div>

            {/* Quick Stats Sidebar (Right) */}
            <div className="space-y-6">
               <div className="glass-card p-6 bg-gradient-to-br from-[#1a2e2e]/40 to-transparent border-emerald-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Current Balance</h3>
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                       <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-4xl font-black text-white tracking-tighter mb-2">
                    ₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isProfit ? '+' : ''}{data.profitLossPercentage.toFixed(2)}%
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                     <button className="btn-emerald text-xs py-3">Invest</button>
                     <button className="btn-outline text-xs py-3">Withdraw</button>
                  </div>
               </div>

               <div className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current NAV</p>
                      <p className="text-lg font-black text-white">₹{data.currentNav.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${data.navChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.navChange >= 0 ? '+' : ''}{data.navChangePercentage.toFixed(2)}% Today
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Bottom Left Circle Analytics */}
            <div className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center group glass-card-hover">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 w-full text-left">Asset Mix</h3>
               <div className="relative h-48 w-48 mb-6">
                  <div className="absolute inset-0 rounded-full border-[12px] border-white/5"></div>
                  <div className="absolute inset-0 rounded-full border-[12px] border-emerald-500 border-t-transparent -rotate-45 shadow-[0_0_20px_rgba(0,245,160,0.3)]"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">84%</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Equity</span>
                  </div>
               </div>
               <p className="text-xs font-bold text-emerald-400">Optimized Performance</p>
               <p className="text-[10px] text-gray-500 mt-1">Diversified across 12 sectors</p>
            </div>

            {/* Middle Promotion Card */}
            <div className="lg:col-span-2 glass-card p-8 bg-gradient-to-r from-emerald-600/20 to-transparent flex items-center gap-8 glass-card-hover border-emerald-500/20">
               <div className="hidden sm:block h-32 w-32 bg-white/5 rounded-3xl rotate-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-2 bg-emerald-500/20 rounded-2xl animate-pulse"></div>
               </div>
               <div className="flex-1">
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Unlock Pro Insights</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm">Get access to real-time market signals and deep portfolio analytics.</p>
                  <button className="btn-emerald">Upgrade Account</button>
               </div>
            </div>

            {/* Bottom Right Watch List / Small Metrics */}
            <div className="lg:col-span-1 glass-card p-6 glass-card-hover">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Sector Insights</h3>
                  <PieIcon className="w-4 h-4 text-emerald-400" />
               </div>
               <div className="space-y-4">
                  {data.sectorData.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                         <span className="text-xs font-bold text-gray-300">{s.name}</span>
                      </div>
                      <span className="text-xs font-black text-white">₹{s.value > 100000 ? (s.value/100000).toFixed(1) + 'L' : (s.value/1000).toFixed(1) + 'K'}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
