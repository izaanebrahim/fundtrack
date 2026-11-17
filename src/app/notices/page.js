'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { Megaphone, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { getNoticesSeenAt, markNoticesSeen, sortNotices } from '@/lib/notices';

export default function Notices() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [previouslySeenAt, setPreviouslySeenAt] = useState(null);
  // Read once per visit, so marking notices as read doesn't hide the "New" tags
  const seenAtOnArrival = useRef(undefined);

  useEffect(() => {
    if (!user) return;

    async function fetchNotices() {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, body, pinned, created_at, updated_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Remember what was new before this visit, then mark everything as read
        if (seenAtOnArrival.current === undefined) seenAtOnArrival.current = getNoticesSeenAt();
        setPreviouslySeenAt(seenAtOnArrival.current);
        setNotices(sortNotices(data || []));
        markNoticesSeen();
      } catch (error) {
        console.error('Error fetching notices:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotices();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-[#101917] rounded-2xl animate-pulse"></div>
        <div className="h-40 bg-[#101917] border border-white/5 rounded-2xl animate-pulse"></div>
        <div className="h-40 bg-[#101917] border border-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#F3F1E8] flex items-center">
          <Megaphone className="mr-3 text-[#12C98B]" />
          Manager&apos;s Notices
        </h1>
        <p className="text-[#7E8D91] text-sm font-medium mt-1">Updates from the fund manager on how the fund is doing.</p>
      </div>

      <div className="space-y-4">
        {notices.map(n => {
          const isNew = !previouslySeenAt || new Date(n.created_at) > new Date(previouslySeenAt);
          const edited = n.updated_at && new Date(n.updated_at) - new Date(n.created_at) > 60 * 1000;
          return (
            <article
              key={n.id}
              className={`bg-[#101917] border rounded-2xl shadow-sm shadow-black/20 p-6 ${n.pinned ? 'border-[#12C98B]/30' : 'border-white/5'}`}
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {n.pinned && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#12C98B]/10 text-[#12C98B] border border-[#12C98B]/20">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                {isNew && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    New
                  </span>
                )}
                <span className="text-[10px] text-[#7E8D91] font-bold uppercase tracking-widest">
                  {format(new Date(n.created_at), 'dd MMM yyyy')}
                  {edited && ` · Edited ${format(new Date(n.updated_at), 'dd MMM yyyy')}`}
                </span>
              </div>
              <h2 className="text-lg font-black text-[#F3F1E8] tracking-tight">{n.title}</h2>
              <p className="text-sm text-[#C9CFCB] mt-2 leading-relaxed whitespace-pre-line">{n.body}</p>
            </article>
          );
        })}

        {notices.length === 0 && (
          <div className="bg-[#101917] border border-white/5 rounded-2xl p-12 text-center">
            <Megaphone className="w-8 h-8 text-[#7E8D91] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#7E8D91]">No notices yet. Updates from the fund manager will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
