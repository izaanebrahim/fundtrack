'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { History, Search, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminNavHistory() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchFundData();
  }, [profile]);

  async function fetchFundData() {
    if (!profile || profile.role !== 'admin') return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fund')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching fund history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRecord(id) {
    if (!confirm('Are you sure you want to delete this NAV record? This action cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/admin/delete-nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');
      
      setHistory(history.filter(record => record.id !== id));
      alert('Record deleted successfully.');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
          <History className="mr-3 text-[#12C98B]" />
          Full NAV History (Admin)
        </h1>
        
        <button className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-[#F3F1E8] text-sm font-medium rounded-lg transition-colors border border-gray-700">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center flex-wrap gap-4 justify-between">
           <p className="text-sm text-[#7E8D91]">Chronological record of all declared NAV and Fund Values.</p>
           <div className="bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-md text-sm font-medium">
             Total Records: {history.length}
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#7E8D91]">
            <thead className="bg-gray-950/50 text-xs uppercase text-[#7E8D91] font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Observation Date</th>
                <th className="px-6 py-4 text-right">Total Value (AUM)</th>
                <th className="px-6 py-4 text-right">Total Circulating Units</th>
                <th className="px-6 py-4 text-right">Declared NAV</th>
                <th className="px-6 py-4 text-right">Created At</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#F3F1E8]">
                    {format(new Date(record.date), 'dd MMMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right text-[#7E8D91]">
                    ₹{Number(record.total_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-[#7E8D91]">
                    {Number(record.total_units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#12C98B] text-base">
                    ₹{Number(record.nav).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-[#7E8D91]">
                    {format(new Date(record.created_at), 'dd MMM yy, HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#7E8D91]">
                    No fund history recorded yet. Please declare an initial NAV in the Manage Fund tab.
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
