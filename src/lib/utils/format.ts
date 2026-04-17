export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRatio(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatMetric(value: number, unit: string): string {
  switch (unit) {
    case 'currency': return formatCurrency(value);
    case 'percent': return formatPercent(value);
    case 'ratio': return formatRatio(value);
    case 'integer': return formatNumber(value);
    case 'decimal': return value.toFixed(2);
    default: return String(value);
  }
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
