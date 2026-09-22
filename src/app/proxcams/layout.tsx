import type { ReactNode } from 'react';
import { ProxCamsNav } from '@/components/proxcams/proxcams-nav';

export const metadata = {
  title: 'PROXCAMS — Live Sex Cams, Free Cam Girls & Couples | Proximity',
  description:
    'Watch live sex cams and free cam girls streaming now. Browse female, male, trans and couples cam rooms in HD — join the action through our verified adult cam partner.',
};

export default function ProxCamsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, rgba(31,3,38,1) 0%, rgba(28,8,34,1) 32%, rgba(15,2,22,1) 100%)',
      }}
    >
      <ProxCamsNav />
      {children}
    </div>
  );
}
