import { Lock } from 'lucide-react';
import { StoryEngine } from './StoryEngine';

// Server component — in a real deployment, check the agency license addons here.
// For now we render the engine directly; the nav item only shows when enabled.
export default function StoryEnginePage() {
  return <StoryEngine />;
}

export function AddonLocked() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
        <Lock className="w-6 h-6 text-[#7C3AED]" />
      </div>
      <h2 className="text-lg font-bold text-[#111827]">Story Engine no activado</h2>
      <p className="text-sm text-[#6B7280] max-w-xs">
        Este add-on no está incluido en tu plan actual. Contacta a tu administrador para activarlo.
      </p>
    </div>
  );
}
