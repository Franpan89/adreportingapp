'use client';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMetric, formatDelta } from '@/lib/utils/format';
import type { MetricUnit } from '@/types';

interface KpiCardProps {
  label: string;
  value: number;
  unit: MetricUnit;
  compareValue?: number;
  delta?: { absolute: number; percent: number; direction: 'up' | 'down' | 'flat' };
  showComparison?: boolean;
  /** Whether a higher value is "good" (true) or "bad" (false = for CPC, CPA) */
  positiveIsGood?: boolean;
}

const NEGATIVE_METRICS = new Set(['cpc', 'cpm', 'cpa', 'spend']);

export function KpiCard({
  label, value, unit, compareValue, delta, showComparison, positiveIsGood = true
}: KpiCardProps) {
  const direction = delta?.direction ?? 'flat';
  const isGood = positiveIsGood
    ? direction === 'up'
    : direction === 'down';

  const deltaColor = direction === 'flat'
    ? 'text-[#5a6472]'
    : isGood ? 'text-[#00A63D]' : 'text-[#c2153f]';

  const deltaBg = direction === 'flat'
    ? 'bg-[#F1F2F5]'
    : isGood ? 'bg-[#d6f5e1]' : 'bg-[#ffdce4]';

  return (
    <div className="neu-raised p-5">
      {/* Label */}
      <p className="text-xs font-medium text-[#5a6472] mb-3 uppercase tracking-wide">{label}</p>

      {/* Primary value */}
      <p className="text-2xl font-bold text-[#1E2938] font-[Roboto] leading-none mb-3">
        {formatMetric(value, unit)}
      </p>

      {/* Comparison row */}
      {showComparison && delta ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', deltaBg, deltaColor)}>
              {direction === 'up' && <TrendingUp className="w-3 h-3" />}
              {direction === 'down' && <TrendingDown className="w-3 h-3" />}
              {direction === 'flat' && <Minus className="w-3 h-3" />}
              {formatDelta(delta.percent)}
            </span>
          </div>
          {compareValue !== undefined && (
            <span className="text-xs text-[#5a6472]">
              vs {formatMetric(compareValue, unit)}
            </span>
          )}
        </div>
      ) : (
        <div className="h-5" /> // Spacer to keep card height consistent
      )}
    </div>
  );
}
