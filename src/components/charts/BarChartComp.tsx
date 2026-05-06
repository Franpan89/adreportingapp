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
  meta_ads:              '#1877F2',
  google_ads:            '#EA4335',
  tiktok_ads:            '#010101',
  meta_page:             '#1877F2',
  meta_instagram:        '#C13584',
  linkedin:              '#0A66C2',
  pinterest:             '#E60023',
  tiktok_organic:        '#010101',
  youtube:               '#FF0000',
  ga4:                   '#F9AB00',
  google_search_console: '#4285F4',
  shopify:               '#95BF47',
  ghl:                   '#312E81',
  klaviyo:               '#7C3AED',
  yotpo:                 '#D97706',
  toast:                 '#FB7185',
  email_sms:             '#6B7280',
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
