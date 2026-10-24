'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Megaphone, Pin, PinOff, Pencil, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sortNotices } from '@/lib/notices';

const EMPTY_FORM = { title: '', body: '', pinned: false };

export default function ManageNotices() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    async function fetchNotices() {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setNotices(sortNotices(data || []));
      } catch (error) {
        console.error('Error fetching notices:', error);
        setMessage({ text: error.message || 'Could not load notices.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    fetchNotices();
  }, [profile]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      setMessage({ text: 'Please add a title and a message.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const values = { title, body, pinned: form.pinned };
      if (editingId) {
        const { data, error } = await supabase.from('notices').update(values).eq('id', editingId).select().single();
        if (error) throw error;
        setNotices(prev => sortNotices(prev.map(n => (n.id === editingId ? data : n))));
        setMessage({ text: 'Notice updated.', type: 'success' });
      } else {
        const { data, error } = await supabase.from('notices').insert([values]).select().single();
        if (error) throw error;
        setNotices(prev => sortNotices([data, ...prev]));
        setMessage({ text: 'Notice posted. All clients can see it now.', type: 'success' });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving notice:', error);
      setMessage({ text: error.message || 'Could not save the notice.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setForm({ title: n.title, body: n.body, pinned: n.pinned });
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePin = async (n) => {
    setMessage({ text: '', type: '' });
    try {
      const { data, error } = await supabase.from('notices').update({ pinned: !n.pinned }).eq('id', n.id).select().single();
      if (error) throw error;
      setNotices(prev => sortNotices(prev.map(x => (x.id === n.id ? data : x))));
    } catch (error) {
      console.error('Error pinning notice:', error);
      setMessage({ text: error.message || 'Could not update the notice.', type: 'error' });
    }
  };

  const handleDelete = async (n) => {
    if (!confirm(`Delete the notice "${n.title}"? Clients will no longer see it.`)) return;
    setMessage({ text: '', type: '' });
    try {
      const { error } = await supabase.from('notices').delete().eq('id', n.id);
      if (error) throw error;
      setNotices(prev => prev.filter(x => x.id !== n.id));
      if (editingId === n.id) resetForm();
      setMessage({ text: 'Notice deleted.', type: 'success' });
    } catch (error) {
      console.error('Error deleting notice:', error);
      setMessage({ text: error.message || 'Could not delete the notice.', type: 'error' });
    }
  };

  if (loading) return <div className="text-[#F3F1E8]">Loading notices...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
          <Megaphone className="mr-3 text-[#12C98B]" />
          Manager&apos;s Notices
        </h1>
        <p className="text-[#7E8D91] text-sm font-medium mt-1">
          Post updates for every client. Pinned notices stay at the top of their Notices tab and dashboard.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-start text-sm ${
          message.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6 space-y-4">
        <h2 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest">
          {editingId ? 'Edit Notice' : 'New Notice'}
        </h2>
        <div>
          <label className="block text-sm font-medium text-[#7E8D91] mb-1">Title</label>
          <input
            type="text"
            maxLength={200}
            placeholder="e.g. October fund update"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#7E8D91] mb-1">Message</label>
          <textarea
            rows={6}
            maxLength={5000}
            placeholder="How the fund did this month, changes to holdings, upcoming dates..."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-[#F3F1E8] focus:outline-none focus:border-[#12C98B]/50 resize-y"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-[#7E8D91] cursor-pointer">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="accent-[#12C98B]"
            />
            Pin to the top
          </label>
          <div className="flex items-center gap-3">
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-[#7E8D91] hover:text-[#F3F1E8] transition-colors">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Post Notice'}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {notices.map(n => (
          <div key={n.id} className={`bg-[#101917] border rounded-2xl shadow-sm shadow-black/20 p-4 sm:p-6 ${editingId === n.id ? 'border-[#12C98B]/50' : n.pinned ? 'border-[#12C98B]/30' : 'border-white/5'}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0 pt-1.5">
                {n.pinned && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                <span className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">
                  Posted {format(new Date(n.created_at), 'dd MMM yyyy, hh:mm a')}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 -mr-2 -mt-0.5">
                <button onClick={() => togglePin(n)} title={n.pinned ? 'Unpin' : 'Pin to top'} className="p-2 rounded-lg text-[#7E8D91] hover:text-[#12C98B] hover:bg-[#12C98B]/10 transition-colors">
                  {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(n)} title="Edit" className="p-2 rounded-lg text-[#7E8D91] hover:text-[#F3F1E8] hover:bg-white/5 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(n)} title="Delete" className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-base font-black text-[#F3F1E8] break-words">{n.title}</h3>
            <p className="text-sm text-[#C9CFCB] mt-2 whitespace-pre-line break-words">{n.body}</p>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="bg-[#101917] border border-white/5 rounded-2xl p-12 text-center text-sm font-semibold text-[#7E8D91]">
            No notices yet. Your first one will show on every client&apos;s dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
