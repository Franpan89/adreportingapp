import type { ClientReport } from '@/types';

/**
 * Mock client reports store.
 * In-memory, mutable across the process. Enough for demo mode.
 * When Supabase is wired up, this file is replaced by `src/lib/supabase/reports.ts`
 * using the same fallback pattern as licenses.
 */
export const MOCK_REPORTS: ClientReport[] = [
  {
    id: 'rpt-001',
    client_id: 'client-1',
    title: 'Reporte Mensual — Marzo 2026',
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    status: 'published',
    created_at: '2026-04-02T10:00:00Z',
    published_at: '2026-04-02T11:30:00Z',
    created_by: 'admin@demo.com',
    executive_summary:
      'Marzo cerró con una inversión total de $18,420 en Meta y Google, generando 412 conversiones (CPA promedio $44.70). Crecimiento de 18% en conversiones vs. febrero, apalancado por la campaña "Primavera Luxe" en Meta. Audiencias lookalike 1% superaron a los intereses amplios en 2.3x ROAS.',
    top_creatives: [
      { name: 'Video Primavera Luxe · 30s', channel: 'meta_ads',   spend: 4210, impressions: 620000, ctr: 2.8, conversions: 142 },
      { name: 'Carrusel · Skincare Kit',    channel: 'meta_ads',   spend: 2890, impressions: 410000, ctr: 2.1, conversions: 88 },
      { name: 'Search · Luxe Cosmetics',    channel: 'google_ads', spend: 3480, impressions: 185000, ctr: 6.4, conversions: 96 },
      { name: 'YouTube Shorts · Brand',     channel: 'google_ads', spend: 1620, impressions: 720000, ctr: 1.2, conversions: 34 },
    ],
    spend_vs_results: [
      { channel: 'meta_ads',   spend: 9820, conversions: 244, cpa: 40.25, roas: 3.8 },
      { channel: 'google_ads', spend: 8600, conversions: 168, cpa: 51.19, roas: 2.9 },
    ],
    audiences: [
      { name: 'Lookalike 1% compradores (LTV alto)', reach: 340000, engagement_rate: 4.1, notes: 'Mejor performer del mes' },
      { name: 'Retargeting · 30d',                    reach: 85000,  engagement_rate: 6.8, notes: 'ROAS 5.2' },
      { name: 'Intereses · Skincare premium',         reach: 920000, engagement_rate: 1.9 },
      { name: 'Broad (AI targeting)',                  reach: 1400000, engagement_rate: 1.1, notes: 'Buen descubrimiento, baja conversión' },
    ],
    social_growth: [
      { platform: 'instagram', followers_start: 48200, followers_end: 51340, growth_pct: 6.5 },
      { platform: 'tiktok',    followers_start: 12100, followers_end: 14860, growth_pct: 22.8 },
      { platform: 'facebook',  followers_start: 33500, followers_end: 33890, growth_pct: 1.2 },
      { platform: 'youtube',   followers_start: 2300,  followers_end: 2810,  growth_pct: 22.2 },
    ],
    recommendations:
      '1) Escalar presupuesto +30% en "Primavera Luxe" manteniendo targeting Lookalike 1%. 2) Pausar audiencia "Broad AI" o limitar a 15% del budget hasta mejorar CPA. 3) Producir 3 variantes nuevas del video de 30s para evitar fatiga creativa en Abril. 4) Activar campaña de email retargeting para los 12.5k carritos abandonados de Marzo.',
  },
  {
    id: 'rpt-002',
    client_id: 'client-1',
    title: 'Campaña Primavera Luxe — Resumen Final',
    period_start: '2026-02-15',
    period_end: '2026-03-20',
    status: 'published',
    created_at: '2026-03-22T14:00:00Z',
    published_at: '2026-03-22T15:10:00Z',
    created_by: 'admin@demo.com',
    executive_summary:
      'La campaña "Primavera Luxe" corrió 34 días con inversión total de $7,100 y generó 198 conversiones directas (CPA $35.85) + 82 asistidas. ROAS 4.2. Superó el objetivo de CPA ($45) en 20%.',
    top_creatives: [
      { name: 'Video Primavera Luxe · 30s', channel: 'meta_ads', spend: 4210, impressions: 620000, ctr: 2.8, conversions: 142 },
      { name: 'Reel · UGC Testimonial',     channel: 'meta_ads', spend: 1890, impressions: 310000, ctr: 3.4, conversions: 56 },
    ],
    spend_vs_results: [
      { channel: 'meta_ads', spend: 7100, conversions: 198, cpa: 35.85, roas: 4.2 },
    ],
    audiences: [
      { name: 'Lookalike 1% compradores', reach: 280000, engagement_rate: 4.3 },
      { name: 'Retargeting web 14d',       reach: 42000,  engagement_rate: 7.1 },
    ],
    social_growth: [
      { platform: 'instagram', followers_start: 49100, followers_end: 51340, growth_pct: 4.6 },
    ],
    recommendations:
      'Replicar estructura en campaña "Verano Luxe" con inicio en Junio. Reservar budget para versión TikTok del creativo ganador. Crear Lookalike 2% para escalar reach manteniendo calidad.',
  },
  {
    id: 'rpt-003',
    client_id: 'client-2',
    title: 'Reporte Mensual — Marzo 2026',
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    status: 'published',
    created_at: '2026-04-03T09:00:00Z',
    published_at: '2026-04-03T09:30:00Z',
    created_by: 'admin@demo.com',
    executive_summary:
      'Marzo mostró estabilidad en inversión ($12,300) con ligero aumento de CPA (+8%) por estacionalidad. TikTok continúa siendo el canal de mayor crecimiento en reach.',
    top_creatives: [
      { name: 'TikTok Trend · Reto Marca', channel: 'tiktok_ads', spend: 2100, impressions: 890000, ctr: 3.9, conversions: 64 },
      { name: 'Meta · Collab Influencer',  channel: 'meta_ads',   spend: 3400, impressions: 480000, ctr: 2.2, conversions: 78 },
    ],
    spend_vs_results: [
      { channel: 'meta_ads',   spend: 7200, conversions: 178, cpa: 40.45, roas: 3.1 },
      { channel: 'tiktok_ads', spend: 5100, conversions: 112, cpa: 45.54, roas: 2.6 },
    ],
    audiences: [
      { name: 'Engagers TikTok 30d',      reach: 120000, engagement_rate: 5.8 },
      { name: 'Intereses · Fashion Gen Z', reach: 680000, engagement_rate: 2.3 },
    ],
    social_growth: [
      { platform: 'tiktok',    followers_start: 38000, followers_end: 44200, growth_pct: 16.3 },
      { platform: 'instagram', followers_start: 22400, followers_end: 23100, growth_pct: 3.1 },
    ],
    recommendations:
      'Doblar apuesta en TikTok con 2 campañas paralelas: una de awareness (broad) y una de conversión (lookalike). Producir 4 variantes de creativo TikTok por mes para evitar fatiga.',
  },
];

