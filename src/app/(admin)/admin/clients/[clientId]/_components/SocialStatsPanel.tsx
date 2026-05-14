import { createClient } from '@/lib/supabase/server';
import {
  resolveClientMetaToken,
  captureMetaSocialSnapshots,
} from '@/lib/supabase/social-snapshots';
interface Props {
  clientId: string;
}

type Platform = 'facebook' | 'instagram';

interface SnapshotRow {
  platform:    Platform;
  page_id:     string;
  page_name:   string | null;
  followers:   number;
  captured_on: string;
}

/**
 * Server component that captures today's follower snapshot for a client and
 * displays current counts + 30-day delta from stored history.
 */
export async function SocialStatsPanel({ clientId }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Capture today's snapshot (silent on failure)
  const accessToken = await resolveClientMetaToken(supabase, clientId, user?.id ?? null);
  if (accessToken) {
    await captureMetaSocialSnapshots(supabase, clientId, accessToken);
  }

  // 2. Load last 60 days of snapshots for this client
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
  const { data: rows } = await supabase
    .from('cr_social_snapshots')
    .select('platform, page_id, page_name, followers, captured_on')
    .eq('client_id', clientId)
    .gte('captured_on', sixtyDaysAgo)
    .order('captured_on', { ascending: true });

  const snapshots = (rows ?? []) as SnapshotRow[];

  if (snapshots.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">Redes sociales</p>
        <p className="text-sm text-[#6B7280]">
          Conecta Meta para comenzar a registrar el crecimiento de seguidores.
        </p>
      </div>
    );
  }

  // 3. Build platform totals (latest count) + 30-day delta
  const today    = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const platforms: Platform[] = ['facebook', 'instagram'];
  const cards = platforms.map(platform => {
    const platformRows = snapshots.filter(r => r.platform === platform);
    if (platformRows.length === 0) return null;

    // Group by page_id, take latest per page, sum
    const byPage = new Map<string, SnapshotRow[]>();
    for (const r of platformRows) {
      const arr = byPage.get(r.page_id) ?? [];
      arr.push(r);
      byPage.set(r.page_id, arr);
    }

    let currentTotal = 0;
    let pastTotal    = 0;
    let pageName: string | null = null;
    for (const arr of byPage.values()) {
      const latest = arr[arr.length - 1];
      const past   = arr.find(r => r.captured_on <= thirtyAgo) ?? arr[0];
      currentTotal += latest.followers;
      pastTotal    += past.followers;
      pageName = pageName ?? latest.page_name;
    }

    const diff = currentTotal - pastTotal;
    const pct  = pastTotal > 0 ? (diff / pastTotal) * 100 : 0;
    return { platform, currentTotal, diff, pct, pageName, hasHistory: pastTotal !== currentTotal };
  }).filter(Boolean) as Array<{
    platform: Platform; currentTotal: number; diff: number; pct: number;
    pageName: string | null; hasHistory: boolean;
  }>;

  if (cards.length === 0) return null;

  const lastCapture = snapshots[snapshots.length - 1].captured_on;
  const stale = lastCapture < today;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Redes sociales</p>
        {stale && (
          <p className="text-[10px] text-[#9CA3AF]">
            Última lectura: {lastCapture}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(card => (
          <PlatformCard key={card.platform} {...card} />
        ))}
      </div>
    </div>
  );
}

function PlatformCard({
  platform, currentTotal, diff, pct, pageName, hasHistory,
}: {
  platform: Platform; currentTotal: number; diff: number; pct: number;
  pageName: string | null; hasHistory: boolean;
}) {
  const isFb = platform === 'facebook';
  const color = isFb ? '#1877F2' : '#C13584';
  const initials = isFb ? 'f' : 'IG';
  const positive = diff >= 0;
  const fmt = (n: number) => new Intl.NumberFormat('es-MX').format(n);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] border border-[#F3F4F6] rounded-lg">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
          {isFb ? 'Facebook' : 'Instagram'}
          {pageName && <span className="ml-1 text-[#D1D5DB]">· {pageName}</span>}
        </p>
        <p className="text-xl font-bold text-[#111827] tabular-nums leading-tight">{fmt(currentTotal)}</p>
        {hasHistory ? (
          <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: positive ? '#059669' : '#DC2626' }}>
            {positive ? '↑' : '↓'} {fmt(Math.abs(diff))} ({positive ? '+' : ''}{pct.toFixed(1)}%) · 30d
          </p>
        ) : (
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Acumulando historial…</p>
        )}
      </div>
    </div>
  );
}
