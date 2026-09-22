'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AI_GIRLFRIENDS,
  ROSTER_STORAGE_KEY,
  toAiGirlfriend,
  type AiGirlfriend,
  type CustomAiGirlfriend,
} from '@/lib/ai-girlfriends-data';

function readRoster(): CustomAiGirlfriend[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomAiGirlfriend[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function allGirlfriends(custom: CustomAiGirlfriend[]): AiGirlfriend[] {
  return [...custom.map(toAiGirlfriend), ...AI_GIRLFRIENDS];
}

export function useAiRoster() {
  const [custom, setCustom] = useState<CustomAiGirlfriend[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustom(readRoster());
    setReady(true);
  }, []);

  const saveRoster = useCallback((next: CustomAiGirlfriend[]) => {
    setCustom(next);
    try {
      window.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — keep in memory only
    }
  }, []);

  const addCharacter = useCallback(
    (character: CustomAiGirlfriend) => {
      saveRoster([...readRoster(), character]);
    },
    [saveRoster]
  );

  const removeCharacter = useCallback(
    (id: string) => {
      saveRoster(readRoster().filter((c) => c.id !== id));
    },
    [saveRoster]
  );

  return { custom, ready, addCharacter, removeCharacter, roster: allGirlfriends(custom) };
}