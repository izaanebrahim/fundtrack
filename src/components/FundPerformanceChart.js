'use client';

import { Calendar, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subMonths, subYears, isAfter } from 'date-fns';

export default function FundPerformanceChart({ liveNav }) {
  const [loading, setLoading] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('ALL'); 
  const [benchmarkError, setBenchmarkError] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch official fund history
        const { data: history, error: historyError } = await supabase
          .from('fund')
          .select('date, nav')
          .order('date', { ascending: true });

        if (historyError) throw historyError;

        const fundPoints = history.map(d => ({
          date: d.date,
          nav: Number(d.nav),
        }));

        // Add today's live NAV point if passed
        if (liveNav) {
          const todayStr = new Date().toISOString().split('T')[0];
          const existingTodayIndex = fundPoints.findIndex(p => p.date === todayStr);
          if (existingTodayIndex >= 0) {
            fundPoints[existingTodayIndex].nav = liveNav;
          } else {
            fundPoints.push({ date: todayStr, nav: liveNav });
          }
        }

        setAllHistory(fundPoints);

        // 2. Fetch Nifty 50 Benchmark
        try {
          const startDate = subYears(new Date(), 3).toISOString().split('T')[0];
          const res = await fetch(`/api/market/benchmark?symbol=%5ENSEI&start=${startDate}`);
          const bench = await res.json();
          if (bench.quotes && bench.quotes.length > 0) {
            setBenchmarkData(bench.quotes.map(q => ({
              date: new Date(q.date).toISOString().split('T')[0],
              price: q.close
            })));
            setBenchmarkError(false);
          } else {
            setBenchmarkError(true);
          }
        } catch (benchErr) {
          console.warn('Benchmark fetch failed:', benchErr);
          setBenchmarkError(true);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [liveNav]);

  const chartData = useMemo(() => {
    if (allHistory.length === 0) return [];
    
    let cutoffDate = null;
    const now = new Date();
    if (selectedRange === '1M') cutoffDate = subMonths(now, 1);
    else if (selectedRange === '6M') cutoffDate = subMonths(now, 6);
    else if (selectedRange === '1Y') cutoffDate = subYears(now, 1);
    else if (selectedRange === '3Y') cutoffDate = subYears(now, 3);

    let filteredFund = allHistory;
    
    if (selectedRange === 'CUSTOM') {
      if (customStartDate) filteredFund = filteredFund.filter(d => d.date >= customStartDate);
      if (customEndDate) filteredFund = filteredFund.filter(d => d.date <= customEndDate);
    } else if (cutoffDate) {
      filteredFund = filteredFund.filter(d => isAfter(new Date(d.date), cutoffDate));
    }

    if (filteredFund.length === 0) return [];

    const fundBase = filteredFund[0].nav;
    const benchmarkVisible = benchmarkData.filter(b => b.date >= filteredFund[0].date);
    const benchmarkBase = benchmarkVisible.length > 0 ? benchmarkVisible[0].price : 0;

    return filteredFund.map(f => {
       const bPoint = benchmarkData.find(b => b.date === f.date);
       const lastBPoint = bPoint || benchmarkData.filter(b => b.date <= f.date).slice(-1)[0];
       
       const benchmarkRebased = (lastBPoint && benchmarkBase > 0)
         ? ((lastBPoint.price / benchmarkBase) * fundBase).toFixed(4)
         : null;
       
       return {
         date: f.date,
         formattedDate: format(new Date(f.date), 'dd MMM yy'),
         fund: Number(f.nav.toFixed(4)),
         benchmark: benchmarkRebased ? Number(benchmarkRebased) : null,
         rawNav: f.nav
       };
    });
  }, [allHistory, benchmarkData, selectedRange, customStartDate, customEndDate]);

  const periodReturn = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].rawNav;
    const last = chartData[chartData.length - 1].rawNav;
    return ((last - first) / first) * 100;
  }, [chartData]);

  const dayChange = useMemo(() => {
    if (allHistory.length < 2) return { value: 0, pct: 0 };
    const sorted = [...allHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = sorted[0].nav;
    const yesterday = sorted[1].nav;
    const value = today - yesterday;
    const pct = yesterday > 0 ? (value / yesterday) * 100 : 0;
    return { value, pct };
  }, [allHistory]);

  if (loading) return (
    <div className="space-y-6 w-full">
      <div className="h-12 w-80 bg-[#101917] rounded-xl animate-pulse"></div>
      <div className="bg-[#101917] rounded-[16px] h-96 animate-pulse"></div>
    </div>
  );

  const ranges = ['1M', '6M', '1Y', '3Y', 'ALL', 'CUSTOM'];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-4">Fund Performance</h2>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-4xl font-black tracking-tighter text-white">₹{liveNav ? liveNav.toFixed(4) : '---'}</h1>
            <div className="flex flex-col">
              <span className={`text-lg font-black ${periodReturn >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
                {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">{selectedRange} Return</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black ${dayChange.pct >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
                {dayChange.pct >= 0 ? '+' : ''}{dayChange.pct.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">1D Change</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="bg-[#101917] border border-white/5 p-1 rounded-2xl flex items-center gap-1">
             {ranges.map(range => (
               <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    selectedRange === range 
                      ? 'bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20' 
                      : 'text-[#7E8D91] hover:text-[#F3F1E8] border border-transparent'
                  }`}
               >
                 {range}
               </button>
             ))}
          </div>
          {selectedRange === 'CUSTOM' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 [color-scheme:dark]"
              />
              <span className="text-[#7E8D91] text-xs">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 [color-scheme:dark]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#101917] border border-white/5 rounded-[16px] p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#12C98B]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="h-96 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12C98B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#12C98B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7E8D91" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7E8D91" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="transparent" tick={{fill: '#7E8D91', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={['auto', 'auto']} stroke="transparent" tick={{fill: '#7E8D91', fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#091411', 
                  borderColor: 'rgba(255,255,255,0.08)', 
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  padding: '12px 16px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                labelStyle={{ color: '#7E8D91', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}
              />
              <Area type="monotone" dataKey="fund" stroke="#12C98B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFund)" name="Fund NAV" dot={false} />
              {!benchmarkError && <Area type="monotone" dataKey="benchmark" stroke="#7E8D91" strokeWidth={2} strokeDasharray="6 3" fill="url(#colorBench)" name="Nifty 50" dot={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
