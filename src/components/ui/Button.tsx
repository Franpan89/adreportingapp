'use client';
import { cn } from '@/lib/utils/cn';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00BD7D] disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:   'bg-[#00BD7D] text-white hover:bg-[#00a86e] active:bg-[#009962] shadow-[2px_3px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[3px_5px_0px_0px_rgba(0,0,0,0.12)] hover:-translate-y-0.5',
  secondary: 'bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] active:bg-[#D1D5DB]',
  ghost:     'bg-transparent text-[#374151] hover:bg-[#F3F4F6] active:bg-[#E5E7EB]',
  outline:   'bg-transparent border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]',
  danger:    'bg-[#DC2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
);

Button.displayName = 'Button';
