'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Briefcase, PieChart, Info } from 'lucide-react';

export default function ClientHoldings() {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);
  
  useEffect(() => {
    async function fetchHoldings() {
      try {
        const { data, error } = await supabase
          .from('holdings')
          .select('*')
          .order('current_price', { ascending: false });
        if (error) throw error;
        setHoldings(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchHoldings();
  }, []);

  if (loading) return <div className="text-gray-400">Loading fund transparency data...</div>;

  const totalAUM = holdings.reduce((sum, h) => sum + (h.quantity * h.current_price), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
          <Briefcase className="mr-3 text-indigo-400" />
          Fund Holdings & Transparency
        </h1>
        <div className="text-right">
           <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Total Assets Under Management</p>
           <p className="text-2xl font-bold text-white">₹{totalAUM.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-xl p-4 flex items-start text-sm text-indigo-200">
        <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          This page shows the real-time breakdown of our portfolio. We maintain a transparent model so you always know exactly where your capital is deployed.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
             <h2 className="text-lg font-semibold text-white">Current Portfolio Assets</h2>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-950/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-800">
                   <tr>
                     <th className="px-6 py-4">Asset</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4 text-right">CMP (₹)</th>
                     <th className="px-6 py-4 text-right">Weight (%)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                   {holdings.map(h => {
                     const weight = totalAUM > 0 ? ((h.quantity * h.current_price) / totalAUM) * 100 : 0;
                     return (
                       <tr key={h.id} className="hover:bg-gray-800/30">
                         <td className="px-6 py-4">
                            <span className="font-medium text-white">{h.name}</span>
                         </td>
                         <td className="px-6 py-4 text-xs font-mono text-gray-500 uppercase">{h.category}</td>
                         <td className="px-6 py-4 text-right font-semibold text-gray-300">
                            {Number(h.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <span className="font-bold text-indigo-400">{weight.toFixed(2)}%</span>
                              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500" style={{ width: `${weight}%` }}></div>
                              </div>
                           </div>
                         </td>
                       </tr>
                     );
                   })}
                   {holdings.length === 0 && (
                     <tr><td colSpan="4" className="text-center py-12 text-gray-600">No holdings information available.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Small Summary Side Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
                 <PieChart className="w-5 h-5 mr-2 text-indigo-400" /> Allocation Breakdown
              </h2>
              <div className="space-y-4">
                {['Equity', 'Cash', 'Debt', 'Gold'].map(cat => {
                   const catSum = holdings.filter(h => h.category === cat).reduce((s, h) => s + (h.quantity * h.current_price), 0);
                   const catPct = totalAUM > 0 ? (catSum / totalAUM) * 100 : 0;
                   if (catSum === 0) return null;
                   return (
                     <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
                           <span className="text-gray-400">{cat}</span>
                           <span className="text-white">{catPct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500" style={{ width: `${catPct}%` }}></div>
                        </div>
                     </div>
                   );
                })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
