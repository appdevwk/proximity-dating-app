'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SessionUser, SiteModeValue } from '@/lib/types';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [siteMode, setSiteModeState] = useState<SiteModeValue>('both');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as {
          user: SessionUser;
          isAdmin: boolean;
        };
        setUser(data.user);
        setIsAdmin(data.isAdmin === true);
        setSiteModeState(data.user?.siteMode ?? 'both');
        setStatus('authenticated');
      } else {
        setUser(null);
        setIsAdmin(false);
        setSiteModeState('both');
        setStatus('unauthenticated');
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
      setSiteModeState('both');
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSiteMode = useCallback(async (next: SiteModeValue) => {
    setSiteModeState(next);
    try {
      await fetch('/api/auth/site-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteMode: next }),
        cache: 'no-store',
      });
      await refresh();
    } catch {
      // keep local state even if the server call fails
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsAdmin(false);
    setSiteModeState('both');
    setStatus('unauthenticated');
    window.location.href = '/';
  }, []);

  return { user, isAdmin, status, siteMode, updateSiteMode, refresh, logout };
}