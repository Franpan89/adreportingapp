'use client';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full text-left cursor-pointer rounded-xl p-4 border-2 transition-all duration-150',
        selected
          ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_0_1px_#7C3AED]'
          : 'border-white/10 bg-[#1F2937] hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5'
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </span>
      )}

      {/* Plan name + price */}
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: plan.color }}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">${plan.price_monthly}</span>
          <span className="text-xs text-white/40">/mes</span>
        </div>
      </div>

      {/* Limits */}
      <p className="text-xs text-white/50 mb-3">
        {plan.max_clients === null ? 'Clientes ilimitados' : `Hasta ${plan.max_clients} cliente${plan.max_clients !== 1 ? 's' : ''}`}
        {' · '}
        {plan.max_channels} canal{plan.max_channels !== 1 ? 'es' : ''}
      </p>

      {/* Features */}
      <ul className="space-y-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
