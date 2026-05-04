'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts';
import type { CampaignSummary, Channel } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface CampaignBarChartProps {
  campaigns: CampaignSummary[];
  metric?: 'spend' | 'conversions' | 'clicks' | 'roas';
  height?: number;
  maxItems?: number;
}

const CHANNEL_COLORS: Record<Channel, string> = {
  meta:       '#1877F2',
  google:     '#EA4335',
  google_ads: '#EA4335',
  tiktok:     '#010101',
  ga4:        '#F9AB00',
  gsc:        '#4285F4',
};

function formatValue(value: number, metric: string): string {
  if (metric === 'spend' || metric === 'cpc' || metric === 'cpa') return formatCurrency(value);
  if (metric === 'roas') return `${value.toFixed(2)}x`;
  return formatNumber(value);
}

export function CampaignBarChart({ campaigns, metric = 'spend', height = 220, maxItems = 6 }: CampaignBarChartProps) {
  const sorted = [...campaigns]
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, maxItems);

  const data = sorted.map(c => ({
    name: c.name.length > 22 ? c.name.slice(0, 22) + '…' : c.name,
    value: c[metric] ?? 0,
    channel: c.channel,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
        <XAxis
          type="number"
          tickFormatter={v => formatValue(v, metric)}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 10, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [formatValue(Number(value ?? 0), metric), metric.toUpperCase()]}
          contentStyle={{
            fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell key={index} fill={CHANNEL_COLORS[entry.channel] ?? '#00BD7D'} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
