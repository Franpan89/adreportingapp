'use client';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-[#374151]">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 pr-8 text-sm text-[#111827] outline-none',
            'focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20',
            'hover:border-[#D1D5DB] transition-colors',
            error && 'border-[#DC2626]',
            className
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-[#374151]">{label}</label>}
      <input
        className={cn(
          'w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]',
          'focus:border-[#00BD7D] focus:ring-2 focus:ring-[#00BD7D]/20',
          'hover:border-[#D1D5DB] transition-colors',
          error && 'border-[#DC2626]',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  );
}
