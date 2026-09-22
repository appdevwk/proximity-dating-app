'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  BadgeCheck,
  Sparkles,
  Eye,
  PlayCircle,
  Sparkle,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';
import { CamCard } from '@/components/proxcams/cam-card';
import {
  CAM_CATEGORIES,
  CAM_ROOMS,
  joinUrlForCategory,
  PARTNER_JOIN_URL,
} from '@/lib/proxcams-data';
import { cn } from '@/lib/utils';

type Tab = 'all' | (typeof CAM_CATEGORIES)[number]['key'];

export default function ProxCamsLandingPage() {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';

  const [tab, setTab] = useState<Tab>('all');
  const [region, setRegion] = useState('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat === 'female' || cat === 'male' || cat === 'couples' || cat === 'trans') {
      setTab(cat);
    }
    const reg = params.get('region');
    if (reg && reg.length > 0 && reg !== 'all') setRegion(reg);
  }, []);

  const rosters = useMemo(() => {
    const from = (t: Tab) =>
      CAM_ROOMS.filter((c) => (t === 'all' ? true : c.category === t)).sort(
        (a, b) => b.viewers - a.viewers
      );
    return {
      all: from('all'),
      female: from('female'),
      male: from('male'),
      couples: from('couples'),
      trans: from('trans'),
    };
  }, []);

  const visible = useMemo(() => {
    let list = rosters[tab] ?? rosters.all;
    if (region !== 'all') list = list.filter((c) => c.region === region);
    return list;
  }, [rosters, tab, region]);

  const topRoom = CAM_ROOMS[0];
  const liveStrip = CAM_ROOMS.filter((c) => c.trending || c.isNew).slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* Hero / featured cam */}
      {topRoom && adult && (
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/10">
          <ProxCamsAvatar
            gradient={topRoom.gradient}
            name={topRoom.name}
            className="absolute inset-0 h-full w-full"
            showLetter={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10 flex min-h-[300px] flex-col justify-center p-6 sm:p-10">
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {formatViewers(topRoom.viewers)} watching
            </span>
            <h1 className="max-w-lg text-3xl sm:text-5xl font-black uppercase leading-tight text-white">
              {topRoom.name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/70">{topRoom.bio}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {topRoom.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
            <Link
              href={`/proxcams/${topRoom.slug}`}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl hover:opacity-90"
            >
              <PlayCircle className="h-4 w-4" />
              Watch Live
            </Link>
          </div>
        </section>
      )}

      {/* LIVE strip */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-black text-white">
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-red-400 ring-1 ring-red-500/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
            right now
          </h2>
          <a
            href={PARTNER_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-xs font-bold text-rose-200 hover:text-white"
          >
            View all 1000+ rooms →
          </a>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {liveStrip.map((room) => (
            <Link
              key={room.id}
              href={`/proxcams/${room.slug}`}
              className="relative w-32 shrink-0 overflow-hidden rounded-xl border border-white/10"
            >
              <div className="relative aspect-[3/4]">
                <ProxCamsAvatar
                  gradient={room.gradient}
                  name={room.name}
                  className="absolute inset-0 h-full w-full"
                  showLetter={false}
                />
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-black uppercase text-white backdrop-blur">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-red-500" />
                  {formatViewers(room.viewers)}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5">
                  <div className="line-clamp-1 text-[11px] font-black text-white">{room.name}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse grid */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white">Free Cams</h2>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/5 p-1">
            {(
              [
                { key: 'all', label: 'All' },
                ...CAM_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
              ] as { key: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                  tab === t.key ? 'bg-rose-600 text-white' : 'text-rose-200 hover:bg-white/10'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {['all', 'North America', 'Europe', 'Latin America', 'Asia'].map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                  region === r ? 'bg-rose-600 text-white' : 'text-rose-200 hover:bg-white/10'
                )}
              >
                {r === 'all' ? 'All Regions' : r}
              </button>
            ))}
          </div>
        </div>

        {!adult ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <p className="mb-6 text-rose-200">
              ProxCams is an 18+ adult feature. Switch your site mode to Adult to browse live cam rooms.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-rose-200">
            No live cams in this filter right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((room) => (
              <CamCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-black text-white">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAM_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setTab(c.key);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:border-rose-400/40"
            >
              <div className="text-lg font-black text-white">{c.label}</div>
              <div className="mt-1 text-[11px] text-rose-200/70">{c.blurb}</div>
            </button>
          ))}
        </div>
      </section>

      {/* SEO / FAQ */}
      <section className="mb-10 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <h2 className="text-lg font-black text-white">Free Live Sex Cams</h2>
        <p>
          PROXCAMS brings live adult webcams to the Proximity dating app. Cam rooms are streamed by
          adult performers (18+) and hosted by our verified cam partner — browsing is free and
          instant, with HD streams and thousands of models online around the clock.
        </p>
        <h3 className="font-bold text-white">Are cam rooms really free?</h3>
        <p>
          Yes. You can watch live, browse 24/7 and join the chat without paying. Tipping, private
          shows and premium interactions are optional and charged by the performing models.
        </p>
        <h3 className="font-bold text-white">Is there age verification?</h3>
        <p>
          ProxCams is strictly 18+. All performers are verified adults displayings 21+. You must be
          an adult member of Proximity with adult site mode enabled to access this module.
        </p>
      </section>
    </main>
  );
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