export function getReportsForClient(clientId: string): ClientReport[] {
  return MOCK_REPORTS
    .filter(r => r.client_id === clientId && r.status === 'published')
    .sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at));
}

export function getReportById(id: string): ClientReport | null {
  return MOCK_REPORTS.find(r => r.id === id) ?? null;
}

export function getAllReportsForClient(clientId: string): ClientReport[] {
  return MOCK_REPORTS
    .filter(r => r.client_id === clientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Generate a demo report with realistic mock content for the given client. */
export function createDemoReport(clientId: string, title: string, periodStart: string, periodEnd: string): ClientReport {
  const now = new Date().toISOString();
  const report: ClientReport = {
    id: `rpt-${Date.now().toString(36)}`,
    client_id: clientId,
    title,
    period_start: periodStart,
    period_end: periodEnd,
    status: 'draft',
    created_at: now,
    published_at: null,
    created_by: 'admin@demo.com',
    executive_summary:
      `Período ${periodStart} al ${periodEnd}: inversión y resultados dentro de los objetivos planteados. ` +
      'Ver detalle por canal, creativos ganadores, audiencias y recomendaciones para el próximo ciclo.',
    top_creatives: [
      { name: 'Creativo A · Video 30s',    channel: 'meta_ads',   spend: 3200, impressions: 520000, ctr: 2.6, conversions: 118 },
      { name: 'Creativo B · Carrusel',     channel: 'meta_ads',   spend: 1800, impressions: 310000, ctr: 2.0, conversions: 64 },
      { name: 'Search · Brand Keywords',   channel: 'google_ads', spend: 2400, impressions: 140000, ctr: 6.1, conversions: 82 },
    ],
    spend_vs_results: [
      { channel: 'meta_ads',   spend: 5000, conversions: 182, cpa: 27.47, roas: 3.6 },
      { channel: 'google_ads', spend: 3400, conversions: 98,  cpa: 34.69, roas: 2.9 },
    ],
    audiences: [
      { name: 'Lookalike 1% compradores', reach: 260000, engagement_rate: 3.9 },
      { name: 'Retargeting · 30d',        reach: 58000,  engagement_rate: 6.2 },
      { name: 'Intereses · Top category', reach: 810000, engagement_rate: 1.7 },
    ],
    social_growth: [
      { platform: 'instagram', followers_start: 30000, followers_end: 31850, growth_pct: 6.2 },
      { platform: 'tiktok',    followers_start: 9800,  followers_end: 11300, growth_pct: 15.3 },
    ],
    recommendations:
      'Mantener inversión en canales con ROAS > 3. Renovar creativos cada 3-4 semanas. Explorar nuevos lookalikes basados en compradores de mayor LTV.',
  };
  MOCK_REPORTS.unshift(report);
  return report;
}
