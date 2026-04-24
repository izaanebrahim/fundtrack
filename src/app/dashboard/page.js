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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-28"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Main Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <IndianRupee className="w-4 h-4 mr-1" />
                Portfolio Value
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                ₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {data.profitLoss > 0 ? '+' : ''}₹{data.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({data.profitLossPercentage.toFixed(2)}%)
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <IndianRupee className="w-4 h-4 mr-1" />
                Total Invested
              </div>
              <div className="text-2xl font-semibold text-white">
                ₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <Layers className="w-4 h-4 mr-1" />
                Total Units Held
              </div>
              <div className="text-2xl font-semibold text-indigo-400">
                {data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                Current NAV
              </div>
              <div className="text-2xl font-semibold text-white mb-2">
                ₹{data.currentNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
              </div>
              <div className={`flex items-center text-sm font-medium ${data.navChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.navChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {data.navChange > 0 ? '+' : ''}{data.navChange.toFixed(4)} ({data.navChangePercentage.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Diversification Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <AllocationChart data={data.categoryData} title="Fund Asset Allocation" />
            <AllocationChart data={data.sectorData} title="Fund Sector Diversification" />
          </div>

          <div className="mt-8 p-6 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                 <PieIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-medium">Detailed Analytics Available</h3>
                <p className="text-gray-400 text-sm">Visit the Fund Performance tab for detailed historical tracking.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
