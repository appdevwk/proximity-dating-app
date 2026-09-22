'use client';

import { useMemo, useState } from 'react';
import { useSiteMode } from '@/components/site-mode-provider';
import { CAM_ROOMS, REGIONS } from '@/lib/proxcams-data';
import type { CamCategory, CamFilter } from '@/lib/proxcams-data';

export type ProxCamsRosterOptions = {
  category?: CamCategory;
  region?: string;
};

export function useProxCamsRoster() {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';
  const [filter, setFilter] = useState<CamFilter>('all');
  const [region, setRegion] = useState('all');

  const roster = useMemo(() => {
    let list = [...CAM_ROOMS];
    if (filter !== 'all') list = list.filter((c) => c.category === filter);
    if (region !== 'all') list = list.filter((c) => c.region === region);
    list.sort((a, b) => b.viewers - a.viewers);
    return list;
  }, [filter, region]);

  return {
    roster,
    ready: true,
    adult,
    filter,
    setFilter,
    region,
    setRegion,
    regions: REGIONS,
  };
}
