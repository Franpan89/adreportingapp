'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ImageIcon, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SourceKey } from '@/types';

interface AdRow {
  id: string;
  ad_name: string;
  campaign_name: string;
  thumbnail_url: string | null;
  creative_type: string | null;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  video_views: number;
  conversions: number;
}

type SortKey = keyof Omit<AdRow, 'id' | 'thumbnail_url' | 'creative_type'>;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 5;

function fmt(value: number, type: 'integer' | 'currency' | 'percent'): string {
  if (type === 'currency') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === 'percent')  return `${value.toFixed(2)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}

interface Column {
  key: SortKey;
  label: string;
  type: 'integer' | 'currency' | 'percent';
  align?: 'right';
  defaultVisible?: boolean;
}

const ALL_COLUMNS: Column[] = [
  { key: 'impressions',  label: 'Impresiones',    type: 'integer',  align: 'right', defaultVisible: true  },
  { key: 'reach',        label: 'Alcance',         type: 'integer',  align: 'right', defaultVisible: true  },
  { key: 'clicks',       label: 'Clics',           type: 'integer',  align: 'right', defaultVisible: true  },
  { key: 'video_views',  label: 'ThruPlay',        type: 'integer',  align: 'right', defaultVisible: true  },
  { key: 'conversions',  label: 'Resultados',      type: 'integer',  align: 'right', defaultVisible: true  },
  { key: 'spend',        label: 'Inversión total', type: 'currency', align: 'right', defaultVisible: true  },
];

const DEFAULT_VISIBLE = new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));

interface CreativeBreakdownProps {
  clientId: string;
  sourceKey: SourceKey;
  since: string;
  until: string;
}

export function CreativeBreakdown({ clientId, sourceKey, since, until }: CreativeBreakdownProps) {
  const [ads, setAds]             = useState<AdRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sortKey, setSortKey]     = useState<SortKey>('spend');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [page, setPage]           = useState(0);
  const [localSince, setLocalSince] = useState(since);
  const [localUntil, setLocalUntil] = useState(until);
  const [visibleCols, setVisibleCols] = useState<Set<SortKey>>(DEFAULT_VISIBLE);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncError, setSyncError]     = useState<string | null>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);

  // Sync local dates when parent preset changes.
  useEffect(() => { setLocalSince(since); }, [since]);
  useEffect(() => { setLocalUntil(until); }, [until]);

  // Close column menu on outside click.
  useEffect(() => {
    if (!colMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [colMenuOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/ad-breakdown?channel=${sourceKey}&since=${localSince}&until=${localUntil}`,
      );
      const json = await res.json() as { ads?: AdRow[] };
      setAds(json.ads ?? []);
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, sourceKey, localSince, localUntil]);

  useEffect(() => { load(); }, [load]);

  const activeColumns = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  const sorted = [...ads].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  function toggleCol(key: SortKey) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least one column
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Grand total row
  const grand = ads.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      reach:       acc.reach       + r.reach,
      clicks:      acc.clicks      + r.clicks,
      video_views: acc.video_views + r.video_views,
      conversions: acc.conversions + r.conversions,
      spend:       acc.spend       + r.spend,
    }),
    { impressions: 0, reach: 0, clicks: 0, video_views: 0, conversions: 0, spend: 0 },
  );

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/sync/${sourceKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, since: localSince, until: localUntil }),
      });
      const json = await res.json();
      if (!json.ok) setSyncError(json.error ?? json.message ?? 'Error al sincronizar');
      else await load();
    } catch (e) {
      setSyncError(String(e));
    } finally {
      setSyncing(false);
    }
  }


  return (
    <Card depth="flat" padding={false} className="p-5">
      <CardHeader className="mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Creative Ads Breakdown</CardTitle>
            <p className="text-xs text-[#9CA3AF]">{ads.length} anuncios</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={localSince}
              max={localUntil}
              onChange={e => { setLocalSince(e.target.value); setPage(0); }}
              className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#00BD7D]"
            />
            <span className="text-xs text-[#9CA3AF]">—</span>
            <input
              type="date"
              value={localUntil}
              min={localSince}
              onChange={e => { setLocalUntil(e.target.value); setPage(0); }}
              className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#00BD7D]"
            />

            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing || loading}
              className="flex items-center gap-1.5 text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando…' : 'Sincronizar'}
            </button>

            {/* Column picker */}
            <div className="relative" ref={colMenuRef}>
              <button
                onClick={() => setColMenuOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Columnas
              </button>
              {colMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-3 min-w-[160px]">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Mostrar métricas</p>
                  {ALL_COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className="w-3.5 h-3.5 accent-[#00BD7D]"
                      />
                      <span className="text-xs text-[#374151] group-hover:text-[#111827]">{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {syncError && (
        <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-[#fee2e2] text-[#DC2626] text-xs rounded-lg">
          <span className="font-medium">Error:</span> {syncError}
        </div>
      )}

      {loading || syncing ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#F3F4F6] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[#374151] font-semibold">Sin anuncios en este período</p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Haz clic en <strong>Sincronizar</strong> para importar los datos de Meta para estas fechas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] w-10">#</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280]">Campaña</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280]">Anuncio</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#6B7280] w-20">Creativo</th>
                {activeColumns.map(col => (
                  <th
                    key={col.key}
                    className="py-2 px-3 text-xs font-semibold text-[#6B7280] text-right cursor-pointer select-none whitespace-nowrap hover:text-[#111827]"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'desc'
                          ? <ChevronDown className="w-3 h-3 text-[#00BD7D]" />
                          : <ChevronUp   className="w-3 h-3 text-[#00BD7D]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 opacity-20" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr key={row.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-3 px-3 text-[#9CA3AF] text-xs">{page * PAGE_SIZE + idx + 1}.</td>
                  <td className="py-3 px-3 max-w-[160px]">
                    <p className="text-xs text-[#6B7280] truncate">{row.campaign_name}</p>
                  </td>
                  <td className="py-3 px-3 max-w-[180px]">
                    <p className="text-xs font-medium text-[#111827] truncate">{row.ad_name}</p>
                  </td>
                  <td className="py-3 px-3">
                    {row.thumbnail_url ? (
                      <img
                        src={row.thumbnail_url}
                        alt={row.ad_name}
                        className="w-14 h-14 object-cover rounded-lg border border-[#E5E7EB]"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-[#D1D5DB]" />
                      </div>
                    )}
                  </td>
                  {activeColumns.map(col => (
                    <td key={col.key} className="py-3 px-3 text-right font-mono text-xs text-[#374151]">
                      {fmt(row[col.key] as number, col.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#E5E7EB] bg-[#F9FAFB]">
                <td colSpan={4} className="py-2.5 px-3 text-xs font-bold text-[#374151]">Grand total</td>
                {activeColumns.map(col => (
                  <td key={col.key} className="py-2.5 px-3 text-right font-mono text-xs font-bold text-[#111827]">
                    {fmt(grand[col.key as keyof typeof grand], col.type)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6]">
              <span className="text-xs text-[#9CA3AF]">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, ads.length)} de {ads.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
                </button>
                <span className="text-xs text-[#374151] px-1">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
