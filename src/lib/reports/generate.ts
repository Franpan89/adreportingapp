import type { SupabaseClient } from '@supabase/supabase-js';
import type { SpendResult, TopCreative, Channel, PeriodTotals } from '@/types';

export interface GeneratedContent {
  executive_summary: string;
  recommendations: string;
  spend_vs_results: SpendResult[];
  top_creatives: TopCreative[];
  period_totals: PeriodTotals;
}

// ── Objective classification ──────────────────────────────────────────────────

type ObjectiveGroup =
  | 'awareness_reach'  // KPI: impressions, reach, CPM — NO conversions
  | 'video_views'      // KPI: ThruPlays, cost/view
  | 'traffic'          // KPI: clicks, CTR, CPC
  | 'engagement'       // KPI: interactions, cost/interaction
  | 'messages'         // KPI: conversations, cost/message
  | 'conversions';     // KPI: conversions, CPA, leads

function classifyObjective(objective: string | null | undefined): ObjectiveGroup {
  const obj = (objective ?? '').toUpperCase();
  if (obj.includes('AWARENESS') || obj.includes('REACH') || obj === 'BRAND_AWARENESS')
    return 'awareness_reach';
  if (obj.includes('VIDEO'))
    return 'video_views';
  if (obj.includes('TRAFFIC') || obj.includes('LINK_CLICK'))
    return 'traffic';
  if (obj.includes('ENGAGEMENT') && !obj.includes('CONVERSATION'))
    return 'engagement';
  if (obj.includes('MESSAGE') || obj.includes('CONVERSATION'))
    return 'messages';
  // SALES, CONVERSIONS, LEADS, LEAD_GENERATION, CATALOG, default
  return 'conversions';
}

const GROUP_LABEL: Record<ObjectiveGroup, string> = {
  awareness_reach: 'Reconocimiento / Alcance',
  video_views:     'Vistas de Video',
  traffic:         'Tráfico',
  engagement:      'Interacción',
  messages:        'Mensajes / Conversaciones',
  conversions:     'Conversiones / Leads',
};

const GROUP_KPIS: Record<ObjectiveGroup, string> = {
  awareness_reach: 'Alcance, Impresiones, CPM, Frecuencia. NUNCA menciones conversiones ni CPA para estas campañas.',
  video_views:     'ThruPlays, Costo por vista, Impresiones. NUNCA menciones conversiones ni CPA.',
  traffic:         'Clics, CTR, CPC. Las conversiones no son el objetivo principal.',
  engagement:      'Interacciones (reacciones, comentarios, compartidos), Costo por interacción.',
  messages:        'Conversaciones iniciadas, Costo por mensaje/conversación, Tasa de respuesta.',
  conversions:     'Conversiones (leads/mensajes/compras), CPA, Tasa de conversión.',
};

// ── Main function ─────────────────────────────────────────────────────────────

