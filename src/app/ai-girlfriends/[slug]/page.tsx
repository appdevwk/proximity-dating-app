'use client';

import { useEffect, useMemo, useRef, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Send,
  Mic,
  Camera,
  Lock,
  ShieldCheck,
  Sparkles,
  UserPlus,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { useAiRoster } from '@/hooks/use-ai-roster';
import { AiGirlfriendAvatar } from '@/components/ai-girlfriends/ai-girlfriend-avatar';
import type { AiGirlfriend } from '@/lib/ai-girlfriends-data';
import { getAiReply, openingMessage } from '@/lib/ai-girlfriend-chat';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  photo?: boolean;
  voice?: boolean;
}

function chatStorageKey(slug: string): string {
  return `proximity_ai_chat_${slug}`;
}

function readChat(slug: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(chatStorageKey(slug));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function GeneratedArt({ gf }: { gf: AiGirlfriend }) {
  return (
    <div className="relative my-1 h-40 w-full overflow-hidden rounded-xl">
      <AiGirlfriendAvatar
        gradient={gf.gradient}
        name={gf.name}
        className="absolute inset-0 h-full w-full"
        showLetter={false}
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white/80">
        Generated for this chat — © Proximity AI
      </span>
    </div>
  );
}

export default function AiGirlfriendChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { roster, ready } = useAiRoster();
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';

  const gf = useMemo(
    () => roster.find((g) => g.slug === slug),
    [roster, slug]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (!ready || booted.current) return;
    const existing = readChat(slug);
    if (existing.length === 0 && gf) {
      const opening: ChatMessage = { role: 'ai', text: openingMessage(gf) };
      const next = [opening];
      setMessages(next);
      try {
        window.localStorage.setItem(chatStorageKey(slug), JSON.stringify(next));
      } catch {
        // ignore
      }
    } else {
      setMessages(existing);
    }
    booted.current = true;
  }, [ready, gf, slug]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-32 text-pink-300 animate-pulse">
        Loading…
      </div>
    );
  }

  if (!gf) notFound();

  const persist = (next: ChatMessage[]) => {
    setMessages(next);
    try {
      window.localStorage.setItem(chatStorageKey(slug), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || typing) return;
    const withUser: ChatMessage[] = [...messages, { role: 'user', text }];
    persist(withUser);
    setInput('');
    setTyping(true);

    const delay = 600 + Math.floor(Math.random() * 900);
    setTimeout(() => {
      const reply = getAiReply(gf, text, adult);
      const next: ChatMessage[] = [
        ...withUser,
        { role: 'ai', text: reply.text, photo: reply.photoEvent, voice: reply.voiceEvent },
      ];
      persist(next);
      setTyping(false);
    }, delay);
  };

  const maybePhotoEvent = () => {
    const withUser: ChatMessage[] = [...messages, { role: 'user', text: '📷 Sent you a photo request' }];
    persist(withUser);
    setTyping(true);
    setTimeout(() => {
      const next: ChatMessage[] = [
        ...withUser,
        { role: 'ai', text: 'Here — a little something just for you.', photo: true },
      ];
      persist(next);
      setTyping(false);
    }, 800);
  };

  const maybeVoice = () => {
    const withUser: ChatMessage[] = [...messages, { role: 'user', text: '🎙️ Recorded a voice message' }];
    persist(withUser);
    setTyping(true);
    setTimeout(() => {
      const next: ChatMessage[] = [
        ...withUser,
        { role: 'ai', text: 'Listen to this one close… it is only for you.', voice: true },
      ];
      persist(next);
      setTyping(false);
    }, 900);
  };

  const clearChat = () => {
    const opening: ChatMessage = { role: 'ai', text: openingMessage(gf) };
    persist([opening]);
  };

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Link
        href="/ai-girlfriends"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-pink-300 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to AI Girlfriends
      </Link>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Profile card */}
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="relative aspect-[4/5]">
            <AiGirlfriendAvatar
              gradient={gf.gradient}
              name={gf.name}
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{gf.name}</h1>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                  {gf.age} yrs
                </span>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-pink-300">
                {gf.vibe} AI Girlfriend
              </p>
            </div>
            {gf.rating === 'adult' && (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-black uppercase text-white ring-1 ring-white/20">
                <ShieldCheck className="h-3 w-3" />
                18+
              </span>
            )}
          </div>

          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-pink-300/70">
                About her
              </h2>
              <p className="mt-1 text-sm text-pink-100/70">{gf.backstory}</p>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-pink-300/70">
                Personality
              </h2>
              <p className="mt-1 text-sm capitalize text-pink-100/70">Tone: {gf.tone}</p>
            </div>
            {gf.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {gf.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-pink-600/20 px-2 py-1 text-[11px] font-bold text-pink-300 ring-1 ring-pink-500/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {gf.rating === 'adult' && adult && (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 py-3 text-sm font-black uppercase tracking-wide text-white hover:opacity-90"
              >
                <Lock className="h-4 w-4" />
                Unlock Private Content
              </button>
            )}
            <Link
              href="/ai-girlfriends/characters/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-pink-400/40 py-2.5 text-sm font-bold text-pink-300 hover:bg-pink-600/20"
            >
              <UserPlus className="h-4 w-4" />
              Create your own
            </Link>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex h-[640px] flex-col rounded-2xl border border-white/10 bg-black/30">
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <AiGirlfriendAvatar
              gradient={gf.gradient}
              name={gf.name}
              className="h-10 w-10"
              showLetter={false}
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-white">
                {gf.name}
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  online
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-pink-300/70">
                <Sparkles className="h-3 w-3" />
                AI companion • remembers your chats
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="ml-auto text-xs font-bold text-pink-300/60 hover:text-white"
            >
              Clear
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) =>
              msg.role === 'ai' ? (
                <div key={i} className="flex items-end gap-2">
                  <AiGirlfriendAvatar
                    gradient={gf.gradient}
                    name={gf.name}
                    className="h-8 w-8 flex-shrink-0"
                    showLetter={false}
                  />
                  <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-2.5 text-sm text-white">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.photo && <GeneratedArt gf={gf} />}
                    {msg.voice && (
                      <div className="mt-2 flex items-center gap-2 rounded-full bg-pink-600/30 px-3 py-1.5 text-xs text-pink-200">
                        <Volume2 className="h-3.5 w-3.5" />
                        Voice message • 0:12
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-gradient-to-r from-pink-600 to-fuchsia-600 px-3.5 py-2.5 text-sm text-white">
                    {msg.text}
                  </div>
                </div>
              )
            )}
            {typing && (
              <div className="flex items-end gap-2">
                <AiGirlfriendAvatar
                  gradient={gf.gradient}
                  name={gf.name}
                  className="h-8 w-8 flex-shrink-0"
                  showLetter={false}
                />
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-300" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-300 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-300 [animation-delay:240ms]" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <footer className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={maybeVoice}
                aria-label="Voice message"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  adult
                    ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white'
                    : 'border border-white/15 text-pink-300/70'
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={maybePhotoEvent}
                aria-label="Send photo"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  adult
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'border border-white/15 text-pink-300/70'
                )}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                placeholder={
                  adult
                    ? `Talk to ${gf.name}…`
                    : `Say hi to ${gf.name}…`
                }
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-500/60"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || typing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white transition-transform hover:scale-105 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {!adult && (
              <p className="mt-2 text-center text-[10px] text-pink-300/50">
                Mainstream mode: photo &amp; voice replies are locked. Switch to the Adult version to unlock them.
              </p>
            )}
          </footer>
        </section>
      </div>
    </main>
  );
}