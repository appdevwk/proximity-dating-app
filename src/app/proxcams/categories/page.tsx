'use client';

import Link from 'next/link';
import { HeartHandshake, Sparkles, Users, Radio, ArrowRight } from 'lucide-react';
import {
  CAM_CATEGORIES,
  REGIONS,
  CAM_ROOMS,
  joinUrlForCategory,
  type CamCategory,
} from '@/lib/proxcams-data';
import { CamCard } from '@/components/proxcams/cam-card';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';

function categoryIcon(key: CamCategory) {
  if (key === 'male') return Users;
  if (key === 'couples') return HeartHandshake;
  if (key === 'trans') return Sparkles;
  return Radio;
}

export default function ProxCamsCategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white">
          Browse Categories
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-rose-200/70">
          Explore every type of live cam room on PROXCAMS — female, male, couples and trans
          models, streaming now in HD.
        </p>
      </header>

      {/* Category hub cards */}
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAM_CATEGORIES.map((cat) => {
          const Icon = categoryIcon(cat.key);
          const rooms = CAM_ROOMS.filter((r) => r.category === cat.key);
          return (
            <Link
              key={cat.key}
              href={`/proxcams?category=${cat.key}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-rose-400/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 text-white shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400 ring-1 ring-red-500/40">
                  Live
                </span>
              </div>
              <h2 className="mt-4 text-lg font-black text-white">{cat.label}</h2>
              <p className="mt-1 text-[13px] text-rose-200/70">{cat.blurb}</p>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-rose-300">
                <span>{rooms.length} rooms online</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Regions */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-white">
          By Region
        </h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.filter((r) => r.key !== 'all').map((r) => (
            <Link
              key={r.key}
              href={`/proxcams?region=${encodeURIComponent(r.key)}`}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-rose-200 hover:border-rose-400/50 hover:text-white"
            >
              {r.flag} {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Top rooms per category */}
      {CAM_CATEGORIES.map((cat) => {
        const top = CAM_ROOMS.filter((r) => r.category === cat.key)
          .sort((a, b) => b.viewers - a.viewers)
          .slice(0, 5);
        return (
          <section key={cat.key} className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{cat.label} — Top Rooms</h2>
              <Link
                href={`/proxcams?category=${cat.key}`}
                className="text-xs font-bold text-rose-300 hover:text-white"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {top.map((room) => (
                <CamCard key={room.id} room={room} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Partner CTA */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10">
        <ProxCamsAvatar
          gradient="from-rose-600 via-pink-600 to-fuchsia-700"
          name=""
          className="absolute inset-0 h-full w-full"
          showLetter={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="relative z-10 p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
            1000+ rooms streaming right now
          </h2>
          <p className="mt-1 max-w-md text-sm text-white/70">
            Browse the full live network on our verified adult cam partner — free to watch, instant HD.
          </p>
          <Link
            href="/proxcams"
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl hover:opacity-90"
          >
            <Radio className="h-4 w-4" />
            Watch Free Cams
          </Link>
        </div>
      </section>

      <p className="mt-8 pb-4 text-center text-[10px] text-white/40">
        PROXCAMS rooms are streamed by verified adult partners (18+) and displayed with their permission.
      </p>
    </main>
  );
}