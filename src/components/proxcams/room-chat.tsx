'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Users, Crown, BadgeCheck } from 'lucide-react';
import type { CamRoom } from '@/lib/proxcams-data';
import { cn } from '@/lib/utils';

interface RoomChatProps {
  room: CamRoom;
}

interface ChatLine {
  id: number;
  user: string;
  color: string;
  text: string;
  mod?: boolean;
  vip?: boolean;
}

const USER_COLORS = [
  'text-pink-300',
  'text-cyan-300',
  'text-amber-300',
  'text-emerald-300',
  'text-violet-300',
  'text-rose-300',
];

const SEED_LINES: ChatLine[] = [
  { id: 1, user: 'luna_fan', color: 'text-pink-300', text: 'hi gorgeous, love the outfit tonight' },
  { id: 2, user: 'bigspender', color: 'text-cyan-300', text: 'tip battle in 10 min?', vip: true },
  { id: 3, user: 'nightowl', color: 'text-amber-300', text: 'just joined, what are we doing today?' },
  { id: 4, user: 'mod_rose', color: 'text-emerald-300', text: 'be nice in chat or you get muted', mod: true },
  { id: 5, user: 'sweetpea', color: 'text-violet-300', text: 'your smile is everything' },
  { id: 6, user: 'drifter', color: 'text-rose-300', text: 'hello from germany' },
  { id: 7, user: 'luna_fan', color: 'text-pink-300', text: 'do you take song requests?' },
  { id: 8, user: 'bigspender', color: 'text-cyan-300', text: 'just tipped, check your phone', vip: true },
];

const FOLLOW_UPS = [
  'haha love that',
  'wow really?',
  'you look amazing today',
  'tip incoming',
  'what time do you stream until?',
  'hello from brazil',
  'that was so funny',
  'can you wave at the camera?',
];

export function RoomChat({ room }: RoomChatProps) {
  const [lines, setLines] = useState<ChatLine[]>(SEED_LINES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(100);

  useEffect(() => {
    const timer = setInterval(() => {
      idRef.current += 1;
      const user = ['mike_92', 'velvet', 'kayla', 'tony', 'mira', 'jax'][idRef.current % 6];
      const color = USER_COLORS[idRef.current % USER_COLORS.length];
      const text = FOLLOW_UPS[idRef.current % FOLLOW_UPS.length];
      setLines((prev) => [...prev.slice(-40), { id: idRef.current, user, color, text }]);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    idRef.current += 1;
    setLines((prev) => [...prev.slice(-40), { id: idRef.current, user: 'you', color: 'text-white', text }]);
    setDraft('');
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400 ring-1 ring-red-500/40">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
          <span className="text-xs font-black text-white">{room.name}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-white/50">
          <Users className="h-3.5 w-3.5" />
          {formatViewers(room.viewers)}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {lines.map((line) => (
          <div key={line.id} className="text-[12px] leading-snug">
            <span className={cn('font-bold', line.color)}>
              {line.mod && <Crown className="mr-1 inline h-3 w-3 text-emerald-400" />}
              {line.vip && <BadgeCheck className="mr-1 inline h-3 w-3 text-amber-400" />}
              {line.user}:
            </span>{' '}
            <span className="text-white/70">{line.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          aria-label="Chat message"
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-white placeholder:text-white/40 focus:border-rose-400/50 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="rounded-md bg-rose-600 p-2 text-white hover:bg-rose-500"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}