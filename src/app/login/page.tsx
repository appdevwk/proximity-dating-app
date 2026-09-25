'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam || '');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      setSuccess('Welcome back! Redirecting…');
      setTimeout(() => router.push(callbackUrl), 800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated') {
    return null; // The router will handle redirect via layout or we can do it here
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-white mb-6">
            <span className="text-3xl">💜</span>
            <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Proximity
            </span>
          </Link>
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to continue to your dashboard</p>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription className="text-gray-400">
              Or <Link href="/signup" className="text-pink-400 hover:underline font-medium">create an account</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || success) && (
                <div className={cn(
                  'rounded-lg p-3 text-sm flex items-center gap-2',
                  error ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                )}>
                  {error && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {success && <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />}
                  {error || success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-pink-400 hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-pink-500"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg text-lg"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="text-pink-400 hover:underline font-medium">Sign up for free</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-xs mt-6 max-w-md mx-auto">
          By signing in, you agree to our <Link href="/terms" className="text-pink-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-pink-400 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading sign-in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
