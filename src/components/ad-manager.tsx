'use client';

import { useEffect, useState, useCallback } from 'react';
import { AD_SENSE_CLIENT_ID, EXOCLICK_ZONE_ID } from '@/lib/site-config';
import { useSiteMode } from '@/components/site-mode-provider';

function ExoClickFrame({ zone, width = '100%', height = '90px' }: { zone: string; width?: string; height?: string }) {
  return (
    <iframe
      src={`https://a.exoclick.com/frame.php?id=${zone}&dimension=0x0`}
      width={width}
      height={height}
      frameBorder={0}
      scrolling="no"
      style={{ display: 'block', width, height, maxWidth: '728px', margin: '10px auto', border: 0 }}
      title="Advertisement"
    />
  );
}

export function AdManager() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded || typeof window === 'undefined') return;
    const existing = document.querySelector('script[data-ad-sense]');
    if (existing) {
      setLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_SENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adSense = 'true';
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, [loaded]);

  return null;
}

export function AdBanner({ slot }: { slot: string }) {
  const { effectiveMode } = useSiteMode();
  if (effectiveMode === 'adult') {
    return <ExoClickFrame zone={EXOCLICK_ZONE_ID} />;
  }
  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', maxWidth: '728px', margin: '10px auto' }}
      data-ad-client={AD_SENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive={true}
    />
  );
}

export function AdRectangle({ slot }: { slot: string }) {
  const { effectiveMode } = useSiteMode();
  if (effectiveMode === 'adult') {
    return <ExoClickFrame zone={EXOCLICK_ZONE_ID} height="250px" />;
  }
  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', maxWidth: '300px', margin: '10px auto' }}
      data-ad-client={AD_SENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive={true}
    />
  );
}

export function AdLeaderboard({ slot }: { slot: string }) {
  const { effectiveMode } = useSiteMode();
  if (effectiveMode === 'adult') {
    return <ExoClickFrame zone={EXOCLICK_ZONE_ID} height="90px" />;
  }
  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', maxWidth: '728px', margin: '0 auto' }}
      data-ad-client={AD_SENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive={true}
    />
  );
}

export function AdInterstitial({ slot }: { slot: string }) {
  const { effectiveMode } = useSiteMode();
  const [show, setShow] = useState(false);

  const handleShow = useCallback(() => {
    setShow(true);
    if (effectiveMode !== 'adult') {
      try {
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      } catch (e) {
        console.error('Ad load error:', e);
      }
    }
  }, [effectiveMode]);

  if (!show) {
    return (
      <button
        onClick={handleShow}
        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        Watch Ad
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShow(false)}>
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {effectiveMode === 'adult' ? (
          <ExoClickFrame zone={EXOCLICK_ZONE_ID} height="300px" />
        ) : (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={AD_SENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive={true}
          />
        )}
        <button
          onClick={() => setShow(false)}
          className="mt-4 w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors"
        >
          Close Ad
        </button>
      </div>
    </div>
  );
}