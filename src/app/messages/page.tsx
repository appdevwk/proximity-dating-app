'use client';

import { Suspense } from 'react';
import { Navigation } from '@/components/navigation';
import MessagesClient from './messages-client';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white">
          <Navigation currentPath="/messages" />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-pink-500 animate-pulse">Loading…</div>
          </div>
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}