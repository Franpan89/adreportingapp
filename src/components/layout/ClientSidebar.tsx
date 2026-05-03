'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ClientSidebarProps {
  clientName?: string;
  logoUrl?: string | null;
  channels?: string[];
}

const CHANNEL_COLORS: Record<string, string> = {
  meta:   '#1877F2',
  google: '#EA4335',
  tiktok: '#010101',
};

const CHANNEL_LABELS: Record<string, string> = {
  meta:   'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
};

export function ClientSidebar({ clientName = 'My Dashboard', channels = [] }: ClientSidebarProps) {
  const path = usePathname();
  const nav = [
    { href: '/dashboard', label: 'Panel',    icon: LayoutDashboard },
    { href: '/reportes',  label: 'Reportes', icon: FileText },
  ];
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#111827] min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00BD7D] flex items-center justify-center shadow-[2px_3px_0_rgba(0,0,0,0.3)]">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{clientName}</p>
            <p className="text-white/40 text-[10px] mt-0.5">Reporte de Rendimiento</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-[#00BD7D] text-white shadow-[2px_3px_0px_rgba(0,0,0,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connected channels */}
      {channels.length > 0 && (
        <div className="px-3 mb-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider px-3 mb-2">
            Canales Activos
          </p>
          <div className="space-y-0.5">
            {channels.map(ch => (
              <div key={ch} className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CHANNEL_COLORS[ch] ?? '#9CA3AF' }}
                />
                <span className="text-xs text-white/50">{CHANNEL_LABELS[ch] ?? ch}</span>
                {/* Live indicator */}
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#16A34A] opacity-80" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Powered-by badge */}
      <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
        <p className="text-[10px] text-white/30 text-center">
          Desarrollado por <span className="text-white/50 font-semibold">Web My Money</span>
        </p>
      </div>

      {/* Logout */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors border-t border-white/10"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
