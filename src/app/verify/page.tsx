'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  Camera,
  Calendar,
  FileText,
  Upload,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import type { ProfileVerificationStatus } from '@/lib/types';

export default function VerifyPage() {
  const router = useRouter();
  const { status } = useSession();
  const [verification, setVerification] = useState<ProfileVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submittingConsent, setSubmittingConsent] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    void refresh();
  }, [status, router]);

  const refresh = async () => {
    try {
      const response = await fetch('/api/user/me', { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as { verification: ProfileVerificationStatus };
        setVerification(data.verification);
      }
    } catch {
      setVerification(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConsent = async () => {
    setError(null);
    setSuccess(null);
    if (!ageChecked || !termsChecked) {
      setError('You must confirm you are 18+ and accept the Terms & Privacy Policy.');
      return;
    }
    setSubmittingConsent(true);
    try {
      const response = await fetch('/api/verification/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageDeclaration: true, termsAccepted: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not record your consent. Please try again.');
        return;
      }
      setSuccess(data.message ?? 'Consent recorded.');
      setVerification(data.verification ?? verification);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmittingConsent(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/verification/photo', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Photo upload failed. Use a clear JPG or PNG under 5 MB.');
        return;
      }
      setSuccess(data.message ?? 'Verification photo submitted.');
      await refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handlePhotoUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation currentPath="/verify" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Checking verification…</div>
        </div>
      </div>
    );
  }

  const verified = verification?.verified === true;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation currentPath="/verify" />

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
            Profile Verification
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            To keep Proximity a safe adult dating community, every member completes
            verification before browsing, matching, and messaging. It takes under a minute.
          </p>
        </div>

        {verified && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Badge className="bg-green-900/60 text-green-300 border border-green-700/50 px-4 py-1.5 text-base">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Fully Verified — you are all set!
            </Badge>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-300 bg-green-500/10 border border-green-700/40 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Step 1 — Age declaration + Terms consent */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={verification?.ageDeclarationConfirmed === true && verification?.termsAccepted === true} index={1} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                18+ Age Declaration & Consent
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Confirm you are an adult and accept the platform rules. Your consent is
              recorded with a timestamp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verification?.ageDeclarationConfirmed === true && verification?.termsAccepted === true ? (
              <div className="text-sm text-green-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Accepted on {verification.termsAcceptedAt ? new Date(verification.termsAcceptedAt).toLocaleString() : '—'}
                {verification.termsVersion ? ` (Terms v${verification.termsVersion})` : ''}
              </div>
            ) : (
              <>
                <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                  <Checkbox
                    checked={ageChecked}
                    onCheckedChange={(checked) => setAgeChecked(checked === true)}
                    className="border-gray-600 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                  />
                  <span>I confirm that I am 18 years of age or older.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                  <Checkbox
                    checked={termsChecked}
                    onCheckedChange={(checked) => setTermsChecked(checked === true)}
                    className="border-gray-600 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                  />
                  <span>
                    I have read and accept the{" "}
                    <Link href="/terms" className="text-pink-400 underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-pink-400 underline">Privacy Policy</Link>.
                  </span>
                </label>
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  onClick={handleAcceptConsent}
                  disabled={submittingConsent}
                >
                  {submittingConsent ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  {submittingConsent ? 'Recording…' : 'Confirm 18+ & Accept Terms'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 2 — Verification photo */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={verification?.photoVerified === true} index={2} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Verification Photo
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Upload a clear, frontal photo of your face. We run a real face-recognition
              scan that creates a unique, private facial fingerprint — so we can confirm
              you're a real member and block the same face from opening multiple accounts.
              Stored privately — never shown to other members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verification?.photoVerified === true ? (
              <div className="text-sm text-green-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Photo submitted{verification.photoSubmittedAt ? ` on ${new Date(verification.photoSubmittedAt).toLocaleString()}` : ''}.
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadingPhoto ? 'Uploading…' : 'Upload Verification Photo'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 3 — Done */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={verified} index={3} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Verified Profile
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Once all steps are complete you earn the Verified badge and unlock matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verified ? (
              <Button
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                onClick={() => router.push('/dashboard')}
              >
                Continue to Dashboard
              </Button>
            ) : (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Circle className="w-4 h-4" />
                Complete steps 1 and 2 to unlock your full profile.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StepBadge({ done, index }: { done: boolean; index: number }) {
  return done ? (
    <span className="w-8 h-8 rounded-full bg-green-900/70 border border-green-700/60 flex items-center justify-center">
      <CheckCircle2 className="w-5 h-5 text-green-300" />
    </span>
  ) : (
    <span className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-400">
      {index}
    </span>
  );
}