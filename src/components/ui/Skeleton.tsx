import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div style={style} className={cn('animate-pulse bg-[#F3F4F6] rounded-lg', className)} />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton style={{ height }} className="w-full rounded-lg" />
    </div>
  );
}
