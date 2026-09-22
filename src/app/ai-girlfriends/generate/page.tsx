'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { useSiteMode } from '@/components/site-mode-provider';
import { useAiRoster } from '@/hooks/use-ai-roster';
import { AiGirlfriendAvatar } from '@/components/ai-girlfriends/ai-girlfriend-avatar';
import { cn } from '@/lib/utils';

const STYLES = ['Cinematic', 'Anime', 'Glossy', 'Noir', 'Pastel', 'HDR'];

const ADULT_SETTINGS = ['Lingerie', 'Beach', 'Studio', 'Private', 'Elegant', 'Bedroom'];
const SFW_SETTINGS = ['Portrait', 'Casual', 'Evening', 'Studio', 'Outdoors', 'Cozy'];

export default function AiGeneratorPage() {
  const { effectiveMode } = useSiteMode();
  const adult = effectiveMode === 'adult';
  const { roster, ready } = useAiRoster();

  const options = roster;
  const [selectedId, setSelectedId] = useState<string>('');
  const [style, setStyle] = useState(STYLES[0]);
  const [setting, setSetting] = useState(adult ? ADULT_SETTINGS[0] : SFW_SETTINGS[0]);
  const [generating, setGenerating] = useState(false);
  const [doneKey, setDoneKey] = useState<number>(0);

  const settings = adult ? ADULT_SETTINGS : SFW_SETTINGS;

  const selected = useMemo(
    () => options.find((g) => g.id === selectedId) ?? options[0],
    [options, selectedId]
  );

  useEffect(() => {
    if (adult) setSetting(ADULT_SETTINGS[0]);
    else setSetting(SFW_SETTINGS[0]);
  }, [adult]);

  useEffect(() => {
    if (options.length > 0 && !selectedId) setSelectedId(options[0].id);
  }, [options, selectedId]);

  const generate = () => {
    if (!selected) return;
    setGenerating(true);
    const randomSteps = 1400 + Math.floor(Math.random() * 1200);
    setTimeout(() => {
      setGenerating(false);
      setDoneKey((k) => k + 1);
    }, randomSteps);
  };

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-black text-white">
          <Wand2 className="h-6 w-6 text-pink-400" />
          {adult ? 'NSFW Image Generator' : 'Image Generator'}
        </h1>
        <p className="mt-2 text-sm text-pink-100/60">
          {adult
            ? 'Choose a character, pick your settings and mood — the generator renders her private look.'
            : 'Pick a character, choose a scene and mood — the generator renders a stylized portrait.'}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Output */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/30 p-6">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10"
            style={{ aspectRatio: '3/4' }}
          >
            {generating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
                <p className="text-sm font-bold text-pink-200">Rendering {setting.toLowerCase()}…</p>
              </div>
            ) : selected ? (
              <AiGirlfriendAvatar
                gradient={selected.gradient}
                name={selected.name}
                className="absolute inset-0 h-full w-full"
                showLetter={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-pink-300">
                No characters yet
              </div>
            )}
            {!generating && selected && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-white">{selected.name}</div>
                    <div className="text-xs text-pink-200/80">
                      {style} • {setting}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold uppercase text-white backdrop-blur">
                    {adult ? '18+' : 'Art'}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!generating && selected && doneKey > 0 && (
            <p className="mt-4 text-sm text-emerald-300">
              ✓ Ready — {adult ? 'show her exactly how you want her.' : 'she is ready for the focus of the scene.'}
            </p>
          )}
        </div>

        {/* Controls */}
        <aside className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-300/70">
              1. Choose your girl
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {options.slice(0, 9).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-colors',
                    selectedId === g.id
                      ? 'border-pink-500 bg-pink-600/20'
                      : 'border-white/10 hover:border-pink-400/50'
                  )}
                >
                  <AiGirlfriendAvatar
                    gradient={g.gradient}
                    name={g.name}
                    className="h-12 w-12"
                    showLetter={false}
                  />
                  <span className="w-full truncate text-[10px] font-bold text-pink-100/80">
                    {g.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-300/70">
              2. Style
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                    style === s
                      ? 'bg-pink-600 text-white'
                      : 'bg-white/5 text-pink-300 hover:bg-white/10'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-300/70">
              3. {adult ? 'Setting' : 'Scene'}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {settings.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSetting(s)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                    setting === s
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-white/5 text-pink-300 hover:bg-white/10'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={generating || !selected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 py-3 text-sm font-black uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Image
              </>
            )}
          </button>

          {!adult && (
            <p className="text-center text-[11px] text-pink-300/50">
              Switch to the Adult version to unlock NSFW settings.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}