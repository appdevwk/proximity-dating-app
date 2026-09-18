import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import { loadFaceModels } from './face-fingerprint';

type FaceNetInput = Parameters<typeof faceapi.detectAllFaces>[0];
function asNetInput(tensor: any): FaceNetInput {
  return tensor as unknown as FaceNetInput;
}

/**
 * Active liveness (anti-photo-spoof) for the 18+ dating platform.
 *
 * A server-issued, single-use challenge asks the member to blink twice while a
 * short burst of webcam frames (~2 fps over ~5s) is captured. The server then
 * verifies, from the 68-point facial landmarks of every frame:
 *   - a face is continuously present (motion/continuity),
 *   - the frames are not a still image (temporal variance),
 *   - at least two distinct blink events occurred (eye-aspect-ratio drops).
 *
 * A static photo of a face cannot produce the required EAR blink pattern, which
 * makes this an effective v1 defense against printed/photo spoofing without a
 * dedicated depth/texture liveness model.
 */

const CHALLENGE_TTL_MS = 3 * 60 * 1000;
const MIN_FRAMES = 6;
const MAX_FRAMES = 12;
const MAX_FRAME_BYTES = 1.5 * 1024 * 1024;
const BLINK_EAR = 0.2;
const OPEN_EAR = 0.26;
const MIN_BLINKS = 2;
const MIN_FACE_CONFIDENCE = 0.5;
const MIN_FRAME_DIFF = 2.0; // mean abs diff (0-255) of 48px grayscale frames
const MIN_EAR_STDDEV = 0.03;
const MIN_IOU = 0.25;

interface Challenge {
  userId: string;
  issuedAt: number;
  used: boolean;
}

const challenges = new Map<string, Challenge>();

/** Issue a fresh, single-use liveness challenge for a member. */
export function createLivenessChallenge(userId: string): {
  nonce: string;
  expiresAt: string;
} {
  for (const [nonce, challenge] of challenges) {
    if (challenge.issuedAt + CHALLENGE_TTL_MS < Date.now()) {
      challenges.delete(nonce);
    }
  }
  const nonce = randomBytes(16).toString('hex');
  challenges.set(nonce, { userId, issuedAt: Date.now(), used: false });
  return {
    nonce,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
  };
}

function takeChallenge(nonce: string, userId: string): Challenge | null {
  const challenge = challenges.get(nonce);
  if (!challenge) return null;
  challenges.delete(nonce);
  if (challenge.userId !== userId) return null;
  if (challenge.issuedAt + CHALLENGE_TTL_MS < Date.now()) return null;
  if (challenge.used) return null;
  challenge.used = true;
  return challenge;
}

