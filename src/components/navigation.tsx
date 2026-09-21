'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Menu,
  X,
  MessageCircle,
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { SiteModeToggle } from '@/components/site-mode-toggle';

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status, isAdmin, logout } = useSession();
  const isAuthed = status === 'authenticated';

  const appLinks = [
    { href: '/verify', label: 'Verify', icon: ShieldCheck },
    { href: '/profile', label: 'Discover', icon: Heart },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/subscribe', label: 'Subscribe', icon: Heart, highlight: true },
    ...(isAdmin ? [{ href: '/portal/39867b93', label: 'Admin', icon: Settings }] : []),
  ];

  const linkClass = (href: string, highlight?: boolean) =>
    `px-3 py-2 rounded-md text-[14px] md:text-[16px] font-bold transition-colors ${
      highlight
        ? 'text-pink-300 hover:text-white border border-pink-400/40 hover:bg-pink-600/20'
        : currentPath === href
          ? 'text-white'
          : 'text-pink-300 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-40" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center gap-2">
            <Link href={isAuthed ? '/dashboard' : '/'} className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-300" />
              <span className="text-lg md:text-xl font-black text-white" style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.8)', letterSpacing: '0.03em' }}>
                PROXIMITY
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthed ? (
              <>
                {appLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href, 'highlight' in item ? item.highlight : false)}>
                    <span className="flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                  </Link>
                ))}
                <SiteModeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-white hover:text-pink-200 border border-white/20 text-sm"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/" className="text-white font-bold hover:text-pink-200 transition-colors text-sm flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-pink-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3" style={{ background: 'rgba(85,0,137,0.95)', borderTop: '1px solid rgba(236,72,153,0.2)' }}>
            {isAuthed ? (
              <>
                {appLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-[18px] font-bold transition-colors ${
                      currentPath === item.href ? 'text-white bg-black/20' : 'text-pink-300 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-[16px] font-bold text-pink-300 hover:text-white w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-[18px] font-bold text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
