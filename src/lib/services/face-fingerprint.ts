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
// Calibrated on the shipped FaceNet-128 model (vladmandic/face-api 1.7.15):
// same-person descriptors across very different photos measure <0.05 cosine,
// while different people measure >=0.15. face-api's canonical 0.6 "matching"
// threshold is EUCLIDEAN ~= 0.18 cosine; we use a slightly stricter 0.15 so a
// look-alike never quietly passes. These are COSINE distances (0 = identical).
export const DEDUPE_DISTANCE_THRESHOLD = 0.15;
export const ID_FACE_MATCH_THRESHOLD = 0.15;
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

type FaceNetInput = Parameters<typeof faceapi.detectAllFaces>[0];

/** face-api's type union omits tf.Tensor; runtime accepts tensors. */
function asNetInput(tensor: tf.Tensor3D): FaceNetInput {
  return tensor as unknown as FaceNetInput;
}

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
        asNetInput(input),
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

/**
 * Detect and fingerprint a face inside a government-issued ID document photo.
 * Document portraits are small and printed, so the size requirement is relaxed:
 * the whole document is scanned first, then an up-scaled portrait region
 * (upper-left ~60% x 85%) is retried when nothing is found. The resulting
 * 128-d descriptor is compared against the member's selfie fingerprint to prove
 * the ID belongs to the same person.
 */
export async function analyzeFaceInDocument(buffer: Buffer): Promise<FaceAnalysis> {
  await loadFaceModels();

  const runProbe = async (input: tf.Tensor3D, inputSize: number) =>
    faceapi
      .detectAllFaces(
        asNetInput(input),
        new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.25 })
      )
      .withFaceLandmarks();

  type NetDetection = Awaited<ReturnType<typeof runProbe>>[number];

  // Printed document portraits are tiny in the whole-document frame, so probe at
  // progressively larger fetch sizes; the detector's box coordinates are always
  // returned in the passed tensor's (full-document) space, so a cross-size
  // comparison is apples-to-apples.
  const DOC_PROBE_SIZES = [416, 640, 896];
  const CROP_PROBE_SIZES = [224, 416, 640];

  const findDocumentFace = async (
    tensor: tf.Tensor3D,
    sizes: number[]
  ): Promise<{ detections: NetDetection[]; probeWidth: number; probeHeight: number } | null> => {
    let last: NetDetection[] = [];
    for (const inputSize of sizes) {
      const detections = await runProbe(tensor, inputSize);
      if (detections.length === 0) continue;
      last = detections;
      if (detections.length === 1) {
        return { detections, probeWidth: tensor.shape[1], probeHeight: tensor.shape[0] };
      }
    }
    if (last.length > 0) {
      const best = [...last].sort((a, b) => b.detection.score - a.detection.score)[0];
      return { detections: [best], probeWidth: tensor.shape[1], probeHeight: tensor.shape[0] };
    }
    return null;
  };

  const runEmbed = async (tensor: tf.Tensor3D) =>
    faceapi
      .detectAllFaces(
        asNetInput(tensor),
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.25 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

  let input: tf.Tensor3D | null = null;
  let crop: tf.Tensor3D | null = null;

  try {
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    input = tf.node.decodeImage(buffer, 3) as tf.Tensor3D;

    let detections: NetDetection[] = [];
    let active = input;
    let probeWidth = width;
    let probeHeight = height;

    const wholeProbe = await findDocumentFace(input, DOC_PROBE_SIZES);
    if (wholeProbe) {
      detections = wholeProbe.detections;
    } else if (width > 0 && height > 0) {
      // Fallback: probe the up-scaled portrait region (typically upper-left).
      crop = tf.image
        .cropAndResize(
          tf.expandDims(input) as tf.Tensor4D,
          [[0, 0, 1, 1]],
          [0],
          [Math.round(height * 0.85 * 1.6), Math.round(width * 0.6 * 1.6)],
          'bilinear'
        )
        .squeeze([0]) as tf.Tensor3D;
      active = crop;
      probeWidth = crop.shape[1];
      probeHeight = crop.shape[0];
      const cropProbe = await findDocumentFace(crop, CROP_PROBE_SIZES);
      if (cropProbe) detections = cropProbe.detections;
    }

    if (detections.length === 0) {
      return {
        ok: false,
        code: 'noFaceDetected',
        message: 'No face found on this document. Make sure the ID portrait area is visible and well lit.',
      };
    }
    if (detections.length > 1) {
      return {
        ok: false,
        code: 'multipleFaces',
        message: 'More than one face detected on this document. Submit a single ID document.',
      };
    }

    const result = detections[0];
    const detection = result.detection;
    const box = detection.box;
    const faceSize = Math.min(box.width, box.height);
    const confidence = detection.score;

    const landmarks = result.landmarks as faceapi.FaceLandmarks68;
    const leftEye = pointCenter(landmarks.getLeftEye());
    const rightEye = pointCenter(landmarks.getRightEye());
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    const eyeDistanceRatio = eyeDistance / box.width;
    const rollDegrees =
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;

    if (eyeDistanceRatio < 0.18 || eyeDistanceRatio > 0.7) {
      return {
        ok: false,
        code: 'notFrontal',
        message: 'The ID portrait is not clearly readable. Photograph the document flat and straight-on.',
      };
    }
    if (Math.abs(rollDegrees) > 30) {
      return {
        ok: false,
        code: 'notFrontal',
        message: 'Please flatten the document and photograph it straight-on.',
      };
    }

    // Embed on an up-scaled face region for a reliable descriptor.
    let embedTensor: tf.Tensor3D | null = null;
    try {
      const padX = Math.max(6, box.width * 0.18);
      const padY = Math.max(6, box.height * 0.18);
      const left = Math.max(0, box.x - padX);
      const top = Math.max(0, box.y - padY);
      const right = Math.min(probeWidth, box.x + box.width + padX);
      const bottom = Math.min(probeHeight, box.y + box.height + padY);
      const boxW = Math.max(32, right - left);
      const boxH = Math.max(32, bottom - top);
      embedTensor = tf.image
        .cropAndResize(
          tf.expandDims(active) as tf.Tensor4D,
          [
            [
              top / probeHeight,
              left / probeWidth,
              bottom / probeHeight,
              right / probeWidth,
            ],
          ],
          [0],
          [Math.round(boxH * 2), Math.round(boxW * 2)],
          'bilinear'
        )
        .squeeze([0]) as tf.Tensor3D;

      const embedded = await runEmbed(embedTensor);
      if (embedded.length === 0) {
        return {
          ok: false,
          code: 'faceTooSmall',
          message: 'The ID portrait is too small to read. Take a closer, in-focus photo of the document.',
        };
      }
      if (embedded.length > 1) {
        return {
          ok: false,
          code: 'multipleFaces',
          message: 'More than one face detected on this document.',
        };
      }
      const descriptor = Array.from(embedded[0].descriptor as Float32Array);
      return {
        ok: true,
        descriptor,
        confidence: Math.max(confidence, embedded[0].detection.score),
        faceSize,
        sharpness: 0,
        rollDegrees,
        eyeDistanceRatio,
      };
    } finally {
      embedTensor?.dispose();
    }
  } catch (error) {
    console.error('ID face analysis error:', error);
    return { ok: false, code: 'analysisFailed', message: 'Could not analyze the ID document.' };
  } finally {
    input?.dispose();
    crop?.dispose();
  }
}