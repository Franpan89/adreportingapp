'use client';
import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-4',  thumb: 'w-3 h-3', offset: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', offset: 'translate-x-5' },
  };
  const s = sizes[size];

  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={e => e.key === 'Enter' && !disabled && onChange(!checked)}
        className={cn(
          'relative rounded-full transition-colors duration-200',
          s.track,
          checked ? 'bg-[#00BD7D]' : 'bg-[#D1D5DB]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform duration-200',
            s.thumb,
            checked && s.offset
          )}
        />
      </div>
      {label && <span className="text-sm text-[#374151]">{label}</span>}
    </label>
  );
}