function meanPoint(points: faceapi.Point[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/** Average eye-aspect-ratio over both eyes using the 68-point landmarks. */
function earOf(landmarks: faceapi.FaceLandmarks68): number {
  const position = landmarks.positions;
  const left =
    (Math.hypot(position[37].x - position[41].x, position[37].y - position[41].y) +
      Math.hypot(position[38].x - position[40].x, position[38].y - position[40].y)) /
    (2 * Math.max(1e-3, Math.hypot(position[36].x - position[39].x, position[36].y - position[39].y)));
  const right =
    (Math.hypot(position[43].x - position[47].x, position[43].y - position[47].y) +
      Math.hypot(position[44].x - position[46].x, position[44].y - position[46].y)) /
    (2 * Math.max(1e-3, Math.hypot(position[42].x - position[45].x, position[42].y - position[45].y)));
  return (left + right) / 2;
}

function iou(a: { x: number; y: number; width: number; height: number }, b: {
  x: number;
  y: number;
  width: number;
  height: number;
}): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const inter = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}

/** Count blink events from a sequence of eye-aspect-ratio values. */
export function countBlinkEvents(ears: number[]): number {
  if (ears.length < 2) return 0;
  let blinks = 0;
  let wasOpen = ears[0] >= OPEN_EAR;
  for (let i = 1; i < ears.length; i++) {
    if (wasOpen && ears[i] < BLINK_EAR) {
      blinks += 1;
      wasOpen = false;
    } else if (!wasOpen && ears[i] > OPEN_EAR) {
      wasOpen = true;
    }
  }
  return blinks;
}

async function downsampleGray(buffer: Buffer): Promise<Uint8Array> {
  const raw = await sharp(buffer)
    .rotate()
    .resize({ width: 48, height: 48, fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();
  return new Uint8Array(raw);
}

export type LivenessResult =
  | { ok: true; blinks: number; frames: number; score: number }
  | {
      ok: false;
      code:
        | 'nonceNotFound'
        | 'nonceExpired'
        | 'nonceUsed'
        | 'nonceUserMismatch'
        | 'invalidFrameCount'
        | 'faceLost'
        | 'stillImage'
        | 'notEnoughBlinks';
      message: string;
      blinks?: number;
      frames?: number;
    };

export async function verifyLiveness(
  frames: Buffer[],
  nonce: string,
  userId: string
): Promise<LivenessResult> {
  if (!nonce || frames.length === 0) {
    return {
      ok: false,
      code: 'nonceNotFound',
      message: 'Missing or invalid liveness challenge.',
    };
  }
  const challenge = takeChallenge(nonce, userId);
  if (!challenge) {
    return {
      ok: false,
      code: 'nonceNotFound',
      message: 'Liveness challenge is invalid, expired, or already used. Please start a new check.',
    };
  }
  if (frames.length < MIN_FRAMES || frames.length > MAX_FRAMES) {
    return {
      ok: false,
      code: 'invalidFrameCount',
      message: `Liveness check needs ${MIN_FRAMES}-${MAX_FRAMES} frames (got ${frames.length}).`,
    };
  }

  await loadFaceModels();

  const ears: number[] = [];
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  const grays: Uint8Array[] = [];

  for (let i = 0; i < frames.length; i++) {
    if (frames[i].byteLength > MAX_FRAME_BYTES) {
      return {
        ok: false,
        code: 'faceLost',
        message: 'A liveness frame was too large. Use the camera capture tool.',
      };
    }
    let input: any | null = null;
    try {
      input = (tf as any).node.decodeImage(frames[i], 3) as any;
      const detections = await faceapi
        .detectAllFaces(
          asNetInput(input),
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
        )
        .withFaceLandmarks();

      if (detections.length === 0 || detections[0].detection.score < MIN_FACE_CONFIDENCE) {
        return {
          ok: false,
          code: 'faceLost',
          message: `We lost your face in frame ${i + 1}. Look straight at the camera and keep still during the blink challenge.`,
          frames: i + 1,
        };
      }
      const result = detections[0];
      ears.push(earOf(result.landmarks as faceapi.FaceLandmarks68));
      const box = result.detection.box;
      boxes.push({ x: box.x, y: box.y, width: box.width, height: box.height });
    } finally {
      input?.dispose();
    }
  }

  const graysBuffer = await Promise.all(frames.map((frame) => downsampleGray(frame)));

  // Temporal variance: consecutive grayscale frames must differ (not a still photo).
  let totalDiff = 0;
  for (let i = 1; i < graysBuffer.length; i++) {
    const a = graysBuffer[i - 1];
    const b = graysBuffer[i];
    let sum = 0;
    for (let j = 0; j < a.length; j++) sum += Math.abs(a[j] - b[j]);
    totalDiff += sum / a.length;
  }
  const avgDiff = graysBuffer.length > 1 ? totalDiff / (graysBuffer.length - 1) : 0;

  // Eye-aspect-ratio stability + blink counting.
  let earStd = 0;
  {
    const mean = ears.reduce((sum, value) => sum + value, 0) / ears.length;
    earStd = Math.sqrt(ears.reduce((sum, value) => sum + (value - mean) ** 2, 0) / ears.length);
  }

  const blinks = countBlinkEvents(ears);

  // Continuity: faces must overlap across consecutive frames.
  for (let i = 1; i < boxes.length; i++) {
    if (iou(boxes[i - 1], boxes[i]) < MIN_IOU) {
      return {
        ok: false,
        code: 'faceLost',
        message: 'Please keep your face centered in the frame during the blink challenge.',
        blinks,
        frames: i + 1,
      };
    }
  }

  if (avgDiff < MIN_FRAME_DIFF && earStd < MIN_EAR_STDDEV) {
    return {
      ok: false,
      code: 'stillImage',
      message: 'No motion detected. Perform the blink challenge live in front of your camera.',
      blinks,
      frames: frames.length,
    };
  }
  if (blinks < MIN_BLINKS) {
    return {
      ok: false,
      code: 'notEnoughBlinks',
      message: `We detected ${blinks} blink(s) — please blink twice clearly during the check.`,
      blinks,
      frames: frames.length,
    };
  }

  const score = Math.min(1, blinks / MIN_BLINKS);
  return { ok: true, blinks, frames: frames.length, score };
}