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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter text-white">Dashboard</h1>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          Updated: {format(new Date(), 'hh:mm a')}
        </div>
      </div>

      {/* 4 Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-36 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Portfolio Value */}
            <div className="glass-card p-6 glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-[40px] -mr-6 -mt-6"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Portfolio Value</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tighter mb-2">
                ₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isProfit ? '+' : ''}₹{data.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({data.profitLossPercentage.toFixed(2)}%)
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${isDayUp ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                {isDayUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                Today: {isDayUp ? '+' : ''}{data.navChangePercentage.toFixed(2)}%
              </div>
            </div>

            {/* Total Invested */}
            <div className="glass-card p-6 glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-[40px] -mr-6 -mt-6"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Invested</span>
                <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tighter">
                ₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Units Held */}
            <div className="glass-card p-6 glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-[40px] -mr-6 -mt-6"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Units Held</span>
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tighter">
                {data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
              </div>
            </div>

            {/* Current NAV */}
            <div className="glass-card p-6 glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-[40px] -mr-6 -mt-6"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current NAV</span>
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tighter mb-2">
                ₹{data.currentNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
              </div>
              <div className={`text-[10px] font-bold ${isDayUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isDayUp ? '+' : ''}{data.navChangePercentage.toFixed(2)}% today
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AllocationChart data={data.categoryData} title="Asset Allocation" />
            <AllocationChart data={data.sectorData} title="Sector Diversification" />
          </div>

          {/* Bottom Banner */}
          <div className="glass-card p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 flex-shrink-0">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">Detailed Analytics Available</h3>
                <p className="text-gray-500 text-xs font-medium mt-0.5">Visit the Fund Performance tab for detailed historical NAV tracking vs Nifty 50.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
