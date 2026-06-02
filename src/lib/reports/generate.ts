import type { SupabaseClient } from '@supabase/supabase-js';
import type { SpendResult, TopCreative, Channel, PeriodTotals } from '@/types';

export interface GeneratedContent {
  executive_summary: string;
  recommendations: string;
  spend_vs_results: SpendResult[];
  top_creatives: TopCreative[];
  period_totals: PeriodTotals;
}

export async function generateReportContent(
  supabase: SupabaseClient,
  clientId: string,
  periodStart: string,
  periodEnd: string,
): Promise<GeneratedContent> {
  // ── 1. Aggregate channel metrics ──────────────────────────────────────────
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

  // Aggregate period totals across all channels
  let totSpend = 0, totConversions = 0, totImpressions = 0, totReach = 0, totInteractions = 0;
  for (const v of channelMap.values()) {
    totSpend        += v.spend;
    totConversions  += v.conversions;
    totImpressions  += v.impressions;
    totReach        += v.reach;
    totInteractions += v.link_clicks + v.video_views; // proxy for interactions
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
      roas:        0, // not used — clients measured by conversions/messages
    }))
    .sort((a, b) => b.spend - a.spend);

  // ── 2. Top creatives from cr_ads ──────────────────────────────────────────
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

  // ── 3. Call OpenRouter for narrative + AI-estimated audiences ─────────────
  const apiKey = process.env.OPENROUTER_API_KEY;
  const hasMetrics = spend_vs_results.length > 0;

  let executive_summary = '';
  let recommendations   = '';

  if (apiKey && hasMetrics) {
    const totalConv  = period_totals.conversions;
    const totalSpend = period_totals.spend;
    const avgCpa     = totalConv > 0 ? round2(totalSpend / totalConv) : 0;

    const channelLines = spend_vs_results
      .map(r => `- ${r.channel}: $${r.spend.toFixed(2)} invertidos, ${r.conversions} conversiones, CPA $${r.cpa.toFixed(2)}`)
      .join('\n');

    const allAdLines = top_creatives
      .map((c, i) => `${i + 1}. "${c.name}" (${c.channel}): $${c.spend.toFixed(2)} invertidos, ${c.conversions} conversiones, CPA $${c.conversions > 0 ? round2(c.spend / c.conversions).toFixed(2) : 'N/A'}, ${c.impressions.toLocaleString()} impresiones, CTR ${c.ctr.toFixed(2)}%`)
      .join('\n') || 'Sin datos de anuncios individuales.';

    const topAd = top_creatives[0];
    const topAdSummary = topAd
      ? `Anuncio #1: "${topAd.name}" con ${topAd.conversions} conversiones y CPA $${topAd.conversions > 0 ? round2(topAd.spend / topAd.conversions).toFixed(2) : 'N/A'}`
      : '';

    const prompt =
      `Eres analista senior de marketing digital. Genera un informe profesional en español.\n\n` +
      `PERÍODO: ${periodStart} al ${periodEnd}\n` +
      `MÉTRICAS CLAVE:\n` +
      `- Inversión total: $${totalSpend.toFixed(2)}\n` +
      `- Conversiones totales (mensajes/leads): ${totalConv}\n` +
      `- CPA promedio: $${avgCpa.toFixed(2)}\n` +
      `- Impresiones totales: ${period_totals.impressions.toLocaleString()}\n` +
      `- Alcance total: ${period_totals.reach > 0 ? period_totals.reach.toLocaleString() : 'no disponible'}\n\n` +
      `RENDIMIENTO POR CANAL:\n${channelLines}\n\n` +
      `TODOS LOS ANUNCIOS DEL PERÍODO:\n${allAdLines}\n\n` +
      (topAdSummary ? `ANUNCIO DESTACADO: ${topAdSummary}\n\n` : '') +
      `REGLAS:\n` +
      `- NUNCA menciones ROAS\n` +
      `- Usa los números EXACTOS del período en el resumen\n` +
      `- El resumen debe mencionar el anuncio #1 por nombre exacto\n` +
      `- Las recomendaciones deben referenciar datos concretos del período\n\n` +
      `Responde ÚNICAMENTE con JSON válido:\n` +
      `{\n` +
      `  "executive_summary": "3 párrafos. Párrafo 1: resultados generales con números exactos (inversión, conversiones totales, CPA). Párrafo 2: destacar el anuncio con mejor performance mencionando su nombre, conversiones y CPA. Párrafo 3: conclusión sobre el rendimiento general y oportunidades. Tono profesional.",\n` +
      `  "recommendations": "5 recomendaciones numeradas separadas por \\n. Cada una DEBE ser específica y referenciar datos del período. Formato: '1. [Acción concreta basada en los datos]'. Sin ROAS."\n` +
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
          temperature: 0.7,
          max_tokens:  1800,
        }),
      });

      if (res.ok) {
        const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw   = json.choices?.[0]?.message?.content?.trim() ?? '';
        const clean = raw.startsWith('```') ? raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim() : raw;
        const parsed = JSON.parse(clean) as {
          executive_summary?: string;
          recommendations?: string;
        };
        executive_summary = parsed.executive_summary ?? '';
        // AI sometimes returns recommendations as an array despite the prompt asking for a string
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
    if (hasMetrics) {
      const tot = spend_vs_results.reduce((a, r) => ({ s: a.s + r.spend, c: a.c + r.conversions }), { s: 0, c: 0 });
      executive_summary =
        `Período ${periodStart} al ${periodEnd}: inversión total $${tot.s.toFixed(0)}, ` +
        `${tot.c} conversiones en ${spend_vs_results.length} canal${spend_vs_results.length > 1 ? 'es' : ''}. ` +
        `Ver detalle por canal y creativos ganadores en las secciones siguientes.`;
    } else {
      executive_summary = `Reporte del período ${periodStart} al ${periodEnd}. No se encontraron datos de inversión sincronizados para este período.`;
    }
  }

  if (!recommendations) {
    recommendations = 'Revisar métricas del período, ajustar presupuesto según canales con mejor rendimiento y renovar creativos según sea necesario.';
  }

  return { executive_summary, recommendations, spend_vs_results, top_creatives, period_totals };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
