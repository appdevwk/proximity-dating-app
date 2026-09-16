'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/types';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as { user: SessionUser };
        setUser(data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setStatus('unauthenticated');
    window.location.href = '/';
  }, []);

  return { user, status, refresh, logout };
}