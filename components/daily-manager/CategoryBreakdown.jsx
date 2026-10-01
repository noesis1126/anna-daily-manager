// components/daily-manager/CategoryBreakdown.jsx
'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { CAT_COLORS } from '@/lib/daily-manager/constants';
import { inr, pct } from '@/lib/daily-manager/format';
import { Empty } from './ui';

export default function CategoryBreakdown({ data }) {
  if (!data?.length) return <Empty icon={PieIcon} title="No expenses yet" text="The category breakdown appears once you add an expense." />;
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="category" innerRadius={52} outerRadius={92} paddingAngle={2}>
              {data.map((d) => <Cell key={d.category} fill={CAT_COLORS[d.category] || '#78716c'} />)}
            </Pie>
            <Tooltip formatter={(v) => inr(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.category} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: CAT_COLORS[d.category] || '#78716c' }} />
            <span className="flex-1 font-medium text-stone-700">{d.category}</span>
            <span className="text-stone-500">{inr(d.total)}</span>
            <span className="w-14 text-right font-bold text-stone-800">{pct(d.pct)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
