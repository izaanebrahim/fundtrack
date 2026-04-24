'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, Search, Filter } from 'lucide-react';
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

  if (loading) return <div className="text-gray-400">Loading transactions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
          <ArrowLeftRight className="mr-3 text-indigo-400" />
          Transaction History
        </h1>
        
        <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
           <button 
             onClick={() => setTypeFilter('ALL')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === 'ALL' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
           >
             All
           </button>
           <button 
             onClick={() => setTypeFilter('INVEST')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === 'INVEST' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'text-gray-400 hover:text-white'}`}
           >
             Investments
           </button>
           <button 
             onClick={() => setTypeFilter('WITHDRAW')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === 'WITHDRAW' ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'text-gray-400 hover:text-white'}`}
           >
             Withdrawals
           </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Status & Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Applied NAV</th>
                <th className="px-6 py-4 text-right">Units Allocated/Redeemed</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium mb-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Completed
                      </span>
                      <span className="text-gray-500 text-xs">{format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      t.type === 'INVEST' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-300">
                    ₹{Number(t.nav_at_transaction).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-300">
                    {Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold text-lg ${t.type === 'INVEST' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ArrowLeftRight className="w-12 h-12 text-gray-700 mb-4" />
                      <p className="text-gray-400 text-lg">No transactions found</p>
                      <p className="text-gray-500 text-sm mt-1">Your investment and withdrawal history will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
