import type { ClientReport, TopCreative, SpendResult, AudienceSegment, SocialGrowthMetric, Channel } from '@/types';

const CHANNEL_META: Record<Channel, { label: string; color: string; bg: string }> = {
  meta:       { label: 'Meta Ads',     color: '#1877F2', bg: '#EBF3FF' },
  google_ads: { label: 'Google Ads',   color: '#EA4335', bg: '#FEECEB' },
  tiktok:     { label: 'TikTok Ads',   color: '#010101', bg: '#F0F0F0' },
  ga4:        { label: 'Analytics',    color: '#F9AB00', bg: '#FEF3CD' },
  gsc:        { label: 'Search',       color: '#4285F4', bg: '#E8F0FE' },
  gtm:        { label: 'Tag Manager',  color: '#34A853', bg: '#E6F4EA' },
  shopify:    { label: 'Shopify',      color: '#95BF47', bg: '#F1F8E9' },
  ghl:        { label: 'GoHighLevel',  color: '#312E81', bg: '#E0E7FF' },
};

const PLATFORM_LABELS: Record<SocialGrowthMetric['platform'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
};

export function ReportView({ report }: { report: ClientReport }) {
  return (
    <article className="report max-w-4xl mx-auto bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] print:shadow-none print:border-0 print:rounded-none print:max-w-none">
      {/* Cover */}
      <header className="px-10 py-10 border-b border-[#E5E7EB] print:break-after-page">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#00BD7D]">Reporte de Cliente</p>
        <h1
          className="mt-2 text-3xl font-bold text-[#111827] leading-tight"
          style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.02em' }}
        >
          {report.title}
        </h1>
        <p className="mt-3 text-sm text-[#6B7280]">
          Período: <span className="text-[#111827] font-medium">{formatPeriod(report.period_start, report.period_end)}</span>
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Publicado el {formatDate(report.published_at ?? report.created_at)}
        </p>
      </header>

      {/* 1. Resumen Ejecutivo */}
      <Section number={1} title="Resumen Ejecutivo">
        <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-line">
          {report.executive_summary}
        </p>
      </Section>

      {/* 2. Mejores Creativos */}
      <Section number={2} title="Mejores Creativos">
        {report.top_creatives.length === 0 ? (
          <EmptyNote>No hay datos de creativos para este período.</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="py-2 pr-3 font-medium">Creativo</th>
                  <th className="py-2 pr-3 font-medium">Canal</th>
                  <th className="py-2 pr-3 font-medium text-right">Inversión</th>
                  <th className="py-2 pr-3 font-medium text-right">Impresiones</th>
                  <th className="py-2 pr-3 font-medium text-right">CTR</th>
                  <th className="py-2 pl-3 font-medium text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {report.top_creatives.map((c, i) => (
                  <CreativeRow key={i} creative={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* 3. Ad Spent vs Resultados */}
      <Section number={3} title="Ad Spend vs. Resultados">
        {report.spend_vs_results.length === 0 ? (
          <EmptyNote>No hay datos de inversión para este período.</EmptyNote>
        ) : (
          <div className="space-y-3">
            {report.spend_vs_results.map((r, i) => <SpendResultBar key={i} row={r} max={maxSpend(report.spend_vs_results)} />)}
            <SpendResultTotals rows={report.spend_vs_results} />
          </div>
        )}
      </Section>

      {/* 4. Audiencias */}
      <Section number={4} title="Audiencias">
        {report.audiences.length === 0 ? (
          <EmptyNote>No hay datos de audiencias para este período.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.audiences.map((a, i) => <AudienceCard key={i} audience={a} />)}
          </div>
        )}
      </Section>

      {/* 5. Crecimiento en Redes Sociales */}
      <Section number={5} title="Crecimiento en Redes Sociales">
        {report.social_growth.length === 0 ? (
          <EmptyNote>No hay datos de crecimiento para este período.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.social_growth.map((s, i) => <SocialCard key={i} metric={s} />)}
          </div>
        )}
      </Section>

      {/* 6. Resumen y Recomendaciones */}
      <Section number={6} title="Resumen y Recomendaciones" last>
        <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-line">
          {report.recommendations}
        </p>
      </Section>

      {/* Footer */}
      <footer className="px-10 py-6 border-t border-[#E5E7EB] text-[11px] text-[#9CA3AF] flex items-center justify-between">
        <span>Web My Money — Reporte generado automáticamente</span>
        <span>ID: {report.id}</span>
      </footer>
    </article>
  );
}

