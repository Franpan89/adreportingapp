import type {
  ClientReport, TopCreative, SpendResult, AudienceSegment,
  SocialGrowthMetric, Channel, PeriodTotals,
} from '@/types';

const CHANNEL_META: Record<Channel, { label: string; color: string; bg: string }> = {
  meta_ads:              { label: 'Meta Ads',       color: '#1877F2', bg: '#EBF3FF' },
  google_ads:            { label: 'Google Ads',     color: '#EA4335', bg: '#FEECEB' },
  tiktok_ads:            { label: 'TikTok Ads',     color: '#010101', bg: '#F0F0F0' },
  meta_page:             { label: 'Facebook',       color: '#1877F2', bg: '#EBF3FF' },
  meta_instagram:        { label: 'Instagram',      color: '#C13584', bg: '#FCE7F3' },
  linkedin:              { label: 'LinkedIn',       color: '#0A66C2', bg: '#E0F2FE' },
  pinterest:             { label: 'Pinterest',      color: '#E60023', bg: '#FEE2E2' },
  tiktok_organic:        { label: 'TikTok',         color: '#010101', bg: '#F0F0F0' },
  youtube:               { label: 'YouTube',        color: '#FF0000', bg: '#FEE2E2' },
  ga4:                   { label: 'Analytics',      color: '#F9AB00', bg: '#FEF3CD' },
  google_search_console: { label: 'Search Console', color: '#4285F4', bg: '#E8F0FE' },
  shopify:               { label: 'Shopify',        color: '#95BF47', bg: '#F1F8E9' },
  ghl:                   { label: 'GoHighLevel',    color: '#312E81', bg: '#E0E7FF' },
  klaviyo:               { label: 'Klaviyo',        color: '#7C3AED', bg: '#F3E8FF' },
  yotpo:                 { label: 'Yotpo',          color: '#D97706', bg: '#FEF3C7' },
  toast:                 { label: 'Toast',          color: '#FB7185', bg: '#FFE4E6' },
  email_sms:             { label: 'Email/SMS',      color: '#6B7280', bg: '#F3F4F6' },
};

const PLATFORM_LABELS: Record<SocialGrowthMetric['platform'], string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  youtube: 'YouTube',     linkedin: 'LinkedIn', x: 'X (Twitter)',
};

function parseRecommendations(text: string): string[] {
  if (!text?.trim()) return [];
  const str = text.trim();

  // AI sometimes stores recommendations as a JSON array string
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        return arr
          .map(s => String(s).replace(/^\s*\d+[.)]\s+/, '').trim())
          .filter(Boolean);
      }
    } catch { /* fall through */ }
  }

  // Standard numbered list: "1. ...\n2. ..."
  const parts = str.split(/(?=\n\s*\d+[.)]\s+)/);
  const cleaned = parts.map(s => s.replace(/^\s*\d+[.)]\s+/, '').trim()).filter(Boolean);
  return cleaned.length > 1 ? cleaned : [str];
}

