'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock, Eye, Flame, BadgeCheck, MonitorPlay, MapPin } from 'lucide-react';
import { CamCard } from '@/components/proxcams/cam-card';
import { RoomPlayer } from '@/components/proxcams/room-player';
import { RoomChat } from '@/components/proxcams/room-chat';
import {
  getCamRoom,
  relatedCams,
  chaturbateEmbedUrl,
  joinUrlForCategory,
} from '@/lib/proxcams-data';
import { useSiteMode } from '@/components/site-mode-provider';

interface CamRoomPageProps {
  params: Promise<{ slug: string }>;
}

export default function CamRoomPage({ params }: CamRoomPageProps) {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';
  const [slug, setSlug] = useState<string | null>(null);
  const [room, setRoom] = useState<ReturnType<typeof getCamRoom> | null>(null);

  useEffect(() => {
    params.then((resolved) => {
      const s = resolved.slug;
      setSlug(s);
      setRoom(getCamRoom(s));
    });
  }, [params]);

  if (!slug) return null;
  if (!room) notFound();

  const related = relatedCams(room);

  if (!adult) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-pink-300" />
        <h1 className="text-2xl font-black text-white">18+ only</h1>
        <p className="mt-2 text-sm text-white/60">
          This cam room is available in adult mode. Switch to Adult from the top-right toggle.
        </p>
      </main>
    );
  }

  const embedUrl =
    room.chaturbateUser && !room.embedUrl
      ? chaturbateEmbedUrl(room.chaturbateUser)
      : (room.embedUrl ?? '');

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <RoomPlayer room={room} embedUrl={embedUrl} />

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-black text-white">{room.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-white/50">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {room.flag} {room.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViewers(room.viewers)} watching
                  </span>
                  {room.hd && (
                    <span className="flex items-center gap-1 text-white/70">
                      <MonitorPlay className="h-3 w-3" />
                      HD
                    </span>
                  )}
                  {room.vip && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <BadgeCheck className="h-3 w-3" />
                      VIP
                    </span>
                  )}
                  {room.trending && (
                    <span className="flex items-center gap-1 text-rose-300">
                      <Flame className="h-3 w-3" />
                      Trending
                    </span>
                  )}
                </p>
              </div>
              <a
                href={joinUrlForCategory(room.category)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:opacity-90"
              >
                Join Room
              </a>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/70">{room.bio}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <RoomChat room={room} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-white">More Live Now</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {related.map((r) => (
            <CamCard key={r.slug} room={r} />
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[10px] text-white/40">
        ProxCams rooms are streamed by verified adult partners and displayed with their permission.
      </p>
    </main>
  );
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}
