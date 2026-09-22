'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clapperboard,
  Radio,
  Menu,
  X,
  Users,
  HeartHandshake,
  Sparkles,
  ExternalLink,
  Flame,
  Crown,
} from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { CAM_CATEGORIES, PARTNER_JOIN_URL } from '@/lib/proxcams-data';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function ProxCamsNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';

  const links: { href: string; label: string; icon: LucideIcon; adult: boolean }[] = [
    { href: '/proxcams', label: 'Featured', icon: Flame, adult: true },
    ...CAM_CATEGORIES.map((c) => ({
      href: `/proxcams?category=${c.key}`,
      label: c.label,
      icon: c.key === 'male' ? Users : HeartHandshake,
      adult: true,
    })),
    { href: '/proxcams/categories', label: 'Categories', icon: Clapperboard, adult: true },
  ];

  const isActive = (href: string) => {
    if (href === '/proxcams') return pathname === '/proxcams';
    return pathname.startsWith('/proxcams/');
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10"
      style={{
        background:
          'linear-gradient(90deg, rgba(34,4,40,0.97) 0%, rgba(64,4,58,0.97) 50%, rgba(34,4,40,0.97) 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/proxcams" className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-purple-700 shadow-lg">
              <Clapperboard className="h-4 w-4 text-white" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black uppercase tracking-widest text-white">
                PROX<span className="text-rose-400">CAMS</span>
              </div>
              <div className="text-[10px] font-bold text-rose-200/70">Live adult webcams</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) =>
              link.adult && !adult ? (
                <span
                  key={link.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-bold text-white/30"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-bold transition-colors',
                    isActive(link.href)
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={PARTNER_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hidden items-center gap-1.5 rounded-md bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2 text-[12px] font-black uppercase tracking-wide text-white hover:opacity-90 sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Join Cams
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-md p-2 text-white/70 hover:text-white md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[15px] font-bold text-white/80 hover:bg-white/5 hover:text-white"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <a
              href={PARTNER_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2.5 text-[14px] font-black uppercase tracking-wide text-white"
            >
              <Users className="h-4 w-4" />
              Join Live Cams
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
