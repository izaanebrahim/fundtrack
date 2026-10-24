'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { History, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Historical NAV table shown under the performance chart.
// Admins also see AUM / units per record, can export CSV and delete records.
export default function NavHistoryTable({ isAdmin = false }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('fund')
          .select(isAdmin ? '*' : 'id, date, nav')
          .order('date', { ascending: false });
        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching NAV history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isAdmin]);

  async function handleDeleteRecord(id) {
    if (!confirm('Are you sure you want to delete this NAV record? This action cannot be undone.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/delete-nav', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminToken: session?.access_token })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');

      setHistory(history.filter(record => record.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record.');
    }
  }

  function handleExportCsv() {
    const header = ['Date', 'Total Value (INR)', 'Total Units', 'NAV (INR)', 'Recorded At'];
    const rows = history.map(r => [
      r.date,
      Number(r.total_value).toFixed(2),
      Number(r.total_units).toFixed(4),
      Number(r.nav).toFixed(4),
      r.created_at ? new Date(r.created_at).toISOString() : '',
    ]);
    const csv = [header, ...rows]
      .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `barakah-nav-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="bg-[#101917] border border-white/5 rounded-2xl h-64 animate-pulse"></div>;

  const columns = isAdmin ? 6 : 3;

  return (
    <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest flex items-center gap-3">
          <History className="w-4 h-4 text-[#12C98B]" /> NAV History
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-[#7E8D91] uppercase tracking-widest">{history.length} records</span>
          {isAdmin && (
            <button
              onClick={handleExportCsv}
              disabled={history.length === 0}
              className="flex items-center px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#F3F1E8] text-xs font-bold rounded-lg border border-white/10 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/20 text-[10px] uppercase text-[#7E8D91] font-black tracking-widest border-b border-white/5">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4">Date</th>
              {isAdmin && <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right">Total Value (AUM)</th>}
              {isAdmin && <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right">Units</th>}
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">NAV per Unit</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">1D Change</th>
              {isAdmin && <th className="px-3 sm:px-6 py-3 sm:py-4 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.map((record, i) => {
              const prevNav = history[i + 1]?.nav;
              const change = prevNav ? record.nav - prevNav : null;
              const changePct = prevNav && prevNav > 0 ? (change / prevNav) * 100 : null;
              return (
                <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-[#7E8D91] font-bold whitespace-nowrap">{format(new Date(record.date), 'dd MMM yyyy')}</td>
                  {isAdmin && (
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right text-[#7E8D91]">
                      ₹{Number(record.total_value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-right text-[#7E8D91]">
                      {Number(record.total_units).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-black text-[#F3F1E8] text-sm sm:text-base">₹{Number(record.nav).toFixed(4)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                    {changePct !== null ? (
                      <span className={`text-xs font-black ${change >= 0 ? 'text-[#12C98B]' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                    ) : <span className="text-[#7E8D91] text-xs">—</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr><td colSpan={columns} className="px-6 py-12 text-center text-[#7E8D91]">No NAV history available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
