'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function NavHistory() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchFundData(); }, [profile]);

  async function fetchFundData() {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('fund').select('id, date, nav').order('date', { ascending: false });
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="glass-card h-96 animate-pulse max-w-4xl mx-auto"></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white">NAV History</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">Official historical Net Asset Value of one fund unit</p>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <History className="w-4 h-4 text-emerald-400" /> Historical NAV Prices
          </h2>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{history.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-[10px] uppercase text-gray-500 font-black tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5 text-right">NAV per Unit</th>
                <th className="px-6 py-5 text-right">1D Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((record, i) => {
                const prevNav = history[i + 1]?.nav;
                const change = prevNav ? record.nav - prevNav : null;
                const changePct = prevNav && prevNav > 0 ? (change / prevNav) * 100 : null;
                return (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-gray-300 font-bold">{format(new Date(record.date), 'dd MMMM yyyy')}</td>
                    <td className="px-6 py-4 text-right font-black text-white text-base">₹{Number(record.nav).toFixed(4)}</td>
                    <td className="px-6 py-4 text-right">
                      {changePct !== null ? (
                        <span className={`text-xs font-black ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-600">No NAV history available.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
