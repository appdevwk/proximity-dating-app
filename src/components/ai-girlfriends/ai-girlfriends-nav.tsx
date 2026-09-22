'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Home, Wand2, UserPlus, MessageCircle } from 'lucide-react';
import { SiteModeToggle } from '@/components/site-mode-toggle';
import { useSiteMode } from '@/components/site-mode-provider';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/ai-girlfriends', label: 'AI Girlfriends', icon: Home },
  { href: '/ai-girlfriends/generate', label: 'Image Generator', icon: Wand2 },
  { href: '/ai-girlfriends/characters/new', label: 'Create AI Girlfriend', icon: UserPlus },
];

export function AiGirlfriendsNav() {
  const pathname = usePathname();
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';

  const isActive = (href: string) =>
    href === '/ai-girlfriends'
      ? pathname === href || pathname === '/ai-girlfriends'
      : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10"
      style={{
        background: 'linear-gradient(90deg, rgba(32,0,50,0.96) 0%, rgba(70,0,70,0.96) 75%, rgba(32,0,50,0.96) 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/ai-girlfriends" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black uppercase tracking-widest text-pink-300">
                Proximity <span className="text-white">AI</span>
              </div>
              <div className="text-[10px] text-pink-300/70">
                {adult ? 'Adult AI Girlfriends' : 'AI Girlfriends'}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-bold transition-colors',
                  isActive(link.href)
                    ? 'bg-white/10 text-white'
                    : 'text-pink-300/80 hover:bg-white/5 hover:text-white'
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SiteModeToggle />
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1 rounded-md border border-pink-400/40 px-3 py-1.5 text-[12px] font-bold text-pink-300 hover:bg-pink-600/20"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Dating App
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-2 py-1.5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[9px] font-bold',
                isActive(link.href) ? 'text-pink-300' : 'text-pink-300/60'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label.replace('AI ', '')}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}