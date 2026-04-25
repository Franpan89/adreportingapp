'use client';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Key, Building2, LogOut, BarChart3, ChevronRight, Shield, Menu, X,
} from 'lucide-react';

const nav = [
  { href: '/superadmin/dashboard', label: 'Panel',      icon: LayoutDashboard },
  { href: '/superadmin/licencias', label: 'Licencias',  icon: Key },
  { href: '/superadmin/agencias',  label: 'Agencias',   icon: Building2 },
];

export function SuperAdminSidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[#111827] border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[2px_3px_0_rgba(0,0,0,0.3)]">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <p className="text-white font-semibold text-sm leading-none">AdPulse <span className="text-[#7C3AED]/80 text-[10px] font-medium ml-1">HQ</span></p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Spacer so mobile content sits below the top bar */}
      <div className="lg:hidden h-14 shrink-0" aria-hidden="true" />

      {/* Overlay on mobile when open */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static column on lg */}
      <aside
        className={cn(
          'w-60 shrink-0 flex flex-col bg-[#111827] border-r border-[#7C3AED]/20 z-50',
          'fixed top-0 left-0 h-screen transition-transform duration-200 lg:static lg:h-auto lg:min-h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center shadow-[2px_3px_0_rgba(0,0,0,0.3)]">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">AdPulse</p>
              <p className="text-[#7C3AED]/80 text-[10px] mt-0.5 font-medium">HQ · Super Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-[#7C3AED] text-white shadow-[2px_3px_0px_rgba(0,0,0,0.2)]'
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

        {/* HQ Badge */}
        <div className="mx-3 mb-3 px-3 py-3 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20">
          <div className="flex items-center gap-2 text-[#7C3AED]">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">AdPulse HQ</span>
          </div>
          <p className="text-[10px] text-white/55 mt-1">Panel de Administración</p>
        </div>

        {/* Logout */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-white/55 hover:text-white/85 hover:bg-white/5 transition-colors border-t border-white/10"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </aside>
    </>
  );
}
