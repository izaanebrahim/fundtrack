'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Phone, Mail, MessageCircle, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_STYLES, formatRequestAmount, whatsappLink } from '@/lib/requests';

const FILTERS = [
  { key: 'OPEN', label: 'Open', statuses: ['PENDING', 'CONTACTED'] },
  { key: 'COMPLETED', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
  { key: 'ALL', label: 'All', statuses: null },
];

export default function ManageRequests() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('OPEN');
  const [adminNotes, setAdminNotes] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    async function fetchRequests() {
      try {
        const { data, error } = await supabase
          .from('requests')
          .select(`
            *,
            client:clients(name, email, phone)
          `)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRequests(data || []);
        setAdminNotes(Object.fromEntries((data || []).map(r => [r.id, r.admin_note || ''])));
      } catch (error) {
        console.error('Error fetching requests:', error);
        setMessage({ text: error.message || 'Could not load requests.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [profile]);

  async function updateRequest(id, changes, successText) {
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.from('requests').update(changes).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, ...changes } : r)));
      if (successText) setMessage({ text: successText, type: 'success' });
    } catch (error) {
      console.error('Error updating request:', error);
      setMessage({ text: error.message || 'Could not update request.', type: 'error' });
    }
  }

  const handleCancel = (r) => {
    if (!confirm(`Cancel ${r.client?.name || 'this client'}'s request?`)) return;
    updateRequest(r.id, { status: 'CANCELLED' }, 'Request cancelled.');
  };

  const saveAdminNote = (r) => {
    const note = (adminNotes[r.id] || '').trim();
    if (note === (r.admin_note || '')) return;
    updateRequest(r.id, { admin_note: note || null });
  };

  const activeFilter = FILTERS.find(f => f.key === filter);
  const visible = activeFilter.statuses
    ? requests.filter(r => activeFilter.statuses.includes(r.status))
    : requests;
  const openCount = requests.filter(r => r.status === 'PENDING' || r.status === 'CONTACTED').length;

  if (loading) return <div className="text-[#F3F1E8]">Loading requests...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
            <Inbox className="mr-3 text-[#12C98B]" />
            Client Requests
          </h1>
          <p className="text-[#7E8D91] text-sm font-medium mt-1">
            {openCount === 0 ? 'No open requests.' : `${openCount} open request${openCount === 1 ? '' : 's'} waiting for you.`}
          </p>
        </div>

        <div className="bg-[#101917] border border-white/5 rounded-xl p-1 grid grid-cols-4 sm:flex items-center sm:self-start">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-0.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-normal sm:tracking-widest transition-all ${
                filter === f.key ? 'bg-[#12C98B]/10 text-[#12C98B]' : 'text-[#7E8D91] hover:text-[#F3F1E8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-start text-sm ${
          message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {visible.map(r => {
          const isInvest = r.type === 'INVEST';
          const isOpen = r.status === 'PENDING' || r.status === 'CONTACTED';
          const whatsapp = whatsappLink(r.client?.phone);
          const recordHref = `/admin/transactions?${new URLSearchParams({
            request: r.id,
            client: r.client_id,
            type: r.type,
            ...(r.amount ? { amount: String(r.amount) } : {}),
          }).toString()}`;

          return (
            <div key={r.id} className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Request details */}
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${isInvest ? 'bg-[#12C98B]/10 text-[#12C98B]' : 'bg-red-500/10 text-red-400'}`}>
                    {isInvest ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-[#F3F1E8] tracking-tight">
                        {isInvest ? 'Invest' : 'Withdraw'} · {formatRequestAmount(r)}
                      </p>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${REQUEST_STATUS_STYLES[r.status]}`}>
                        {REQUEST_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#F3F1E8] mt-1">{r.client?.name || 'Unknown client'}</p>
                    <p className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest mt-0.5">
                      Sent {format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                    {r.note && (
                      <p className="text-sm text-[#7E8D91] mt-3 whitespace-pre-wrap break-words">&ldquo;{r.note}&rdquo;</p>
                    )}

                    {/* Contact */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {r.client?.phone && (
                        <a href={`tel:${r.client.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs font-bold text-[#F3F1E8] hover:border-[#12C98B]/40">
                          <Phone className="w-3.5 h-3.5" /> {r.client.phone}
                        </a>
                      )}
                      {whatsapp && (
                        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs font-bold text-[#F3F1E8] hover:border-[#12C98B]/40">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {r.client?.email && (
                        <a href={`mailto:${r.client.email}`} className="flex items-center gap-1.5 max-w-full min-w-0 px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs font-bold text-[#F3F1E8] hover:border-[#12C98B]/40">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{r.client.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 lg:w-72 flex-shrink-0">
                  {isOpen && (
                    <div className="grid grid-cols-2 gap-2">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => updateRequest(r.id, { status: 'CONTACTED' }, 'Marked as contacted.')}
                          className="col-span-2 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-500/20"
                        >
                          Mark Contacted
                        </button>
                      )}
                      <Link
                        href={recordHref}
                        className="col-span-2 py-2 text-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-black rounded-xl text-xs font-black uppercase tracking-widest"
                      >
                        Record Transaction
                      </Link>
                      <button
                        onClick={() => updateRequest(r.id, { status: 'COMPLETED' }, 'Request marked as completed.')}
                        className="py-2 bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#12C98B]/20"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleCancel(r)}
                        className="py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <textarea
                    rows={2}
                    placeholder="Note for your records"
                    value={adminNotes[r.id] ?? ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    onBlur={() => saveAdminNote(r)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="bg-[#101917] border border-white/5 rounded-2xl p-12 text-center text-[#7E8D91]">
            {filter === 'OPEN' ? 'No open requests right now.' : 'No requests here.'}
          </div>
        )}
      </div>
    </div>
  );
}
