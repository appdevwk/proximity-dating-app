'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/hooks/use-session';
import { Check, Loader2, Globe, ShieldCheck, X } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  maxSites: number;
  description: string;
}

interface Target {
  id: string;
  name: string;
  slug: string;
  popular: boolean;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  plan: { id: string; name: string; slug: string; price: number; maxSites: number };
  targets: Target[];
}

export default function SubscribePage() {
  const router = useRouter();
  const { status } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [catalogResponse, statusResponse] = await Promise.all([
        fetch('/api/crosspost', { cache: 'no-store' }),
        fetch('/api/crosspost/status', { cache: 'no-store' }),
      ]);
      if (catalogResponse.ok) {
        const catalog = await catalogResponse.json();
        setPlans(catalog.plans ?? []);
        setTargets(catalog.targets ?? []);
      }
      if (statusResponse.ok) {
        const data = await statusResponse.json();
        setSubscription(data.subscription ?? null);
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'success') {
          setMessage('Payment successful! Your cross-post subscription is active.');
        } else if (params.get('checkout') === 'cancelled') {
          setMessage('Checkout cancelled. No charges were made.');
        }
      }
    } catch {
      setError('Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void load();
  }, [status, router, load]);

  const subscribe = async (planId: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/crosspost/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Checkout could not be started');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.activated) {
        setMessage('Subscription activated!');
        await load();
        return;
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleTarget = async (targetId: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/crosspost/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not update site');
        return;
      }
      setMessage(data.message ?? 'Updated');
      await load();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitAll = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/crosspost/submit', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Submission failed');
        return;
      }
      setMessage(data.message ?? 'Submitted!');
      await load();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/subscribe" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
        </div>
      </div>
    );
  }

  const planLimit = subscription?.plan.maxSites ?? 0;
  const activeTargetIds = new Set((subscription?.targets ?? []).map((t) => t.id));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
      <Navigation currentPath="/subscribe" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white" style={{ textShadow: '0 0 20px rgba(236,72,153,0.9)' }}>
            Cross-Post Your Profile Everywhere
          </h1>
          <p className="text-gray-300 mt-3 max-w-2xl mx-auto">
            Automatically place your profile on partner dating sites to reach more people. Just pick a plan,
            choose the sites, and we handle the rest.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 mb-4">
            <Check className="w-4 h-4 flex-shrink-0" />
            {message}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan.id === plan.id;
            return (
              <Card key={plan.id} className={`bg-black/70 backdrop-blur-md border rounded-2xl shadow-2xl ${isCurrent ? 'border-pink-500 ring-1 ring-pink-500' : 'border-gray-700/50'}`}>
                <CardHeader className={plan.slug.startsWith('mega') ? 'text-center pb-2' : 'text-center pb-2'}>
                  {plan.slug.startsWith('mega') && (
                    <Badge className="mx-auto bg-pink-600 text-white">Most Popular</Badge>
                  )}
                  <CardTitle className="text-xl font-black text-pink-400">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    <span className="text-3xl font-black text-white">${plan.price.toFixed(2)}</span>
                    <span className="text-sm"> / month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <p className="text-sm text-gray-300">{plan.description}</p>
                  <p className="text-sm text-pink-300 font-bold">
                    {plan.maxSites} partner sites included
                  </p>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg text-lg"
                    disabled={busy || isCurrent}
                    onClick={() => void subscribe(plan.id)}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : busy
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sites */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">Select Partner Sites</h2>
            {subscription ? (
              <span className="text-sm text-gray-400">
                {activeTargetIds.size} / {planLimit} sites active
              </span>
            ) : (
              <span className="text-sm text-gray-400">Subscribe to a plan first</span>
            )}
          </div>

          {!subscription && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 border border-gray-700/50 rounded-lg px-4 py-3 mb-4">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Choose a plan above to unlock cross-posting.
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {targets.map((target) => {
              const active = activeTargetIds.has(target.id);
              const atLimit = subscription && activeTargetIds.size >= planLimit && !active;
              return (
                <button
                  key={target.id}
                  type="button"
                  disabled={!subscription || busy}
                  onClick={() => void toggleTarget(target.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700/50 bg-black/40 hover:border-pink-400'
                  } ${!subscription ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <Globe className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-pink-400'}`} />
                    {target.popular && <Badge className="bg-pink-600 text-white text-[10px]">Popular</Badge>}
                  </div>
                  <div className="mt-3 font-bold text-gray-100">{target.name}</div>
                  <div className="mt-1 text-[12px]">
                    {active ? (
                      <span className="text-emerald-400">Active</span>
                    ) : atLimit ? (
                      <span className="text-amber-400">Upgrade for more</span>
                    ) : (
                      <span className="text-gray-500">Tap to activate</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit */}
          {subscription && activeTargetIds.size > 0 && (
            <div className="mt-10 text-center">
              <Button
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-8 py-3 rounded-lg text-lg"
                disabled={busy}
                onClick={() => void submitAll()}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit My Profile Now'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Sends your public profile to all {activeTargetIds.size} active partner site(s).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}