/* ---------------- Section shell ---------------- */
function Section({ number, title, children, last }: { number: number; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={`px-10 py-8 ${last ? '' : 'border-b border-[#E5E7EB]'} print:break-inside-avoid`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-[#00BD7D] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <h2
          className="text-lg font-bold text-[#111827]"
          style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.02em' }}
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

/* ---------------- Creative row ---------------- */
function CreativeRow({ creative }: { creative: TopCreative }) {
  const c = CHANNEL_META[creative.channel];
  return (
    <tr className="border-b border-[#F3F4F6] last:border-0">
      <td className="py-3 pr-3 text-[#111827] font-medium">{creative.name}</td>
      <td className="py-3 pr-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium" style={{ color: c.color, background: c.bg }}>
          {c.label}
        </span>
      </td>
      <td className="py-3 pr-3 text-right tabular-nums">{fmtCurrency(creative.spend)}</td>
      <td className="py-3 pr-3 text-right tabular-nums text-[#6B7280]">{fmtNumber(creative.impressions)}</td>
      <td className="py-3 pr-3 text-right tabular-nums text-[#6B7280]">{creative.ctr.toFixed(1)}%</td>
      <td className="py-3 pl-3 text-right tabular-nums font-semibold text-[#00BD7D]">{creative.conversions}</td>
    </tr>
  );
}

/* ---------------- Spend vs results ---------------- */
function SpendResultBar({ row, max }: { row: SpendResult; max: number }) {
  const c = CHANNEL_META[row.channel];
  const pct = max > 0 ? Math.max(4, Math.round((row.spend / max) * 100)) : 0;
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: c.color }}>{c.label}</span>
        <span className="text-xs text-[#6B7280]">ROAS <span className="font-bold text-[#111827]">{row.roas.toFixed(1)}x</span></span>
      </div>
      <div className="h-2 bg-white border border-[#E5E7EB] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <Stat label="Inversión" value={fmtCurrency(row.spend)} />
        <Stat label="Conversiones" value={String(row.conversions)} accent />
        <Stat label="CPA" value={fmtCurrency(row.cpa)} />
      </div>
    </div>
  );
}

function SpendResultTotals({ rows }: { rows: SpendResult[] }) {
  const spend = rows.reduce((a, r) => a + r.spend, 0);
  const conv  = rows.reduce((a, r) => a + r.conversions, 0);
  const cpa   = conv > 0 ? spend / conv : 0;
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#111827] text-white rounded-lg">
      <div className="flex items-center gap-6 text-xs">
        <div><span className="text-white/60">Total inversión</span> <span className="font-bold ml-1.5">{fmtCurrency(spend)}</span></div>
        <div><span className="text-white/60">Total conversiones</span> <span className="font-bold ml-1.5">{conv}</span></div>
      </div>
      <div className="text-xs">
        <span className="text-white/60">CPA blend</span>
        <span className="font-bold text-[#00BD7D] ml-1.5">{fmtCurrency(cpa)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">{label}</p>
      <p className={`mt-0.5 font-semibold tabular-nums ${accent ? 'text-[#00BD7D]' : 'text-[#111827]'}`}>{value}</p>
    </div>
  );
}

/* ---------------- Audiences ---------------- */
function AudienceCard({ audience }: { audience: AudienceSegment }) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
      <p className="text-sm font-semibold text-[#111827]">{audience.name}</p>
      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Reach</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#111827]">{fmtNumber(audience.reach)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Engagement</p>
          <p className="mt-0.5 font-semibold tabular-nums text-[#111827]">{audience.engagement_rate.toFixed(1)}%</p>
        </div>
      </div>
      {audience.notes && <p className="text-[11px] text-[#6B7280] mt-3 italic">{audience.notes}</p>}
    </div>
  );
}

/* ---------------- Social growth ---------------- */
function SocialCard({ metric }: { metric: SocialGrowthMetric }) {
  const positive = metric.growth_pct >= 0;
  const diff = metric.followers_end - metric.followers_start;
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[#111827]">{PLATFORM_LABELS[metric.platform]}</p>
        <span
          className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded ${positive ? 'bg-[#dcfce7] text-[#16A34A]' : 'bg-[#fee2e2] text-[#DC2626]'}`}
        >
          {positive ? '+' : ''}{metric.growth_pct.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold tabular-nums text-[#111827]">{fmtNumber(metric.followers_end)}</p>
        <p className="text-xs text-[#6B7280]">
          seguidores <span className="text-[#9CA3AF]">({positive ? '+' : ''}{fmtNumber(diff)})</span>
        </p>
      </div>
      <p className="text-[11px] text-[#9CA3AF] mt-1">
        Inició en {fmtNumber(metric.followers_start)}
      </p>
    </div>
  );
}

/* ---------------- Utils ---------------- */
function maxSpend(rows: SpendResult[]) {
  return rows.reduce((a, r) => Math.max(a, r.spend), 0);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('es-MX').format(n);
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} — ${e}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}
