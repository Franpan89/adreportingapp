import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

type Depth = 'flat' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  depth?: Depth;
  padding?: boolean;
}

const depthClasses: Record<Depth, string> = {
  flat: 'shadow-[var(--shadow-card)]',
  sm:   'shadow-[var(--shadow-perspective-sm)]',
  md:   'shadow-[var(--shadow-perspective-md)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-perspective-lg)] transition-all duration-150',
  lg:   'shadow-[var(--shadow-perspective-lg)] hover:-translate-y-1 hover:shadow-[var(--shadow-perspective-xl)] transition-all duration-150',
};

export function Card({ depth = 'flat', padding = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl',
        depthClasses[depth],
        padding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[#111827]', className)} {...props}>
      {children}
    </h3>
  );
}
