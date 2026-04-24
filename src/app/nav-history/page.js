'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function NavHistory() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchFundData();
  }, [profile]);

  async function fetchFundData() {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fund')
        .select('id, date, nav')
        .order('date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching NAV history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-gray-400">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
          <History className="mr-3 text-indigo-400" />
          Historical NAV Prices
        </h1>
      </div>
      
      <p className="text-gray-400 text-sm">Review the official historical Net Asset Value (NAV) of a single unit of the fund.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950/50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Observation Date</th>
                <th className="px-6 py-4 text-right">Declared NAV per Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-300">
                    {format(new Date(record.date), 'dd MMMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-400 text-base">
                    ₹{Number(record.nav).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                </tr>
              ))}
              
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="2" className="px-6 py-12 text-center text-gray-500">
                    No NAV history is currently available.
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
