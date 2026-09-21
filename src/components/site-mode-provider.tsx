'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type SiteMode = 'mainstream' | 'adult' | 'both';
export type EffectiveMode = 'mainstream' | 'adult';

const MODE_COOKIE = 'proximity_site_mode';
const EFFECTIVE_COOKIE = 'proximity_site_effective';

interface SiteModeContextValue {
  mode: SiteMode;
  effectiveMode: EffectiveMode;
  setMode: (mode: SiteMode) => void;
  setEffectiveMode: (mode: EffectiveMode) => void;
}

const SiteModeContext = createContext<SiteModeContextValue | null>(null);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function SiteModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<SiteMode>('both');
  const [effectiveMode, setEffectiveModeState] = useState<EffectiveMode>('mainstream');

  useEffect(() => {
    const storedMode = readCookie(MODE_COOKIE) as SiteMode | null;
    const storedEffective = readCookie(EFFECTIVE_COOKIE) as EffectiveMode | null;
    if (storedMode === 'mainstream' || storedMode === 'adult' || storedMode === 'both') {
      setModeState(storedMode);
    }
    if (storedEffective === 'adult' || storedEffective === 'mainstream') {
      setEffectiveModeState(storedEffective);
    }
  }, []);

  const setMode = useCallback((next: SiteMode) => {
    setModeState(next);
    writeCookie(MODE_COOKIE, next);
    if (next !== 'both') {
      setEffectiveModeState(next);
      writeCookie(EFFECTIVE_COOKIE, next);
    }
  }, []);

  const setEffectiveMode = useCallback((next: EffectiveMode) => {
    setEffectiveModeState(next);
    writeCookie(EFFECTIVE_COOKIE, next);
  }, []);

  return (
    <SiteModeContext.Provider value={{ mode, effectiveMode, setMode, setEffectiveMode }}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteMode(): SiteModeContextValue {
  const ctx = useContext(SiteModeContext);
  if (!ctx) throw new Error('useSiteMode must be used within SiteModeProvider');
  return ctx;
}