export function ReportView({ report }: { report: ClientReport }) {
  const accent = report.accent_color ?? '#00BD7D';
  const accentLight = accent + '18'; // ~10% opacity hex approximation
  const publishedDate = new Date(report.published_at ?? report.created_at)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  const recs = parseRecommendations(report.recommendations);

  return (
    <article className="report max-w-4xl mx-auto bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden print:shadow-none print:border-0 print:rounded-none print:max-w-none">

      {/* ── Accent top bar ── */}
      <div style={{ background: accent, height: 5 }} />

      {/* ── Cover ── */}
      <header className="px-10 pt-10 pb-8 border-b border-[#F3F4F6] print:break-after-page">
        {/* Logo row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {report.agency_logo_url ? (
              <img src={report.agency_logo_url} alt="Logo agencia" className="h-20 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-10 flex items-center">
                <span className="text-sm font-semibold text-[#9CA3AF]">{report.agency_name ?? ''}</span>
              </div>
            )}
          </div>
          {report.client_logo_url && (
            <img src={report.client_logo_url} alt="Logo cliente" className="h-20 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
          )}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>
          Informe de Rendimiento
        </p>
        <h1
          className="text-4xl font-bold text-[#111827] leading-tight mb-3"
          style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.02em' }}
        >
          {report.title}
        </h1>
        <p className="text-sm text-[#6B7280]">
          Período: <span className="font-semibold text-[#374151]">{formatPeriod(report.period_start, report.period_end)}</span>
        </p>
      </header>

      {/* ── KPI Strip ── */}
      {report.period_totals && <KpiStrip totals={report.period_totals} accent={accent} />}

      {/* ── 1. Resumen Ejecutivo ── */}
      <Section number={1} title="Resumen Ejecutivo" accent={accent}>
        <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-line">
          {report.executive_summary}
        </p>
      </Section>

      {/* ── 2. Mejores Creativos ── */}
      <Section number={2} title="Mejores Creativos" accent={accent}>
        {report.top_creatives.length === 0 ? (
          <EmptyNote>No hay datos de creativos para este período.</EmptyNote>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {report.top_creatives.map((c, i) => <CreativeCard key={i} creative={c} accent={accent} rank={i + 1} />)}
          </div>
        )}
      </Section>

      {/* ── 3. Inversión y Resultados ── */}
      <Section number={3} title="Inversión y Resultados por Canal" accent={accent}>
        {report.spend_vs_results.length === 0 ? (
          <EmptyNote>No hay datos de inversión para este período.</EmptyNote>
        ) : (
          <div className="space-y-3">
            {report.spend_vs_results.map((r, i) => (
              <SpendResultBar key={i} row={r} max={maxSpend(report.spend_vs_results)} accent={accent} />
            ))}
            <SpendResultTotals rows={report.spend_vs_results} accent={accent} />
          </div>
        )}
      </Section>

      {/* ── 4. Audiencias ── */}
      <Section number={4} title="Audiencias" accent={accent}>
        {report.audiences.length === 0 ? (
          <EmptyNote>No hay datos de audiencias para este período.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.audiences.map((a, i) => <AudienceCard key={i} audience={a} accent={accent} />)}
          </div>
        )}
      </Section>

      {/* ── 5. Crecimiento en Redes ── */}
      <Section number={5} title="Crecimiento en Redes Sociales" accent={accent}>
        {report.social_growth.length === 0 ? (
          <EmptyNote>No hay datos de crecimiento de seguidores para este período.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.social_growth.map((s, i) => <SocialCard key={i} metric={s} accent={accent} />)}
          </div>
        )}
      </Section>

      {/* ── 6. Recomendaciones ── */}
      <Section number={6} title="Conclusiones y Recomendaciones" accent={accent} last>
        {recs.length === 0 ? (
          <EmptyNote>Sin recomendaciones registradas.</EmptyNote>
        ) : (
          <ol className="space-y-3">
            {recs.map((rec, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span
                  className="shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{ background: accent }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-[#374151] leading-relaxed">{rec}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t-4 px-10 py-5 flex items-center justify-between" style={{ borderColor: accent }}>
        <span className="text-sm font-semibold text-[#374151]">
          {report.agency_name ?? 'Web My Money'}
        </span>
        <span className="text-xs text-[#9CA3AF]">{publishedDate}</span>
      </footer>
    </article>
  );
}

/* ─────────────── KPI Strip ─────────────── */
function KpiStrip({ totals, accent }: { totals: PeriodTotals; accent: string }) {
  const kpis = [
    { label: 'Inversión total', value: fmtCurrency(totals.spend) },
    { label: 'Conversiones',    value: fmtNumber(totals.conversions) },
    { label: 'Impresiones',     value: fmtCompact(totals.impressions) },
    { label: 'Alcance',         value: fmtCompact(totals.reach) },
    { label: 'Interacciones',   value: fmtCompact(totals.interactions) },
  ];
  return (
    <div className="grid grid-cols-5 divide-x divide-[#F3F4F6] border-b border-[#F3F4F6] print:break-inside-avoid">
      {kpis.map(({ label, value }) => (
        <div key={label} className="px-5 py-5 text-center">
          <p className="text-xl font-bold text-[#111827] tabular-nums" style={{ fontFamily: 'Oswald, sans-serif' }}>
            {value}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-1 font-medium">{label}</p>
          <div className="mt-2 h-0.5 w-8 mx-auto rounded-full" style={{ background: accent }} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Section shell ─────────────── */
function Section({
  number, title, children, last, accent,
}: {
  number: number; title: string; children: React.ReactNode; last?: boolean; accent: string;
}) {
  return (
    <section className={`px-10 py-8 ${last ? '' : 'border-b border-[#F3F4F6]'} print:break-inside-avoid`}>
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
          style={{ background: accent }}
        >
          {number}
        </span>
        <h2
          className="text-xl font-bold text-[#111827]"
          style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.03em' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#9CA3AF] italic">{children}</p>;
}

/* ─────────────── Creative card ─────────────── */
function CreativeCard({ creative, accent, rank }: { creative: TopCreative; accent: string; rank: number }) {
  const ch = CHANNEL_META[creative.channel];
  return (
    <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative bg-[#1a1a1a] overflow-hidden" style={{ height: '200px' }}>
        {creative.thumbnail_url ? (
          <img
            src={creative.thumbnail_url}
            alt={creative.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F3F4F6]">
            <span className="text-4xl text-[#D1D5DB]">🖼</span>
          </div>
        )}
        {/* Rank badge */}
        {rank <= 3 && (
          <span
            className="absolute top-2 left-2 w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow"
            style={{ background: accent }}
          >
            #{rank}
          </span>
        )}
        {/* Channel badge */}
        <span
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ color: ch.color, background: ch.bg }}
        >
          {ch.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-xs font-semibold text-[#111827] leading-snug line-clamp-2 mb-2">{creative.name}</p>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#9CA3AF]">Inversión</p>
            <p className="text-xs font-bold text-[#111827] tabular-nums">{fmtCurrencyCompact(creative.spend)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#9CA3AF]">Conv.</p>
            <p className="text-xs font-bold tabular-nums" style={{ color: accent }}>{creative.conversions}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#9CA3AF]">CTR</p>
            <p className="text-xs font-bold text-[#111827] tabular-nums">{creative.ctr.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Spend vs results ─────────────── */
function SpendResultBar({ row, max, accent }: { row: SpendResult; max: number; accent: string }) {
  const ch = CHANNEL_META[row.channel];
  const pct = max > 0 ? Math.max(4, Math.round((row.spend / max) * 100)) : 0;
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: ch.color }}>{ch.label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: accent + '18', color: accent }}>
          {row.conversions} conv.
        </span>
      </div>
      <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ch.color }} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Inversión</p>
          <p className="mt-0.5 font-bold text-[#111827] tabular-nums">{fmtCurrency(row.spend)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">CPA</p>
          <p className="mt-0.5 font-bold text-[#111827] tabular-nums">{fmtCurrency(row.cpa)}</p>
        </div>
      </div>
    </div>
  );
}

function SpendResultTotals({ rows, accent }: { rows: SpendResult[]; accent: string }) {
  const spend = rows.reduce((a, r) => a + r.spend, 0);
  const conv  = rows.reduce((a, r) => a + r.conversions, 0);
  const cpa   = conv > 0 ? spend / conv : 0;
  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl text-white" style={{ background: accent }}>
      <div className="flex items-center gap-6 text-xs">
        <div>
          <p className="text-white/70 uppercase tracking-wider text-[10px]">Total inversión</p>
          <p className="font-bold mt-0.5">{fmtCurrency(spend)}</p>
        </div>
        <div>
          <p className="text-white/70 uppercase tracking-wider text-[10px]">Total conversiones</p>
          <p className="font-bold mt-0.5">{conv}</p>
        </div>
      </div>
      <div className="text-xs text-right">
        <p className="text-white/70 uppercase tracking-wider text-[10px]">CPA promedio</p>
        <p className="font-bold mt-0.5">{fmtCurrency(cpa)}</p>
      </div>
    </div>
  );
}

/* ─────────────── Audiences ─────────────── */
function AudienceCard({ audience, accent }: { audience: AudienceSegment; accent: string }) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
      <p className="text-sm font-semibold text-[#111827] mb-3">{audience.name}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Alcance</p>
          <p className="mt-0.5 font-bold tabular-nums text-[#111827]">{fmtNumber(audience.reach)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Engagement</p>
          <p className="mt-0.5 font-bold tabular-nums" style={{ color: accent }}>{audience.engagement_rate.toFixed(1)}%</p>
        </div>
      </div>
      {audience.notes && (
        <p className="text-[11px] text-[#6B7280] mt-3 pt-3 border-t border-[#E5E7EB] italic">{audience.notes}</p>
      )}
    </div>
  );
}

/* ─────────────── Social growth ─────────────── */
function SocialCard({ metric, accent }: { metric: SocialGrowthMetric; accent: string }) {
  const positive = metric.growth_pct >= 0;
  const diff = metric.followers_end - metric.followers_start;
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#111827]">{PLATFORM_LABELS[metric.platform]}</p>
        <span
          className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
          style={positive
            ? { background: accent + '18', color: accent }
            : { background: '#fee2e2', color: '#DC2626' }}
        >
          {positive ? '+' : ''}{metric.growth_pct.toFixed(1)}%
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-[#111827]">{fmtNumber(metric.followers_end)}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">
        seguidores · {positive ? '+' : ''}{fmtNumber(diff)} vs inicio
      </p>
    </div>
  );
}

/* ─────────────── Formatters ─────────────── */
function maxSpend(rows: SpendResult[]) {
  return rows.reduce((a, r) => Math.max(a, r.spend), 0);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtCurrencyCompact(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return fmtCurrency(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('es-MX').format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  const e = new Date(end   + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${s} — ${e}`;
}
