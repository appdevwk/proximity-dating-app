import { AiGirlfriendsNav } from '@/components/ai-girlfriends/ai-girlfriends-nav';

export const metadata = {
  title: 'Proximity AI Girlfriends — Chat, Photos & Voice',
  description:
    'Pick from a roster of AI girlfriends, chat in real time, and create your own companion. Two versions — mainstream and adult.',
};

export default function AiGirlfriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, rgba(28,0,45,1) 0%, rgba(28,10,45,1) 40%, rgba(15,2,26,1) 100%)',
      }}
    >
      <AiGirlfriendsNav />
      {children}
    </div>
  );
}