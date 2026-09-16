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
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status, isAdmin, logout } = useSession();
  const isAuthed = status === 'authenticated';

  const appLinks = [
    { href: '/profile', label: 'Discover', icon: Heart },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-[18px] md:text-[20px] font-black transition-colors ${
      currentPath === href
        ? 'bg-pink-600 text-white shadow-lg'
        : 'text-pink-500 hover:text-pink-400 hover:bg-pink-600/20'
    }`;

  return (
    <nav className="bg-black/80 border-b border-pink-950 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link href={isAuthed ? '/dashboard' : '/'} className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <span
                className="text-xl md:text-2xl font-black text-pink-500"
                style={{
                  textShadow: '0 0 15px rgba(236, 72, 153, 0.8)',
                  letterSpacing: '0.03em',
                }}
              >
                PROXIMITY
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthed ? (
              <>
                {appLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    <span className="flex items-center gap-1.5">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/" className={linkClass('/')}>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Sign In
                </span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-pink-400 hover:text-pink-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/90 border-t border-pink-950">
            {isAuthed ? (
              <>
                {appLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-[22px] font-black transition-colors ${
                      currentPath === item.href
                        ? 'bg-pink-600 text-white shadow-lg'
                        : 'text-pink-500 hover:text-pink-400 hover:bg-pink-600/20'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-[20px] font-black text-gray-400 hover:text-white w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-[22px] font-black text-pink-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}