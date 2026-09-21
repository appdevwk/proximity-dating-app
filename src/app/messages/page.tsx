'use client';

import { Suspense } from 'react';
import { Navigation } from '@/components/navigation';
import MessagesClient from './messages-client';
import { AdBanner } from '@/components/ad-manager';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
          <Navigation currentPath="/messages" />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-pink-500 animate-pulse">Loading…</div>
          </div>
        </div>
      }
    >
      <MessagesClient />
      <div className="text-center py-6">
        <AdBanner slot="1234567892" />
      </div>
      <AdBanner slot="1234567894" />
    </Suspense>
  );
}