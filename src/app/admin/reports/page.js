'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { FileText, Upload, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageReports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [fileUrl, setFileUrl] = useState(''); // Normally we'd handle file upload to storage here, but for MVP let's allow a URL or simple text entry.
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchReports();
  }, [profile]);

  async function fetchReports() {
    if (!profile || profile.role !== 'admin') return;
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

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!title || !month || !fileUrl) {
      setMessage({ text: 'Please fill all fields.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.from('reports').insert([{
        title,
        month,
        file_url: fileUrl
      }]);

      if (error) throw error;

      setMessage({ text: 'Report uploaded successfully.', type: 'success' });
      setTitle('');
      setFileUrl('');
      fetchReports();
    } catch (error) {
       setMessage({ text: error.message || 'Failed to upload report.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      fetchReports();
    } catch (error) {
       setMessage({ text: error.message || 'Failed to delete.', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
        <FileText className="mr-3 text-[#12C98B]" />
        Manage Reports
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 shadow-sm sticky top-8">
            <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-6">Upload Monthly Report</h2>
            
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start text-sm ${
                message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUploadReport} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 2026 Factsheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Target Month</label>
                <input
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7E8D91] mb-1">Document Link / URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://link-to-pdf..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
                />
                <p className="text-xs text-[#7E8D91] mt-2">
                  For MVP, provide an external link (Google Drive, AWS, etc) to the PDF.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {submitting ? 'Publishing...' : 'Publish Report'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Reports */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 flex items-center justify-between">
             <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest">Published Reports</h2>
             <span className="bg-gray-800 text-[#7E8D91] text-xs px-2 py-1 rounded-md">{reports.length} Total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => (
              <div key={report.id} className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 rounded-lg p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-semibold text-[#12C98B] bg-indigo-900/30 px-2 py-1 rounded border border-indigo-800/50">
                         {format(new Date(report.month + '-01'), 'MMMM yyyy')}
                       </span>
                       <button onClick={() => handleDelete(report.id)} className="text-[#7E8D91] hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <h3 className="text-[#F3F1E8] font-medium text-lg leading-tight mb-3">{report.title}</h3>
                 </div>
                 <div className="flex items-center justify-between mt-4 text-sm text-[#7E8D91]">
                    <span className="text-xs">Added {format(new Date(report.created_at), 'dd MMM yy')}</span>
                    <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="text-[#12C98B] hover:text-indigo-300 transition-colors font-medium">
                      View Link &rarr;
                    </a>
                 </div>
              </div>
            ))}
            
            {reports.length === 0 && !loading && (
              <div className="col-span-1 md:col-span-2 p-12 bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 border-dashed rounded-xl flex flex-col items-center justify-center text-[#7E8D91]">
                <FileText className="w-10 h-10 mb-3 text-gray-700" />
                <p>No reports uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
