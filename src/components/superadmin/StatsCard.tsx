import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatsCardProps {
  label: string;
  value: string;
  Icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  sublabel?: string;
  accent?: string; // hex color, default #7C3AED
}

export function StatsCard({
  label, value, Icon, trend, trendPositive, sublabel, accent = '#7C3AED',
}: StatsCardProps) {
  return (
    <div className="bg-[#1F2937] border border-white/10 rounded-xl p-5 shadow-[2px_4px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[4px_8px_0_rgba(0,0,0,0.25)] transition-all duration-150">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shadow-[2px_3px_0px_rgba(0,0,0,0.2)]"
          style={{ background: accent + '25' }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
        </div>
        {trend && (
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            trendPositive
              ? 'bg-[#dcfce7] text-[#16A34A]'
              : 'bg-[#fee2e2] text-[#DC2626]'
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sublabel && <p className="text-[10px] text-white/30 mt-1">{sublabel}</p>}
    </div>
  );
}
