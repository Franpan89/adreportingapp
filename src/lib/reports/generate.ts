import type { SupabaseClient } from '@supabase/supabase-js';
import type { SpendResult, TopCreative, AudienceSegment, Channel, PeriodTotals } from '@/types';

export interface GeneratedContent {
  executive_summary: string;
  recommendations: string;
  spend_vs_results: SpendResult[];
  top_creatives: TopCreative[];
  audiences: AudienceSegment[];
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
  let audiences: AudienceSegment[] = [];

  if (apiKey && hasMetrics) {
    const channelLines = spend_vs_results
      .map(r => `- ${r.channel}: $${r.spend.toFixed(0)} invertidos, ${r.conversions} conversiones (mensajes/leads), CPA $${r.cpa.toFixed(2)}`)
      .join('\n');

    const adLines = top_creatives.slice(0, 3)
      .map(c => `- "${c.name}" (${c.channel}): $${c.spend.toFixed(0)}, ${c.conversions} conv., CTR ${c.ctr.toFixed(1)}%`)
      .join('\n') || 'Sin datos de anuncios individuales.';

    const prompt =
      `Eres analista de marketing digital de la agencia Web My Money.\n` +
      `Genera un análisis en español para el período ${periodStart} al ${periodEnd}.\n` +
      `Los clientes se miden por conversiones (mensajes recibidos/leads) y CPA. NUNCA menciones ROAS.\n\n` +
      `CANALES:\n${channelLines}\n\n` +
      `MEJORES ANUNCIOS:\n${adLines}\n\n` +
      `REACH TOTAL DEL PERÍODO: ${period_totals.reach > 0 ? period_totals.reach.toLocaleString('es-MX') : 'no disponible'}\n\n` +
      `Responde ÚNICAMENTE con JSON válido con esta estructura exacta:\n` +
      `{\n` +
      `  "executive_summary": "2-3 párrafos enfocados en conversiones/mensajes y CPA, tono profesional, sin mencionar ROAS",\n` +
      `  "recommendations": "texto plano con 4-5 recomendaciones numeradas separadas por salto de línea, ejemplo: 1. Texto...\\n2. Texto...\\n3. Texto...",\n` +
      `  "audiences": [\n` +
      `    {"name": "nombre del segmento", "reach": 120000, "engagement_rate": 3.5, "notes": "observación"},\n` +
      `    ... (3-4 segmentos típicos de Meta Ads para este tipo de campaña de conversiones/mensajes)\n` +
      `  ]\n` +
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
          max_tokens:  1100,
        }),
      });

      if (res.ok) {
        const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const raw   = json.choices?.[0]?.message?.content?.trim() ?? '';
        const clean = raw.startsWith('```') ? raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim() : raw;
        const parsed = JSON.parse(clean) as {
          executive_summary?: string;
          recommendations?: string;
          audiences?: AudienceSegment[];
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
        audiences         = Array.isArray(parsed.audiences) ? parsed.audiences : [];
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

  return { executive_summary, recommendations, spend_vs_results, top_creatives, audiences, period_totals };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
