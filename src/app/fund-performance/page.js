'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import FundPerformanceChart from '@/components/FundPerformanceChart';
import { Info } from 'lucide-react';

export default function FundPerformance() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [liveNav, setLiveNav] = useState(10);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch live NAV
        const { data: holdings } = await supabase.from('holdings').select('quantity, current_price');
        const liveAum = holdings?.reduce((sum, h) => sum + (h.quantity * h.current_price), 0) || 0;
        const { data: transactions } = await supabase.from('transactions').select('type, units');
        let liveUnits = 0;
        if (transactions) {
          transactions.forEach(t => {
            if (t.type === 'INVEST') liveUnits += Number(t.units);
            else if (t.type === 'WITHDRAW') liveUnits -= Number(t.units);
          });
        }
        const currentLiveNav = liveUnits > 0 ? liveAum / liveUnits : 10;
        setLiveNav(currentLiveNav);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-12 w-80 bg-[#101917] rounded-xl animate-pulse"></div>
      <div className="bg-[#101917] h-96 rounded-[16px] animate-pulse"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <FundPerformanceChart liveNav={liveNav} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-[#12C98B]/30 hover:shadow-[0_0_30px_rgba(18,201,139,0.05)] hover:-translate-y-[2px]">
          <div className="w-3 h-3 rounded-full bg-[#12C98B] mt-1.5 shadow-[0_0_10px_#12C98B] flex-shrink-0"></div>
          <div>
            <p className="text-[#F3F1E8] font-black text-sm mb-1">Your Fund</p>
            <p className="text-[#7E8D91] text-xs font-medium">Real-time performance based on live portfolio holdings.</p>
          </div>
        </div>
        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-[#7E8D91]/30 hover:-translate-y-[2px]">
          <div className="w-3 h-3 rounded-full bg-[#7E8D91] mt-1.5 flex-shrink-0" style={{boxShadow: '0 0 8px #7E8D91'}}></div>
          <div>
            <p className="text-[#F3F1E8] font-black text-sm mb-1">Nifty 50 Index</p>
            <p className="text-[#7E8D91] text-xs font-medium">Market benchmark for relative performance comparison.</p>
          </div>
        </div>
        <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 flex items-center gap-3 transition-all">
          <Info className="w-5 h-5 flex-shrink-0 text-[#7E8D91]" />
          <p className="text-[#7E8D91] text-xs font-medium italic">Fund shows actual NAV. Benchmark is scaled to match fund's starting NAV for visual comparison.</p>
        </div>
      </div>
    </div>
  );
}
