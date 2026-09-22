'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Wand2, Check } from 'lucide-react';
import { useAiRoster } from '@/hooks/use-ai-roster';
import {
  AI_GRADIENT_PALETTE,
  fallbackLines,
  slugify,
  type AiRating,
  type CustomAiGirlfriend,
} from '@/lib/ai-girlfriends-data';
import { AiGirlfriendAvatar } from '@/components/ai-girlfriends/ai-girlfriend-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VIBES = ['Sultry', 'Playful', 'Romantic', 'Crazy', 'Submissive', 'Step mom', 'Bratty', 'Sweet'];

export default function CreateCharacterPage() {
  const router = useRouter();
  const { addCharacter } = useAiRoster();

  const [name, setName] = useState('');
  const [age, setAge] = useState(21);
  const [vibe, setVibe] = useState('Playful');
  const [bio, setBio] = useState('');
  const [backstory, setBackstory] = useState('');
  const [opening, setOpening] = useState('');
  const [gradient, setGradient] = useState(AI_GRADIENT_PALETTE[0]);
  const [rating, setRating] = useState<AiRating>('mainstream');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (name.trim().length < 2) {
      setError('Give her a name (at least 2 characters).');
      return;
    }
    if (age < 21) {
      setError('All Proximity AI characters must be 21+.');
      return;
    }

    const slug = slugify(name);
    const character: CustomAiGirlfriend = {
      id: crypto.randomUUID(),
      slug,
      name: name.trim(),
      age,
      vibe,
      bio: bio.trim() || `${vibe} AI girlfriend created by you.`,
      backstory:
        backstory.trim() ||
        `A ${vibe.toLowerCase()} companion you designed from scratch — make her memories yours.`,
      tags: ['New'],
      rating,
      gradient,
      tone: vibe.toLowerCase(),
      opening:
        opening.trim() ||
        `Hi! I am ${name.trim()} — you created me, so I am exactly how you like me.`,
      lines: fallbackLines(name.trim()),
      adultLines: rating === 'adult' ? [
        { hint: 'sex', reply: 'You made me this way… so show me exactly what you want and I will match it.' },
      ] : [],
    };

    setSaving(true);
    setTimeout(() => {
      addCharacter(character);
      router.push(`/ai-girlfriends/${slug}`);
    }, 400);
  };

  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black text-white">
          <Heart className="h-6 w-6 text-pink-400" />
          Create Your Own AI Girlfriend
        </h1>
        <p className="mt-2 text-sm text-pink-100/60">
          Define her look, personality, and backstory. She goes straight to your roster.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="relative aspect-[4/5]">
            <AiGirlfriendAvatar
              gradient={gradient}
              name={name || 'Your Girl'}
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{name || 'Your Girl'}</h2>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  {age} yrs
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-pink-300">
                {vibe} • {rating === 'adult' ? '18+' : 'Mainstream'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luna"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-500/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
                Age (21+)
              </label>
              <input
                type="number"
                min={21}
                max={60}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-pink-500/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
              Personality
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVibe(v)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                    vibe === v
                      ? 'bg-pink-600 text-white'
                      : 'bg-white/5 text-pink-300 hover:bg-white/10'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
              Look (color palette)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AI_GRADIENT_PALETTE.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradient(g)}
                  className={cn(
                    'h-10 w-full rounded-lg bg-gradient-to-br transition-transform hover:scale-105',
                    g,
                    gradient === g && 'ring-2 ring-white'
                  )}
                  aria-label={g}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
              Version
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRating('mainstream')}
                className={cn(
                  'rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                  rating === 'mainstream'
                    ? 'border-pink-500 bg-pink-600/20 text-white'
                    : 'border-white/10 text-pink-300 hover:border-pink-400/50'
                )}
              >
                Mainstream
                <span className="block text-[10px] font-medium text-pink-200/60">SFW companion</span>
              </button>
              <button
                type="button"
                onClick={() => setRating('adult')}
                className={cn(
                  'rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                  rating === 'adult'
                    ? 'border-rose-500 bg-rose-600/20 text-white'
                    : 'border-white/10 text-pink-300 hover:border-rose-400/50'
                )}
              >
                18+ Adult
                <span className="block text-[10px] font-medium text-pink-200/60">NSFW roleplay</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="One-liner about her…"
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-500/60"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
                Backstory
              </label>
              <textarea
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                rows={2}
                placeholder="Where is she from? What shaped her?"
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-500/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-pink-300/70">
              First message she sends you
            </label>
            <input
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder={`Hi! I am ${name || 'Luna'} — you created me…`}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-pink-300/40 outline-none focus:border-pink-500/60"
            />
          </div>

          {error && <p className="text-sm font-bold text-rose-300">{error}</p>}

          <Button
            onClick={save}
            disabled={saving}
            className="w-full gap-2 bg-gradient-to-r from-pink-600 to-fuchsia-600 py-3 text-sm font-black uppercase tracking-wide text-white hover:opacity-90"
          >
            {saving ? (
              <span className="animate-pulse">Bringing her to life…</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create Her
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-pink-300/50">
            <Wand2 className="h-3 w-3" />
            Your creation is saved on this device and appears in your roster.
          </p>
        </div>
      </div>
    </main>
  );
}