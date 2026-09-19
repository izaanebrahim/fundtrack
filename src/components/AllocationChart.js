'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#12C98B', '#D6B875', '#7E8D91', '#3A5A52', '#8B7D6B', '#4A6B63', '#A89F91', '#2C4A42'];

export default function AllocationChart({ data, title, hideTitle }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[#7E8D91] bg-[#101917] border border-white/5 rounded-2xl">
        <p className="text-sm font-medium">No allocation data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    if (a.name === 'Equity') return -1;
    if (b.name === 'Equity') return 1;
    return b.value - a.value;
  });

  return (
    <div className="bg-[#101917] border border-white/5 rounded-2xl p-6 transition-all hover:border-[#12C98B]/30 h-full">
      {!hideTitle && (
        <h3 className="text-sm font-black text-[#F3F1E8] uppercase tracking-widest mb-6">{title}</h3>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              animationDuration={1200}
              strokeWidth={0}
            >
              {sortedData.map((entry, index) => {
                let fill = COLORS[index % COLORS.length];
                if (entry.name === 'Cash') fill = '#12C98B';
                if (entry.name === 'Equity') fill = '#D6B875';
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#091411', 
                borderColor: 'rgba(255,255,255,0.08)', 
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                padding: '12px 16px'
              }}
              itemStyle={{ fontSize: '12px', color: '#F3F1E8', fontWeight: 700 }}
              formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-[11px] text-[#7E8D91] font-semibold ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
