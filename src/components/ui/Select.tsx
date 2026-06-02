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
      {label && <label className="text-xs font-medium text-[#5a6472]">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            'neu-inset-sm w-full appearance-none rounded-lg px-3 py-2 pr-8 text-sm text-[#1E2938] outline-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666] transition-shadow',
            error && 'outline outline-2 outline-[#FF2157]',
            className
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6472] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[#FF2157]">{error}</p>}
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
      {label && <label className="text-xs font-medium text-[#5a6472]">{label}</label>}
      <input
        className={cn(
          'neu-inset-sm w-full rounded-lg px-3 py-2 text-sm text-[#1E2938] outline-none placeholder:text-[#9aa3af]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666] transition-shadow',
          error && 'outline outline-2 outline-[#FF2157]',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#5a6472]">{hint}</p>}
      {error && <p className="text-xs text-[#FF2157]">{error}</p>}
    </div>
  );
}
