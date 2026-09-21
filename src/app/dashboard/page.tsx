'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdBanner, AdInterstitial } from '@/components/ad-manager';
import { useSession } from '@/hooks/use-session';
import type { Conversation, MatchSummary, UserMe } from '@/lib/types';
import { Heart, MessageCircle, MessagesSquare, ShieldCheck, Sparkles, UserRound, Settings, MapPin, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [me, setMe] = useState<UserMe | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void Promise.all([
      fetch('/api/user/me', { cache: 'no-store' }).then((response) =>
        response.ok ? (response.json() as Promise<UserMe>) : null
      ),
      fetch('/api/matches?limit=4', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : Promise.resolve({ matches: [] })
      ),
      fetch('/api/messages', { cache: 'no-store' }).then((response) =>
        response.ok ? response.json() : Promise.resolve({ conversations: [] })
      ),
    ])
      .then(([meData, matchesData, messagesData]) => {
        setMe(meData);
        setMatches(matchesData.matches ?? []);
        setConversations(messagesData.conversations ?? []);
      })
      .catch(() => {
        setMe(null);
      })
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/dashboard" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Loading your dashboard…</div>
        </div>
      </div>
    );
  }

  const stats = me?.stats;
  const totalUnread = conversations.reduce((sum, entry) => sum + entry.unreadCount, 0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
       <Navigation currentPath="/dashboard" />

       <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
         <div className="flex items-center justify-between flex-wrap gap-3">
           <div>
             <h1 className="text-3xl md:text-4xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
               Welcome back 👋
             </h1>
             <p className="text-gray-400 mt-1">
               {me?.profile?.displayName ?? me?.user.name ?? me?.user.email}
             </p>
           </div>
           <div className="flex gap-2">
             <Button
               onClick={() => router.push('/profile')}
               className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
             >
               <Heart className="w-4 h-4 mr-2" />
               Discover
             </Button>
             <Button variant="outline" onClick={() => router.push('/profile/edit')}>
               <Settings className="w-4 h-4 mr-2" />
               Edit Profile
              </Button>
            </div>
          </div>

          {me?.verification && !me.verification.verified && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-600/40 rounded-xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200 flex-1">
              Complete profile verification to unlock browsing, matching, and messaging.
            </p>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => router.push('/verify')}
            >
              Verify Now
            </Button>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Matches"
              value={stats.acceptedMatches}
              icon={<Heart className="w-4 h-4 text-pink-400" />}
              onClick={() => router.push('/messages')}
            />
            <StatCard
              label="New Messages"
              value={stats.unreadMessages}
              icon={<MessagesSquare className="w-4 h-4 text-purple-400" />}
              onClick={() => router.push('/messages')}
            />
            <StatCard
              label="Likes Received"
              value={stats.likesReceived}
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            />
            <StatCard
              label="Messages Sent"
              value={stats.messages}
              icon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile preview */}
          <Card className="bg-gray-900/60 border-pink-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-400">Your Profile</CardTitle>
              {me?.profile?.ageVerified && (
                <Badge className="bg-green-900/60 text-green-300 border border-green-700/50">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={me?.profile?.profilePicture ?? undefined} />
                  <AvatarFallback className="bg-pink-800 text-white text-2xl">
                    {(me?.profile?.displayName ?? 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-lg">{me?.profile?.displayName ?? 'Set up your profile'}</div>
                  {me?.profile?.age !== null && me?.profile?.age !== undefined && (
                    <div className="text-sm text-gray-400">{me?.profile.age} • {me?.profile?.gender}</div>
                  )}
                </div>
              </div>

              {me?.profile?.location && (
                <p className="flex items-center text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mr-1 text-pink-400" />
                  {me.profile.location}
                </p>
              )}
              {me?.profile?.bio && (
                <p className="text-sm text-gray-300 line-clamp-3">{me.profile.bio}</p>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interested in</p>
                <div className="flex flex-wrap gap-1.5">
                  {(me?.preferences?.interestedIn ?? []).map((gender) => (
                    <Badge key={gender} className="bg-gray-800 text-pink-300 border border-pink-900">
                      {gender}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/profile/edit')}
              >
                <UserRound className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            </CardContent>
          </Card>

          {/* Recent matches */}
          <Card className="bg-gray-900/60 border-pink-950">
            <CardHeader>
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Recent Matches
              </CardTitle>
              <CardDescription className="text-gray-500">
                People you&apos;ve matched with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {matches.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-gray-500">No matches yet.</p>
                  <Button
                    onClick={() => router.push('/profile')}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Find Your Match
                  </Button>
                </div>
              ) : (
                matches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => router.push(`/messages?with=${match.user.userId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-pink-950/40 transition-colors text-left"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={match.user.profilePicture ?? undefined} />
                      <AvatarFallback className="bg-pink-800 text-white">
                        {match.user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1">
                        {match.user.displayName}
                        {match.user.userVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Matched {timeAgo(match.matchedAt)}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent messages */}
          <Card className="bg-gray-900/60 border-pink-950">
            <CardHeader>
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Recent Messages
              </CardTitle>
              <CardDescription className="text-gray-500">
                Latest conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No conversations yet.</p>
                </div>
              ) : (
                conversations.slice(0, 4).map((conversation) => (
                  <button
                    key={conversation.user.userId}
                    onClick={() => router.push(`/messages?with=${conversation.user.userId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-pink-950/40 transition-colors text-left"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.user.profilePicture ?? undefined} />
                      <AvatarFallback className="bg-pink-800 text-white">
                        {conversation.user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{conversation.user.displayName}</div>
                      <div className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-pink-400' : 'text-gray-500'}`}>
                        {conversation.lastMessage?.content ?? 'Say hello 👋'}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-pink-600">{conversation.unreadCount}</Badge>
                    )}
                  </button>
                ))
              )}
              {totalUnread > 0 && (
                <Button variant="outline" className="w-full" onClick={() => router.push('/messages')}>
                  Open Messages
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-6">
          <AdBanner slot="1234567892" />
        </div>
        <AdBanner slot="1234567893" />
        <AdInterstitial slot="1234567895" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-black text-white">{value}</div>
      </div>
    </>
  );

  return onClick ? (
    <button onClick={onClick} className="text-left bg-gray-900/60 border border-pink-950 rounded-2xl p-4 hover:bg-pink-950/40 transition-colors">
      {content}
    </button>
  ) : (
    <div className="bg-gray-900/60 border border-pink-950 rounded-2xl p-4">{content}</div>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}