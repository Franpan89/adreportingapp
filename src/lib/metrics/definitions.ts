import type { MetricDefinition, MetricConfig } from '@/types';

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'spend',              label: 'Inversión',          unit: 'currency', channels: ['meta','google','tiktok','google_ads'], is_derived: false },
  { key: 'impressions',        label: 'Impresiones',        unit: 'integer',  channels: ['meta','google','tiktok','google_ads'], is_derived: false },
  { key: 'clicks',             label: 'Clics',              unit: 'integer',  channels: ['meta','google','tiktok','google_ads'], is_derived: false },
  { key: 'conversions',        label: 'Conversiones',       unit: 'integer',  channels: ['meta','google','tiktok','google_ads'], is_derived: false },
  { key: 'conversions_value',  label: 'Ingresos',           unit: 'currency', channels: ['meta','google','tiktok','google_ads'], is_derived: false },
  { key: 'reach',              label: 'Alcance',            unit: 'integer',  channels: ['meta','tiktok'],                       is_derived: false },
  { key: 'video_views',        label: 'Vistas de video',    unit: 'integer',  channels: ['meta','tiktok'],                       is_derived: false },
  { key: 'roas',               label: 'ROAS',               unit: 'ratio',    channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'conversions_value / spend' },
  { key: 'ctr',                label: 'CTR',                unit: 'percent',  channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'clicks / impressions * 100' },
  { key: 'cpc',                label: 'CPC',                unit: 'currency', channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'spend / clicks' },
  { key: 'cpm',                label: 'CPM',                unit: 'currency', channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'spend / impressions * 1000' },
  { key: 'cvr',                label: 'Tasa de conv.',      unit: 'percent',  channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'conversions / clicks * 100' },
  { key: 'cpa',                label: 'Costo por conv.',    unit: 'currency', channels: ['meta','google','tiktok','google_ads'], is_derived: true,  formula: 'spend / conversions' },
  // GA4 — organic / sessions
  { key: 'sessions',           label: 'Sesiones',           unit: 'integer',  channels: ['ga4'],                                  is_derived: false },
  { key: 'organic_users',      label: 'Usuarios orgánicos', unit: 'integer',  channels: ['ga4'],                                  is_derived: false },
  // GSC — organic search
  { key: 'organic_clicks',     label: 'Clics orgánicos',    unit: 'integer',  channels: ['gsc'],                                  is_derived: false },
  { key: 'organic_impressions',label: 'Impresiones búsq.',  unit: 'integer',  channels: ['gsc'],                                  is_derived: false },
  { key: 'organic_position',   label: 'Posición media',     unit: 'decimal',  channels: ['gsc'],                                  is_derived: false },
  { key: 'organic_ctr',        label: 'CTR orgánico',       unit: 'percent',  channels: ['gsc'],                                  is_derived: true,  formula: 'organic_clicks / organic_impressions * 100' },
];

export const DEFAULT_METRIC_CONFIG: MetricConfig[] = [
  { metric_key: 'spend',             label: 'Inversión',        unit: 'currency', is_visible: true,  display_order: 0,  show_in_kpi: true,  show_in_table: true,  show_in_chart: true  },
  { metric_key: 'roas',              label: 'ROAS',             unit: 'ratio',    is_visible: true,  display_order: 1,  show_in_kpi: true,  show_in_table: true,  show_in_chart: true  },
  { metric_key: 'conversions_value', label: 'Ingresos',         unit: 'currency', is_visible: true,  display_order: 2,  show_in_kpi: true,  show_in_table: true,  show_in_chart: false },
  { metric_key: 'conversions',       label: 'Conversiones',     unit: 'integer',  is_visible: true,  display_order: 3,  show_in_kpi: true,  show_in_table: true,  show_in_chart: false },
  { metric_key: 'impressions',       label: 'Impresiones',      unit: 'integer',  is_visible: true,  display_order: 4,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'clicks',            label: 'Clics',            unit: 'integer',  is_visible: true,  display_order: 5,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'ctr',               label: 'CTR',              unit: 'percent',  is_visible: true,  display_order: 6,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpc',               label: 'CPC',              unit: 'currency', is_visible: true,  display_order: 7,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpm',               label: 'CPM',              unit: 'currency', is_visible: true,  display_order: 8,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpa',               label: 'Costo por conv.',  unit: 'currency', is_visible: true,  display_order: 9,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'reach',             label: 'Alcance',          unit: 'integer',  is_visible: false, display_order: 10, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'video_views',       label: 'Vistas de video',  unit: 'integer',  is_visible: false, display_order: 11, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cvr',               label: 'Tasa de conv.',    unit: 'percent',  is_visible: false, display_order: 12, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
];

export function getMetricDef(key: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find(m => m.key === key);
}
