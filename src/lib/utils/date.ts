import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, parseISO } from 'date-fns';

export type DateRange = { start: Date; end: Date };

export type PresetKey = 'today' | '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export const DATE_PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
];

export function getPresetRange(preset: PresetKey): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case '7d':
      return { start: subDays(today, 6), end: today };
    case '30d':
      return { start: subDays(today, 29), end: today };
    case '90d':
      return { start: subDays(today, 89), end: today };
    case 'this_month':
      return { start: startOfMonth(today), end: today };
    case 'last_month': {
      const lm = subMonths(today, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case 'this_year':
      return { start: startOfYear(today), end: today };
    default:
      return { start: subDays(today, 29), end: today };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const diffMs = range.end.getTime() - range.start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return {
    start: subDays(range.start, diffDays),
    end: subDays(range.end, diffDays),
  };
}

export function formatDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateParam(s: string): Date {
  return parseISO(s);
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatRangeLabel(range: DateRange): string {
  return `${formatDisplayDate(range.start)} – ${formatDisplayDate(range.end)}`;
}
