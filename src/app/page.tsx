'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/hooks/use-session';
import { AdBanner, AdInterstitial } from '@/components/ad-manager';
import { useSiteMode, type SiteMode } from '@/components/site-mode-provider';
import {
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Loader2,
  Smartphone,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { status, refresh } = useSession();
  const { effectiveMode, mode, setMode, setEffectiveMode } = useSiteMode();
  const isAdult = effectiveMode === 'adult';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regAgeConfirmed, setRegAgeConfirmed] = useState(false);
  const [regTerms, setRegTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <div className="text-pink-500 animate-pulse">Loading…</div>
      </div>
    );
  }

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      await refresh();
      router.push('/dashboard');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setError(null);

    if (regName.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!regEmail.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!regDob) {
      setError('Please enter your date of birth.');
      return;
    }
    if (!regAgeConfirmed) {
      setError('You must confirm you are 18 years of age or older.');
      return;
    }
    if (!regTerms) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
          name: regName.trim(),
          dateOfBirth: regDob,
          ageDeclaration: true,
          termsAccepted: true,
          siteMode: mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Registration failed');
        return;
      }
      await refresh();
      router.push('/verify');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
      {/* Fixed header matching xdating.com */}
      <div className="header-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-12">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-xl font-black text-pink-400" style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.8)' }}>
              PROXIMITY
            </span>
          </div>
          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <Button variant="ghost" size="sm" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; }} className="text-white hover:text-pink-200 border border-pink-400/30">
                Log out
              </Button>
            ) : (
              <a href="/" className="text-white font-bold text-sm hover:text-pink-200 transition-colors">
                Login
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hero section matching xdating.com */}
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-50px)] px-4 pt-20">
        <div className="text-center space-y-6 animate-slide-up">
          <h1 className="text-[2.5em] md:text-[4em] font-black text-white leading-tight" style={{ textShadow: '0 0 20px rgba(236,72,153,0.9), 0 0 40px rgba(236,72,153,0.7)' }}>
            Find Your Perfect Match<br />Nearby
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-lg mx-auto">
            Discover real profiles in your area. Advanced dating platform with biometric verification.
          </p>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm flex-wrap justify-center">
              {isAdult && (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>18+ Only</span>
                  <span className="mx-1">•</span>
                </>
              )}
              <MapPin className="w-4 h-4" />
              <span>Location Based</span>
              <span className="mx-1">•</span>
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Community</span>
            </div>
          </div>
        </div>

        {/* Sign up / Sign in card */}
        <div className="max-w-md w-full mt-8">
          {/* Version chooser */}
          <div className="mb-4 rounded-2xl bg-black/70 backdrop-blur-md border border-gray-700/50 p-4">
            <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-3">Choose Your Version</p>
            <div className="grid grid-cols-3 gap-2">
              <VersionOption
                active={mode === 'mainstream' || mode === 'both'}
                selected={mode === 'mainstream' || (mode === 'both' && effectiveMode === 'mainstream')}
                label="Mainstream"
                badge={mode === 'both' ? 'Free Ads' : 'Free'}
                onClick={() => {
                  if (mode === 'both') setEffectiveMode('mainstream');
                  else setMode('mainstream');
                }}
              />
              <VersionOption
                active={mode === 'adult' || mode === 'both'}
                selected={mode === 'adult' || (mode === 'both' && effectiveMode === 'adult')}
                label="Adult"
                badge={mode === 'both' ? '18+ Ads' : '18+'}
                onClick={() => {
                  if (mode === 'both') setEffectiveMode('adult');
                  else setMode('adult');
                }}
              />
              <VersionOption
                active={mode === 'both'}
                selected={mode === 'both'}
                label="Both"
                badge="Access All"
                onClick={() => setMode('both')}
              />
            </div>
            <p className="text-center text-[11px] text-gray-500 mt-3">
              {mode === 'both'
                ? 'You have full access. Switch versions anytime with the toggle above.'
                : mode === 'adult'
                  ? 'Adult experience with 18+ ad-supported access throughout.'
                  : 'Mainstream experience with ad-supported free access.'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Card className="w-full bg-black/70 backdrop-blur-md border-gray-700/50 rounded-2xl shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-black text-pink-400">Welcome to Proximity</CardTitle>
              <CardDescription className="text-gray-400">{isAdult ? '18+ Adult Dating App' : 'Free Dating App'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 rounded-lg">
                  <TabsTrigger value="login" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-lg">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-lg">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300 text-sm">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300 text-sm">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleLogin();
                      }}
                      placeholder="Enter your password"
                      className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 rounded-lg"
                    />
                  </div>
                  {/* Ad unit 1 - shown on login */}
                  <div className="flex justify-center py-2">
                    <AdBanner slot="1234567890" />
                  </div>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg text-lg"
                    onClick={handleLogin}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-gray-300 text-sm">Name</Label>
                    <Input
                      id="reg-name"
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      placeholder="Enter your name"
                      className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-gray-300 text-sm">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-gray-300 text-sm">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      placeholder="Create a password (min 8 characters)"
                      className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-dob" className="text-gray-300 text-sm">Date of Birth</Label>
                    <Input
                      id="reg-dob"
                      type="date"
                      value={regDob}
                      onChange={(event) => setRegDob(event.target.value)}
                      className="bg-gray-800/80 border-gray-600 text-white rounded-lg"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                    <Checkbox
                      checked={regAgeConfirmed}
                      onCheckedChange={(checked) => setRegAgeConfirmed(checked === true)}
                      className="border-gray-600 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                    />
                    <span>
                      I confirm that I am <strong className="text-pink-400">18 years of age or older</strong>.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                    <Checkbox
                      checked={regTerms}
                      onCheckedChange={(checked) => setRegTerms(checked === true)}
                      className="border-gray-600 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                    />
                    <span>
                      I have read and accept the{" "}
                      <a href="/terms" className="text-pink-400 underline">Terms of Service</a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-pink-400 underline">Privacy Policy</a>.
                    </span>
                  </label>
                  {/* Ad unit 2 - shown on register */}
                  <div className="flex justify-center py-2">
                    <AdBanner slot="1234567891" />
                  </div>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg text-lg"
                    onClick={handleRegister}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create My Account'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-4 space-y-3">
            <p className="text-sm text-gray-400">
              By continuing, you confirm you are 18+ years old and agree to our{" "}
              <a href="/terms" className="text-pink-400 underline">Terms of Service</a> and{" "}
              <a href="/privacy" className="text-pink-400 underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* Features section */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 max-w-4xl w-full">
          <FeatureCard
            icon={<Heart className="w-6 h-6 text-pink-400" />}
            title="Match Nearby"
            subtitle="Swipe through real profiles in your area"
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6 text-purple-400" />}
            title="Mutual Matches"
            subtitle="Chat instantly when you both like each other"
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-emerald-400" />}
            title="Age Verified"
            subtitle={isAdult ? 'Every member is confirmed 18+' : 'Every member is verified as a real person'}
          />
        </div>

        {/* Ad banners at bottom of home page */}
        <div className="text-center py-6 mt-8">
          <AdBanner slot="1234567892" />
        </div>
        <AdBanner slot="1234567894" />
        {isAdult && <AdInterstitial slot="1234567895" />}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 text-center">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-200 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function VersionOption({
  active,
  selected,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  selected: boolean;
  label: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-3 text-center transition-colors ${
        selected
          ? 'border-pink-500 bg-pink-600/20 ring-1 ring-pink-500'
          : active
            ? 'border-gray-600 bg-gray-800/60 hover:border-pink-400'
            : 'border-gray-600 bg-gray-800/60 opacity-70 hover:border-pink-400'
      }`}
    >
      <span className="block text-sm font-bold text-white">{label}</span>
      <span className={`block text-[11px] mt-1 ${selected ? 'text-pink-300' : 'text-gray-400'}`}>{badge}</span>
    </button>
  );
}
