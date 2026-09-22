'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Wand2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { useAiRoster } from '@/hooks/use-ai-roster';
import { AiGirlfriendCard } from '@/components/ai-girlfriends/ai-girlfriend-card';
import { AiGirlfriendAvatar } from '@/components/ai-girlfriends/ai-girlfriend-avatar';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'mainstream' | 'adult';

interface Slide {
  key: string;
  adultOnly: boolean;
  heading: React.ReactNode;
  sub?: string;
  cta: string;
  href: string;
  blue?: boolean;
  icon?: React.ReactNode;
  gradient?: string;
}

export default function AiGirlfriendsHomePage() {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';
  const { roster, ready } = useAiRoster();

  const [heroIndex, setHeroIndex] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 'create',
        adultOnly: false,
        heading: (
          <>
            Create Your Own
            <br />
            <strong>AI Girlfriend</strong>
          </>
        ),
        cta: 'Create Now',
        href: '/ai-girlfriends/characters/new',
        gradient: 'from-fuchsia-600 via-purple-600 to-indigo-700',
      },
      {
        key: 'generate',
        adultOnly: false,
        heading: (
          <>
            Image Generator
            <br />
            <strong>Create the perfect image in seconds</strong>
          </>
        ),
        sub: 'Choose your settings, poses, and actions!',
        cta: 'Generate',
        href: '/ai-girlfriends/generate',
        blue: true,
        icon: <Wand2 className="h-3.5 w-3.5" />,
        gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
      },
      {
        key: 'private',
        adultOnly: true,
        heading: (
          <>
            Unlock Her
            <br />
            <strong>Private Content</strong>
          </>
        ),
        cta: 'Unlock Now',
        href: '/ai-girlfriends/keina-mori',
        icon: <Lock className="h-3.5 w-3.5" />,
        gradient: 'from-rose-500 via-pink-600 to-fuchsia-600',
      },
      {
        key: 'live',
        adultOnly: true,
        heading: (
          <>
            Jump Into
            <br />
            <strong>LIVE Action</strong>
          </>
        ),
        sub: 'A round the clock companionship',
        cta: 'Join Now',
        href: '/ai-girlfriends',
        blue: true,
        icon: <Play className="h-3.5 w-3.5" />,
        gradient: 'from-indigo-600 via-purple-600 to-fuchsia-600',
      },
    ],
    []
  );

  const visibleSlides = slides.filter((s) => !s.adultOnly || adult);

  useEffect(() => {
    const bounded = Math.min(heroIndex, visibleSlides.length - 1);
    if (bounded !== heroIndex) setHeroIndex(bounded);
  }, [visibleSlides.length, heroIndex]);

  useEffect(() => {
    if (heroTimer.current) clearInterval(heroTimer.current);
    heroTimer.current = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % visibleSlides.length);
    }, 6000);
    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current);
    };
  }, [visibleSlides.length]);

  const features = useMemo(() => roster, [roster]);
  const filtered = useMemo(() => {
    return features.filter((gf) => {
      if (filter === 'adult') return gf.rating === 'adult';
      if (filter === 'mainstream') return gf.rating === 'mainstream';
      if (!adult) return gf.rating === 'mainstream';
      return true;
    });
  }, [features, filter, adult]);

  const framed = filtered.slice(0, 18);

  const showHeading = (filter: Filter) => {
    if (filter === 'all') return 'Browse AI Girlfriends';
    if (filter === 'mainstream') return 'Mainstream AI Girlfriends';
    return 'Adult & NSFW AI Girlfriends';
  };

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Hero slideshow */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${heroIndex * 100}%)` }}
        >
          {visibleSlides.map((slide) => (
            <Link
              key={slide.key}
              href={slide.href}
              className="relative block w-full shrink-0"
              style={{ aspectRatio: '5/2' }}
            >
              <AiGirlfriendAvatar
                gradient={slide.gradient ?? 'from-pink-600 to-fuchsia-700'}
                name=""
                className="absolute inset-0 h-full w-full"
                showLetter={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12">
                <h2 className="max-w-md text-2xl sm:text-4xl font-black uppercase leading-tight text-white drop-shadow-lg">
                  {slide.heading}
                </h2>
                {slide.sub && <p className="mt-2 text-sm text-pink-200 max-w-sm">{slide.sub}</p>}
                <span
                  className={cn(
                    'mt-5 inline-flex items-center gap-2 self-start rounded-lg px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl transition-transform hover:scale-105',
                    slide.blue
                      ? 'bg-gradient-to-r from-blue-600 to-fuchsia-600'
                      : 'bg-gradient-to-r from-pink-600 to-fuchsia-600'
                  )}
                >
                  {slide.icon}
                  {slide.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setHeroIndex((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setHeroIndex((prev) => (prev + 1) % visibleSlides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {visibleSlides.map((slide, i) => (
            <button
              key={slide.key}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setHeroIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === heroIndex ? 'w-6 bg-pink-500' : 'w-2 bg-white/40 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      </div>

      {/* LIVE action strip */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-baseline gap-2 text-xl sm:text-2xl font-black text-white">
            <span className="text-pink-400">Jump into</span>
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2 py-0.5 text-sm font-black text-red-400 ring-1 ring-red-500/40">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
            ACTION
          </h2>
          <Link href="/ai-girlfriends/generate" className="text-sm font-bold text-pink-300 hover:text-white">
            See all →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {features.slice(4, 10).map((gf) => (
            <Link
              key={gf.id}
              href={`/ai-girlfriends/${gf.slug}`}
              className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-white/10"
            >
              <div className="relative aspect-[3/4]">
                <AiGirlfriendAvatar
                  gradient={gf.gradient}
                  name={gf.name}
                  className="absolute inset-0 h-full w-full"
                  showLetter={false}
                />
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-black uppercase text-white backdrop-blur">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-red-500" />
                  Live
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <div className="text-sm font-black text-white">{gf.name}</div>
                  <div className="text-[10px] text-pink-300 font-bold">{gf.age} yrs</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Intro */}
      <section className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          The AI Girlfriend App Made for Real Chat
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-pink-100/60">
          {adult
            ? 'Every character chats back in real time, remembers what you talked about, and can send photos and voice when the moment calls for it. Browse the roster — or create your own AI girlfriend from scratch.'
            : 'Chat with companions who reply in real time, keep your memory, and feel genuinely alive. Browse the mainstream roster — or create your own AI girlfriend from scratch.'}
        </p>
      </section>

      {/* Browse grid */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-white">{showHeading(filter)}</h2>
          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {(
              [
                { key: 'all', label: adult ? 'All' : 'SFW' },
                { key: 'mainstream', label: 'Mainstream' },
                { key: 'adult', label: 'Adult' },
              ] as { key: Filter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                disabled={!adult && tab.key === 'adult'}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                  filter === tab.key
                    ? 'bg-pink-600 text-white'
                    : 'text-pink-300 hover:bg-white/10 disabled:opacity-40'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {!ready ? (
          <div className="py-20 text-center text-pink-300 animate-pulse">Loading roster…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <p className="text-pink-200">
              No {filter === 'adult' ? 'adult' : filter === 'mainstream' ? 'mainstream' : ''} AI
              girlfriends match — switch versions to see the full roster.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {framed.map((gf) => (
              <AiGirlfriendCard
                key={gf.id}
                girlfriend={gf}
                href={`/ai-girlfriends/${gf.slug}`}
              />
            ))}
          </div>
        )}

        {features.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/ai-girlfriends/characters/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 px-6 py-3 text-sm font-black text-white uppercase tracking-wide hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Create your own AI Girlfriend
            </Link>
          </div>
        )}
      </section>

      {/* Longform SEO */}
      <section className="mb-10 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-pink-100/70">
        <h2 className="text-lg font-black text-white">How AI Girlfriend Chat Works</h2>
        <p>
          Type in the chat box and the AI girlfriend reads your message, pulls context from your
          conversation, and replies in her voice — no mode switching, no separate tools. Voice
          replies, photo replies, and roleplay scenarios all run inside the same chat window.
        </p>
        {adult ? (
          <p>
            The adult roster adds private, 18+ roleplay: unlock private content, request photos,
            and let conversations escalate as far as you want them to. Every character is
            explicitly adult (21+).
          </p>
        ) : (
          <p>
            The mainstream experience keeps every companion warm, playful, and fully safe for all
            audiences while still feeling real and personal.
          </p>
        )}
        <h2 className="text-lg font-black text-white">Free to Start</h2>
        <p>
          Free accounts include unlimited text chat with any character in the roster. Premium adds
          priority replies, longer memory, and uncapped voice and image generation.
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-10 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-black text-white">AI Girlfriend App FAQ</h2>
        {[
          {
            q: 'Is this a free AI girlfriend feature?',
            a: 'Yes. Free accounts get unlimited text chat with any AI girlfriend in the roster. Voice replies, photo generation, and custom characters are part of the paid plans.',
          },
          {
            q: 'Can I make my own AI girlfriend?',
            a: 'Yes. Open the character creator, define her look, personality, voice, and backstory, save her, and she will chat the same way as featured characters.',
          },
          {
            q: 'Can my AI girlfriend send photos?',
            a: `${
              adult
                ? 'Yes. Ask in chat and she replies with a generated image that matches her look and the context of your message.'
                : 'Photo replies are available on the adult version of this feature. The mainstream version keeps photos profile-style.'
            }`,
          },
          {
            q: 'How is the adult version different?',
            a: 'The adult version unlocks the NSFW roster, private roleplay and photo replies. It requires an adult user account and is strictly 18+.',
          },
        ].map((faq) => (
          <div key={faq.q}>
            <h3 className="font-bold text-pink-300">{faq.q}</h3>
            <p className="mt-1 text-[13px] text-pink-100/60">{faq.a}</p>
          </div>
        ))}
      </section>

      <p className="pb-4 text-center text-[11px] text-pink-100/40">
        Proximity AI is an AI companion feature of the Proximity dating app. All characters are AI-generated and 21+.
      </p>
    </main>
  );
}