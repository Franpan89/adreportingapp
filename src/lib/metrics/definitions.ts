import type { MetricDefinition, MetricConfig } from '@/types';

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'spend',              label: 'Ad Spend',           unit: 'currency', channels: ['meta','google','tiktok'], is_derived: false },
  { key: 'impressions',        label: 'Impressions',        unit: 'integer',  channels: ['meta','google','tiktok'], is_derived: false },
  { key: 'clicks',             label: 'Clicks',             unit: 'integer',  channels: ['meta','google','tiktok'], is_derived: false },
  { key: 'conversions',        label: 'Conversions',        unit: 'integer',  channels: ['meta','google','tiktok'], is_derived: false },
  { key: 'conversions_value',  label: 'Revenue',            unit: 'currency', channels: ['meta','google','tiktok'], is_derived: false },
  { key: 'reach',              label: 'Reach',              unit: 'integer',  channels: ['meta','tiktok'],           is_derived: false },
  { key: 'video_views',        label: 'Video Views',        unit: 'integer',  channels: ['meta','tiktok'],           is_derived: false },
  { key: 'roas',               label: 'ROAS',               unit: 'ratio',    channels: ['meta','google','tiktok'], is_derived: true,  formula: 'conversions_value / spend' },
  { key: 'ctr',                label: 'CTR',                unit: 'percent',  channels: ['meta','google','tiktok'], is_derived: true,  formula: 'clicks / impressions * 100' },
  { key: 'cpc',                label: 'CPC',                unit: 'currency', channels: ['meta','google','tiktok'], is_derived: true,  formula: 'spend / clicks' },
  { key: 'cpm',                label: 'CPM',                unit: 'currency', channels: ['meta','google','tiktok'], is_derived: true,  formula: 'spend / impressions * 1000' },
  { key: 'cvr',                label: 'Conv. Rate',         unit: 'percent',  channels: ['meta','google','tiktok'], is_derived: true,  formula: 'conversions / clicks * 100' },
  { key: 'cpa',                label: 'Cost per Conv.',     unit: 'currency', channels: ['meta','google','tiktok'], is_derived: true,  formula: 'spend / conversions' },
];

export const DEFAULT_METRIC_CONFIG: MetricConfig[] = [
  { metric_key: 'spend',             label: 'Ad Spend',        unit: 'currency', is_visible: true,  display_order: 0,  show_in_kpi: true,  show_in_table: true,  show_in_chart: true  },
  { metric_key: 'roas',              label: 'ROAS',            unit: 'ratio',    is_visible: true,  display_order: 1,  show_in_kpi: true,  show_in_table: true,  show_in_chart: true  },
  { metric_key: 'conversions_value', label: 'Revenue',         unit: 'currency', is_visible: true,  display_order: 2,  show_in_kpi: true,  show_in_table: true,  show_in_chart: false },
  { metric_key: 'conversions',       label: 'Conversions',     unit: 'integer',  is_visible: true,  display_order: 3,  show_in_kpi: true,  show_in_table: true,  show_in_chart: false },
  { metric_key: 'impressions',       label: 'Impressions',     unit: 'integer',  is_visible: true,  display_order: 4,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'clicks',            label: 'Clicks',          unit: 'integer',  is_visible: true,  display_order: 5,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'ctr',               label: 'CTR',             unit: 'percent',  is_visible: true,  display_order: 6,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpc',               label: 'CPC',             unit: 'currency', is_visible: true,  display_order: 7,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpm',               label: 'CPM',             unit: 'currency', is_visible: true,  display_order: 8,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cpa',               label: 'Cost per Conv.',  unit: 'currency', is_visible: true,  display_order: 9,  show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'reach',             label: 'Reach',           unit: 'integer',  is_visible: false, display_order: 10, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'video_views',       label: 'Video Views',     unit: 'integer',  is_visible: false, display_order: 11, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
  { metric_key: 'cvr',               label: 'Conv. Rate',      unit: 'percent',  is_visible: false, display_order: 12, show_in_kpi: false, show_in_table: true,  show_in_chart: false },
];

export function getMetricDef(key: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find(m => m.key === key);
}
