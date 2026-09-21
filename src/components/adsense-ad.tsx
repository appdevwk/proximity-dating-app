'use client';

import { useEffect } from 'react';

export function AdSenseAd({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  useEffect(() => {
    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
      }
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, [slot]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive={true}
    />
  );
}
