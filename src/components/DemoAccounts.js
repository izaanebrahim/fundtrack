'use client';

import { useState } from 'react';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demoData';
import { resetDemoData } from '@/lib/supabase';

// Shown on the login page of the public demo: one-click demo logins.
export default function DemoAccounts({ onPick, align = 'left' }) {
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className={`mt-6 rounded-[10px] border border-[#12C98B]/25 bg-[#12C98B]/[0.06] p-4 text-[13px] text-[#7E8D91] ${align === 'center' ? 'text-center' : ''}`}>
      <p className="text-[#F3F1E8] font-semibold mb-1">Demo version with sample data</p>
      <p className="mb-3">Sign in with a demo account (password <span className="text-[#F3F1E8] font-mono">{DEMO_PASSWORD}</span>):</p>
      <div className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => onPick(a.email, DEMO_PASSWORD)}
            className="px-3 py-1.5 rounded-[8px] border border-[#12C98B]/40 text-[#12C98B] hover:bg-[#12C98B]/10 transition-colors font-medium"
          >
            {a.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { resetDemoData(); setResetDone(true); }}
        className="mt-3 text-[12px] underline underline-offset-2 hover:text-[#F3F1E8]"
      >
        {resetDone ? 'Demo data reset' : 'Reset demo data'}
      </button>
    </div>
  );
}
