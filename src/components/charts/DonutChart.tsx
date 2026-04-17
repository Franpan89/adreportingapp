'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
  metric?: string;
  unit?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-[#111827]">{d.name}</p>
      <p className="text-[#6B7280] mt-1">{formatCurrency(d.value)}</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string; payload: { value: number; percent?: number } }[] }) {
  if (!payload) return null;
  const total = payload.reduce((sum, e) => sum + e.payload.value, 0);
  return (
    <ul className="flex flex-col gap-2 mt-3">
      {payload.map((entry, i) => {
        const pct = total > 0 ? (entry.payload.value / total) * 100 : 0;
        return (
          <li key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-[#374151]">{entry.value}</span>
            </div>
            <div className="text-right">
              <span className="text-[#111827] font-semibold">{formatCurrency(entry.payload.value)}</span>
              <span className="text-[#9CA3AF] ml-1.5">({formatPercent(pct, 1)})</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DonutChart({ data, height = 180 }: DonutChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={height * 0.28}
            outerRadius={height * 0.44}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend payload={data.map(d => ({ value: d.name, color: d.color, payload: { value: d.value } }))} />
    </div>
  );
}
