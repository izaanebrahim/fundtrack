'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageHoldings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);
  const [syncing, setSyncing] = useState(false);
  
  // Form State
  const [newAsset, setNewAsset] = useState({
     symbol: '',
     name: '',
     category: 'Equity',
     sector: 'Banking & Finance',
     quantity: '',
     avg_cost: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', avg_cost: '', sector: '' });

  useEffect(() => {
    fetchHoldings();
  }, [profile]);

  async function fetchHoldings() {
    if (!profile || profile.role !== 'admin') return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .order('name');
      if (error) throw error;
      setHoldings(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const [verifying, setVerifying] = useState(false);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setMessage({ text: '', type: '' });

    try {
      // 1. Verify symbol exists and get details
      const response = await fetch(`/api/market/verify?symbol=${newAsset.symbol}`);
      const marketData = await response.json();

      if (!response.ok) {
        throw new Error(marketData.error || 'Could not verify ticker symbol.');
      }

      // 2. Insert into Supabase using verified data
      const { error } = await supabase.from('holdings').insert([{
        ...newAsset,
        name: marketData.name, // Auto-fill real name
        quantity: Number(newAsset.quantity),
        avg_cost: Number(newAsset.avg_cost),
        current_price: marketData.price || Number(newAsset.avg_cost)
      }]);
      
      if (error) throw error;
      
      setMessage({ text: `Success: Added ${marketData.name}`, type: 'success' });
      setNewAsset({ symbol: '', name: '', category: 'Equity', quantity: '', avg_cost: '' });
      fetchHoldings();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const deleteHolding = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      const { error } = await supabase.from('holdings').delete().eq('id', id);
      if (error) throw error;
      fetchHoldings();
    } catch (error) {
       alert(error.message);
    }
  };

  const handleEditStart = (h) => {
    setEditingId(h.id);
    setEditForm({
      quantity: h.quantity,
      avg_cost: h.avg_cost,
      sector: h.sector || 'Others / Cash'
    });
  };

  const handleEditSave = async (id) => {
    try {
      const { error } = await supabase
        .from('holdings')
        .update({
          quantity: Number(editForm.quantity),
          avg_cost: Number(editForm.avg_cost),
          sector: editForm.sector
        })
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      setMessage({ text: 'Holding updated successfully', type: 'success' });
      fetchHoldings();
    } catch (error) {
      alert(error.message);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setMessage({ text: '', type: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/sync-nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: session?.access_token })
      });
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Sync failed');
      
      setMessage({ 
        text: `Success! New NAV: ₹${Number(result.nav).toFixed(4)} (AUM: ₹${result.totalValue.toLocaleString('en-IN')})`, 
        type: 'success' 
      });
      fetchHoldings();
    } catch (error) {
       setMessage({ text: error.message, type: 'error' });
    } finally {
       setSyncing(false);
    }
  };

  if (loading) return <div className="text-[#F3F1E8]">Loading holdings...</div>;

  const totalAUM = holdings.reduce((sum, h) => sum + (h.quantity * h.current_price), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
          <Briefcase className="mr-3 text-[#12C98B]" />
          Manage Fund Holdings
        </h1>
        
        <button 
          onClick={triggerSync}
          disabled={syncing || holdings.length === 0}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Market Data...' : 'Sync Prices & Update NAV'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Add Asset Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 shadow-sm">
             <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-6 flex items-center">
               <Plus className="w-5 h-5 mr-2 text-[#12C98B]" /> Add New Asset
             </h2>

             {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start text-sm ${
                message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                {message.text}
              </div>
            )}

             <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Ticker Symbol</label>
                  <input
                    type="text" placeholder="e.g. RELIANCE.NS" required
                    value={newAsset.symbol} onChange={e => setNewAsset({...newAsset, symbol: e.target.value})}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                  />
                  <p className="text-[10px] text-[#7E8D91] mt-1">Use .NS for NSE India stocks</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Asset Name (Optional)</label>
                  <input
                    type="text" placeholder="Auto-fills on verify"
                    value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                  />
                  {!newAsset.name && <p className="text-[10px] text-[#12C98B] mt-1">Leave blank to auto-fetch from market</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Category</label>
                  <select
                    value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                  >
                    <option>Equity</option>
                    <option>Debt</option>
                    <option>Cash</option>
                    <option>Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7E8D91] mb-1">Sector (for Diversification)</label>
                  <select
                    value={newAsset.sector} onChange={e => setNewAsset({...newAsset, sector: e.target.value})}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                  >
                    <optgroup label="Financial Services">
                      <option>Banking & Finance</option>
                      <option>Insurance</option>
                      <option>Non-Banking Financial (NBFC)</option>
                      <option>Financial Services</option>
                    </optgroup>
                    <optgroup label="Technology & Telecom">
                      <option>Information Technology</option>
                      <option>Telecommunication</option>
                      <option>Media & Entertainment</option>
                    </optgroup>
                    <optgroup label="Energy & Industrials">
                      <option>Energy & Power</option>
                      <option>Oil & Gas</option>
                      <option>Metals & Mining</option>
                      <option>Infrastructure & Construction</option>
                      <option>Cement & Building Materials</option>
                      <option>Capital Goods & Engineering</option>
                      <option>Defence & Aerospace</option>
                    </optgroup>
                    <optgroup label="Consumer & Retail">
                      <option>Consumer Goods (FMCG)</option>
                      <option>Consumer Durables</option>
                      <option>Retail & E-Commerce</option>
                      <option>Textiles & Apparel</option>
                      <option>Hotels, Restaurants & Tourism</option>
                    </optgroup>
                    <optgroup label="Healthcare & Life Sciences">
                      <option>Healthcare & Pharma</option>
                      <option>Hospitals & Diagnostics</option>
                    </optgroup>
                    <optgroup label="Auto & Transport">
                      <option>Automobile</option>
                      <option>Auto Components</option>
                      <option>Logistics & Shipping</option>
                    </optgroup>
                    <optgroup label="Materials & Chemicals">
                      <option>Chemicals & Fertilizers</option>
                      <option>Paper & Packaging</option>
                    </optgroup>
                    <optgroup label="Real Assets">
                      <option>Real Estate</option>
                      <option>Agriculture & Allied</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option>ETF / Index Fund</option>
                      <option>Others / Cash</option>
                    </optgroup>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium text-[#7E8D91] mb-1">Quantity</label>
                     <input
                       type="number" step="0.0001" required
                       value={newAsset.quantity} onChange={e => setNewAsset({...newAsset, quantity: e.target.value})}
                       className="w-full px-2 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-[#7E8D91] mb-1">Avg Cost</label>
                     <input
                       type="number" step="0.01" required
                       value={newAsset.avg_cost} onChange={e => setNewAsset({...newAsset, avg_cost: e.target.value})}
                       className="w-full px-2 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] text-sm"
                     />
                   </div>
                </div>
                <button 
                  type="submit" 
                  disabled={verifying}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verifying Ticker...' : 'Add to Holdings'}
                </button>
             </form>
          </div>
        </div>

        {/* Assets List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest">Current Asset Allocation</h2>
               <div className="text-right">
                  <p className="text-xs text-[#7E8D91] uppercase font-bold tracking-wider">Total Calculated AUM</p>
                  <p className="text-2xl font-bold text-[#F3F1E8]">₹{totalAUM.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-[#7E8D91]">
                 <thead className="bg-gray-950/50 text-xs uppercase text-[#7E8D91] font-semibold border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Asset / Ticker</th>
                      <th className="px-6 py-4">Category / Sector</th>
                      <th className="px-6 py-4 text-right">Qty</th>
                      <th className="px-6 py-4 text-right">Avg Cost</th>
                      <th className="px-6 py-4 text-right">CMP</th>
                      <th className="px-6 py-4 text-right">Holding Value</th>
                      <th className="px-6 py-4 text-right">P&L (%)</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {holdings.map(h => {
                      const holdingValue = h.quantity * h.current_price;
                      const costValue = h.quantity * h.avg_cost;
                      const pnl = holdingValue - costValue;
                      const pnlPct = costValue > 0 ? (pnl / costValue) * 100 : 0;

                      const isEditing = h.id === editingId;

                      return (
                        <tr key={h.id} className={`${isEditing ? 'bg-[#12C98B]/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
                          <td className="px-6 py-4">
                            <p className="font-medium text-[#F3F1E8]">{h.name}</p>
                            <p className="text-xs text-[#12C98B] font-mono">{h.symbol}</p>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select
                                value={editForm.sector}
                                onChange={e => setEditForm({ ...editForm, sector: e.target.value })}
                                className="w-full px-2 py-1 bg-gray-950 border border-gray-700 rounded text-xs text-[#F3F1E8]"
                              >
                                <optgroup label="Financial Services">
                                  <option>Banking & Finance</option>
                                  <option>Insurance</option>
                                  <option>Non-Banking Financial (NBFC)</option>
                                  <option>Financial Services</option>
                                </optgroup>
                                <optgroup label="Technology & Telecom">
                                  <option>Information Technology</option>
                                  <option>Telecommunication</option>
                                  <option>Media & Entertainment</option>
                                </optgroup>
                                <optgroup label="Energy & Industrials">
                                  <option>Energy & Power</option>
                                  <option>Oil & Gas</option>
                                  <option>Metals & Mining</option>
                                  <option>Infrastructure & Construction</option>
                                  <option>Cement & Building Materials</option>
                                  <option>Capital Goods & Engineering</option>
                                  <option>Defence & Aerospace</option>
                                </optgroup>
                                <optgroup label="Consumer & Retail">
                                  <option>Consumer Goods (FMCG)</option>
                                  <option>Consumer Durables</option>
                                  <option>Retail & E-Commerce</option>
                                  <option>Textiles & Apparel</option>
                                  <option>Hotels, Restaurants & Tourism</option>
                                </optgroup>
                                <optgroup label="Healthcare & Life Sciences">
                                  <option>Healthcare & Pharma</option>
                                  <option>Hospitals & Diagnostics</option>
                                </optgroup>
                                <optgroup label="Auto & Transport">
                                  <option>Automobile</option>
                                  <option>Auto Components</option>
                                  <option>Logistics & Shipping</option>
                                </optgroup>
                                <optgroup label="Materials & Chemicals">
                                  <option>Chemicals & Fertilizers</option>
                                  <option>Paper & Packaging</option>
                                </optgroup>
                                <optgroup label="Real Assets">
                                  <option>Real Estate</option>
                                  <option>Agriculture & Allied</option>
                                </optgroup>
                                <optgroup label="Other">
                                  <option>ETF / Index Fund</option>
                                  <option>Others / Cash</option>
                                </optgroup>
                              </select>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="w-fit px-2 py-0.5 rounded-full text-[9px] bg-gray-800 border border-gray-700">{h.category}</span>
                                <span className="text-[10px] text-[#7E8D91]">{h.sector || 'N/A'}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {isEditing ? (
                               <input 
                                 type="number" step="0.0001"
                                 className="w-20 px-2 py-1 bg-gray-950 border border-gray-700 rounded text-right text-[#F3F1E8]"
                                 value={editForm.quantity}
                                 onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                               />
                             ) : (
                               <span className="font-mono">{h.quantity}</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {isEditing ? (
                               <input 
                                 type="number" step="0.01"
                                 className="w-24 px-2 py-1 bg-gray-950 border border-gray-700 rounded text-right text-[#F3F1E8]"
                                 value={editForm.avg_cost}
                                 onChange={e => setEditForm({...editForm, avg_cost: e.target.value})}
                               />
                             ) : (
                               <span>₹{h.avg_cost.toLocaleString()}</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#F3F1E8]">₹{h.current_price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-semibold text-[#F3F1E8]">₹{holdingValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td className={`px-6 py-4 text-right font-medium ${pnl >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-right">
                             {isEditing ? (
                               <div className="flex items-center justify-end gap-2">
                                 <button onClick={() => handleEditSave(h.id)} className="text-[#12C98B] hover:text-emerald-300 p-1">
                                   <Check className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => setEditingId(null)} className="text-[#7E8D91] hover:text-[#F3F1E8] p-1">
                                   <X className="w-4 h-4" />
                                 </button>
                               </div>
                             ) : (
                               <div className="flex items-center justify-end gap-2">
                                 <button onClick={() => handleEditStart(h)} className="text-[#7E8D91] hover:text-[#12C98B] transition-colors p-1">
                                   <Pencil className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => deleteHolding(h.id)} className="text-[#7E8D91] hover:text-red-400 transition-colors p-1">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                    {holdings.length === 0 && (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-[#7E8D91] italic">No assets added yet. Add your first stock ticker to begin tracking.</td>
                      </tr>
                    )}
                 </tbody>
               </table>
            </div>
            {holdings.length > 0 && (
              <div className="p-4 bg-black/20 border-t border-white/5 text-[11px] text-[#7E8D91] italic text-right">
                Last globally synced: {holdings[0].last_synced_at ? format(new Date(holdings[0].last_synced_at), 'dd MMM, hh:mm a') : 'Never'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
