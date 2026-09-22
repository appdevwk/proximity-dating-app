import Link from 'next/link';
import { Eye, Flame, BadgeCheck, MonitorPlay } from 'lucide-react';
import { ProxCamsAvatar } from '@/components/proxcams/proxcams-avatar';
import type { CamRoom } from '@/lib/proxcams-data';
import { cn } from '@/lib/utils';

interface CamCardProps {
  room: CamRoom;
  className?: string;
}

export function CamCard({ room, className }: CamCardProps) {
  return (
    <Link
      href={`/proxcams/${room.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(236,72,153,0.25)]',
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <ProxCamsAvatar
          gradient={room.gradient}
          name={room.name}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
          showLetter={false}
        />

        {/* top-left status chips */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <span className="flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          {room.vip && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-black uppercase text-black">
              <BadgeCheck className="h-3 w-3" />
              VIP
            </span>
          )}
        </div>

        {/* top-right badges */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {room.hd && (
            <span className="flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black uppercase text-black">
              <MonitorPlay className="h-3 w-3" />
              HD
            </span>
          )}
          {room.isNew && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
              New
            </span>
          )}
        </div>

        {/* bottom overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-white">
              <span>{room.flag}</span>
              <span className="line-clamp-1">{room.name}</span>
              <span className="rounded bg-white/15 px-1 py-0.5 text-[9px]">{room.age ?? ''}</span>
            </div>
            <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-pink-300">
              <Eye className="h-3 w-3" />
              {formatViewers(room.viewers)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {room.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">
                {tag}
              </span>
            ))}
            {room.trending && (
              <span className="flex items-center gap-0.5 text-[9px] font-black text-rose-300">
                <Flame className="h-3 w-3" />
                Trending
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}
