'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useMemo } from 'react';
import { Landmark, TrendingUp, History, IndianRupee, Layers, Calendar } from 'lucide-react';
import { format, subMonths, subYears, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ManageFund() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [liveStats, setLiveStats] = useState({ aum: 0, units: 0, nav: 10 });
  const [selectedRange, setSelectedRange] = useState('ALL');

  useEffect(() => {
    fetchFundData();
  }, [profile]);

  async function fetchFundData() {
    if (!profile || profile.role !== 'admin') return;
    setLoading(true);
    try {
      // 1. Fetch official history
      const { data, error } = await supabase
        .from('fund')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);

      // 2. Fetch live stats for comparison
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

      setLiveStats({
        aum: liveAum,
        units: liveUnits,
        nav: liveUnits > 0 ? liveAum / liveUnits : 10
      });

    } catch (error) {
      console.error("Error fetching fund data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Combine history for chart (old to new)
  const chartHistory = useMemo(() => {
    const data = [...history].reverse().map(h => ({
      date: h.date,
      nav: Number(h.nav),
      formattedDate: format(new Date(h.date), 'dd MMM yy')
    }));

    // Add live point
    return [...data, {
      date: new Date().toISOString().split('T')[0],
      nav: liveStats.nav,
      formattedDate: 'Today'
    }];
  }, [history, liveStats.nav]);

  const filteredData = useMemo(() => {
    if (chartHistory.length === 0) return [];
    let cutoffDate = null;
    const now = new Date();
    if (selectedRange === '1M') cutoffDate = subMonths(now, 1);
    else if (selectedRange === '6M') cutoffDate = subMonths(now, 6);
    else if (selectedRange === '1Y') cutoffDate = subYears(now, 1);
    else if (selectedRange === '3Y') cutoffDate = subYears(now, 3);
    
    if (!cutoffDate) return chartHistory;
    return chartHistory.filter(d => isAfter(new Date(d.date), cutoffDate));
  }, [chartHistory, selectedRange]);

  const periodReturn = useMemo(() => {
    if (filteredData.length < 2) return 0;
    const first = filteredData[0].nav;
    const last = filteredData[filteredData.length - 1].nav;
    return ((last - first) / first) * 100;
  }, [filteredData]);

  if (loading) return <div className="text-[#F3F1E8] p-8 font-medium animate-pulse">Fetching live analytics...</div>;

  const ranges = ['1M', '6M', '1Y', '3Y', 'ALL'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
          <Landmark className="mr-3 text-[#12C98B]" />
          Fund Analytics & History
        </h1>
        
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-1 rounded-lg flex items-center">
           {ranges.map(range => (
             <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
                  selectedRange === range 
                  ? 'bg-indigo-600 text-[#F3F1E8] shadow-lg' 
                  : 'text-[#7E8D91] hover:text-[#F3F1E8]'
                }`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      {/* Hero Performance Chart */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
         <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-bold text-[#F3F1E8]">₹{liveStats.nav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</h2>
            <span className={`text-lg font-bold ${periodReturn >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
              {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}% <span className="text-sm font-medium text-[#7E8D91] ml-1">in {selectedRange}</span>
            </span>
         </div>

         <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={filteredData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="formattedDate" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: '#818cf8' }} />
                  <Area type="monotone" dataKey="nav" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" animationDuration={1000} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Live Status Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 shadow-sm">
             <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center">
               <TrendingUp className="w-4 h-4 mr-2" /> Live Stats
             </h2>
             <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#7E8D91] mb-1">Total AUM</p>
                  <p className="text-lg font-semibold text-gray-200">₹{liveStats.aum.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E8D91] mb-1">Active Units</p>
                  <p className="text-lg font-semibold text-gray-200">{liveStats.units.toLocaleString('en-IN')}</p>
                </div>
             </div>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-3">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center">
                 <History className="w-5 h-5 mr-3 text-[#7E8D91]" /> Published NAV Audit Logs
               </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#7E8D91]">
                <thead className="bg-gray-950/50 text-xs uppercase text-[#7E8D91] font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Publish Date</th>
                    <th className="px-6 py-4 text-right">AUM at Sync</th>
                    <th className="px-6 py-4 text-right">Units at Sync</th>
                    <th className="px-6 py-4 text-right text-[#F3F1E8]">Published NAV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#7E8D91]">
                        {format(new Date(record.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ₹{Number(record.total_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {Number(record.total_units).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#12C98B] text-base">
                        ₹{Number(record.nav).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                      </td>
                    </tr>
                  ))}
                  
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[#7E8D91] italic">
                        No official history snapshots yet. Go to Manage Holdings to sync your first NAV record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
