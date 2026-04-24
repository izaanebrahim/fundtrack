'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Briefcase, PieChart, Info } from 'lucide-react';

export default function ClientHoldings() {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);
  
  useEffect(() => {
    async function fetchHoldings() {
      try {
        const { data, error } = await supabase
          .from('holdings')
          .select('*')
          .order('current_price', { ascending: false });
        if (error) throw error;
        setHoldings(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchHoldings();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-64 glass-card animate-pulse"></div>
      <div className="glass-card h-12 animate-pulse"></div>
      <div className="glass-card h-80 animate-pulse"></div>
    </div>
  );

  const totalAUM = holdings.reduce((sum, h) => sum + (h.quantity * h.current_price), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Fund Holdings</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Full transparency into where your capital is deployed</p>
        </div>
        <div className="glass-card px-6 py-4 text-right">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total AUM</p>
          <p className="text-2xl font-black text-white tracking-tighter">₹{totalAUM.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="glass-card p-4 flex items-start gap-3 border-emerald-500/10" style={{background: 'rgba(0,245,160,0.03)'}}>
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500/70" />
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          We maintain a transparent model so you always know exactly where your capital is deployed. Prices are updated via live market data sync.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Current Portfolio Assets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-[10px] uppercase text-gray-500 font-black tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">CMP (₹)</th>
                  <th className="px-6 py-4 text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {holdings.map(h => {
                  const weight = totalAUM > 0 ? ((h.quantity * h.current_price) / totalAUM) * 100 : 0;
                  return (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-white text-sm">{h.name}</p>
                        <p className="text-[10px] text-emerald-400/70 font-mono font-bold">{h.symbol}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400">{h.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-200">
                        {Number(h.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-black text-emerald-400 text-sm">{weight.toFixed(1)}%</span>
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${weight}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {holdings.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-12 text-gray-600 font-medium">No holdings information available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Allocation Breakdown
            </h2>
            <div className="space-y-5">
              {['Equity', 'Cash', 'Debt', 'Gold'].map(cat => {
                const catSum = holdings.filter(h => h.category === cat).reduce((s, h) => s + (h.quantity * h.current_price), 0);
                const catPct = totalAUM > 0 ? (catSum / totalAUM) * 100 : 0;
                if (catSum === 0) return null;
                const colors = { Equity: '#00f5a0', Cash: '#06b6d4', Debt: '#8b5cf6', Gold: '#f59e0b' };
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-gray-400">{cat}</span>
                      <span className="text-white">{catPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${catPct}%`, background: colors[cat] }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
