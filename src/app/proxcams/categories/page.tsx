'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Camera, Lock, Grid3x3, Sparkles, Users, MonitorPlay } from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';
import {
  CAM_CATEGORIES,
  CAM_ROOMS,
  REGIONS,
  joinUrlForCategory,
  PARTNER_JOIN_URL,
} from '@/lib/proxcams-data';
import { cn } from '@/lib/utils';

export default function ProxCamsCategoriesPage() {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';

  const [region, setRegion] = useState('all');

  const roomCount = (category: string) =>
    CAM_ROOMS.filter((c) => c.category === category).length;

  const roomCountForRegion = (region: string) =>
    region === 'all' ? CAM_ROOMS.length : CAM_ROOMS.filter((c) => c.region === region).length;

  const topCategory = useMemo(
    () => [...CAM_CATEGORIES].sort((a, b) => roomCount(b.key) - roomCount(a.key))[0],
    []
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* 18+ gate */}
      {!adult ? (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-20 text-center">
          <Lock className="mx-auto mb-4 h-10 w-10 text-rose-300" />
          <h1 className="text-2xl font-black text-white">18+ only</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-rose-200/80">
            ProxCams categories are adult cams for adults only. Switch your site mode to Adult from
            the top-right toggle to browse by category.
          </p>
        </section>
      ) : (
        <>
          {/* Hero */}
          <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/10">
            <ProxCamsAvatar
              gradient={CAM_ROOMS[0]?.gradient ?? 'from-rose-500 to-pink-600'}
              name="Live"
              className="absolute inset-0 h-full w-full"
              showLetter={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            <div className="relative z-10 flex min-h-[260px] flex-col justify-center p-6 sm:p-10">
              <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
                <MonitorPlay className="h-3.5 w-3.5" />
                Go live with a partner
              </span>
              <h1 className="max-w-lg text-3xl sm:text-5xl font-black uppercase leading-tight text-white">
                Browse cams by category
              </h1>
              <p className="mt-3 max-w-md text-sm text-white/70">
                Filter live cam rooms by category and region — from female and male to couples and
                trans — and jump straight to a room or to becoming a partnered broadcaster.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={joinUrlForCategory(topCategory.key)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-xl hover:opacity-90"
                >
                  <Camera className="h-4 w-4" />
                  Become a model
                </Link>
                <Link
                  href={PARTNER_JOIN_URL}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                  Partner program
                </Link>
              </div>
            </div>
          </section>

          {/* Region filter */}
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-black text-white">Browse by region</h2>
            <div className="flex flex-wrap items-center gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRegion(r.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold transition-colors',
                    region === r.key
                      ? 'border-rose-500/50 bg-rose-600 text-white'
                      : 'text-rose-100 hover:bg-white/10'
                  )}
                >
                  {r.flag && <span className="text-sm leading-none">{r.flag}</span>}
                  {r.label}
                  <span className="ml-0.5 rounded-full bg-black/25 px-1.5 text-[10px] tabular-nums">
                    {roomCountForRegion(r.key)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Category grid */}
          <section className="mb-10">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-white">
              <Grid3x3 className="h-5 w-5 text-rose-400" />
              All categories
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAM_CATEGORIES.map((c) => {
                const count = roomCount(c.key);
                const preview = CAM_ROOMS.filter((r) => r.category === c.key).slice(0, 4);
                return (
                  <div
                    key={c.key}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-rose-400/40"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{c.label}</h3>
                        <p className="mt-1 text-xs text-rose-200/70">{c.blurb}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-black text-white">
                        <Users className="h-3 w-3" />
                        {count} live
                      </span>
                    </div>
                    <div className="mb-4 grid grid-cols-4 gap-1.5">
                      {preview.map((r) => (
                        <Link
                          key={r.slug}
                          href={`/proxcams/${r.slug}`}
                          className="group relative aspect-[3/4] overflow-hidden rounded-lg"
                          title={`${r.name} — ${r.region}`}
                        >
                          <ProxCamsAvatar
                            gradient={r.gradient}
                            name={r.name}
                            className="absolute inset-0 h-full w-full"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-center text-white">
                            <p className="text-[9px] font-bold leading-tight">{r.flag} {r.name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/proxcams?category=${c.key}`}
                        className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-xs font-bold text-white hover:bg-white/10"
                      >
                        View {c.label} rooms
                      </Link>
                      <Link
                        href={joinUrlForCategory(c.key)}
                        className="rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90"
                      >
                        Join as {c.label}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEO / FAQ */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <h2 className="text-lg font-black text-white">ProxCams categories explained</h2>
            <p className="mt-2">
              ProxCams organizes live adult cams by category — Female, Male, Couples and Trans — and
              by region including the United States and Spain. Rooms are streamed by verified adult
              performers (18+). Browsing is free; tipping, private shows and MPV go through our
              partnered cam platform. A broadcaster in your category joins through our partner
              program — verify, set up your room, and go live to your region.
            </p>
            <p className="mt-3">
              <Link href="/proxcams" className="font-bold text-rose-300 hover:underline">
                ← Back to all live rooms
              </Link>
            </p>
          </section>
        </>
      )}
    </main>
  );
}
