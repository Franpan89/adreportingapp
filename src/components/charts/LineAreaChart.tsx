'use client';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import type { DailyDataPoint } from '@/types';
import { formatMetric } from '@/lib/utils/format';
import type { MetricUnit } from '@/types';

interface LineAreaChartProps {
  data: DailyDataPoint[];
  compareData?: DailyDataPoint[];
  metric: string;
  unit: MetricUnit;
  height?: number;
  showComparison?: boolean;
  compareMode?: 'overlay' | 'side-by-side';
}

const PRIMARY_COLOR = '#00BD7D';
const COMPARE_COLOR = '#6B7280';

function formatXAxis(value: string, dayIndex?: boolean) {
  if (!value) return '';
  if (dayIndex) return `Day ${value}`;
  // Show short date: Jan 5
  const d = new Date(value + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label, unit, showComparison }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit: MetricUnit; showComparison?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-semibold text-[#374151] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-[#6B7280]">{entry.name}</span>
          </div>
          <span className="font-semibold text-[#111827]">{formatMetric(entry.value ?? 0, unit)}</span>
        </div>
      ))}
    </div>
  );
}

export function LineAreaChart({
  data, compareData, metric, unit, height = 280, showComparison, compareMode = 'overlay'
}: LineAreaChartProps) {
  const isOverlay = showComparison && compareData && compareMode === 'overlay';

  // Normalize data to dayIndex for overlay
  const normalizedPrimary = data.map((d, i) => ({ ...d, dayIndex: i + 1 }));
  const normalizedCompare = compareData?.map((d, i) => ({ ...d, dayIndex: i + 1 }));

  if (isOverlay) {
    // Merge both series into one dataset by dayIndex
    const maxLen = Math.max(normalizedPrimary.length, normalizedCompare?.length ?? 0);
    const merged = Array.from({ length: maxLen }, (_, i) => ({
      dayIndex: i + 1,
      primary: (normalizedPrimary[i] as unknown as Record<string, number | undefined>)?.[metric] ?? null,
      compare: (normalizedCompare?.[i] as unknown as Record<string, number | undefined>)?.[metric] ?? null,
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={merged} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={0.15} />
              <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="dayIndex"
            tickFormatter={v => `Day ${v}`}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={v => formatMetric(v, unit)}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip unit={unit} showComparison />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone" dataKey="primary" name="Current period"
            stroke={PRIMARY_COLOR} strokeWidth={2}
            fill="url(#primaryGrad)"
            dot={false} activeDot={{ r: 4, fill: PRIMARY_COLOR }}
          />
          <Line
            type="monotone" dataKey="compare" name="Previous period"
            stroke={COMPARE_COLOR} strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false} activeDot={{ r: 3, fill: COMPARE_COLOR }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  const chartData = data.map(d => ({
    date: d.date,
    value: (d as unknown as Record<string, number | string | undefined>)[metric] as number ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={0.15} />
            <stop offset="100%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="date"
          tickFormatter={v => formatXAxis(v)}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => formatMetric(v, unit)}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Area
          type="monotone" dataKey="value" name="Value"
          stroke={PRIMARY_COLOR} strokeWidth={2}
          fill="url(#areaGrad)"
          dot={false} activeDot={{ r: 4, fill: PRIMARY_COLOR }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
