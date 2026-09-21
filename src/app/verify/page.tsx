'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LivenessCamera } from '@/components/liveness-camera';
import { AdBanner } from '@/components/ad-manager';
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
  IdCard,
  ScanFace,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import type { ProfileVerificationStatus } from '@/lib/types';

type IdStatus = {
  idVerified: boolean;
  idVerifiedAt: string | null;
  documentType: string | null;
  dobMasked: string | null;
  source: string | null;
  country: string | null;
  idFaceMatchScore: number | null;
};

const DOCUMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'DRIVERS_LICENSE', label: 'Driver’s License' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'ID_CARD', label: 'National ID Card' },
];

export default function VerifyPage() {
  const router = useRouter();
  const { status } = useSession();
  const [verification, setVerification] = useState<ProfileVerificationStatus | null>(null);
  const [idStatus, setIdStatus] = useState<IdStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submittingConsent, setSubmittingConsent] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [documentType, setDocumentType] = useState<string>('DRIVERS_LICENSE');
  const [uploadingId, setUploadingId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [livenessResult, setLivenessResult] = useState<{ blinks: number; score: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

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
      const [meRes, idRes] = await Promise.all([
        fetch('/api/user/me', { cache: 'no-store' }),
        fetch('/api/verification/id', { cache: 'no-store' }),
      ]);
      if (meRes.ok) {
        const data = (await meRes.json()) as { verification: ProfileVerificationStatus };
        setVerification(data.verification);
      }
      if (idRes.ok) {
        setIdStatus((await idRes.json()) as IdStatus);
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

  const handleIdUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    setUploadingId(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      const response = await fetch('/api/verification/id', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'ID verification failed. Use a clear photo of your document under 5 MB.');
        return;
      }
      setSuccess(
        `${data.message} Your ID documents a member who is at least 18 (DOB ${data.dobMasked}, source: ${data.source}).`
      );
      await refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setUploadingId(false);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'id') => {
    const file = event.target.files?.[0];
    if (file) {
      void (kind === 'photo' ? handlePhotoUpload(file) : handleIdUpload(file));
    }
    const ref = kind === 'photo' ? fileInputRef : idInputRef;
    if (ref.current) ref.current.value = '';
  };

  const onLivenessDone = (result: { blinks: number; score: number }) => {
    setLivenessResult(result);
    setSuccess('Liveness check passed. Your profile is fully verified.');
    void refresh();
  };

  const onLivenessError = (message: string) => {
    setError(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
        <Navigation currentPath="/verify" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-pink-500 animate-pulse">Checking verification…</div>
        </div>
      </div>
    );
  }

  const verified = verification?.verified === true;
  const fullyVerified = verification?.fullyVerified === true;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(90deg, rgba(85,0,137,1) 0%, rgba(120,0,123,1) 75%, rgba(85,0,137,1) 100%)' }}>
       <Navigation currentPath="/verify" />

       <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-pink-500" style={{ textShadow: '0 0 15px rgba(236,72,153,0.6)' }}>
            Profile Verification
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            To keep Proximity a safe adult dating community, every member completes an
            industry-standard verification: 18+ consent, a verification photo, a government
            ID proving your age, and a live liveness check.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 py-1 flex-wrap">
          {fullyVerified ? (
            <Badge className="bg-green-900/60 text-green-300 border border-green-700/50 px-4 py-1.5 text-base">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Fully Verified — ID + Liveness confirmed
            </Badge>
          ) : verified ? (
            <Badge className="bg-pink-900/60 text-pink-300 border border-pink-700/50 px-4 py-1.5 text-base">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Verified — complete the ID & liveness steps for full status
            </Badge>
          ) : null}
        </div>

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
                18+ Declaration & Consent
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

        {/* Step 2 — Verification photo (selfie fingerprint) */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={verification?.photoVerified === true} index={2} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Verification Photo (Face Fingerprint)
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Upload a clear, frontal photo of your face. A real face-recognition scan creates a
              unique, private facial fingerprint so we can confirm you're a real member, build
              the baseline for your ID match, and block the same face from duplicate accounts.
              Stored privately — never shown to other members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verification?.photoVerified === true ? (
              <div className="text-sm text-green-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Photo submitted{verification.photoSubmittedAt ? ` on ${new Date(verification.photoSubmittedAt).toLocaleString()}` : ''} — facial fingerprint recorded.
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => onFileChange(event, 'photo')}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadingPhoto ? 'Analyzing face…' : 'Upload Verification Photo'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 3 — Government ID */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={idStatus?.idVerified === true} index={3} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                Government ID (Age Evidence)
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Upload a clear photo of your &nbsp;government-issued ID. We read the date of birth
              printed on it (driver's license, passport MRZ, or national ID), confirm 18+, and
              match the portrait on the document to your verification photo. This is real
              evidence-based age verification — not a checkbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {idStatus?.idVerified === true ? (
              <div className="text-sm text-green-300 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ID verified{idStatus.idVerifiedAt ? ` on ${new Date(idStatus.idVerifiedAt).toLocaleString()}` : ''}.
                </div>
                <div className="text-gray-400">
                  Document: {idStatus.documentType ?? '—'} · DOB {idStatus.dobMasked ?? '—'} · Source:{' '}
                  {idStatus.source === 'mrz' ? 'passport MRZ (machine-readable)' : 'OCR'} · Country:{' '}
                  {idStatus.country ?? '—'} · Portrait match score: {idStatus.idFaceMatchScore?.toFixed(3) ?? '—'}
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {DOCUMENT_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={documentType === option.value ? 'default' : 'outline'}
                      className={documentType === option.value ? 'bg-pink-600 text-white' : ''}
                      onClick={() => setDocumentType(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => onFileChange(event, 'id')}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => idInputRef.current?.click()}
                  disabled={uploadingId}
                >
                  {uploadingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadingId ? 'Reading document…' : 'Upload ID Document'}
                </Button>
                <p className="text-xs text-gray-500">
                  Tips: flat document, no glare or shadows, all corners visible, DOB and MRZ in
                  focus. Your document is stored privately and is never shown to other members or
                  served by the site.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Step 4 — Liveness */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={verification?.livenessVerified === true} index={4} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <ScanFace className="w-4 h-4" />
                Liveness Check
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              A short live check with your camera. Blink twice — a static photo of a face cannot
              pass this, which keeps pictures of pictures out of the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {verification?.livenessVerified === true ? (
              <div className="text-sm text-green-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Liveness confirmed — {livenessResult ? `${livenessResult.blinks} blink(s) detected.` : 'you passed the live blink check.'}
              </div>
            ) : (
              <LivenessCamera onDone={onLivenessDone} onError={onLivenessError} />
            )}
          </CardContent>
        </Card>

        {/* Step 5 — Done */}
        <Card className="bg-gray-900/60 border-pink-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <StepBadge done={fullyVerified} index={5} />
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4" />
                Fully Verified Profile
              </CardTitle>
            </div>
            <CardDescription className="text-gray-500">
              Complete all four steps to earn the Fully Verified badge: 18+ consent, verification
              photo, government ID, and the live liveness check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fullyVerified ? (
              <Button
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                onClick={() => router.push('/dashboard')}
              >
                Continue to Dashboard
              </Button>
            ) : verified ? (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Core verification complete. Finish the ID and liveness steps for the Fully Verified badge.
              </p>
            ) : (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Circle className="w-4 h-4" />
                Complete the four steps above to unlock your full profile and the Verified badge.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="text-center py-6">
          <AdBanner slot="1234567892" />
        </div>
        <AdBanner slot="1234567894" />
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