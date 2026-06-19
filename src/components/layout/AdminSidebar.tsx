'use client';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings, LogOut, BarChart3, ChevronRight, Zap, Sparkles, MessageSquare
} from 'lucide-react';

const baseNav = [
  { href: '/admin/dashboard', label: 'Resumen',       icon: LayoutDashboard },
  { href: '/admin/clients',   label: 'Clientes',      icon: Users },
  { href: '/admin/whatsapp',  label: 'WhatsApp',      icon: MessageSquare },
  { href: '/admin/settings',  label: 'Configuración', icon: Settings },
];

const storyEngineNav = { href: '/admin/story-engine', label: 'Story Engine', icon: Sparkles };

export function AdminSidebar({ storyEngineEnabled = false }: { storyEngineEnabled?: boolean }) {
  const path = usePathname();
  const nav = storyEngineEnabled ? [...baseNav, storyEngineNav] : baseNav;

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#E7E5E4] min-h-screen font-[Roboto]">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg neu-raised-sm flex items-center justify-center text-[#006666]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[#1E2938] font-bold text-sm leading-none">Client Reporting</p>
            <p className="text-[#5a6472] text-[10px] mt-1">Panel de Agencia</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          const isStoryEngine = href === '/admin/story-engine';
          const accent = isStoryEngine ? '#7C3AED' : '#006666';
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-120 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666]',
                active
                  ? 'neu-inset-sm font-bold'
                  : 'neu-pressable text-[#5a6472] hover:text-[#1E2938]'
              )}
              style={active ? { color: accent } : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* Pro badge */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-lg neu-inset-sm">
        <div className="flex items-center gap-2 text-[#006666]">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Agencia Pro</span>
        </div>
        <p className="text-[10px] text-[#5a6472] mt-1">4 clientes · Todos los canales activos</p>
      </div>

      {/* Logout */}
      <form action="/auth/signout" method="post" className="px-3 pb-4">
        <button
          type="submit"
          className="neu-pressable w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-[#5a6472] hover:text-[#FF2157] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006666]"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
