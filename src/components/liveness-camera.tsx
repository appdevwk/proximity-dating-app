'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Video, RefreshCw, CheckCircle2, Camera } from 'lucide-react';

const FRAME_COUNT = 10;
const FRAME_INTERVAL_MS = 450;
const PREP_MS = 2400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Phase = 'idle' | 'starting' | 'recording' | 'verifying' | 'done';

function drawFrame(source: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const maxDim = 640;
    const scale = Math.min(1, maxDim / Math.max(source.videoWidth, source.videoHeight || 1));
    canvas.width = Math.round(source.videoWidth * scale);
    canvas.height = Math.round(source.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob ?? new Blob()), 'image/jpeg', 0.72);
  });
}

type Props = {
  onDone: (result: { blinks: number; score: number }) => void;
  onError: (message: string, code?: string) => void;
};

export function LivenessCamera({ onDone, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setPhase('starting');
    try {
      const challengeRes = await fetch('/api/verification/liveness', { cache: 'no-store' });
      const challenge = await challengeRes.json();
      if (!challengeRes.ok || !challenge.nonce) {
        onError(challenge.error ?? 'Could not start the liveness check.');
        setPhase('idle');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCountdown(3);
      await sleep(PREP_MS);
      setCountdown(0);
      setPhase('recording');

      const frames: Blob[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (videoRef.current) {
          frames.push(await drawFrame(videoRef.current));
        }
        await sleep(FRAME_INTERVAL_MS);
      }

      setPhase('verifying');
      const formData = new FormData();
      formData.append('nonce', challenge.nonce);
      frames.forEach((frame, index) => formData.append('frames', frame, `frame-${index}.jpg`));

      const uploadRes = await fetch('/api/verification/liveness', {
        method: 'POST',
        body: formData,
      });
      const data = await uploadRes.json();
      stopStream();
      if (!uploadRes.ok) {
        onError(data.error ?? 'Liveness check failed. Please try again.', data.code);
        setPhase('idle');
        return;
      }
      setPhase('done');
      onDone({ blinks: data.blinks, score: data.score });
    } catch {
      stopStream();
      onError('Camera access was blocked or unavailable. Allow camera access and try again.', 'cameraDenied');
      setPhase('idle');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-gray-700 bg-black">
        {phase === 'idle' ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <Camera className="w-6 h-6 mr-2" /> Camera preview will appear here
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-5xl font-black text-pink-400">{countdown}</span>
              </div>
            )}
            {phase === 'recording' && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" /> Recording
              </div>
            )}
            {phase === 'verifying' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-pink-300">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying liveness…
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        {phase === 'idle' && 'Look straight at the camera and blink twice when the check starts.'}
        {phase === 'recording' && 'Now! Blink twice clearly and keep your face centered.'}
        {phase === 'verifying' && 'Analyzing blink pattern…'}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={start}
        disabled={phase === 'starting' || phase === 'recording' || phase === 'verifying'}
      >
        {phase === 'starting' || phase === 'recording' || phase === 'verifying' ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : phase === 'done' ? (
          <RefreshCw className="w-4 h-4 mr-2" />
        ) : (
          <Video className="w-4 h-4 mr-2" />
        )}
        {phase === 'done' ? 'Actually, run it again' : 'Start Liveness Check'}
      </Button>
    </div>
  );
}