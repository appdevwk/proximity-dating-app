'use client';

import Link from 'next/link';
import { ExternalLink, HeartHandshake, MonitorPlay } from 'lucide-react';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';
import { joinUrlForCategory } from '@/lib/proxcams-data';
import type { CamRoom } from '@/lib/proxcams-data';

interface RoomPlayerProps {
  room: CamRoom;
  embedUrl: string;
}

export function RoomPlayer({ room, embedUrl }: RoomPlayerProps) {
  return (
    <>
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
    </>
  );
}