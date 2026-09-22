'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  ExternalLink,
  Eye,
  Flame,
  HeartHandshake,
  Lock,
  MonitorPlay,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';
import { CamCard } from '@/components/proxcams/cam-card';
import { ProxCamsNav } from '@/components/proxcams/proxcams-nav';
import {
  getCamRoom,
  relatedCams,
  joinUrlForCategory,
  chaturbateEmbedUrl,
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
        <section className="relative mb-2 overflow-hidden rounded-t-2xl">
          <ProxCamsAvatar
            gradient={room.gradient}
            name={room.name}
            className="aspect-video w-full"
          />
          {embedUrl.startsWith('http') ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Link
                href={joinUrlForCategory(room.category)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 text-sm font-black uppercase text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Watch Live on Partner
              </Link>
            </div>
          )}
        </section>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-black uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {room.viewers.toLocaleString()} watching
          </span>
          {room.hd && (
            <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[11px] font-black text-white/80">
              <MonitorPlay className="h-3.5 w-3.5" /> HD
            </span>
          )}
          <Link
            href={joinUrlForCategory(room.category)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-1.5 text-xs font-black uppercase text-white"
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            Join {room.category}
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">About {room.name}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{room.bio}</p>
        </section>

        <section>
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