export async function generateReportContent(
  supabase: SupabaseClient,
  clientId: string,
  periodStart: string,
  periodEnd: string,
): Promise<GeneratedContent> {

  // ── 1. Campaign-level stats (with objectives) ─────────────────────────────
  type CampStatRow = { spend?: number; conversions?: number; impressions?: number; clicks?: number; reach?: number; link_clicks?: number; video_views?: number };
  type CampRow = {
    id: string; name: string; channel: string; objective: string | null;
    cr_daily_stats?: CampStatRow[];
  };

  const { data: campRows } = await supabase
    .from('cr_campaigns')
    .select('id, name, channel, objective, cr_daily_stats(spend, conversions, impressions, clicks, reach, link_clicks, video_views)')
    .eq('client_id', clientId)
    .gte('cr_daily_stats.date', periodStart)
    .lte('cr_daily_stats.date', periodEnd);

  type CampaignStat = {
    id: string; name: string; channel: string; objective: string | null;
    group: ObjectiveGroup;
    spend: number; conversions: number; impressions: number;
    clicks: number; reach: number; video_views: number;
    cpm: number; ctr: number; cpc: number; cpa: number;
  };

  const campaigns: CampaignStat[] = ((campRows ?? []) as CampRow[])
    .map(c => {
      const s: CampStatRow[] = c.cr_daily_stats ?? [];
      const sum = (k: keyof CampStatRow) => s.reduce((a, r) => a + (Number(r[k]) || 0), 0);
      const spend       = round2(sum('spend'));
      const conversions = Math.round(sum('conversions'));
      const impressions = Math.round(sum('impressions'));
      const clicks      = Math.round(sum('clicks'));
      const reach       = Math.round(sum('reach'));
      const video_views = Math.round(sum('video_views'));
      return {
        id: c.id, name: c.name, channel: c.channel, objective: c.objective,
        group: classifyObjective(c.objective),
        spend, conversions, impressions, clicks, reach, video_views,
        cpm: impressions > 0 ? round2((spend / impressions) * 1000) : 0,
        ctr: impressions > 0 ? round2((clicks  / impressions) * 100)  : 0,
        cpc: clicks > 0       ? round2(spend / clicks)                  : 0,
        cpa: conversions > 0  ? round2(spend / conversions)             : 0,
      };
    })
    .filter(c => c.spend > 0 || c.impressions > 0);

  // ── 2. Channel-level aggregation (for spend_vs_results + period_totals) ───
  const { data: statsRows } = await supabase
    .from('cr_daily_stats')
    .select('channel, spend, conversions, impressions, clicks, reach, link_clicks, video_views')
    .eq('client_id', clientId)
    .gte('date', periodStart)
    .lte('date', periodEnd);

  const channelMap = new Map<string, { spend: number; conversions: number; impressions: number; clicks: number; reach: number; link_clicks: number; video_views: number }>();
  for (const row of statsRows ?? []) {
    const key = String(row.channel);
    const e = channelMap.get(key) ?? { spend: 0, conversions: 0, impressions: 0, clicks: 0, reach: 0, link_clicks: 0, video_views: 0 };
    channelMap.set(key, {
      spend:        e.spend        + (Number(row.spend)        || 0),
      conversions:  e.conversions  + (Number(row.conversions)  || 0),
      impressions:  e.impressions  + (Number(row.impressions)  || 0),
      clicks:       e.clicks       + (Number(row.clicks)       || 0),
      reach:        e.reach        + (Number(row.reach)        || 0),
      link_clicks:  e.link_clicks  + (Number(row.link_clicks)  || 0),
      video_views:  e.video_views  + (Number(row.video_views)  || 0),
    });
  }

  let totSpend = 0, totConversions = 0, totImpressions = 0, totReach = 0, totInteractions = 0;
  for (const v of channelMap.values()) {
    totSpend        += v.spend;
    totConversions  += v.conversions;
    totImpressions  += v.impressions;
    totReach        += v.reach;
    totInteractions += v.link_clicks + v.video_views;
  }
  const period_totals: PeriodTotals = {
    spend:        round2(totSpend),
    conversions:  Math.round(totConversions),
    impressions:  Math.round(totImpressions),
    reach:        Math.round(totReach),
    interactions: Math.round(totInteractions),
  };

  const spend_vs_results: SpendResult[] = Array.from(channelMap.entries())
    .filter(([, v]) => v.spend > 0)
    .map(([channel, v]) => ({
      channel:     channel as Channel,
      spend:       round2(v.spend),
      conversions: Math.round(v.conversions),
      cpa:         v.conversions > 0 ? round2(v.spend / v.conversions) : 0,
      roas:        0,
    }))
    .sort((a, b) => b.spend - a.spend);

  // ── 3. Top creatives ──────────────────────────────────────────────────────
  const { data: adRows } = await supabase
    .from('cr_ads')
    .select('name, channel, thumbnail_url, cr_ad_daily_stats(spend, conversions, impressions, clicks)')
    .eq('client_id', clientId)
    .gte('cr_ad_daily_stats.date', periodStart)
    .lte('cr_ad_daily_stats.date', periodEnd);

  type S = { spend?: number; conversions?: number; impressions?: number; clicks?: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top_creatives: TopCreative[] = (adRows ?? [] as any[])
    .map((ad: { name: string; channel: string; thumbnail_url?: string | null; cr_ad_daily_stats?: S[] }) => {
      const stats: S[] = ad.cr_ad_daily_stats ?? [];
      const spend       = stats.reduce((a, s) => a + (Number(s.spend)       || 0), 0);
      const conversions = stats.reduce((a, s) => a + (Number(s.conversions) || 0), 0);
      const impressions = stats.reduce((a, s) => a + (Number(s.impressions) || 0), 0);
      const clicks      = stats.reduce((a, s) => a + (Number(s.clicks)      || 0), 0);
      return { name: ad.name, channel: ad.channel as Channel, thumbnail_url: ad.thumbnail_url ?? null, spend, conversions, impressions, clicks };
    })
    .filter(a => a.spend > 0)
    .sort((a, b) => b.conversions - a.conversions || b.spend - a.spend)
    .map(a => ({
      name:          a.name,
      channel:       a.channel,
      spend:         round2(a.spend),
      impressions:   a.impressions,
      ctr:           a.impressions > 0 ? round2((a.clicks / a.impressions) * 100) : 0,
      conversions:   Math.round(a.conversions),
      thumbnail_url: a.thumbnail_url,
    }));

  // ── 4. Build objective-aware prompt ───────────────────────────────────────
  const apiKey     = process.env.OPENROUTER_API_KEY;
  const hasMetrics = campaigns.length > 0 || spend_vs_results.length > 0;

  let executive_summary = '';
  let recommendations   = '';

  if (apiKey && hasMetrics) {
    // Group campaigns by objective for the prompt
    const byGroup = new Map<ObjectiveGroup, CampaignStat[]>();
    for (const c of campaigns) {
      if (!byGroup.has(c.group)) byGroup.set(c.group, []);
      byGroup.get(c.group)!.push(c);
    }

    const campaignSection = campaigns.length > 0
      ? Array.from(byGroup.entries()).map(([group, camps]) => {
          const groupLabel = GROUP_LABEL[group];
          const kpis       = GROUP_KPIS[group];
          const lines = camps.map(c => {
            const base = `  - "${c.name}": $${c.spend.toFixed(2)} invertidos, ${c.impressions.toLocaleString()} impresiones, alcance ${c.reach.toLocaleString()}`;
            if (group === 'awareness_reach')
              return `${base}, CPM $${c.cpm.toFixed(2)}`;
            if (group === 'video_views')
              return `${base}, ${c.video_views.toLocaleString()} ThruPlays, CPM $${c.cpm.toFixed(2)}`;
            if (group === 'traffic')
              return `${base}, ${c.clicks.toLocaleString()} clics, CTR ${c.ctr.toFixed(2)}%, CPC $${c.cpc.toFixed(2)}`;
            if (group === 'engagement')
              return `${base}, ${c.conversions.toLocaleString()} interacciones`;
            // messages / conversions
            return `${base}, ${c.conversions} conversiones, CPA $${c.cpa.toFixed(2)}`;
          }).join('\n');
          return `[OBJETIVO: ${groupLabel}]\nKPIs a evaluar → ${kpis}\nCampañas:\n${lines}`;
        }).join('\n\n')
      : 'Sin datos de campañas individuales.';

    // Conversion-focused campaigns only (for top ad context)
    const convCamps = campaigns.filter(c => c.group === 'messages' || c.group === 'conversions');
    const topAd = top_creatives[0];
    const topAdLine = topAd && convCamps.length > 0
      ? `Mejor anuncio de conversión: "${topAd.name}" — ${topAd.conversions} conversiones, CPA $${topAd.conversions > 0 ? round2(topAd.spend / topAd.conversions).toFixed(2) : 'N/A'}, ${topAd.impressions.toLocaleString()} impresiones, CTR ${topAd.ctr.toFixed(2)}%`
      : '';

    const prompt =
      `Eres un trafficker digital y analista de medios senior. Redacta un informe profesional en español para presentar a un cliente.\n\n` +
      `PERÍODO: ${periodStart} al ${periodEnd}\n` +
      `INVERSIÓN TOTAL: $${period_totals.spend.toFixed(2)}\n` +
      `IMPRESIONES TOTALES: ${period_totals.impressions.toLocaleString()}\n` +
      `ALCANCE TOTAL: ${period_totals.reach > 0 ? period_totals.reach.toLocaleString() : 'no disponible'}\n\n` +
      `══ CAMPAÑAS DEL PERÍODO ══\n${campaignSection}\n\n` +
      (topAdLine ? `ANUNCIO DESTACADO:\n${topAdLine}\n\n` : '') +
      `══ REGLAS DE ORO (OBLIGATORIAS) ══\n` +
      `1. Campañas de RECONOCIMIENTO / ALCANCE: analiza EXCLUSIVAMENTE alcance, impresiones, CPM y frecuencia. JAMÁS menciones conversiones, CPA ni leads en estas campañas.\n` +
      `2. Campañas de CONVERSIÓN / MENSAJES: analiza conversiones, CPA y eficiencia del embudo.\n` +
      `3. Campañas de TRÁFICO: analiza clics, CTR y CPC. No uses conversiones como KPI principal.\n` +
      `4. Usa números EXACTOS del período. Sin inventar cifras.\n` +
      `5. NUNCA menciones ROAS.\n` +
      `6. Tono consultivo y profesional, como si fueras el trafficker que rinde cuentas al cliente.\n\n` +
      `Responde ÚNICAMENTE con JSON válido:\n` +
      `{\n` +
      `  "executive_summary": "3 párrafos profesionales. Párrafo 1: visión general de la inversión y resultados globales del período, diferenciando objetivos (reconocimiento vs conversión). Párrafo 2: performance por tipo de campaña — para reconocimiento habla de alcance/CPM; para conversión habla de leads/CPA; menciona el anuncio estrella si aplica. Párrafo 3: conclusión estratégica sobre el mix de campañas y eficiencia general.",\n` +
      `  "recommendations": "5 recomendaciones numeradas, separadas por \\n. Cada recomendación debe: (a) ser específica con datos del período, (b) respetar el objetivo de cada campaña (no pedir 'más conversiones' a una campaña de reconocimiento), (c) dar una acción concreta. Formato: '1. [Acción concreta].'\n` +
      `}`;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://reporting.webmymoney.com',
          'X-Title':      'WMM Client Reporting',
        },
        body: JSON.stringify({
          model:       'openai/gpt-4o-mini',
          messages:    [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens:  2000,
        }),
      });

      if (res.ok) {
        const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw   = json.choices?.[0]?.message?.content?.trim() ?? '';
        const clean = raw.startsWith('```') ? raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim() : raw;
        const parsed = JSON.parse(clean) as { executive_summary?: string; recommendations?: string | string[] };
        executive_summary = parsed.executive_summary ?? '';
        if (Array.isArray(parsed.recommendations)) {
          recommendations = (parsed.recommendations as string[])
            .map((r, i) => `${i + 1}. ${String(r).replace(/^\s*\d+[.)]\s+/, '').trim()}`)
            .join('\n');
        } else {
          recommendations = parsed.recommendations ?? '';
        }
      }
    } catch {
      // Fall through to defaults
    }
  }

  if (!executive_summary) {
    const convTotal = campaigns.filter(c => c.group === 'messages' || c.group === 'conversions')
      .reduce((a, c) => a + c.conversions, 0);
    executive_summary = hasMetrics
      ? `Período ${periodStart} al ${periodEnd}: inversión total $${period_totals.spend.toFixed(0)}, ` +
        `${period_totals.impressions.toLocaleString()} impresiones, alcance ${period_totals.reach.toLocaleString()}` +
        (convTotal > 0 ? `, ${convTotal} conversiones.` : '.')
      : `Reporte del período ${periodStart} al ${periodEnd}. No se encontraron datos de inversión sincronizados.`;
  }

  if (!recommendations) {
    recommendations = 'Revisar métricas del período según el objetivo de cada campaña. Campañas de reconocimiento: optimizar CPM y alcance. Campañas de conversión: ajustar CPA y creativos de mayor rendimiento.';
  }

  return { executive_summary, recommendations, spend_vs_results, top_creatives, period_totals };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
