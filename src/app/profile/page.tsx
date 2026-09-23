'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { AdBanner } from '@/components/ad-manager';
import {
  Heart,
  X,
  Star,
  MapPin,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import type { DiscoverProfile } from '@/lib/types';

const SWIPE_THRESHOLD = 80;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession();
  const [deck, setDeck] = useState<DiscoverProfile[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<DiscoverProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [swipeError, setSwipeError] = useState<string | null>(null);
  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void loadProfiles(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadProfiles = useCallback(async (atOffset: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profiles/discover?limit=20&offset=${atOffset}`, {
        cache: 'no-store',
      });
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      const data = (await response.json()) as {
        profiles?: DiscoverProfile[];
        total?: number;
        verificationRequired?: boolean;
      };
      if (response.status === 403 && data.verificationRequired) {
        router.push('/verify');
        return;
      }
      const profiles = data.profiles ?? [];
      setDeck(atOffset === 0 ? profiles : (prev) => [...prev, ...profiles]);
      setOffset(atOffset + profiles.length);
      setHasMore(profiles.length > 0 && profiles.length % 20 === 0);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const topCard = useMemo(() => deck[0] ?? null, [deck]);

  const swipe = useCallback(async (action: 'like' | 'dislike' | 'super_like') => {
    if (!topCard || busy) return;
    setBusy(true);
    setSwipeError(null);
    const profile = topCard;
    setDeck((prev) => prev.filter((entry) => entry.userId !== profile.userId));
    try {
      const response = await fetch('/api/profiles/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: profile.id, action }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      if (!response.ok) {
        setSwipeError(data.error ?? 'Something went wrong, try again.');
        // Re-insert the profile so the user can retry.
        setDeck((prev) => [profile, ...prev]);
        return;
      }
      if (data.isNewMatch) {
        setMatchedProfile(profile);
      }
    } catch {
      setDeck((prev) => [profile, ...prev]);
      setSwipeError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }, [topCard, busy, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black">
        <Navigation currentPath="/profile" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 text-lg animate-pulse">Loading profiles…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
      <Navigation currentPath="/profile" />

      <div
        className="container max-w-xl mx-auto px-4 py-6"
        ref={lastRef}
      >
        {swipeError && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3">
            {swipeError}
          </div>
        )}

        <div className="relative h-[68vh] md:h-[70vh]">
          {loading && deck.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-pink-500 animate-pulse">Finding matches…</div>
            </div>
          ) : (
            <>
              {deck.slice(0, 3).map((profile, index) => {
                const isTop = index === 0;
                if (!isTop) {
                  return (
                    <div
                      key={profile.userId}
                      className="absolute inset-0 rounded-2xl bg-white/5 border border-pink-900/40"
                      style={{ transform: `translateY(${index * 8}px) scale(${1 - index * 0.02})` }}
                    />
                  );
                }
                return (
                  <motion.div
                    key={profile.userId}
                    className="absolute inset-0"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.9}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > SWIPE_THRESHOLD) void swipe('like');
                      else if (info.offset.x < -SWIPE_THRESHOLD) void swipe('dislike');
                    }}
                    whileDrag={{ scale: 1.03 }}
                  >
                    <ProfileCard profile={profile} />
                  </motion.div>
                );
              })}

              {!topCard && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-pink-600/20 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-pink-400">That&apos;s all for now</h2>
                    <p className="text-gray-400 mt-1">
                      {hasMore ? 'Load more singles nearby' : 'Tweak your preferences to see more people.'}
                    </p>
                  </div>
                  {hasMore && (
                    <Button
                      onClick={() => void loadProfiles(offset)}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Load More
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => router.push('/profile/edit')}>
                    <UserRound className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}

              {deck.length >= 4 && <div className="absolute inset-0 rounded-2xl bg-white/5 border border-pink-900/30" style={{ transform: 'translateY(16px) scale(0.96)' }} />}
            </>
          )}
        </div>

        {topCard && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <SwipeButton
              icon={<X className="w-7 h-7" />}
              className="bg-gray-800 hover:bg-gray-700 text-white w-16 h-16"
              title="Pass"
              onClick={() => void swipe('dislike')}
              disabled={busy}
            />
            <SwipeButton
              icon={<Heart className="w-9 h-9" />}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white w-20 h-20 shadow-lg shadow-pink-600/30"
              title="Like"
              onClick={() => void swipe('like')}
              disabled={busy}
            />
            <SwipeButton
              icon={<Star className="w-6 h-6" />}
              className="bg-purple-700 hover:bg-purple-600 text-white w-16 h-16"
              title="Super Like"
              onClick={() => void swipe('super_like')}
              disabled={busy}
            />
          </div>
        )}

        {topCard && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Drag the card left to pass, right to like
          </p>
        )}
      </div>

      <AnimatePresence>
        {matchedProfile && (
          <MatchOverlay
            profile={matchedProfile}
            onClose={() => setMatchedProfile(null)}
            onMessage={() => {
              router.push(`/messages?with=${matchedProfile.userId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileCard({ profile }: { profile: DiscoverProfile }) {
  const initial = profile.displayName.charAt(0).toUpperCase();
  return (
    <Card className="relative w-full h-full overflow-hidden rounded-2xl bg-gray-900 border-pink-900/40 shadow-2xl">
      {profile.profilePicture ? (
        <img
          src={profile.profilePicture}
          alt={profile.displayName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-700/40 to-purple-800/40 flex items-center justify-center">
          <Avatar className="w-32 h-32 bg-black/40">
            <AvatarFallback className="text-6xl text-pink-400">{initial}</AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

      <div className="absolute top-4 left-4 flex gap-2">
        <Badge className="bg-black/60 text-pink-300 border border-pink-800/50 backdrop-blur-sm">
          {profile.age}
        </Badge>
        {profile.userVerified && (
          <Badge className="bg-green-900/60 text-green-300 border border-green-700/50 backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5">
        <h2 className="text-2xl md:text-3xl font-black text-white">
          {profile.displayName}, {profile.age}
        </h2>
        {(profile.location || profile.distanceMiles != null) && (
          <p className="flex items-center text-sm text-gray-200 mt-1">
            <MapPin className="w-4 h-4 mr-1 text-pink-400" />
            {profile.location ? `${profile.location}` : 'Nearby'}
            {profile.distanceMiles === 0 && ' • Less than a mile away'}
            {profile.distanceMiles != null && profile.distanceMiles > 0 && ` • ${profile.distanceMiles} mi away`}
          </p>
        )}
        {profile.bio && <p className="text-sm text-gray-300 mt-2 line-clamp-3">{profile.bio}</p>}
        {profile.interestedIn.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interestedIn.map((interest) => (
              <Badge
                key={interest}
                className="bg-pink-600/70 text-white border border-pink-400/40"
              >
                {interest}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function SwipeButton({
  icon,
  className,
  title,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  className: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {icon}
    </button>
  );
}

function MatchOverlay({
  profile,
  onClose,
  onMessage,
}: {
  profile: DiscoverProfile;
  onClose: () => void;
  onMessage: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-sm text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="text-5xl"
        >
          💖
        </motion.div>
        <h2 className="text-5xl font-black mt-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          It&apos;s a Match!
        </h2>
        <p className="text-gray-400 mt-2">
          You and {profile.displayName} liked each other.
        </p>

        <div className="relative mt-6 h-56 rounded-2xl overflow-hidden border border-pink-800/50">
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-700 to-purple-800 flex items-center justify-center text-6xl text-white">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-xl font-bold">
              {profile.displayName}, {profile.age}
            </h3>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 text-gray-300 border-pink-900"
            onClick={onClose}
          >
            Keep Swiping
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            onClick={onMessage}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Send a Message
          </Button>
        </div>
      </motion.div>
      <div className="text-center py-6">
        <AdBanner slot="1234567892" />
      </div>
      <AdBanner slot="1234567894" />
    </motion.div>
  );
}