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

const base = 'inline-flex items-center justify-center gap-2 font-medium font-[Roboto] rounded-lg transition-all duration-120 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666] disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:   'neu-pressable text-[#006666] [text-shadow:0_1px_0_var(--neu-light)] hover:text-[#0a7d7d] active:text-[#006666]',
  secondary: 'neu-pressable text-[#1E2938] hover:text-[#006666]',
  ghost:     'bg-transparent text-[#5a6472] rounded-md hover:bg-black/[0.04] active:bg-black/[0.07]',
  outline:   'neu-inset-sm text-[#1E2938] hover:text-[#006666]',
  danger:    'neu-pressable text-[#FF2157] active:text-[#d11744]',
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
