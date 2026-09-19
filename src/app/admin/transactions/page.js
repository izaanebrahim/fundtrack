'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageTransactions() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [manualNav, setManualNav] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [currentNav, setCurrentNav] = useState(0);

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [type, setType] = useState('INVEST');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, [profile]);

  async function fetchData() {
    if (!profile || profile.role !== 'admin') return;
    setLoading(true);
    try {
      // Fetch Clients
      const { data: clientsData, error: cError } = await supabase
        .from('clients')
        .select('*')
        .eq('role', 'client')
        .order('name');
      if (cError) throw cError;
      setClients(clientsData || []);

      // Fetch latest NAV
      const { data: fundData } = await supabase
        .from('fund')
        .select('nav')
        .order('date', { ascending: false })
        .limit(1)
        .single();
        
      const latestNav = fundData?.nav || 10;
      setCurrentNav(latestNav);
      setManualNav(latestNav);

      // Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          client:clients(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!selectedClient || !amount || Number(amount) <= 0) {
      setMessage({ text: 'Please fill all fields correctly.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const txAmount = Number(amount);
      let units = 0;

      if (type === 'INVEST') {
        units = txAmount / manualNav;
      } else {
        units = txAmount / manualNav;
      }

      const { error } = await supabase.from('transactions').insert([{
        client_id: selectedClient,
        type: type,
        amount: txAmount,
        nav_at_transaction: manualNav,
        units: units
      }]);

      if (error) throw error;

      // Automated Cash Balancing
      try {
        const { data: cashAsset } = await supabase
          .from('holdings')
          .select('*')
          .eq('symbol', 'CASH')
          .maybeSingle();

        if (cashAsset) {
          // Update existing cash
          const change = type === 'INVEST' ? txAmount : -txAmount;
          await supabase
            .from('holdings')
            .update({ 
               quantity: Number(cashAsset.quantity) + change,
               current_price: 1, // Ensure price stays parity with currency
               avg_cost: 1
            })
            .eq('id', cashAsset.id);
        } else if (type === 'INVEST') {
          // Create cash asset if first investment
          await supabase.from('holdings').insert([{
            symbol: 'CASH',
            name: 'Cash Balance',
            category: 'Cash',
            sector: 'Others / Cash',
            quantity: txAmount,
            avg_cost: 1,
            current_price: 1
          }]);
        }
      } catch (cashErr) {
        console.error("Secondary Cash Update Failed:", cashErr);
        // We don't throw here to avoid failing the transaction record itself, 
        // but we log it for the admin.
      }

      setMessage({ text: `Successfully processed ${type} of ₹${txAmount}. Cash balance updated.`, type: 'success' });
      setAmount('');
      setSelectedClient('');
      fetchData(); // Refresh table
    } catch (error) {
      console.error(error);
      setMessage({ text: error.message || 'Error processing transaction.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction? This will permanently affect the client\'s portfolio and the fund\'s NAV.')) return;
    
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setMessage({ text: 'Transaction deleted successfully.', type: 'success' });
      fetchData();
    } catch (error) {
       console.error(error);
       alert(error.message);
    }
  };

  if (loading) return <div className="text-[#F3F1E8]">Loading data...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
        <ArrowLeftRight className="mr-3 text-[#12C98B]" />
        Manage Transactions
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1 border border-gray-800 bg-gray-900 rounded-xl shadow-sm overflow-hidden sticky top-8 h-fit">
          <div className="p-6 border-b border-white/5 bg-gray-900/50">
            <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest">Record Transaction</h2>
            <div className="mt-2 text-sm text-[#7E8D91] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>System Calculated NAV:</span>
                <span className="text-[#7E8D91] font-mono">₹{Number(currentNav).toFixed(4)}</span>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[11px] font-bold text-[#12C98B] uppercase tracking-wider">NAV to Apply for this Order</label>
                <input 
                  type="number" step="0.0001"
                  className="w-full px-3 py-1.5 bg-gray-950 border border-indigo-500/30 rounded-lg text-[#F3F1E8] font-mono text-lg focus:ring-1 focus:ring-indigo-500"
                  value={manualNav}
                  onChange={(e) => setManualNav(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start text-sm ${
                message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleTransaction} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Select Client</label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
                >
                  <option value="" disabled>-- Select a Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center font-medium transition-colors ${type === 'INVEST' ? 'border-[#12C98B] bg-[#12C98B]/10 text-[#12C98B]' : 'border-gray-700 bg-gray-950 text-[#7E8D91] hover:bg-gray-800'}`}>
                    <input type="radio" value="INVEST" checked={type === 'INVEST'} onChange={() => setType('INVEST')} className="sr-only" />
                    Investment
                  </label>
                  <label className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center font-medium transition-colors ${type === 'WITHDRAW' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-gray-700 bg-gray-950 text-[#7E8D91] hover:bg-gray-800'}`}>
                    <input type="radio" value="WITHDRAW" checked={type === 'WITHDRAW'} onChange={() => setType('WITHDRAW')} className="sr-only" />
                    Withdrawal
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
                />
                {amount && (
                  <p className="text-xs text-[#7E8D91] mt-2">
                    Estimated Layout: <span className="text-[#F3F1E8] font-medium">~{(Number(amount)/manualNav).toFixed(4)} Units</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : `Process ${type === 'INVEST' ? 'Investment' : 'Withdrawal'}`}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5">
               <h2 className="text-xl font-semibold text-[#F3F1E8]">Recent Transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#7E8D91]">
                <thead className="bg-gray-950/50 text-xs uppercase text-[#7E8D91] font-semibold border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Amount (₹)</th>
                    <th className="px-6 py-4 text-right">Units</th>
                    <th className="px-6 py-4 text-right">Applied NAV</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#7E8D91]">
                        {format(new Date(t.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#7E8D91] font-medium">{t.client?.name}</div>
                      </td>
                      <td className="px-6 py-4 flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          t.type === 'INVEST' ? 'bg-emerald-900/30 text-[#12C98B] border border-emerald-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${t.type === 'INVEST' ? 'text-[#12C98B]' : 'text-red-400'}`}>
                        {t.type === 'INVEST' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-[#7E8D91]">
                        {Number(t.units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-6 py-4 text-right text-[#7E8D91]">
                        ₹{Number(t.nav_at_transaction).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1.5 text-[#7E8D91] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#7E8D91]">
                        No transactions recorded yet.
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
