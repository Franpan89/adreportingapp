'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { ChannelBadge, StatusBadge } from '@/components/ui/Badge';
import { formatMetric, formatDelta } from '@/lib/utils/format';
import type { CampaignSummary, MetricConfig, ReportResponse } from '@/types';

interface CampaignTableProps {
  campaigns: CampaignSummary[];
  compareCampaigns?: CampaignSummary[];
  allowedMetrics: MetricConfig[];
  showComparison?: boolean;
}

type SortKey = string;
type SortDir = 'asc' | 'desc';

export function CampaignTable({ campaigns, compareCampaigns, allowedMetrics, showComparison }: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const tableMetrics = allowedMetrics.filter(m => m.show_in_table && m.is_visible);

  const compareMap = new Map(compareCampaigns?.map(c => [c.id, c]) ?? []);

  const sorted = [...campaigns]
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = (a[sortKey as keyof CampaignSummary] as number) ?? 0;
      const bv = (b[sortKey as keyof CampaignSummary] as number) ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 text-[#00BD7D]" />
      : <ArrowUp className="w-3 h-3 text-[#00BD7D]" />;
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search campaigns…"
          className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20 text-[#111827] placeholder:text-[#9CA3AF]"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                Campaign
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                Channel
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                Status
              </th>
              {tableMetrics.map(m => (
                <th
                  key={m.metric_key}
                  className="text-right px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide cursor-pointer whitespace-nowrap"
                  onClick={() => toggleSort(m.metric_key)}
                >
                  <span className="flex items-center justify-end gap-1">
                    {m.label}
                    <SortIcon col={m.metric_key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign, i) => {
              const compare = compareMap.get(campaign.id);
              return (
                <tr
                  key={campaign.id}
                  className={cn(
                    'border-b border-[#F3F4F6] last:border-0 transition-colors',
                    i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]',
                    'hover:bg-[#F0FDF8]'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#111827] text-sm">{campaign.name}</span>
                  </td>
                  <td className="px-3 py-3">
                    <ChannelBadge channel={campaign.channel} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={campaign.status} />
                  </td>
                  {tableMetrics.map(m => {
                    const val = campaign[m.metric_key as keyof CampaignSummary] as number ?? 0;
                    const cmpVal = compare?.[m.metric_key as keyof CampaignSummary] as number;
                    const pct = cmpVal && cmpVal !== 0 ? ((val - cmpVal) / Math.abs(cmpVal)) * 100 : null;
                    return (
                      <td key={m.metric_key} className="px-3 py-3 text-right">
                        <span className="font-medium text-[#111827]">
                          {formatMetric(val, m.unit)}
                        </span>
                        {showComparison && pct !== null && (
                          <span className={cn(
                            'block text-[10px] mt-0.5',
                            Math.abs(pct) < 0.5 ? 'text-[#9CA3AF]' : pct > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          )}>
                            {formatDelta(pct)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3 + tableMetrics.length} className="py-12 text-center text-[#9CA3AF] text-sm">
                  No campaigns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#9CA3AF] mt-2 text-right">{sorted.length} campaigns</p>
    </div>
  );
}
