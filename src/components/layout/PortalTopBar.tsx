'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, MessageSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PortalTopBarProps {
  clientName: string;
  clientLogoUrl: string | null;
  clientId: string;
}

const NAV = [
  { href: '/dashboard',  label: 'Panel',    icon: BarChart3     },
  { href: '/reportes',   label: 'Reportes', icon: FileText      },
  { href: '/whatsapp',   label: 'WhatsApp', icon: MessageSquare },
];

export function PortalTopBar({ clientName, clientLogoUrl }: PortalTopBarProps) {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-6 py-0 flex items-center gap-6 h-14">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        {clientLogoUrl
          ? <img src={clientLogoUrl} alt={clientName} className="h-7 w-auto object-contain" />
          : (
            <div className="w-7 h-7 rounded-lg bg-[#006666] flex items-center justify-center text-white text-xs font-bold">
              {clientName.charAt(0).toUpperCase()}
            </div>
          )
        }
        <span className="text-sm font-semibold text-[#111827] hidden sm:block">{clientName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex items-center gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 h-14 text-sm font-medium border-b-2 transition-colors',
                active
                  ? 'border-[#006666] text-[#006666]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#6B7280] hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>
      </form>
    </header>
  );
}
