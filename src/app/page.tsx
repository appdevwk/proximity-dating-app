'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/navigation';
import { SaucyBackground } from '@/components/saucy-background';
import { useSession } from '@/hooks/use-session';
import {
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Loader2,
  Smartphone,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { status, refresh } = useSession();

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
      <SaucyBackground>
        <Navigation currentPath="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Loading…</div>
        </div>
      </SaucyBackground>
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
    <SaucyBackground>
      <Navigation currentPath="/" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-4 animate-slide-up">
            <div className="text-[40px] md:text-[56px] font-black text-pink-600"
                 style={{
                   textShadow: '0 0 20px rgba(236,72,153,0.9), 0 0 40px rgba(236,72,153,0.7)',
                   letterSpacing: '0.05em',
                 }}>
              PROXIMITY
            </div>
            <p className="text-xl text-gray-300">Find Your Perfect Match Nearby</p>
            <div className="flex justify-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                18+ Only
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Location Based
              </span>
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Verified Community
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Card className="w-full bg-black/70 backdrop-blur-sm border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-black text-pink-500">Welcome to Proximity</CardTitle>
              <CardDescription className="text-gray-400">18+ Adult Dating App</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="login" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-gray-300 data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleLogin();
                      }}
                      placeholder="Enter your password"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleLogin}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-gray-300">Name</Label>
                    <Input
                      id="reg-name"
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      placeholder="Enter your name"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-gray-300">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-gray-300">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      placeholder="Create a password (min 8 characters)"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-dob" className="text-gray-300">Date of Birth</Label>
                    <Input
                      id="reg-dob"
                      type="date"
                      value={regDob}
                      onChange={(event) => setRegDob(event.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
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
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleRegister}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create My Account'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-400">
              By continuing, you confirm you are 18+ years old and agree to our{" "}
              <a href="/terms" className="text-pink-400 underline">Terms of Service</a> and{" "}
              <a href="/privacy" className="text-pink-400 underline">Privacy Policy</a>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-center pt-4">
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
              subtitle="Every member is confirmed 18+"
            />
          </div>

          <div className="text-center pt-4">
            <a href="/mobile" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors">
              <Smartphone className="w-4 h-4" />
              Get the Proximity mobile apps
            </a>
          </div>
        </div>
      </div>
    </SaucyBackground>
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
    <div className="bg-black/50 backdrop-blur-sm border border-gray-700 rounded-xl p-5">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-200 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}