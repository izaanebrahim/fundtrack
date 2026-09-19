'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, [profile]);

  async function fetchReports() {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('month', { ascending: false });
        
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-[#7E8D91]">Loading reports...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center mb-2">
            <FileText className="mr-3 text-[#12C98B]" />
            Fund Reports & Factsheets
          </h1>
          <p className="text-[#7E8D91] text-sm">Monthly and quarterly performance reports prepared by the fund manager.</p>
        </div>
        <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 px-4 py-2 rounded-lg flex items-center hidden sm:flex">
          <Calendar className="w-4 h-4 text-[#7E8D91] mr-2" />
          <span className="text-sm text-[#7E8D91] font-medium">Archive: {reports.length} Documents</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="group bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 hover:bg-white/[0.02] transition-colors shadow-sm relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110"></div>
            
            <div className="flex-grow">
               <div className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-[#12C98B] mb-3 bg-indigo-400/10 px-2 py-1 rounded">
                 {format(new Date(report.month + '-01'), 'MMM yyyy')}
               </div>
               <h3 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-2 leading-snug group-hover:text-indigo-200 transition-colors">
                 {report.title}
               </h3>
               <p className="text-xs text-[#7E8D91] flex items-center mt-3">
                 Published: {format(new Date(report.created_at), 'MMM dd, yyyy')}
               </p>
            </div>
            
            <div className="pt-5 mt-5 border-t border-gray-800/60">
               <a 
                 href={report.file_url} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="flex items-center justify-center w-full py-2 px-4 bg-gray-800 hover:bg-indigo-600 text-[#7E8D91] hover:text-[#F3F1E8] text-sm font-medium rounded-lg transition-colors group-hover:shadow-md"
               >
                 <Download className="w-4 h-4 mr-2" />
                 View / Download
               </a>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 border-dashed rounded-xl">
           <FileText className="w-12 h-12 text-[#7E8D91] mb-4" />
           <h3 className="text-lg font-medium text-[#7E8D91] mb-1">No reports available</h3>
           <p className="text-[#7E8D91]">The fund manager has not uploaded any reports yet.</p>
        </div>
      )}
    </div>
  );
}
