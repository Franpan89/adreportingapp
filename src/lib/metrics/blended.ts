// Cross-channel KPI blending
// Inspired by wmm-client-intel/web/lib/blended-metrics.ts

import type { MetricTotals } from '@/types';

export type BusinessType = 'ecommerce' | 'service';

export interface BlendedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  blendedROAS: number | null;
  blendedCTR: number | null;
  blendedCPC: number | null;
  blendedCPA: number | null;
  // Organic (GA4 + GSC)
  totalSessions: number;
  totalOrganicClicks: number;
  organicPosition: number | null;
}

export function blendMetrics(
  channelTotals: Partial<Record<string, MetricTotals>>,
  businessType: BusinessType = 'ecommerce'
): BlendedMetrics {
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;
  let totalSessions = 0;
  let totalOrganicClicks = 0;
  let positionSum = 0;
  let positionCount = 0;

  for (const [channel, totals] of Object.entries(channelTotals)) {
    if (!totals) continue;

    if (channel === 'ga4') {
      totalSessions += totals.sessions ?? 0;
    } else if (channel === 'gsc') {
      totalOrganicClicks += totals.organic_clicks ?? 0;
      if (totals.organic_position != null && totals.organic_position > 0) {
        positionSum += totals.organic_position;
        positionCount++;
      }
    } else {
      // Paid channels: meta, google, tiktok, google_ads
      totalSpend += totals.spend ?? 0;
      totalImpressions += totals.impressions ?? 0;
      totalClicks += totals.clicks ?? 0;
      totalConversions += totals.conversions ?? 0;
      if (businessType === 'ecommerce') {
        totalRevenue += totals.conversions_value ?? 0;
      }
    }
  }

  const blendedROAS = businessType === 'ecommerce' && totalSpend > 0
    ? totalRevenue / totalSpend
    : null;

  const blendedCTR = totalImpressions > 0
    ? (totalClicks / totalImpressions) * 100
    : null;

  const blendedCPC = totalClicks > 0
    ? totalSpend / totalClicks
    : null;

  const blendedCPA = totalConversions > 0
    ? totalSpend / totalConversions
    : null;

  const organicPosition = positionCount > 0
    ? positionSum / positionCount
    : null;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalRevenue,
    blendedROAS,
    blendedCTR,
    blendedCPC,
    blendedCPA,
    totalSessions,
    totalOrganicClicks,
    organicPosition,
  };
}

export function formatBlendedMetric(key: keyof BlendedMetrics, value: number | null): string {
  if (value === null) return '—';
  switch (key) {
    case 'totalSpend':
    case 'blendedCPC':
    case 'blendedCPA':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'blendedROAS':
      return `${value.toFixed(2)}x`;
    case 'blendedCTR':
      return `${value.toFixed(2)}%`;
    case 'organicPosition':
      return value.toFixed(1);
    default:
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}
