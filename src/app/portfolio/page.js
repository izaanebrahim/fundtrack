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
    pnlPercentage: 0,
    dayChange: 0,
    dayChangePct: 0,
  });

  useEffect(() => {
    async function fetchPortfolio() {
      if (!profile) return;
      setLoading(true);
      try {
        // Fetch live NAV from holdings
        const { data: holdings } = await supabase.from('holdings').select('quantity, current_price');
        const liveAum = holdings?.reduce((sum, h) => sum + (h.quantity * h.current_price), 0) || 0;
        const { data: allTx } = await supabase.from('transactions').select('type, units');
        let systemUnits = 0;
        allTx?.forEach(t => {
          if (t.type === 'INVEST') systemUnits += Number(t.units);
          else if (t.type === 'WITHDRAW') systemUnits -= Number(t.units);
        });
        const liveNav = systemUnits > 0 ? liveAum / systemUnits : 10;

        // Fetch previous NAV for 1-day change
        const { data: navHistory } = await supabase
          .from('fund')
          .select('nav')
          .order('date', { ascending: false })
          .limit(2);
        const prevNav = navHistory?.[1]?.nav || liveNav;
        const dayChange = liveNav - prevNav;
        const dayChangePct = prevNav > 0 ? (dayChange / prevNav) * 100 : 0;

        // Fetch user tx
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('client_id', profile.id)
          .order('created_at', { ascending: true });

        let units = 0;
        let invested = 0;
        txs?.forEach(t => {
          if (t.type === 'INVEST') { 
            units += Number(t.units); 
            invested += Number(t.amount); 
          } else if (t.type === 'WITHDRAW') { 
            const avgNav = units > 0 ? (invested / units) : 0;
            units -= Number(t.units); 
            invested -= Number(t.units) * avgNav; 
          }
        });

        // Clamp: if fully exited, both should be 0
        if (units <= 0.0001) { units = 0; invested = 0; }
        if (invested < 0) invested = 0;

        const value = units * liveNav;
        const avgNav = units > 0 ? (invested / units) : 0;
        const pnl = value - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

        setData({ totalUnits: units, currentNav: liveNav, averageNav: avgNav, investedAmount: invested, portfolioValue: value, profitLoss: pnl, pnlPercentage: pnlPct, dayChange, dayChangePct });
      } catch (error) {
        console.error("Error loading portfolio:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, [profile]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 h-48 animate-pulse"></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 h-36 animate-pulse"></div>
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 h-36 animate-pulse"></div>
      </div>
    </div>
  );

  const isProfit = data.profitLoss >= 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8]">My Portfolio</h1>
        <p className="text-[#7E8D91] text-sm font-medium mt-1">Detailed breakdown of your investments</p>
      </div>

      {/* Hero Card */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-8 relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(0,245,160,0.05) 0%, rgba(22,27,27,0.8) 100%)'}}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#12C98B]/5 rounded-full blur-[80px]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-3">Current Portfolio Value</p>
            <h2 className="text-4xl font-black tracking-tighter text-[#F3F1E8] mb-3">₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            <div className={`flex items-center gap-2 text-sm font-black ${isProfit ? 'text-[#12C98B]' : 'text-red-400'}`}>
               {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
               {data.profitLoss > 0 ? '+' : ''}₹{data.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({data.pnlPercentage.toFixed(2)}%)
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold mt-1 ${data.dayChangePct >= 0 ? 'text-[#12C98B]/80' : 'text-red-500/80'}`}>
              {data.dayChangePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              Today: {data.dayChangePct >= 0 ? '+' : ''}{data.dayChangePct.toFixed(2)}% ({data.dayChangePct >= 0 ? '+' : ''}₹{(data.dayChange * data.totalUnits).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
            <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-3">Total Amount Invested</p>
            <h2 className="text-3xl font-black tracking-tighter text-gray-200">₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
            <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-3">Total Units Held</p>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-black tracking-tighter text-[#12C98B]">{data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</h2>
              <span className="text-[#7E8D91] mb-1 text-xs font-bold uppercase tracking-wider">units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-6">NAV Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 transition-all hover:border-[#12C98B]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-[#7E8D91]">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center"><IndianRupee className="w-4 h-4" /></div>
                <span className="text-xs font-black uppercase tracking-widest">Average NAV (Your Cost)</span>
              </div>
              <span className="text-[#F3F1E8] font-black text-xl">₹{data.averageNav.toFixed(4)}</span>
            </div>
            <p className="text-xs text-[#7E8D91] font-medium">Weighted average cost at which you accumulated your units.</p>
          </div>

          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 transition-all hover:border-[#12C98B]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-[#7E8D91]">
                <div className="h-8 w-8 rounded-lg bg-[#12C98B]/10 flex items-center justify-center text-[#12C98B]"><TrendingUp className="w-4 h-4" /></div>
                <span className="text-xs font-black uppercase tracking-widest">Current Live NAV</span>
              </div>
              <span className="text-[#12C98B] font-black text-xl">₹{data.currentNav.toFixed(4)}</span>
            </div>
            <p className="text-xs text-[#7E8D91] font-medium">Current market value of one unit of the fund.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
