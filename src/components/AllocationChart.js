'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#00f5a0', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#3b82f6', '#d4ff3f', '#00d98b'];

export default function AllocationChart({ data, title, hideTitle }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-600 glass-card">
        <p className="text-sm font-medium">No allocation data available</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 glass-card-hover h-full">
      {!hideTitle && (
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">{title}</h3>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              animationDuration={1200}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#161b1b', 
                borderColor: 'rgba(255,255,255,0.08)', 
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                padding: '12px 16px'
              }}
              itemStyle={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}
              formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-[11px] text-gray-400 font-semibold ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
