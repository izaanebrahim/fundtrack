'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Transactions() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    async function fetchTransactions() {
      if (!profile) return;
      setLoading(true);
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .eq('client_id', profile.id)
          .order('created_at', { ascending: false });

        if (typeFilter !== 'ALL') {
          query = query.eq('type', typeFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [profile, typeFilter]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 animate-pulse"></div>
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 h-96 animate-pulse"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8]">Transactions</h1>
          <p className="text-[#7E8D91] text-sm font-medium mt-1">Your investment and withdrawal history</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-1.5">
           <button 
             onClick={() => setTypeFilter('ALL')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'ALL' ? 'bg-white/10 text-[#F3F1E8]' : 'text-[#7E8D91] hover:text-[#F3F1E8]'}`}
           >
             All
           </button>
           <button 
             onClick={() => setTypeFilter('INVEST')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'INVEST' ? 'bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20' : 'text-[#7E8D91] hover:text-[#F3F1E8]'}`}
           >
             Investments
           </button>
           <button 
             onClick={() => setTypeFilter('WITHDRAW')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'WITHDRAW' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-[#7E8D91] hover:text-[#F3F1E8]'}`}
           >
             Withdrawals
           </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-5 transition-all hover:border-[#12C98B]/20">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                t.type === 'INVEST' ? 'bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {t.type}
              </span>
              <span className="text-[#7E8D91] text-[10px] font-bold">{format(new Date(t.created_at), 'dd MMM yyyy')}</span>
            </div>
            <div className={`text-2xl font-black tracking-tighter mb-3 ${t.type === 'INVEST' ? 'text-[#12C98B]' : 'text-red-400'}`}>
              {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#7E8D91] font-bold uppercase tracking-widest block mb-1">NAV</span>
                <span className="text-[#F3F1E8] font-black">₹{Number(t.nav_at_transaction).toFixed(4)}</span>
              </div>
              <div>
                <span className="text-[#7E8D91] font-bold uppercase tracking-widest block mb-1">Units</span>
                <span className="text-[#F3F1E8] font-black">{Number(t.units).toFixed(4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#7E8D91]">
            <thead className="bg-black/20 text-[10px] uppercase text-[#7E8D91] font-black tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-5">Status & Date</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5 text-right">Applied NAV</th>
                <th className="px-6 py-5 text-right">Units</th>
                <th className="px-6 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[#F3F1E8] font-bold mb-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#12C98B] mr-2 shadow-sm shadow-[#12C98B]/50"></span>
                        Completed
                      </span>
                      <span className="text-[#7E8D91] text-[10px] font-bold">{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      t.type === 'INVEST' ? 'bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-[#7E8D91]">
                    ₹{Number(t.nav_at_transaction).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-5 text-right text-[#7E8D91] font-bold">
                    {Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className={`px-6 py-5 text-right font-black text-lg ${t.type === 'INVEST' ? 'text-[#12C98B]' : 'text-red-400'}`}>
                    {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ArrowLeftRight className="w-12 h-12 text-gray-700 mb-4" />
                      <p className="text-[#7E8D91] text-lg font-black">No transactions found</p>
                      <p className="text-[#7E8D91] text-sm mt-1">Your investment and withdrawal history will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Empty State */}
      {transactions.length === 0 && (
        <div className="lg:hidden bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-700 mb-4 mx-auto" />
          <p className="text-[#7E8D91] text-lg font-black">No transactions found</p>
          <p className="text-[#7E8D91] text-sm mt-1">Your history will appear here.</p>
        </div>
      )}
    </div>
  );
}
