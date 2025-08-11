'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Server, 
  Menu, 
  X,
  Home,
  Settings,
  User
} from 'lucide-react';

interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      href: '/',
      label: 'PROXIMITY',
      icon: Heart,
      description: '18+ Adult Dating App',
      isActive: currentPath === '/'
    },
    {
      href: '/dashboard',
      label: 'Server Dashboard',
      icon: Server,
      description: 'AI Master Server Control',
      isActive: currentPath === '/dashboard'
    },
    {
      href: '/admin',
      label: 'Admin Panel',
      icon: Settings,
      description: 'App Administration',
      isActive: currentPath === '/admin'
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">WhiteKnight</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 rounded-md text-[20px] md:text-[24px] font-black transition-colors ${
                    item.isActive
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'text-pink-500 hover:text-pink-400 hover:bg-pink-600/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5" />
                    <span style={{ 
                      textShadow: '0 0 15px rgba(236, 72, 153, 0.8)',
                      letterSpacing: '0.02em'
                    }}>{item.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-[24px] md:text-[28px] font-black transition-colors ${
                  item.isActive
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'text-pink-500 hover:text-pink-400 hover:bg-pink-600/20'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <div>
                  <div style={{ 
                    textShadow: '0 0 15px rgba(236, 72, 153, 0.8)',
                    letterSpacing: '0.02em'
                  }}>{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}