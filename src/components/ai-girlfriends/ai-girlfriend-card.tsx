import Link from 'next/link';
import { AiGirlfriendAvatar } from '@/components/ai-girlfriends/ai-girlfriend-avatar';
import type { AiGirlfriend } from '@/lib/ai-girlfriends-data';
import { cn } from '@/lib/utils';

const TAG_STYLES: Record<string, string> = {
  Trending: 'text-pink-300 bg-pink-500/15 ring-pink-500/40',
  New: 'text-amber-300 bg-amber-500/15 ring-amber-500/40',
  Games: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/40',
};

interface AiGirlfriendCardProps {
  girlfriend: AiGirlfriend;
  href: string;
  className?: string;
  showLive?: boolean;
}

export function AiGirlfriendCard({
  girlfriend,
  href,
  className,
  showLive = true,
}: AiGirlfriendCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(236,72,153,0.25)]',
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <AiGirlfriendAvatar
          gradient={girlfriend.gradient}
          name={girlfriend.name}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
          showLetter={false}
        />
        {showLive && (
          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
        )}
        {girlfriend.tags.length > 0 && (
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {girlfriend.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 backdrop-blur',
                  TAG_STYLES[tag] ?? 'text-white bg-white/15 ring-white/30'
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-white drop-shadow">{girlfriend.name}</span>
            <span
              className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur"
              title="All characters are 21+ years old"
            >
              {girlfriend.age} yrs
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] text-white/70">
            {girlfriend.vibe} • {girlfriend.bio}
          </p>
        </div>
      </div>
    </Link>
  );
}