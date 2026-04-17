'use client';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Settings, LogOut, BarChart3, ChevronRight, Zap
} from 'lucide-react';

const nav = [
  { href: '/admin/dashboard', label: 'Overview',  icon: LayoutDashboard },
  { href: '/admin/clients',   label: 'Clients',   icon: Users },
  { href: '/admin/settings',  label: 'Settings',  icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[#111827] min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00BD7D] flex items-center justify-center shadow-[2px_3px_0_rgba(0,0,0,0.3)]">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">AdPulse</p>
            <p className="text-white/40 text-[10px] mt-0.5">Agency Dashboard</p>
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#00BD7D] text-white shadow-[2px_3px_0px_rgba(0,0,0,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Pro badge */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-lg bg-[#00BD7D]/10 border border-[#00BD7D]/20">
        <div className="flex items-center gap-2 text-[#00BD7D]">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Agency Pro</span>
        </div>
        <p className="text-[10px] text-white/40 mt-1">4 clients · All channels active</p>
      </div>

      {/* Logout */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors border-t border-white/10"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
