import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import sharp from 'sharp';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Real face-recognition fingerprinting for profile verification.
 *
 * Replaces the previous simulated biometric pipeline with an industry-standard
 * face "fingerprint": a FaceNet 128-dimensional embedding extracted from the
 * uploaded photo. The fingerprint is deterministic and privacy-safe (you cannot
 * reconstruct a face from an embedding), and it lets the platform:
 *   1. prove the photo is a real, single, frontal, in-focus face; and
 *   2. detect the same face being used to create duplicate accounts.
 */

export const FINGERPRINT_VERSION = 'facenet128-v1';
export const DEDUPE_DISTANCE_THRESHOLD = 0.45; // cosine distance; lower = same person
export const MIN_FACE_CONFIDENCE = 0.6;
export const MIN_FACE_SIZE = 96; // px, short side of the face bounding box
export const MIN_CROP_SHARPNESS = 50; // Laplacian variance on the face crop
export const MAX_FACES = 1;
export const MAX_ANALYSIS_DIMENSION = 1024; // long side, px, for analysis tensor

export type FaceAnalysisErrorCode =
  | 'noFaceDetected'
  | 'multipleFaces'
  | 'faceTooSmall'
  | 'lowConfidence'
  | 'blurryImage'
  | 'notFrontal'
  | 'analysisFailed';

export interface FaceAnalysisOk {
  ok: true;
  descriptor: number[];
  confidence: number;
  faceSize: number;
  sharpness: number;
  rollDegrees: number;
  eyeDistanceRatio: number;
}

export interface FaceAnalysisError {
  ok: false;
  code: FaceAnalysisErrorCode;
  message: string;
}

export type FaceAnalysis = FaceAnalysisOk | FaceAnalysisError;

export interface FaceFingerprint {
  v: string; // FINGERPRINT_VERSION
  d: number[]; // 128-dimensional embedding
  created: number; // ms epoch
  meta?: {
    confidence: number;
    faceSize: number;
    sharpness: number;
  };
}

let modelsLoaded: Promise<void> | null = null;

function resolveModelPath(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'models', 'face-api'),
    path.join(process.cwd(), '..', 'public', 'models', 'face-api'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export async function loadFaceModels(): Promise<void> {
  if (!modelsLoaded) {
    modelsLoaded = (async () => {
      const modelPath = resolveModelPath();
      await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    })().catch((error) => {
      modelsLoaded = null;
      throw error;
    });
  }
  return modelsLoaded;
}

/** Normalize an upload for analysis: EXIF-rotate, downscale, RGB, JPEG. */
export async function prepareAnalysisBuffer(original: Buffer): Promise<Buffer> {
  return sharp(original)
    .rotate()
    .resize({
      width: MAX_ANALYSIS_DIMENSION,
      height: MAX_ANALYSIS_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

function varianceOfLaplacian(gray: Uint8Array, width: number, height: number): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += lap;
      sumSq += lap * lap;
      count += 1;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function pointCenter(points: faceapi.Point[]): { x: number; y: number } {
  const length = points.length;
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / length, y: y / length };
}

async function computeFaceSharpness(
  buffer: Buffer,
  box: { x: number; y: number; width: number; height: number }
): Promise<number> {
  const padding = 0.2;
  const width = Math.max(16, Math.round(box.width));
  const height = Math.max(16, Math.round(box.height));
  const left = Math.max(0, Math.round(box.x - padding * width));
  const top = Math.max(0, Math.round(box.y - padding * height));

  const crop = await sharp(buffer)
    .extract({ left, top, width, height })
    .greyscale()
    .resize({ width: 128, height: 128, fit: 'fill' })
    .raw()
    .toBuffer()
    .catch(() => null);

  if (!crop) return 0;
  return varianceOfLaplacian(new Uint8Array(crop), 128, 128);
}

/**
 * Analyze a (prepared) photo: must contain exactly one, sufficiently large,
 * confident, frontal, in-focus face. Returns the 128-d FaceNet descriptor.
 */
export async function analyzeFace(buffer: Buffer): Promise<FaceAnalysis> {
  await loadFaceModels();

  let input: tf.Tensor3D | null = null;
  try {
    input = tf.node.decodeImage(buffer, 3) as tf.Tensor3D;

    const detections = await faceapi
      .detectAllFaces(
        input,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { ok: false, code: 'noFaceDetected', message: 'No face detected in this photo.' };
    }
    if (detections.length > MAX_FACES) {
      return {
        ok: false,
        code: 'multipleFaces',
        message: `Please submit a photo with exactly one face (found ${detections.length}).`,
      };
    }

    const result = detections[0];
    const detection = result.detection;
    const box = detection.box;
    const faceSize = Math.min(box.width, box.height);
    const confidence = detection.score;

    if (confidence < MIN_FACE_CONFIDENCE) {
      return {
        ok: false,
        code: 'lowConfidence',
        message: 'Face confidence too low. Retake the photo with better lighting.',
      };
    }
    if (faceSize < MIN_FACE_SIZE) {
      return {
        ok: false,
        code: 'faceTooSmall',
        message: 'Face is too small in the frame. Move closer or retake the photo.',
      };
    }

    const landmarks = result.landmarks as faceapi.FaceLandmarks68;
    const leftEye = pointCenter(landmarks.getLeftEye());
    const rightEye = pointCenter(landmarks.getRightEye());
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    const eyeDistanceRatio = eyeDistance / box.width;
    const rollDegrees =
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;

    if (eyeDistanceRatio < 0.25 || eyeDistanceRatio > 0.62) {
      return {
        ok: false,
        code: 'notFrontal',
        message: 'Please face the camera directly (photo appears to be at an angle).',
      };
    }
    if (Math.abs(rollDegrees) > 25) {
      return {
        ok: false,
        code: 'notFrontal',
        message: 'Please keep your head straight and face the camera directly.',
      };
    }

    const sharpness = await computeFaceSharpness(buffer, box);
    if (sharpness < MIN_CROP_SHARPNESS) {
      return {
        ok: false,
        code: 'blurryImage',
        message: 'Photo is too blurry. Retake it with a still, well-lit shot.',
      };
    }

    const descriptor = Array.from(result.descriptor as Float32Array); // FaceNet 128-d
    return {
      ok: true,
      descriptor,
      confidence,
      faceSize,
      sharpness,
      rollDegrees,
      eyeDistanceRatio,
    };
  } catch (error) {
    console.error('Face analysis error:', error);
    return { ok: false, code: 'analysisFailed', message: 'Could not analyze the face in this photo.' };
  } finally {
    input?.dispose();
  }
}

export function serializeFingerprint(
  descriptor: number[],
  meta: { confidence: number; faceSize: number; sharpness: number }
): string {
  const fingerprint: FaceFingerprint = {
    v: FINGERPRINT_VERSION,
    d: descriptor,
    created: Date.now(),
    meta,
  };
  return JSON.stringify(fingerprint);
}

export function deserializeFingerprint(raw: string | null | undefined): number[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FaceFingerprint;
    if (!parsed?.v?.startsWith('facenet') || !Array.isArray(parsed.d) || parsed.d.length !== 128) {
      return null;
    }
    return parsed.d.map((value) => Number(value));
  } catch {
    return null;
  }
}

/** Cosine distance between two 128-d descriptors: 0 = identical, 1 = unrelated. */
export function fingerprintDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 1;
  return Math.max(0, Math.min(1, 1 - dot / denom));
}

export function samePerson(a: number[], b: number[]): boolean {
  return fingerprintDistance(a, b) <= DEDUPE_DISTANCE_THRESHOLD;
}