'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Layers, PieChart as PieIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import AllocationChart from '@/components/AllocationChart';
import Link from 'next/link';

export default function Dashboard() {
  const { user, profile } = useAuth();
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

        // Clamp: if fully exited, both should be 0
        if (totalUnits <= 0) { totalUnits = 0; investedAmount = 0; }
        if (investedAmount < 0) investedAmount = 0;

        const currentNav = totalSystemUnits > 0 ? (liveAum / totalSystemUnits) : 10;
        const portfolioValue = totalUnits * currentNav;
        const profitLoss = portfolioValue - investedAmount;
        const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

        const { data: lastNavData } = await supabase
          .from('fund')
          .select('nav')
          .order('date', { ascending: false })
          .limit(2);
        
        const lastOfficialNav = lastNavData?.[1]?.nav || lastNavData?.[0]?.nav || currentNav;
        const navChange = currentNav - lastOfficialNav;
        const navChangePercentage = lastOfficialNav > 0 ? (navChange / lastOfficialNav) * 100 : 0;

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

        setData({ totalUnits, currentNav, investedAmount, portfolioValue, profitLoss, profitLossPercentage, navChange, navChangePercentage, categoryData, sectorData });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const isProfit = data.profitLoss >= 0;
  const isDayUp = data.navChange >= 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 glass-card animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 glass-card animate-pulse"></div>
          <div className="h-64 glass-card animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 glass-card animate-pulse"></div>
          <div className="h-48 glass-card animate-pulse"></div>
          <div className="h-48 glass-card animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Hello, {profile?.name?.split(' ')[0] || 'Investor'}</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Here's your investment overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transactions" className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
            History
          </Link>
          <div className="px-4 py-2 glass-card text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {format(new Date(), 'dd MMM yyyy')}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Portfolio Balance & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 relative overflow-hidden h-full flex flex-col justify-between" 
               style={{ background: 'linear-gradient(135deg, rgba(0,245,160,0.08) 0%, rgba(13,17,17,0.9) 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-[50px] -mr-10 -mt-10"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Balance</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-4xl font-black text-white tracking-tighter mb-4">
                ₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isProfit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {isProfit ? '+' : ''}{data.profitLossPercentage.toFixed(2)}% Total
                </div>
                <div className={`text-[10px] font-bold ${isDayUp ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                  {isDayUp ? '+' : ''}{data.navChangePercentage.toFixed(2)}% today
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-black font-black text-xs rounded-xl uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                <ArrowUpRight className="w-4 h-4" /> Invest
              </button>
              <button className="flex items-center justify-center gap-2 py-3 glass-card border-white/10 text-white font-black text-xs rounded-xl uppercase tracking-widest hover:bg-white/5 transition-all">
                <ArrowDownLeft className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Middle/Right Column: Market & Asset Allocation */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Market Card */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current NAV</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white tracking-tighter mb-2">
                ₹{data.currentNav.toFixed(4)}
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fund Performance Index</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Units Held</p>
                <p className="text-lg font-black text-white tracking-tight">{data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Total Invested</p>
                <p className="text-lg font-black text-white tracking-tight">₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Allocation Donut */}
          <div className="glass-card overflow-hidden">
            <AllocationChart data={data.categoryData} title="Asset Mix" hideTitle />
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Sector Allocation</h3>
          <PieIcon className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {data.sectorData.slice(0, 6).map((s, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 truncate">{s.name}</span>
                <span className="text-[10px] font-black text-emerald-400">
                  {data.portfolioValue > 0 ? ((s.value / data.portfolioValue) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${data.portfolioValue > 0 ? (s.value / data.portfolioValue * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
          {data.sectorData.length === 0 && (
            <p className="text-xs font-semibold text-gray-500 col-span-full">No sector allocation data available.</p>
          )}
        </div>
      </div>

    </div>
  );
}
