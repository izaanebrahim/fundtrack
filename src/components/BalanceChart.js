'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { LineChart as LineIcon } from 'lucide-react';
import { computeClientPosition } from '@/lib/portfolio';

const toDay = (value) => format(new Date(value), 'yyyy-MM-dd');

function formatRupees(value) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

// The client's own balance over time: units held on each recorded NAV date
// multiplied by that day's NAV, next to the money they had invested.
export default function BalanceChart({ transactions = [], navHistory = [], liveNav, title = 'Your Balance Over Time' }) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];
    const firstDay = toDay(
      transactions.reduce((min, t) => (new Date(t.created_at) < new Date(min) ? t.created_at : min), transactions[0].created_at)
    );

    const points = navHistory
      .filter(f => f.date >= firstDay)
      .map(f => ({ date: f.date, nav: Number(f.nav) }));

    const today = toDay(new Date());
    if (liveNav) {
      const existing = points.find(p => p.date === today);
      if (existing) existing.nav = liveNav;
      else points.push({ date: today, nav: liveNav });
    }

    return points.map(p => {
      const { units, invested } = computeClientPosition(
        transactions.filter(t => toDay(t.created_at) <= p.date)
      );
      return {
        date: p.date,
        formattedDate: format(new Date(p.date), 'dd MMM yy'),
        balance: Number((units * p.nav).toFixed(2)),
        invested: Number(invested.toFixed(2)),
      };
    });
  }, [transactions, navHistory, liveNav]);

  return (
    <div className="bg-[#101917] border border-white/5 rounded-2xl shadow-sm shadow-black/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-[#F3F1E8] uppercase tracking-widest">{title}</h3>
        <LineIcon className="w-4 h-4 text-[#12C98B]" />
      </div>
      {chartData.length < 2 ? (
        <p className="text-xs font-semibold text-[#7E8D91] py-10 text-center">
          Your chart will fill in as the fund records its daily NAV.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12C98B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#12C98B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="transparent" tick={{ fill: '#7E8D91', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={['auto', 'auto']} stroke="transparent" tick={{ fill: '#7E8D91', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={formatRupees} width={56} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#091411',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  padding: '12px 16px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                labelStyle={{ color: '#7E8D91', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}
                formatter={(value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                isAnimationActive={false}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, color: '#7E8D91' }} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#12C98B" strokeWidth={2.5} fill="url(#colorBalance)" dot={false} activeDot={{ r: 4, fill: '#12C98B', stroke: '#091411', strokeWidth: 2 }} />
              <Area type="stepAfter" dataKey="invested" name="Invested" stroke="#7E8D91" strokeWidth={2} strokeDasharray="6 3" fill="transparent" dot={false} activeDot={{ r: 3, fill: '#7E8D91', stroke: '#091411', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
