'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageCircle, Send, ShieldCheck, Heart } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import type { Conversation, ConversationUser, MessageOut } from '@/lib/types';

const POLL_INTERVAL = 3000;

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<ConversationUser | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasOpenedInitialRef = useRef(false);

  const openConversation = useCallback(async (user: ConversationUser) => {
    setActiveUser(user);
    setShowChatOnMobile(true);
    try {
      const response = await fetch(`/api/messages/${user.userId}`, { cache: 'no-store' });
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      if (response.status === 403) {
        router.push('/verify');
        return;
      }
      const data = (await response.json()) as { messages?: MessageOut[] };
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    }
  }, [router]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' });
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      if (response.status === 403) {
        router.push('/verify');
        return;
      }
      const data = (await response.json()) as { conversations?: Conversation[] };
      setConversations(data.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load + open conversation from ?with=.
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void loadConversations();
  }, [status, loadConversations, router]);

  useEffect(() => {
    if (status !== 'authenticated' || hasOpenedInitialRef.current) return;
    const withUserId = searchParams.get('with');
    if (!withUserId) return;
    hasOpenedInitialRef.current = true;
    const conversation = conversations.find((entry) => entry.user.userId === withUserId);
    if (conversation) {
      void openConversation(conversation.user);
    }
  }, [conversations, searchParams, status, openConversation]);

  // Refresh conversations every 3s (lightweight real-time sync).
  useEffect(() => {
    if (status !== 'authenticated') return;
    const refreshConversations = async () => {
      try {
        const response = await fetch('/api/messages', { cache: 'no-store' });
        if (response.ok) {
          const data = (await response.json()) as { conversations?: Conversation[] };
          setConversations(data.conversations ?? []);
        }
      } catch {
        // silent — next poll will retry
      }
    };
    void refreshConversations();
    const interval = setInterval(refreshConversations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [status]);

  // Refresh open conversation messages every 3s.
  useEffect(() => {
    if (status !== 'authenticated' || !activeUser) return;
    const refreshThread = async () => {
      try {
        const response = await fetch(`/api/messages/${activeUser.userId}`, { cache: 'no-store' });
        if (response.ok) {
          const data = (await response.json()) as { messages?: MessageOut[] };
          setMessages((prev) => {
            if (data.messages && data.messages.length === prev.length) return prev;
            return data.messages ?? prev;
          });
        }
      } catch {
        // silent
      }
    };
    const interval = setInterval(refreshThread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [status, activeUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeUser]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !activeUser || sending) return;
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeUser.userId, content }),
      });
      if (response.status === 401) {
        router.replace('/');
        return;
      }
      if (response.status === 403) {
        router.push('/verify');
        return;
      }
      const data = (await response.json()) as { message?: MessageOut };
      if (data.message) {
        setMessages((prev) => [...prev, data.message as MessageOut]);
        setInput('');
      }
      void loadConversations();
    } catch {
      // keep the text in the box so the user can retry
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((sum, entry) => sum + entry.unreadCount, 0);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black">
        <Navigation currentPath="/messages" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Loading conversations…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation currentPath="/messages" />

      <div className="max-w-5xl mx-auto px-0 md:px-4 py-4 md:py-6">
        <div className="hidden md:block mb-4">
          <h1 className="text-3xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
            Messages
          </h1>
          <p className="text-gray-400 text-sm mt-1">Chat with your matches in real time</p>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] overflow-hidden">
          {/* Conversation list */}
          <div className={`${showChatOnMobile ? 'hidden' : 'flex'} md:flex flex-col bg-gray-900/60 border border-pink-950 rounded-2xl overflow-hidden`}>
            <div className="p-4 border-b border-pink-950 flex items-center justify-between md:hidden">
              <h1 className="text-2xl font-black text-pink-500">Messages</h1>
              {totalUnread > 0 && (
                <Badge className="bg-pink-600">{totalUnread} new</Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading…</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <MessageCircle className="w-10 h-10 mx-auto text-gray-600" />
                  <p className="text-gray-400">No conversations yet.</p>
                  <p className="text-sm text-gray-500">
                    Start swiping to match with people and chat here.
                  </p>
                  <Button
                    onClick={() => router.push('/profile')}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Start Swiping
                  </Button>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.user.userId}
                    onClick={() => void openConversation(conversation.user)}
                    className={`w-full text-left flex items-center gap-3 p-4 border-b border-pink-950/40 transition-colors hover:bg-pink-950/40 ${
                      activeUser?.userId === conversation.user.userId ? 'bg-pink-950/50' : ''
                    }`}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={conversation.user.profilePicture ?? undefined} />
                      <AvatarFallback className="bg-pink-800 text-white">
                        {conversation.user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate flex items-center gap-1">
                          {conversation.user.displayName}
                          {conversation.user.userVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {timeAgo(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${conversation.unreadCount > 0 ? 'text-pink-400 font-medium' : 'text-gray-400'}`}>
                        {conversation.lastMessage
                          ? conversation.lastMessage.content
                          : 'Matched! Say hello 👋'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-pink-600 flex-shrink-0 ml-2">{conversation.unreadCount}</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat view */}
          <div className={`${showChatOnMobile ? 'flex' : 'hidden'} md:flex flex-col bg-gray-900/60 border border-pink-950 rounded-2xl overflow-hidden`}>
            {activeUser ? (
              <>
                <div className="p-4 border-b border-pink-950 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden text-pink-400"
                    onClick={() => setShowChatOnMobile(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activeUser.profilePicture ?? undefined} />
                    <AvatarFallback className="bg-pink-800 text-white">
                      {activeUser.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-1.5">
                      {activeUser.displayName}
                      {activeUser.userVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-emerald-400">Matched</p>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm mt-10">
                      You matched with {activeUser.displayName}! Break the ice and say hi 👋
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.senderId === activeUser.userId ? false : true;
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                              mine
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-sm'
                                : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-pink-200/70' : 'text-gray-500'}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-pink-950 flex gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    className="bg-gray-800 border-pink-950 text-white placeholder-gray-500"
                  />
                  <Button
                    onClick={() => void sendMessage()}
                    disabled={sending || !input.trim()}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="w-14 h-14 text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-300">Select a conversation</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Choose a match on the left to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso);
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString();
}