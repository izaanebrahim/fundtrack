'use client';

import { TrendingUp, Calendar, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { format, subMonths, subYears, isAfter } from 'date-fns';

export default function FundPerformance() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allHistory, setAllHistory] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('ALL'); 
  const [liveNav, setLiveNav] = useState(10);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch live NAV (most recent state)
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

        // 2. Fetch official fund history
        const { data: history, error: historyError } = await supabase
          .from('fund')
          .select('date, nav')
          .order('date', { ascending: true });

        if (historyError) throw historyError;

        const fundPoints = history.map(d => ({
          date: d.date,
          nav: Number(d.nav),
        }));

        // Add today point (Live NAV)
        const todayStr = new Date().toISOString().split('T')[0];
        const existingTodayIndex = fundPoints.findIndex(p => p.date === todayStr);
        
        if (existingTodayIndex >= 0) {
          // Replace with live NAV for the most accurate current view
          fundPoints[existingTodayIndex].nav = currentLiveNav;
        } else {
          fundPoints.push({
            date: todayStr,
            nav: currentLiveNav
          });
        }

        setAllHistory(fundPoints);

        // 3. Fetch Benchmark (Nifty 50) - Get 3 years to cover any range
        const startDate = subYears(new Date(), 3).toISOString().split('T')[0];
        const res = await fetch(`/api/market/benchmark?symbol=%5ENSEI&start=${startDate}`);
        const bench = await res.json();
        if (bench.quotes) {
           setBenchmarkData(bench.quotes.map(q => ({
              date: new Date(q.date).toISOString().split('T')[0],
              price: q.close
           })));
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  // Combined and Rebased Data
  const chartData = useMemo(() => {
    if (allHistory.length === 0) return [];
    
    // 1. Determine visible range
    let cutoffDate = null;
    const now = new Date();
    if (selectedRange === '1M') cutoffDate = subMonths(now, 1);
    else if (selectedRange === '6M') cutoffDate = subMonths(now, 6);
    else if (selectedRange === '1Y') cutoffDate = subYears(now, 1);
    else if (selectedRange === '3Y') cutoffDate = subYears(now, 3);

    const filteredFund = cutoffDate 
      ? allHistory.filter(d => isAfter(new Date(d.date), cutoffDate))
      : allHistory;

    if (filteredFund.length === 0) return [];

    // 2. Base values for rebasing (starting at 100)
    const fundBase = filteredFund[0].nav;
    
    // Find closest benchmark date for rebasing
    const benchmarkVisible = benchmarkData.filter(b => b.date >= filteredFund[0].date);
    const benchmarkBase = benchmarkVisible.length > 0 ? benchmarkVisible[0].price : 0;

    // 3. Map to common format
    return filteredFund.map(f => {
       const bPoint = benchmarkData.find(b => b.date === f.date);
       // If exact date not found in benchmark (holidays), find the last available
       const lastBPoint = bPoint || benchmarkData.filter(b => b.date <= f.date).slice(-1)[0];
       
       return {
         date: f.date,
         formattedDate: format(new Date(f.date), 'dd MMM yy'),
         fund: ((f.nav / fundBase) * 100).toFixed(2),
         benchmark: (lastBPoint && benchmarkBase > 0) ? ((lastBPoint.price / benchmarkBase) * 100).toFixed(2) : null,
         rawNav: f.nav
       };
    });
  }, [allHistory, benchmarkData, selectedRange]);

  const periodReturn = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].rawNav;
    const last = chartData[chartData.length - 1].rawNav;
    return ((last - first) / first) * 100;
  }, [chartData]);

  if (loading) return <div className="text-gray-400 p-8 animate-pulse">Analyzing market performance...</div>;

  const ranges = ['1M', '6M', '1Y', '3Y', 'ALL'];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
              <Calendar className="w-4 h-4" />
              Comparative NAV Growth (Rebased to 100)
           </div>
           <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-bold text-white tracking-tight">₹{liveNav.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</h1>
              <span className={`text-xl font-bold ${periodReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {periodReturn >= 0 ? '+' : ''}{periodReturn.toFixed(2)}%
              </span>
           </div>
        </div>

        <div className="bg-gray-900/50 p-1 rounded-lg border border-gray-800 flex items-center">
           {ranges.map(range => (
             <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedRange === range ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
         <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="formattedDate" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="fund" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFund)" name="Fund Growth" />
                  <Area type="monotone" dataKey="benchmark" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Nifty 50" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_10px_#10b981]"></div>
            <div>
               <p className="text-white font-bold text-lg leading-tight">Your Fund</p>
               <p className="text-gray-500 text-sm">Real-time performance based on portfolio holdings.</p>
            </div>
         </div>
         <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1.5 border-2 border-dashed border-white"></div>
            <div>
               <p className="text-white font-bold text-lg leading-tight">Nifty 50 Index</p>
               <p className="text-gray-500 text-sm">Market benchmark for relative comparison.</p>
            </div>
         </div>
         <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl flex items-center gap-3 italic text-gray-500 text-sm">
            <Info className="w-5 h-5 flex-shrink-0" />
            Both assets are scaled to 100 at the start of the timeframe to show relative percentage growth.
         </div>
      </div>
    </div>
  );
}
