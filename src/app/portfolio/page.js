'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Briefcase, IndianRupee, Layers, TrendingUp, TrendingDown } from 'lucide-react';

export default function Portfolio() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalUnits: 0,
    currentNav: 0,
    averageNav: 0,
    investedAmount: 0,
    portfolioValue: 0,
    profitLoss: 0,
    pnlPercentage: 0
  });

  useEffect(() => {
    async function fetchPortfolio() {
      if (!profile) return;
      setLoading(true);
      try {
        // Fetch current NAV
        const { data: fundData } = await supabase
          .from('fund')
          .select('nav')
          .order('date', { ascending: false })
          .limit(1)
          .single();
        const currentNav = fundData?.nav || 0;

        // Fetch user tx
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('client_id', profile.id);

        let units = 0;
        let invested = 0;

        // Simplistic weighted average calculation for MVP
        if (txs && txs.length > 0) {
          txs.forEach(t => {
            if (t.type === 'INVEST') {
              units += Number(t.units);
              invested += Number(t.amount);
            } else if (t.type === 'WITHDRAW') {
              units -= Number(t.units);
              invested -= Number(t.amount); 
            }
          });
        }

        const value = units * currentNav;
        const avgNav = units > 0 ? (invested / units) : 0;
        const pnl = value - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

        setData({
          totalUnits: units,
          currentNav,
          averageNav: avgNav,
          investedAmount: invested,
          portfolioValue: value,
          profitLoss: pnl,
          pnlPercentage: pnlPct
        });

      } catch (error) {
        console.error("Error loading portfolio:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [profile]);

  if (loading) return <div className="text-gray-400">Loading portfolio...</div>;

  const isProfit = data.profitLoss >= 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
        <Briefcase className="mr-3 text-indigo-400" />
        My Portfolio Details
      </h1>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900/30 to-gray-900 border border-indigo-500/20 rounded-2xl p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-gray-400 text-sm font-medium mb-1">Current Value</p>
            <h2 className="text-4xl font-bold text-white mb-2">₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            <div className={`flex items-center text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
               {isProfit ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
               {data.profitLoss > 0 ? '+' : ''}₹{data.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({data.pnlPercentage.toFixed(2)}%)
            </div>
          </div>

          <div className="md:border-l md:border-gray-800 md:pl-8">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Amount Invested</p>
            <h2 className="text-3xl font-semibold text-gray-200">₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
          </div>

          <div className="md:border-l md:border-gray-800 md:pl-8">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Units Held</p>
             <div className="flex items-end">
                <h2 className="text-3xl font-semibold text-indigo-400">{data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</h2>
                <span className="text-gray-500 ml-2 mb-1 text-sm font-medium">units</span>
             </div>
          </div>
        </div>
      </div>

      {/* Break down */}
      <h3 className="text-lg font-medium text-white mb-4">Allocation & Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-start">
           <div className="flex items-center justify-between w-full mb-4">
              <span className="text-gray-400 font-medium flex items-center"><IndianRupee className="w-4 h-4 mr-2" /> Average NAV (Cost)</span>
              <span className="text-white font-semibold text-xl">₹{data.averageNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</span>
           </div>
           <p className="text-sm text-gray-500">This is the weighted average cost at which you accumulated your units.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-start">
           <div className="flex items-center justify-between w-full mb-4">
              <span className="text-gray-400 font-medium flex items-center"><Layers className="w-4 h-4 mr-2" /> Current Live NAV</span>
              <span className="text-emerald-400 font-semibold text-xl">₹{data.currentNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</span>
           </div>
           <p className="text-sm text-gray-500">The current market value of one unit of the fund.</p>
        </div>
      </div>
    </div>
  );
}
