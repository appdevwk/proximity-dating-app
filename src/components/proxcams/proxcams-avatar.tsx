import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ProxCamsAvatarProps {
  gradient: string;
  name: string;
  className?: string;
  showLetter?: boolean;
}

export function ProxCamsAvatar({
  gradient,
  name,
  className,
  showLetter = true,
}: ProxCamsAvatarProps) {
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
            <stop offset="52%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
        <g fill={`url(#${gradId})`}>
          <path d="M120 38c40 0 68 29 68 74 0 47-28 76-68 76s-68-29-68-76c0-45 28-74 68-74z" />
          <path d="M6 300c7-76 48-120 114-120s107 44 114 120H6z" />
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