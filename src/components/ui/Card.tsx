import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

type Depth = 'flat' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  depth?: Depth;
  padding?: boolean;
}

const depthClasses: Record<Depth, string> = {
  flat: 'neu-inset-sm',
  sm:   'neu-raised-sm',
  md:   'neu-raised',
  lg:   'neu-raised',
};

export function Card({ depth = 'flat', padding = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl',
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
    <h3 className={cn('text-sm font-semibold text-[#1E2938]', className)} {...props}>
      {children}
    </h3>
  );
}
