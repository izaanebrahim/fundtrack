'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MessageCircle, ArrowUpRight, ArrowDownLeft, Inbox, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { computeClientPosition } from '@/lib/portfolio';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_STYLES, formatRequestAmount, whatsappLink } from '@/lib/requests';
import BalanceChart from '@/components/BalanceChart';

const inr = (value, digits = 2) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: digits })}`;

function Stat({ label, value, sub, tone }) {
  return (
    <div className="min-w-0 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-4 sm:p-5">
      <p className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-[length:clamp(1rem,4.6vw,1.5rem)] font-black tracking-tight break-words ${tone || 'text-[#F3F1E8]'}`}>{value}</p>
      {sub && <p className="text-[10px] font-bold text-[#7E8D91] mt-1">{sub}</p>}
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [navHistory, setNavHistory] = useState([]);
  const [liveNav, setLiveNav] = useState(0);
  const [systemUnits, setSystemUnits] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile || profile.role !== 'admin' || !id) return;

    async function fetchClient() {
      try {
        const [clientRes, txRes, requestRes, holdingsRes, allTxRes, fundRes] = await Promise.all([
          supabase.from('clients').select('*').eq('id', id).single(),
          supabase.from('transactions').select('*').eq('client_id', id).order('created_at', { ascending: false }),
          supabase.from('requests').select('*').eq('client_id', id).order('created_at', { ascending: false }),
          supabase.from('holdings').select('quantity, current_price'),
          supabase.from('transactions').select('type, units'),
          supabase.from('fund').select('date, nav').order('date', { ascending: true }),
        ]);
        if (clientRes.error) throw clientRes.error;

        const aum = holdingsRes.data?.reduce((sum, h) => sum + h.quantity * h.current_price, 0) || 0;
        let units = 0;
        allTxRes.data?.forEach(t => {
          if (t.type === 'INVEST') units += Number(t.units);
          else if (t.type === 'WITHDRAW') units -= Number(t.units);
        });

        setClient(clientRes.data);
        setTransactions(txRes.data || []);
        setRequests(requestRes.data || []);
        setNavHistory(fundRes.data || []);
        setSystemUnits(units);
        setLiveNav(units > 0 ? aum / units : 10);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError(err.message || 'Could not load this client.');
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [profile, id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-[#101917] rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#101917] border border-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-72 bg-[#101917] border border-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Link href="/admin/clients" className="inline-flex items-center text-sm text-[#7E8D91] hover:text-[#F3F1E8]">
          <ArrowLeft className="w-4 h-4 mr-2" /> All clients
        </Link>
        <p className="text-red-300">{error || 'Client not found.'}</p>
      </div>
    );
  }

  const { units, invested, averageNav } = computeClientPosition(transactions);
  const value = units * liveNav;
  const pnl = value - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const share = systemUnits > 0 ? (units / systemUnits) * 100 : 0;
  const totalDeposited = transactions.filter(t => t.type === 'INVEST').reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter(t => t.type === 'WITHDRAW').reduce((s, t) => s + Number(t.amount), 0);
  const firstInvestment = transactions.reduce((min, t) => (!min || new Date(t.created_at) < new Date(min) ? t.created_at : min), null);
  const whatsapp = whatsappLink(client.phone);
  const recordHref = (type) => `/admin/transactions?${new URLSearchParams({ client: client.id, type }).toString()}`;

  return (
    <div className="space-y-8 pb-10">
      <Link href="/admin/clients" className="inline-flex items-center text-sm font-semibold text-[#7E8D91] hover:text-[#F3F1E8]">
        <ArrowLeft className="w-4 h-4 mr-2" /> All clients
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-[#12C98B]/15 flex items-center justify-center text-[#12C98B] text-xl font-black border border-[#12C98B]/30">
            {client.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#F3F1E8] break-words">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#7E8D91]">
              <span className="break-all">{client.email}</span>
              <span>{client.phone || 'No phone provided'}</span>
              {client.created_at && <span>Joined {format(new Date(client.created_at), 'dd MMM yyyy')}</span>}
              {firstInvestment && <span>First investment {format(new Date(firstInvestment), 'dd MMM yyyy')}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center px-3 py-2 bg-white/5 hover:bg-white/10 text-[#F3F1E8] text-xs font-bold rounded-lg border border-white/10">
              <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
            </a>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-2 bg-white/5 hover:bg-white/10 text-[#F3F1E8] text-xs font-bold rounded-lg border border-white/10">
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
            </a>
          )}
          <a href={`mailto:${client.email}`} className="flex items-center px-3 py-2 bg-white/5 hover:bg-white/10 text-[#F3F1E8] text-xs font-bold rounded-lg border border-white/10">
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
          </a>
          <Link href={recordHref('INVEST')} className="flex items-center px-3 py-2 bg-[#12C98B] text-black text-xs font-black rounded-lg">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" /> Record Investment
          </Link>
          <Link href={recordHref('WITHDRAW')} className="flex items-center px-3 py-2 bg-white/5 hover:bg-white/10 text-[#F3F1E8] text-xs font-bold rounded-lg border border-white/10">
            <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" /> Record Withdrawal
          </Link>
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Stat label="Current Value" value={inr(value)} sub={`at live NAV ₹${liveNav.toFixed(4)}`} />
        <Stat label="Units Held" value={units.toLocaleString('en-IN', { maximumFractionDigits: 4 })} sub={`${share.toFixed(2)}% of the fund`} />
        <Stat label="Avg Buy NAV" value={`₹${averageNav.toFixed(4)}`} />
        <Stat label="Invested (cost)" value={inr(invested, 0)} sub={`Deposited ${inr(totalDeposited, 0)} · Withdrawn ${inr(totalWithdrawn, 0)}`} />
        <Stat
          label="Profit / Loss"
          value={`${pnl >= 0 ? '+' : '-'}${inr(Math.abs(pnl), 0)}`}
          sub={`${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
          tone={pnl >= 0 ? 'text-[#12C98B]' : 'text-red-400'}
        />
      </div>

      {transactions.length > 0 && (
        <BalanceChart transactions={transactions} navHistory={navHistory} liveNav={liveNav} title="Balance Over Time" />
      )}

      {/* Transactions */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center gap-3">
            <ArrowLeftRight className="w-4 h-4 text-[#12C98B]" /> Transactions
          </h2>
          <span className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest">{transactions.length} total</span>
        </div>
        {/* Mobile: one card per transaction */}
        <div className="sm:hidden divide-y divide-white/5">
          {transactions.map(t => (
            <div key={t.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.type === 'INVEST' ? 'bg-[#12C98B]/10 text-[#12C98B]' : 'bg-red-500/10 text-red-400'}`}>
                  {t.type === 'INVEST' ? 'Invest' : 'Withdraw'}
                </span>
                <span className="text-[#F3F1E8] font-bold text-sm">{inr(t.amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 mt-2 text-xs text-[#7E8D91]">
                <span>{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                <span className="text-right">
                  {Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })} units
                  {t.nav_at_transaction ? ` @ ₹${Number(t.nav_at_transaction).toFixed(4)}` : ''}
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="px-4 py-10 text-center text-sm text-[#7E8D91]">No transactions yet.</p>}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-[10px] uppercase text-[#7E8D91] font-black tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">NAV</th>
                <th className="px-6 py-4 text-right">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-[#7E8D91] font-bold whitespace-nowrap">{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.type === 'INVEST' ? 'bg-[#12C98B]/10 text-[#12C98B]' : 'bg-red-500/10 text-red-400'}`}>
                      {t.type === 'INVEST' ? 'Invest' : 'Withdraw'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[#F3F1E8] font-bold">{inr(t.amount)}</td>
                  <td className="px-6 py-4 text-right text-[#7E8D91]">{t.nav_at_transaction ? `₹${Number(t.nav_at_transaction).toFixed(4)}` : '—'}</td>
                  <td className="px-6 py-4 text-right text-[#7E8D91]">{Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[#7E8D91]">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
          <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center gap-3">
            <Inbox className="w-4 h-4 text-[#12C98B]" /> Requests
          </h2>
          <Link href="/admin/requests" className="text-[10px] font-black text-[#12C98B] uppercase tracking-widest whitespace-nowrap hover:underline">Open Requests page</Link>
        </div>
        <div className="divide-y divide-white/5">
          {requests.map(r => (
            <div key={r.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#F3F1E8]">
                  {r.type === 'INVEST' ? 'Invest' : 'Withdraw'} · {formatRequestAmount(r)}
                </p>
                <p className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest mt-0.5">
                  Sent {format(new Date(r.created_at), 'dd MMM yyyy')}
                </p>
                {r.note && <p className="text-xs text-[#7E8D91] mt-1 break-words">Client: {r.note}</p>}
                {r.admin_note && <p className="text-xs text-[#7E8D91] mt-1">Your note: {r.admin_note}</p>}
              </div>
              <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${REQUEST_STATUS_STYLES[r.status] || REQUEST_STATUS_STYLES.PENDING}`}>
                {REQUEST_STATUS_LABELS[r.status] || r.status}
              </span>
            </div>
          ))}
          {requests.length === 0 && <p className="text-xs font-semibold text-[#7E8D91] py-2">No requests from this client.</p>}
        </div>
      </div>
    </div>
  );
}
