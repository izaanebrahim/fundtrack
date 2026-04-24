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
      <div className="h-10 w-64 glass-card animate-pulse"></div>
      <div className="glass-card h-96 animate-pulse"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Transactions</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Your investment and withdrawal history</p>
        </div>
        
        <div className="flex items-center gap-2 glass-card p-1.5">
           <button 
             onClick={() => setTypeFilter('ALL')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'ALL' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
           >
             All
           </button>
           <button 
             onClick={() => setTypeFilter('INVEST')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'INVEST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
           >
             Investments
           </button>
           <button 
             onClick={() => setTypeFilter('WITHDRAW')}
             className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'WITHDRAW' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-500 hover:text-white'}`}
           >
             Withdrawals
           </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 lg:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="glass-card p-5 glass-card-hover">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                t.type === 'INVEST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {t.type}
              </span>
              <span className="text-gray-500 text-[10px] font-bold">{format(new Date(t.created_at), 'dd MMM yyyy')}</span>
            </div>
            <div className={`text-2xl font-black tracking-tighter mb-3 ${t.type === 'INVEST' ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-600 font-bold uppercase tracking-widest block mb-1">NAV</span>
                <span className="text-white font-black">₹{Number(t.nav_at_transaction).toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-600 font-bold uppercase tracking-widest block mb-1">Units</span>
                <span className="text-white font-black">{Number(t.units).toFixed(4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="glass-card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-black/20 text-[10px] uppercase text-gray-500 font-black tracking-widest border-b border-white/5">
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
                      <span className="text-white font-bold mb-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50"></span>
                        Completed
                      </span>
                      <span className="text-gray-600 text-[10px] font-bold">{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      t.type === 'INVEST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-300">
                    ₹{Number(t.nav_at_transaction).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-5 text-right text-gray-300 font-bold">
                    {Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className={`px-6 py-5 text-right font-black text-lg ${t.type === 'INVEST' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ArrowLeftRight className="w-12 h-12 text-gray-700 mb-4" />
                      <p className="text-gray-400 text-lg font-black">No transactions found</p>
                      <p className="text-gray-600 text-sm mt-1">Your investment and withdrawal history will appear here.</p>
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
        <div className="lg:hidden glass-card p-12 text-center">
          <ArrowLeftRight className="w-12 h-12 text-gray-700 mb-4 mx-auto" />
          <p className="text-gray-400 text-lg font-black">No transactions found</p>
          <p className="text-gray-600 text-sm mt-1">Your history will appear here.</p>
        </div>
      )}
    </div>
  );
}
