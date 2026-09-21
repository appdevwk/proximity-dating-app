'use client';

import { useSiteMode } from '@/components/site-mode-provider';
import { useSession } from '@/hooks/use-session';

export function SiteModeToggle() {
  const { effectiveMode, setEffectiveMode, setMode } = useSiteMode();
  const { status, siteMode, updateSiteMode } = useSession();
  const isAuthed = status === 'authenticated';

  const select = (value: 'mainstream' | 'adult') => {
    setEffectiveMode(value);
    if (isAuthed) {
      void updateSiteMode(value);
    } else {
      setMode(value);
    }
  };

  const buttonClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
      active ? 'bg-pink-600 text-white' : 'text-pink-300 hover:text-white bg-white/5'
    }`;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-black/30 p-1" title={`Version: ${effectiveMode}`}>
      <button type="button" onClick={() => select('mainstream')} className={buttonClass(effectiveMode === 'mainstream')}>
        Mainstream
      </button>
      <button type="button" onClick={() => select('adult')} className={buttonClass(effectiveMode === 'adult')}>
        Adult
      </button>
      {isAuthed && siteMode === 'both' && (
        <span className="px-2 text-[11px] text-gray-400 hidden lg:inline">Both</span>
      )}
    </div>
  );
}