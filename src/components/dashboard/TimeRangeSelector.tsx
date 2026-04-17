'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Calendar, ChevronDown, GitCompare } from 'lucide-react';
import { DATE_PRESETS, getPresetRange, getPreviousPeriod, formatRangeLabel, formatDateParam } from '@/lib/utils/date';
import type { PresetKey, DateRange } from '@/lib/utils/date';
import { Toggle } from '@/components/ui/Toggle';

interface TimeRangeSelectorProps {
  preset: PresetKey;
  customRange?: DateRange;
  compareEnabled: boolean;
  compareRange?: DateRange;
  onPresetChange: (preset: PresetKey) => void;
  onCustomRangeChange?: (range: DateRange) => void;
  onCompareToggle: (enabled: boolean) => void;
  onCompareRangeChange?: (range: DateRange) => void;
}

export function TimeRangeSelector({
  preset, customRange, compareEnabled, compareRange,
  onPresetChange, onCustomRangeChange, onCompareToggle, onCompareRangeChange,
}: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [showCompareCustom, setShowCompareCustom] = useState(false);
  const [open, setOpen] = useState(false);

  const primaryRange = preset === 'custom' && customRange
    ? customRange
    : getPresetRange(preset);

  const effectiveCompare = compareRange ?? getPreviousPeriod(primaryRange);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Primary range */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#111827] hover:border-[#D1D5DB] transition-colors"
        >
          <Calendar className="w-4 h-4 text-[#6B7280]" />
          <span>{formatRangeLabel(primaryRange)}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-[#9CA3AF] transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute top-full mt-2 right-0 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-2 min-w-[200px]">
            {DATE_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => { onPresetChange(p.key); setShowCustom(false); setOpen(false); }}
                className={cn(
                  'w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  preset === p.key
                    ? 'bg-[#e6f9f4] text-[#00BD7D] font-medium'
                    : 'text-[#374151] hover:bg-[#F9FAFB]'
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="border-t border-[#F3F4F6] mt-1 pt-1">
              <button
                onClick={() => { setShowCustom(true); onPresetChange('custom'); setOpen(false); }}
                className="w-full flex items-center px-3 py-2 rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] text-left"
              >
                Custom range…
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            defaultValue={customRange ? formatDateParam(customRange.start) : ''}
            onChange={e => {
              if (onCustomRangeChange && e.target.value) {
                const start = new Date(e.target.value);
                onCustomRangeChange({ start, end: customRange?.end ?? start });
              }
            }}
            className="border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-xs text-[#111827] outline-none focus:border-[#00BD7D]"
          />
          <span className="text-[#9CA3AF]">–</span>
          <input
            type="date"
            defaultValue={customRange ? formatDateParam(customRange.end) : ''}
            onChange={e => {
              if (onCustomRangeChange && e.target.value) {
                const end = new Date(e.target.value);
                onCustomRangeChange({ start: customRange?.start ?? end, end });
              }
            }}
            className="border border-[#E5E7EB] rounded-lg px-2 py-1.5 text-xs text-[#111827] outline-none focus:border-[#00BD7D]"
          />
        </div>
      )}

      {/* Comparison toggle */}
      <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
        <GitCompare className="w-4 h-4 text-[#9CA3AF]" />
        <Toggle
          size="sm"
          checked={compareEnabled}
          onChange={onCompareToggle}
          label="Compare"
        />
      </div>

      {/* Comparison period display */}
      {compareEnabled && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F3F4F6] rounded-lg text-xs text-[#6B7280]">
          <span className="w-2 h-0.5 bg-[#6B7280] opacity-60 inline-block" style={{ borderBottom: '1.5px dashed' }} />
          vs {formatRangeLabel(effectiveCompare)}
        </div>
      )}
    </div>
  );
}
