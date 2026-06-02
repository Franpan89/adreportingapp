import type {
  ClientReport, TopCreative, SpendResult, AudienceSegment,
  SocialGrowthMetric, Channel, PeriodTotals, DemographicData, DemographicBreakdownRow,
  CampaignSummary,
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
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr)) {
        return arr.map(s => String(s).replace(/^\s*\d+[.)]\s+/, '').trim()).filter(Boolean);
      }
    } catch { /* fall through */ }
  }
  const parts = str.split(/(?=\n\s*\d+[.)]\s+)/);
  const cleaned = parts.map(s => s.replace(/^\s*\d+[.)]\s+/, '').trim()).filter(Boolean);
  return cleaned.length > 1 ? cleaned : [str];
}

export function ReportView({ report, clientName, demographics, campaigns }: { report: ClientReport; clientName?: string; demographics?: DemographicData | null; campaigns?: CampaignSummary[] }) {
  const accent = report.accent_color ?? '#00BD7D';
  const publishedDate = new Date(report.published_at ?? report.created_at)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const recs = parseRecommendations(report.recommendations);
  const topCreative = report.top_creatives[0] ?? null;

  return (
    <article className="report max-w-4xl mx-auto bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden print:shadow-none print:max-w-none">

      {/* ══ PORTADA ══ */}
      <CoverPage report={report} accent={accent} clientName={clientName} />

      {/* ══ PÁGINAS DE CONTENIDO ══ */}
      <div className="bg-white">

        {/* Header strip on each content page */}
        <PageHeader report={report} accent={accent} clientName={clientName} />

        {/* ── KPI Strip ── */}
        {report.period_totals && <KpiStrip totals={report.period_totals} accent={accent} />}

        {/* ── 1. RESUMEN EJECUTIVO ── */}
        <Section title="RESUMEN EJECUTIVO" accent={accent}>
          <div className={`grid gap-8 items-start ${topCreative?.thumbnail_url ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {(topCreative?.full_picture_url ?? topCreative?.thumbnail_url) && (
              <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#1a1a1a]">
                <img
                  src={topCreative.full_picture_url ?? topCreative.thumbnail_url!}
                  alt={topCreative.name}
                  className="w-full object-contain"
                  style={{ maxHeight: 320 }}
                  loading="eager"
                />
                <div className="px-3 py-2 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                  <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-0.5">Anuncio destacado</p>
                  <p className="text-xs font-semibold text-[#111827] line-clamp-2">{topCreative.name}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-base leading-relaxed text-[#374151] whitespace-pre-line" style={{ color: accent === '#00BD7D' ? '#374151' : undefined }}>
                {report.executive_summary}
              </p>
            </div>
          </div>
        </Section>

        {/* ── 2. INFORME DE ANUNCIOS ── */}
        <Section title="INFORME DE ANUNCIOS" accent={accent}>
          {report.top_creatives.length === 0 ? (
            <EmptyNote>No hay datos de anuncios para este período.</EmptyNote>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ background: accent }}>
                    <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3 w-8">#</th>
                    <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Campaña</th>
                    <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Anuncio</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Impr.</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Alcance</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Clics</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">ThruPlay</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Conv.</th>
                    <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-3 py-3">Inversión</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_creatives.map((c, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                      <td className="px-3 py-3 text-center">
                        {i < 3 ? (
                          <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center mx-auto" style={{ background: accent }}>
                            {i + 1}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9CA3AF] font-medium">{i + 1}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 max-w-[120px]">
                        <p className="text-[10px] text-[#6B7280] line-clamp-2 leading-snug">{c.campaign_name ?? '—'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {(c.full_picture_url ?? c.thumbnail_url) ? (
                            <img
                              src={c.full_picture_url ?? c.thumbnail_url!}
                              alt=""
                              className="w-10 h-10 rounded-lg object-contain shrink-0 border border-[#E5E7EB] bg-[#f3f4f6]"
                              loading="eager"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] shrink-0 flex items-center justify-center text-[#D1D5DB]">🖼</div>
                          )}
                          <p className="text-[10px] font-semibold text-[#111827] line-clamp-2 leading-snug max-w-[120px]">{c.name}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] tabular-nums text-[#374151]">{fmtCompact(c.impressions)}</td>
                      <td className="px-3 py-3 text-right text-[11px] tabular-nums text-[#374151]">{fmtCompact(c.reach ?? 0)}</td>
                      <td className="px-3 py-3 text-right text-[11px] tabular-nums text-[#374151]">{fmtCompact(c.clicks ?? 0)}</td>
                      <td className="px-3 py-3 text-right text-[11px] tabular-nums text-[#374151]">{fmtCompact(c.video_views ?? 0)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>{c.conversions}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-[11px] font-semibold tabular-nums text-[#111827]">{fmtCurrency(c.spend)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: accent }}>
                    <td colSpan={3} className="px-3 py-3 text-xs font-bold text-[#374151]">
                      TOTALES — {report.top_creatives.length} anuncio{report.top_creatives.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] font-bold tabular-nums text-[#374151]">
                      {fmtCompact(report.top_creatives.reduce((a, c) => a + c.impressions, 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] font-bold tabular-nums text-[#374151]">
                      {fmtCompact(report.top_creatives.reduce((a, c) => a + (c.reach ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] font-bold tabular-nums text-[#374151]">
                      {fmtCompact(report.top_creatives.reduce((a, c) => a + (c.clicks ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] font-bold tabular-nums text-[#374151]">
                      {fmtCompact(report.top_creatives.reduce((a, c) => a + (c.video_views ?? 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold tabular-nums" style={{ color: accent }}>
                      {report.top_creatives.reduce((a, c) => a + c.conversions, 0)}
                    </td>
                    <td className="px-3 py-3 text-right text-[11px] font-bold tabular-nums text-[#374151]">
                      {fmtCurrency(report.top_creatives.reduce((a, c) => a + c.spend, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Section>

        {/* ── 3. DESGLOSE DE CAMPAÑAS ── */}
        {(campaigns?.length ?? 0) > 0 && (
          <Section title="DESGLOSE DE CAMPAÑAS" accent={accent}>
            <CampaignBreakdownSection campaigns={campaigns!} accent={accent} />
          </Section>
        )}

        {/* ── 4. INVERSIÓN POR CANAL ── */}
        {report.spend_vs_results.length > 0 && (
          <Section title="INVERSIÓN Y RESULTADOS POR CANAL" accent={accent}>
            <div className="space-y-3">
              {report.spend_vs_results.map((r, i) => (
                <SpendResultBar key={i} row={r} max={maxSpend(report.spend_vs_results)} accent={accent} />
              ))}
              <SpendResultTotals rows={report.spend_vs_results} accent={accent} />
            </div>
          </Section>
        )}

        {/* ── 5. CRECIMIENTO EN REDES ── */}
        <Section title="CRECIMIENTO EN REDES SOCIALES" accent={accent}>
          {report.social_growth.length === 0 ? (
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[#374151]">Aún no hay historial de seguidores</p>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-md mx-auto">
                Comenzamos a registrar los seguidores de Facebook e Instagram desde hoy.
                El próximo reporte mostrará el crecimiento real del período.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.social_growth.map((s, i) => <SocialCard key={i} metric={s} accent={accent} />)}
            </div>
          )}
        </Section>

        {/* ── 6. AUDIENCIA Y DEMOGRAFÍA ── */}
        <Section title="AUDIENCIA Y DEMOGRAFÍA" accent={accent}>
          <DemographicsSection demographics={demographics ?? null} accent={accent} />
        </Section>

        {/* ── 7. CONCLUSIONES Y RECOMENDACIONES ── */}
        <Section title="CONCLUSIONES Y RECOMENDACIONES" accent={accent} last>
          {recs.length === 0 ? (
            <EmptyNote>Sin recomendaciones registradas.</EmptyNote>
          ) : (
            <ol className="space-y-4">
              {recs.map((rec, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span
                    className="shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center mt-0.5 shadow-sm"
                    style={{ background: accent }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#374151] leading-relaxed pt-1">{rec}</p>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* ── Footer ── */}
        <footer className="border-t-4 px-10 py-5 flex items-center justify-between print:break-before-page" style={{ borderColor: accent }}>
          <span className="text-sm font-semibold text-[#374151]">{report.agency_name ?? 'Web My Money'}</span>
          <span className="text-xs text-[#9CA3AF]">{publishedDate}</span>
        </footer>
      </div>
    </article>
  );
}

/* ─────────────── Cover Page ─────────────── */
function CoverPage({ report, accent, clientName }: { report: ClientReport; accent: string; clientName?: string }) {
  const periodLabel = formatPeriodMonth(report.period_start, report.period_end);
  const displayName = clientName ?? report.title;
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-12 py-20 print:min-h-screen print:break-after-page"
      style={{ background: accent, minHeight: 560 }}
    >
      {report.agency_logo_url ? (
        <div className="bg-white rounded-2xl px-8 py-4 mb-10 inline-block shadow-sm">
          <img
            src={report.agency_logo_url}
            alt="Logo agencia"
            className="h-20 max-w-[220px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <p className="text-white text-4xl font-bold mb-10 tracking-wide">{report.agency_name ?? ''}</p>
      )}

      <h1 className="text-white text-5xl font-black uppercase tracking-wider mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
        Informe de Pautaje
      </h1>
      <p className="text-white/80 text-2xl mb-14" style={{ fontFamily: 'Oswald, sans-serif' }}>
        {periodLabel}
      </p>

      <div className="text-white">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60 mb-2">Cliente</p>
        {report.client_logo_url ? (
          <img
            src={report.client_logo_url}
            alt="Logo cliente"
            className="h-16 max-w-[200px] object-contain mx-auto mt-2"
            style={{ filter: 'brightness(0) invert(1)' }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <p className="text-white text-3xl font-semibold">{displayName}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Page Header ─────────────── */
function PageHeader({ report, accent, clientName }: { report: ClientReport; accent: string; clientName?: string }) {
  const periodLabel = formatPeriodMonth(report.period_start, report.period_end);
  const displayName = clientName ?? report.title;
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b-4 print:break-inside-avoid" style={{ borderColor: accent }}>
      <div className="flex items-center gap-3">
        {report.agency_logo_url ? (
          <img src={report.agency_logo_url} alt="" className="h-12 max-w-[140px] object-contain" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-base font-bold" style={{ color: accent }}>{report.agency_name ?? ''}</span>
        )}
      </div>
      <div className="text-right text-sm">
        <p className="text-[#374151]">
          <span className="font-bold">Informe de Pautaje: </span>
          <span style={{ color: accent }}>{periodLabel}</span>
        </p>
        <p className="text-[#374151]">
          <span className="font-bold">Cliente: </span>
          <span style={{ color: accent }}>{displayName}</span>
        </p>
      </div>
    </div>
  );
}

/* ─────────────── KPI Strip ─────────────── */
function KpiStrip({ totals, accent }: { totals: PeriodTotals; accent: string }) {
  const kpis = [
    { label: 'Inversión total',  value: fmtCurrency(totals.spend) },
    { label: 'Conversiones',     value: fmtNumber(totals.conversions) },
    { label: 'Impresiones',      value: fmtCompact(totals.impressions) },
    { label: 'Alcance',          value: fmtCompact(totals.reach) },
    { label: 'Interacciones',    value: fmtCompact(totals.interactions) },
  ];
  return (
    <div className="grid grid-cols-5 divide-x divide-[#F3F4F6] border-b border-[#F3F4F6]">
      {kpis.map(({ label, value }) => (
        <div key={label} className="px-4 py-5 text-center">
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
  title, children, last, accent,
}: {
  title: string; children: React.ReactNode; last?: boolean; accent: string;
}) {
  return (
    <section className={`px-8 py-8 ${last ? '' : 'border-b border-[#F3F4F6]'} print:break-inside-avoid`}>
      <h2
        className="text-2xl font-black text-[#111827] mb-6 text-center uppercase tracking-wider"
        style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.08em' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#9CA3AF] italic text-center">{children}</p>;
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
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ch.color }} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Inversión</p>
          <p className="mt-0.5 font-bold text-[#111827] tabular-nums">{fmtCurrency(row.spend)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">CPA</p>
          <p className="mt-0.5 font-bold text-[#111827] tabular-nums">{row.cpa > 0 ? fmtCurrency(row.cpa) : '—'}</p>
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
      <div className="flex items-center gap-8 text-xs">
        <div>
          <p className="text-white/70 uppercase tracking-wider text-[10px]">Total inversión</p>
          <p className="font-bold mt-0.5 text-sm">{fmtCurrency(spend)}</p>
        </div>
        <div>
          <p className="text-white/70 uppercase tracking-wider text-[10px]">Total conversiones</p>
          <p className="font-bold mt-0.5 text-sm">{conv}</p>
        </div>
      </div>
      <div className="text-xs text-right">
        <p className="text-white/70 uppercase tracking-wider text-[10px]">CPA promedio</p>
        <p className="font-bold mt-0.5 text-sm">{cpa > 0 ? fmtCurrency(cpa) : '—'}</p>
      </div>
    </div>
  );
}

/* ─────────────── Demographics ─────────────── */
function DemographicsSection({ demographics, accent }: { demographics: DemographicData | null; accent: string }) {
  const hasData = demographics && (
    demographics.gender.length > 0 || demographics.age.length > 0 ||
    demographics.countries.length > 0 || demographics.regions.length > 0
  );

  if (!hasData) {
    return (
      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-6 text-center">
        <p className="text-sm text-[#6B7280]">
          No hay datos demográficos disponibles para este período. Asegúrate de que la cuenta de Meta Ads esté sincronizada.
        </p>
      </div>
    );
  }

  const { gender, age, countries, regions } = demographics!;
  const maxAge     = Math.max(...age.map(r => r.reach), 1);
  const maxCountry = Math.max(...countries.map(r => r.reach), 1);
  const maxRegion  = Math.max(...regions.map(r => r.reach), 1);

  return (
    <div className="space-y-6">
      {/* Gender + Age row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Género */}
        {gender.length > 0 && (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-4">Género</p>
            <div className="space-y-3">
              {gender.map(g => (
                <DemoBar key={g.label} row={g} max={100} usePercent accent={accent} />
              ))}
            </div>
          </div>
        )}

        {/* Edad */}
        {age.length > 0 && (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-4">Rango de edad</p>
            <div className="space-y-2">
              {age.map(a => (
                <DemoBar key={a.label} row={a} max={maxAge} accent={accent} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Countries + Regions row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Países */}
        {countries.length > 0 && (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-4">Países</p>
            <div className="space-y-2">
              {countries.map(c => (
                <DemoBar key={c.label} row={c} max={maxCountry} accent={accent} />
              ))}
            </div>
          </div>
        )}

        {/* Regiones / Ciudades */}
        {regions.length > 0 && (
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold mb-4">Regiones / Ciudades</p>
            <div className="space-y-2">
              {regions.map(r => (
                <DemoBar key={r.label} row={r} max={maxRegion} accent={accent} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoBar({
  row, max, accent, usePercent,
}: {
  row: DemographicBreakdownRow; max: number; accent: string; usePercent?: boolean;
}) {
  const barPct = max > 0 ? Math.max(2, Math.round((usePercent ? row.pct : row.reach) / max * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[#374151]">{row.label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>{row.pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: accent }} />
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-0.5 tabular-nums">{fmtNumber(row.reach)} personas</p>
    </div>
  );
}

/* ─────────────── Audiences (legacy — kept for backwards compat) ─────────────── */
function AudienceCard({ audience, accent }: { audience: AudienceSegment; accent: string }) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
      <p className="text-sm font-bold text-[#111827] mb-3">{audience.name}</p>
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Alcance estimado</p>
          <p className="mt-0.5 font-bold tabular-nums text-[#111827]">{fmtNumber(audience.reach)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Engagement</p>
          <p className="mt-0.5 font-bold tabular-nums" style={{ color: accent }}>{audience.engagement_rate.toFixed(1)}%</p>
        </div>
      </div>
      {audience.notes && (
        <p className="text-[11px] text-[#6B7280] pt-3 border-t border-[#E5E7EB] italic leading-relaxed">{audience.notes}</p>
      )}
    </div>
  );
}

/* ─────────────── Social growth ─────────────── */
function SocialCard({ metric, accent }: { metric: SocialGrowthMetric; accent: string }) {
  const positive = metric.growth_pct >= 0;
  const diff = metric.followers_end - metric.followers_start;
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-bold text-[#111827]">{PLATFORM_LABELS[metric.platform]}</p>
        <span
          className="text-sm font-bold tabular-nums px-3 py-1 rounded-full"
          style={positive
            ? { background: accent + '20', color: accent }
            : { background: '#fee2e2', color: '#DC2626' }}
        >
          {positive ? '↑' : '↓'} {Math.abs(metric.growth_pct).toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Seguidores actuales</p>
          <p className="text-2xl font-bold tabular-nums text-[#111827] mt-0.5">{fmtNumber(metric.followers_end)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">Variación del período</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: positive ? accent : '#DC2626' }}>
            {positive ? '+' : ''}{fmtNumber(diff)}
          </p>
        </div>
      </div>
      {metric.followers_start > 0 && (
        <p className="text-[10px] text-[#9CA3AF] mt-3 pt-3 border-t border-[#E5E7EB]">
          Inicio del período: {fmtNumber(metric.followers_start)} seguidores
        </p>
      )}
    </div>
  );
}

/* ─────────────── Campaign Breakdown ─────────────── */
const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_ENGAGEMENT:               'Interacción',
  OUTCOME_ENGAGEMENT_CONVERSATIONS: 'Mensajes',
  OUTCOME_TRAFFIC:                  'Tráfico',
  OUTCOME_LEADS:                    'Leads',
  OUTCOME_SALES:                    'Ventas',
  OUTCOME_AWARENESS:                'Reconocimiento',
  OUTCOME_APP_PROMOTION:            'App',
  CONVERSIONS:                      'Conversiones',
  MESSAGES:                         'Mensajes',
  LINK_CLICKS:                      'Clics al enlace',
  REACH:                            'Alcance',
  BRAND_AWARENESS:                  'Reconocimiento',
  PAGE_LIKES:                       'Me gusta',
  VIDEO_VIEWS:                      'Vídeo',
  LEAD_GENERATION:                  'Generación de leads',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: 'Activo',   color: '#059669', bg: '#D1FAE5' },
  PAUSED:   { label: 'Pausado',  color: '#D97706', bg: '#FEF3C7' },
  ARCHIVED: { label: 'Archivado', color: '#6B7280', bg: '#F3F4F6' },
  DELETED:  { label: 'Eliminado', color: '#DC2626', bg: '#FEE2E2' },
};

function CampaignBreakdownSection({ campaigns, accent }: { campaigns: CampaignSummary[]; accent: string }) {
  const totalSpend = campaigns.reduce((a, c) => a + (c.spend ?? 0), 0);
  const totalConv  = campaigns.reduce((a, c) => a + (c.conversions ?? 0), 0);
  const totalImpr  = campaigns.reduce((a, c) => a + (c.impressions ?? 0), 0);
  const totalAvgCpa = totalConv > 0 ? totalSpend / totalConv : 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: accent }}>
            <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Campaña</th>
            <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Objetivo</th>
            <th className="text-left text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Estado</th>
            <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Impresiones</th>
            <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Inversión</th>
            <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">Conv.</th>
            <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">CPA</th>
            <th className="text-right text-white text-[11px] font-bold uppercase tracking-wider px-4 py-3">CTR</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c, i) => {
            const statusCfg = STATUS_CONFIG[c.status?.toUpperCase() ?? ''] ?? { label: c.status ?? '—', color: '#6B7280', bg: '#F3F4F6' };
            const objectiveLabel = OBJECTIVE_LABELS[c.objective?.toUpperCase() ?? ''] ?? (c.objective ? c.objective.replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase()) : '—');
            return (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                <td className="px-4 py-3 text-xs font-semibold text-[#111827] max-w-[180px]">
                  <p className="line-clamp-2 leading-snug">{c.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: accent + '18', color: accent }}>
                    {objectiveLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums text-[#374151]">{fmtCompact(c.impressions ?? 0)}</td>
                <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-[#111827]">{fmtCurrency(c.spend ?? 0)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>{c.conversions ?? 0}</span>
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums" style={{ color: (c.cpa ?? 0) > 0 ? '#374151' : '#9CA3AF' }}>
                  {(c.cpa ?? 0) > 0 ? fmtCurrency(c.cpa!) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums text-[#374151]">
                  {(c.ctr ?? 0) > 0 ? `${(c.ctr!).toFixed(2)}%` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2" style={{ borderColor: accent }}>
            <td colSpan={3} className="px-4 py-3 text-xs font-bold text-[#374151]">
              TOTALES — {campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''}
            </td>
            <td className="px-4 py-3 text-right text-xs font-bold text-[#374151] tabular-nums">{fmtCompact(totalImpr)}</td>
            <td className="px-4 py-3 text-right text-xs font-bold text-[#374151] tabular-nums">{fmtCurrency(totalSpend)}</td>
            <td className="px-4 py-3 text-right text-sm font-bold tabular-nums" style={{ color: accent }}>{totalConv}</td>
            <td className="px-4 py-3 text-right text-xs font-bold tabular-nums" style={{ color: accent }}>
              {totalAvgCpa > 0 ? fmtCurrency(totalAvgCpa) : '—'}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─────────────── Formatters ─────────────── */
function maxSpend(rows: SpendResult[]) {
  return rows.reduce((a, r) => Math.max(a, r.spend), 0);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('es-MX').format(n);
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPeriodMonth(start: string, end: string) {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end   + 'T12:00:00');
  // Same month → "Noviembre 2025"
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase());
  }
  const sLabel = s.toLocaleDateString('es-MX', { month: 'short' });
  const eLabel = e.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  return `${sLabel} — ${eLabel}`;
}
