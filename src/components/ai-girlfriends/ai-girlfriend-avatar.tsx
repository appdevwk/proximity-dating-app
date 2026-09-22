import { useId } from 'react';
import { cn } from '@/lib/utils';

interface AiGirlfriendAvatarProps {
  gradient: string;
  name: string;
  className?: string;
  showLetter?: boolean;
}

export function AiGirlfriendAvatar({
  gradient,
  name,
  className,
  showLetter = true,
}: AiGirlfriendAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const gradId = useId();

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br',
        gradient,
        className
      )}
    >
      <svg
        viewBox="0 0 240 300"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
        <g fill={`url(#${gradId})`}>
          <path d="M120 40c38 0 66 28 66 72 0 46-28 74-66 74s-66-28-66-74c0-44 28-72 66-72z" />
          <path d="M8 300c6-74 46-118 112-118s106 44 112 118H8z" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {showLetter && (
        <span className="pointer-events-none absolute bottom-1.5 right-2 text-white/90 font-black text-[11px] uppercase tracking-wider">
          {initial}
        </span>
      )}
    </div>
  );
}