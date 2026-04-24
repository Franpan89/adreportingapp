'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface DataPoint {
  mes: string;
  cantidad: number;
}

interface SuperAdminBarChartProps {
  data: DataPoint[];
  height?: number;
}

export function SuperAdminBarChart({ data, height = 180 }: SuperAdminBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="mes"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1F2937',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
          cursor={{ fill: 'rgba(124,58,237,0.08)' }}
          formatter={(value) => [`${value ?? 0} nueva${Number(value) !== 1 ? 's' : ''}`, 'Licencias']}
        />
        <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? '#7C3AED' : 'rgba(124,58,237,0.35)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
