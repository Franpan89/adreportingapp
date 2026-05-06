/**
 * KPI defaults per business type for the consolidated home view.
 *
 * These are SHORTCUTS, not feature gates. Per-client overrides via the
 * metric-config UI win when set. When `business_type` is null, the
 * generic default applies.
 *
 * Each entry is an ordered list of metric keys. The first 5 fill the
 * KPI band on the consolidated home.
 *
 * Naming caveat: the connectors that surface "calls", "appointments",
 * "leads", "MQLs", "demos", "pipeline_value", "orders", "covers", etc.
 * haven't shipped yet. Until they land, the consolidated query falls
 * back to the universal columns we DO have populated from the existing
 * paid-ad sync (cost, impressions, clicks, conversions, conversions_value).
 * This registry holds the *target* labels — the rendering layer
 * substitutes a generic key when the target metric isn't available yet.
 */
import type { BusinessType } from '@/types';

export interface KpiDefault {
  /** Metric key — preferred match in cr_source_daily / cr_daily_stats */
  key: string;
  /** Display label (Spanish — matches the rest of the UI) */
  label: string;
  /** Format hint for KpiCard */
  unit: 'currency' | 'percent' | 'integer' | 'decimal' | 'ratio';
}

const KPIS_BY_BUSINESS: Record<BusinessType, KpiDefault[]> = {
  ecommerce: [
    { key: 'cost',               label: 'Inversión',     unit: 'currency' },
    { key: 'revenue',            label: 'Ingresos',      unit: 'currency' },
    { key: 'conversions',        label: 'Pedidos',       unit: 'integer'  },
    { key: 'blended_roas',       label: 'ROAS',          unit: 'ratio'    },
    { key: 'blended_cpa',        label: 'CPA',           unit: 'currency' },
  ],
  high_ticket_local: [
    { key: 'cost',               label: 'Inversión',           unit: 'currency' },
    { key: 'conversions',        label: 'Leads',               unit: 'integer'  },
    { key: 'blended_cpa',        label: 'Costo por Lead',      unit: 'currency' },
    { key: 'visits',             label: 'Visitas Web',         unit: 'integer'  },
    { key: 'blended_roas',       label: 'ROAS',                unit: 'ratio'    },
  ],
  low_ticket_local: [
    { key: 'cost',               label: 'Inversión',           unit: 'currency' },
    { key: 'conversions',        label: 'Llamadas/Reservas',   unit: 'integer'  },
    { key: 'blended_cpa',        label: 'Costo por Lead',      unit: 'currency' },
    { key: 'visits',             label: 'Visitas Web',         unit: 'integer'  },
    { key: 'engagements',        label: 'Engagement',          unit: 'integer'  },
  ],
  b2b: [
    { key: 'cost',               label: 'Inversión',           unit: 'currency' },
    { key: 'conversions',        label: 'Leads / MQLs',        unit: 'integer'  },
    { key: 'blended_cpa',        label: 'Costo por Lead',      unit: 'currency' },
    { key: 'visits',             label: 'Visitas Web',         unit: 'integer'  },
    { key: 'revenue',            label: 'Pipeline Atribuido',  unit: 'currency' },
  ],
  restaurant: [
    { key: 'cost',               label: 'Inversión',           unit: 'currency' },
    { key: 'conversions',        label: 'Pedidos / Cubiertos', unit: 'integer'  },
    { key: 'revenue',            label: 'Ventas Netas',        unit: 'currency' },
    { key: 'blended_cpa',        label: 'Costo por Pedido',    unit: 'currency' },
    { key: 'visits',             label: 'Visitas',             unit: 'integer'  },
  ],
};

/** Generic 5-card default when no business_type is set on the client. */
const KPIS_GENERIC: KpiDefault[] = [
  { key: 'cost',         label: 'Inversión',     unit: 'currency' },
  { key: 'visits',       label: 'Tráfico',       unit: 'integer'  },
  { key: 'conversions',  label: 'Conversiones',  unit: 'integer'  },
  { key: 'revenue',      label: 'Ingresos',      unit: 'currency' },
  { key: 'blended_roas', label: 'ROAS Blended',  unit: 'ratio'    },
];

export function kpiDefaultsForBusinessType(businessType: BusinessType | null): KpiDefault[] {
  if (!businessType) return KPIS_GENERIC;
  return KPIS_BY_BUSINESS[businessType] ?? KPIS_GENERIC;
}

/** Source-priority order — surfaces relevant sources first in the leaderboard. */
const SOURCES_BY_BUSINESS: Record<BusinessType, string[]> = {
  ecommerce:         ['shopify', 'meta_ads', 'klaviyo', 'yotpo', 'google_ads', 'meta_instagram', 'meta_page', 'tiktok_ads', 'tiktok_organic', 'ga4', 'google_search_console', 'youtube', 'pinterest', 'linkedin', 'ghl', 'email_sms'],
  high_ticket_local: ['ghl', 'meta_ads', 'google_ads', 'meta_page', 'meta_instagram', 'ga4', 'google_search_console', 'tiktok_ads', 'tiktok_organic', 'youtube', 'linkedin', 'pinterest', 'shopify', 'klaviyo', 'yotpo', 'toast', 'email_sms'],
  low_ticket_local:  ['ghl', 'meta_ads', 'google_ads', 'meta_page', 'meta_instagram', 'ga4', 'google_search_console', 'tiktok_ads', 'tiktok_organic', 'youtube', 'linkedin', 'pinterest', 'shopify', 'klaviyo', 'yotpo', 'toast', 'email_sms'],
  b2b:               ['linkedin', 'ghl', 'google_ads', 'ga4', 'meta_ads', 'google_search_console', 'youtube', 'meta_page', 'meta_instagram', 'tiktok_ads', 'tiktok_organic', 'pinterest', 'shopify', 'klaviyo', 'yotpo', 'toast', 'email_sms'],
  restaurant:        ['toast', 'meta_ads', 'meta_page', 'meta_instagram', 'ghl', 'google_ads', 'ga4', 'google_search_console', 'tiktok_ads', 'tiktok_organic', 'youtube', 'linkedin', 'pinterest', 'shopify', 'klaviyo', 'yotpo', 'email_sms'],
};

const GENERIC_PRIORITY = [
  'shopify', 'meta_ads', 'google_ads', 'tiktok_ads', 'ghl', 'klaviyo',
  'meta_instagram', 'meta_page', 'tiktok_organic', 'linkedin', 'pinterest',
  'youtube', 'ga4', 'google_search_console', 'yotpo', 'toast', 'email_sms',
];

/** Returns the input list re-sorted by business-type relevance.
 *  Sources not in the priority list are appended in their original order. */
export function sortSourcesForBusinessType<T extends string>(
  sources: T[],
  businessType: BusinessType | null,
): T[] {
  const priority = businessType ? SOURCES_BY_BUSINESS[businessType] : GENERIC_PRIORITY;
  const rank = new Map(priority.map((s, i) => [s, i]));
  return [...sources].sort((a, b) => {
    const ra = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });
}
