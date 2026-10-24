'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Layers, PieChart as PieIcon, ArrowUpRight, ArrowDownLeft, Inbox, Megaphone, Pin, Send, PhoneCall, BadgeCheck } from 'lucide-react';
import { format } from 'date-fns';
import AllocationChart from '@/components/AllocationChart';
import { computeClientPosition } from '@/lib/portfolio';
import RequestModal from '@/components/RequestModal';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_STYLES, formatRequestAmount } from '@/lib/requests';
import Link from 'next/link';
import BalanceChart from '@/components/BalanceChart';
import { sortNotices } from '@/lib/notices';

export default function Dashboard() {
  const { user, profile } = useAuth();
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
  const [requestType, setRequestType] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsVersion, setRequestsVersion] = useState(0);
  const [userTransactions, setUserTransactions] = useState([]);
  const [navHistory, setNavHistory] = useState([]);
  const [latestNotice, setLatestNotice] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function fetchLatestNotice() {
      const { data: noticeData, error } = await supabase
        .from('notices')
        .select('id, title, body, pinned, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.error('Error fetching notices:', error);
        return;
      }
      setLatestNotice(sortNotices(noticeData || [])[0] || null);
    }

    fetchLatestNotice();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchRequests() {
      const { data: requestData, error } = await supabase
        .from('requests')
        .select('id, type, amount, withdraw_all, status, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }
      setRequests(requestData || []);
    }

    fetchRequests();
  }, [user, requestsVersion]);

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

        const { units: totalUnits, invested: investedAmount } = computeClientPosition(userTransactions || []);

        const currentNav = totalSystemUnits > 0 ? (liveAum / totalSystemUnits) : 10;
        const portfolioValue = totalUnits * currentNav;
        const profitLoss = portfolioValue - investedAmount;
        const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

        const { data: fundHistory } = await supabase
          .from('fund')
          .select('date, nav')
          .order('date', { ascending: true });
        const history = fundHistory || [];

        const lastOfficialNav = history[history.length - 2]?.nav || history[history.length - 1]?.nav || currentNav;
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

        setUserTransactions(userTransactions || []);
        setNavHistory(history);
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
  const dayChangeAmount = data.totalUnits * data.navChange;
  const isNewClient = userTransactions.length === 0;
  const totalSectorValue = data.sectorData.reduce((sum, s) => sum + s.value, 0);

  const sortedSectors = [...data.sectorData].sort((a, b) => b.value - a.value);
  let displaySectors = [];
  if (sortedSectors.length <= 5) {
    displaySectors = sortedSectors;
  } else {
    displaySectors = sortedSectors.slice(0, 5);
    const othersValue = sortedSectors.slice(5).reduce((sum, s) => sum + s.value, 0);
    displaySectors.push({ name: 'Others', value: othersValue });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
          <div className="h-64 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
          <div className="h-48 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
          <div className="h-48 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8]">Hello, {profile?.name?.split(' ')[0] || 'Investor'}</h1>
          <p className="text-[#7E8D91] text-sm font-medium mt-1">
            {isNewClient ? 'Welcome aboard. Here is how to get started.' : "Here's your investment overview for today."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transactions" className="px-4 py-2 bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#12C98B]/20 transition-all">
            History
          </Link>
          <div className="px-4 py-2 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">
            {format(new Date(), 'dd MMM yyyy')}
          </div>
        </div>
      </div>

      {latestNotice && (
        <Link href="/notices" className="block bg-[#101917] border border-[#12C98B]/20 rounded-2xl shadow-sm shadow-black/20 p-5 hover:border-[#12C98B]/40 transition-all">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-[#12C98B]/10 flex items-center justify-center text-[#12C98B]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-[#12C98B] uppercase tracking-widest">Manager&apos;s Notice</span>
                {latestNotice.pinned && <Pin className="w-3 h-3 text-[#12C98B]" />}
                <span className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest ml-auto flex-shrink-0">
                  {format(new Date(latestNotice.created_at), 'dd MMM yyyy')}
                </span>
              </div>
              <p className="text-sm font-bold text-[#F3F1E8] truncate">{latestNotice.title}</p>
              <p className="text-xs text-[#7E8D91] mt-1 line-clamp-2 whitespace-pre-line">{latestNotice.body}</p>
            </div>
          </div>
        </Link>
      )}

      {isNewClient ? (
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-8 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, rgba(0,245,160,0.08) 0%, rgba(13,17,17,0.9) 100%)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#12C98B]/10 rounded-full blur-[60px] -mr-10 -mt-10"></div>
          <h2 className="text-2xl font-black tracking-tight text-[#F3F1E8] relative">
            Welcome to Barakah Capital, {profile?.name?.split(' ')[0] || 'Investor'}
          </h2>
          <p className="text-sm text-[#7E8D91] mt-2 max-w-xl relative">
            You have not invested yet. Your first investment takes three simple steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 relative">
            {[
              { icon: Send, title: 'Send a request', text: 'Tap Invest below and tell us how much you would like to invest.' },
              { icon: PhoneCall, title: 'We contact you', text: 'The fund manager gets in touch with payment details.' },
              { icon: BadgeCheck, title: 'Units are allotted', text: 'Once the money arrives, you receive units at that day\'s NAV.' },
            ].map((step, i) => (
              <div key={step.title} className="bg-black/20 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-[#12C98B]/10 flex items-center justify-center text-[#12C98B]">
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest">Step {i + 1}</span>
                </div>
                <p className="text-sm font-bold text-[#F3F1E8]">{step.title}</p>
                <p className="text-xs text-[#7E8D91] mt-1">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 relative">
            <button onClick={() => setRequestType('INVEST')} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#12C98B] text-black font-black text-xs rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-[#12C98B]/20">
              <ArrowUpRight className="w-4 h-4" /> Invest
            </button>
            <span className="text-xs text-[#7E8D91]">
              Current NAV: <span className="text-[#F3F1E8] font-bold">₹{data.currentNav.toFixed(4)}</span>
            </span>
          </div>
        </div>
      ) : (
      <>
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Portfolio Balance & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-8 relative overflow-hidden h-full flex flex-col justify-between" 
               style={{ background: 'linear-gradient(135deg, rgba(0,245,160,0.08) 0%, rgba(13,17,17,0.9) 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#12C98B]/10 rounded-full blur-[50px] -mr-10 -mt-10"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest">Current Balance</span>
                <div className="h-8 w-8 rounded-xl bg-[#12C98B]/10 flex items-center justify-center text-[#12C98B]">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              
              <div className="text-4xl font-black text-[#F3F1E8] tracking-tighter mb-4">
                ₹{data.portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isProfit ? 'bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {isProfit ? '+' : ''}{data.profitLossPercentage.toFixed(2)}% Total
                </div>
                <div className={`text-[10px] font-bold ${isDayUp ? 'text-[#12C98B]/60' : 'text-red-500/60'}`}>
                  {isDayUp ? '+' : ''}{data.navChangePercentage.toFixed(2)}% ({isDayUp ? '+' : '-'}₹{Math.abs(dayChangeAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}) today
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => setRequestType('INVEST')} className="flex items-center justify-center gap-2 py-3 bg-[#12C98B] text-black font-black text-xs rounded-xl uppercase tracking-widest hover:bg-[#12C98B] transition-all shadow-lg shadow-[#12C98B]/20">
                <ArrowUpRight className="w-4 h-4" /> Invest
              </button>
              <button onClick={() => setRequestType('WITHDRAW')} disabled={data.portfolioValue <= 0} title={data.portfolioValue <= 0 ? 'You have no balance to withdraw yet' : undefined} className="disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 border-white/10 text-[#F3F1E8] font-black text-xs rounded-xl uppercase tracking-widest hover:bg-white/5 transition-all">
                <ArrowDownLeft className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Middle/Right Column: Market & Asset Allocation */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Market Card */}
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest">Current NAV</span>
                <TrendingUp className="w-4 h-4 text-[#12C98B]" />
              </div>
              <div className="text-3xl font-black text-[#F3F1E8] tracking-tighter mb-2">
                ₹{data.currentNav.toFixed(4)}
              </div>
              <p className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">Fund Performance Index</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-1">Units Held</p>
                <p className="text-lg font-black text-[#F3F1E8] tracking-tight">{data.totalUnits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-1">Total Invested</p>
                <p className="text-lg font-black text-[#F3F1E8] tracking-tight">₹{data.investedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Allocation Donut */}
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden">
            <AllocationChart data={data.categoryData} title="Asset Mix" hideTitle />
          </div>
        </div>
      </div>

      <BalanceChart transactions={userTransactions} navHistory={navHistory} liveNav={data.currentNav} />

      {/* Secondary Row */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-[#F3F1E8] uppercase tracking-widest">Sector Allocation</h3>
          <PieIcon className="w-4 h-4 text-[#12C98B]" />
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div 
            className="grid gap-6" 
            style={{ gridTemplateColumns: `repeat(${displaySectors.length}, minmax(130px, 1fr))` }}
          >
            {displaySectors.map((s, i) => (
              <div key={i} className="space-y-2 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold text-[#7E8D91] truncate" title={s.name}>{s.name}</span>
                  <span className="text-[10px] font-black text-[#12C98B] flex-shrink-0">
                    {totalSectorValue > 0 ? ((s.value / totalSectorValue) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#12C98B] rounded-full" 
                    style={{ width: `${totalSectorValue > 0 ? (s.value / totalSectorValue * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {displaySectors.length === 0 && (
              <p className="text-xs font-semibold text-[#7E8D91] col-span-full">No sector allocation data available.</p>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Client Requests */}
      {requests.length > 0 && (
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-[#F3F1E8] uppercase tracking-widest">Your Requests</h3>
            <Inbox className="w-4 h-4 text-[#12C98B]" />
          </div>
          <div className="divide-y divide-white/5">
            {requests.map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#F3F1E8]">
                    {r.type === 'INVEST' ? 'Invest' : 'Withdraw'} · {formatRequestAmount(r)}
                  </p>
                  <p className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest mt-0.5">
                    Sent {format(new Date(r.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${REQUEST_STATUS_STYLES[r.status] || REQUEST_STATUS_STYLES.PENDING}`}>
                  {REQUEST_STATUS_LABELS[r.status] || r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {requestType && (
        <RequestModal
          type={requestType}
          clientId={user.id}
          portfolioValue={data.portfolioValue}
          onClose={() => setRequestType(null)}
          onSubmitted={() => setRequestsVersion(v => v + 1)}
        />
      )}

    </div>
  );
}
