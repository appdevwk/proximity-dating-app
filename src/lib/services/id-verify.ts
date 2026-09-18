import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Evidence-based government-ID verification for the 18+ dating platform.
 *
 * Reads the date of birth from an uploaded ID document and proves the holder
 * is 18+ from that date (not from a self-declared checkbox). The document
 * image is normalized for OCR, and the date of birth is extracted from either:
 *   - the Machine Readable Zone (MRZ) when the document has one (passports and
 *     many national ID cards), which is machine-verifiable and preferred; or
 *   - an OCR text scan anchored on DOB / DATE OF BIRTH labels.
 *
 * The document itself is stored privately on the server and is never served
 * through any public URL.
 */

export type IdDocumentType = 'DRIVERS_LICENSE' | 'PASSPORT' | 'ID_CARD';
export type IdSource = 'mrz' | 'ocr';

export const TESSDATA_DIR = 'public/models/tessdata';

const FUZZY_DIGITS: Record<string, string> = {
  O: '0',
  D: '0',
  Q: '0',
  U: '0',
  I: '1',
  L: '1',
  T: '1',
  J: '1',
  Z: '2',
  S: '5',
  B: '8',
  G: '6',
};

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

function resolveTessdataPath(): string {
  const candidates = [
    path.join(process.cwd(), TESSDATA_DIR),
    path.join(process.cwd(), '..', TESSDATA_DIR),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

let workerPromise: ReturnType<typeof createWorker> | null = null;
let ocrQueue: Promise<unknown> = Promise.resolve();

/** OCR a normalized image to text. A single shared worker serializes requests. */
export async function ocrText(buffer: Buffer): Promise<string> {
  workerPromise ??= createWorker('eng', 1, { langPath: resolveTessdataPath() });
  const worker = await workerPromise;
  const run = ocrQueue.then(() => worker.recognize(buffer));
  ocrQueue = run.catch(() => undefined);
  const { data } = await run;
  return data?.text ?? '';
}

/** EXIF-rotate + normalize a document photo for OCR (long side capped). */
export async function normalizeDocumentImage(original: Buffer): Promise<Buffer> {
  const meta = await sharp(original).metadata();
  const maxSide = Math.max(meta.width ?? 0, meta.height ?? 0);
  const target = maxSide >= 2000 ? 2000 : undefined;
  return sharp(original)
    .rotate()
    .resize({ width: target, height: target, fit: 'inside', withoutEnlargement: true })
    .greyscale()
    .normalize()
    .sharpen({ sigma: 0.9 })
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

function fuzzyDigits(value: string): string {
  return value
    .split('')
    .map((ch) => FUZZY_DIGITS[ch.toUpperCase()] ?? ch)
    .join('');
}

function isoOrNull(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function ageFromIsoDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return -1;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) {
    age -= 1;
  }
  return age;
}

export function maskDateOfBirth(iso: string): string {
  const [, m, d] = iso.split('-');
  return `****-${m}-${d}`;
}

/**
 * Parse a Machine Readable Zone for the date of birth. Supports the TD3
 * (passport, 44-char lines: DOB rows 13-18 on line 2) and TD1 (national ID,
 * 30-char lines: DOB rows 0-5 on line 2) layouts. Returns the issuing state too.
 */
export function parseMrzDateOfBirth(text: string): { dob: string; country: string } | null {
  const lines = text
    .replace(/[ \r\t]+/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 27 && /^[A-Z0-9<]+$/.test(line));

  for (let i = 0; i < lines.length - 1; i++) {
    const first = lines[i];
    const second = lines[i + 1];
    const is44 = first.length === 44 && second.length === 44;
    const is30 = first.length === 30 && second.length === 30;
    if (!is44 && !is30) continue;

    const rawDob = is44 ? second.substring(13, 19) : second.substring(0, 6);
    const code = fuzzyDigits(rawDob);
    if (!/^\d{6}$/.test(code)) continue;

    const yy = parseInt(code.slice(0, 2), 10);
    const mm = parseInt(code.slice(2, 4), 10);
    const dd = parseInt(code.slice(4, 6), 10);
    const nowYear = new Date().getUTCFullYear();
    for (const year of [2000 + yy, 1900 + yy]) {
      if (year > nowYear) continue;
      const dob = isoOrNull(year, mm, dd);
      if (dob) return { dob, country: first.substring(2, 5) || '' };
    }
  }
  return null;
}

/**
 * OCR date-of-birth extraction anchored on an explicit DOB / DATE OF BIRTH /
 * BIRTHDATE / BORN label (English ID documents). Only dates within ~60 chars
 * of a label are accepted, which avoids picking up expiry dates.
 */
export function parseOcrDateOfBirth(text: string): string | null {
  const labelMatch = text.search(
    /\b(?:DOB|DATE\s*OF\s*BIRTH|BIRTHDATE|BIRTH\s*DAY|BORN(?:\s*ON)?)\b/i
  );
  if (labelMatch < 0) return null;
  const window = text.slice(labelMatch, labelMatch + 70);

  const numeric = window.match(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4}|\d{2})/);
  if (numeric) {
    const a = parseInt(fuzzyDigits(numeric[1]), 10);
    const b = parseInt(fuzzyDigits(numeric[2]), 10);
    let y = parseInt(fuzzyDigits(numeric[3]), 10);
    if (isNaN(a) || isNaN(b) || isNaN(y)) return null;
    if (y < 100) {
      const nowYY = new Date().getUTCFullYear() % 100;
      y = y <= nowYY ? 2000 + y : 1900 + y;
    }
    let m: number;
    let d: number;
    if (a > 12 && b <= 12) {
      m = b;
      d = a;
    } else if (b > 12 && a <= 12) {
      m = a;
      d = b;
    } else {
      // Ambiguous DD/MM vs MM/DD: resolve as MM/DD (US-style English docs).
      m = a;
      d = b;
    }
    return isoOrNull(y, m, d);
  }

  const alphaMonthFirst = window.match(
    /(\d{1,2})\s+([A-Z]{3})[A-Z]*(?:[,\s/\.\-]*)(\d{4})/
  );
  if (alphaMonthFirst) {
    const month = MONTH_NAMES[alphaMonthFirst[2].toUpperCase()];
    const d = parseInt(fuzzyDigits(alphaMonthFirst[1]), 10);
    const y = parseInt(alphaMonthFirst[3], 10);
    if (month && !isNaN(d) && !isNaN(y)) return isoOrNull(y, month, d);
  }

  const alphaMonthSecond = window.match(
    /([A-Z]{3})[A-Z]*(?:[\s/\.\-]*)(\d{1,2})(?:[,\s/\.\-]*)(\d{4})/
  );
  if (alphaMonthSecond) {
    const month = MONTH_NAMES[alphaMonthSecond[1].toUpperCase()];
    const d = parseInt(fuzzyDigits(alphaMonthSecond[2]), 10);
    const y = parseInt(alphaMonthSecond[3], 10);
    if (month && !isNaN(d) && !isNaN(y)) return isoOrNull(y, month, d);
  }

  return null;
}

export type IdEvidence =
  | {
      ok: true;
      dob: string;
      age: number;
      source: IdSource;
      country: string | null;
    }
  | {
      ok: false;
      code: 'unreadableDocument' | 'noDateOfBirth' | 'underage' | 'impossibleDate';
      message: string;
    };

/**
 * Extract evidence that the document holder is 18+ from a government-issued
 * ID photo. MRZ is preferred (passports / national IDs); otherwise falls back
 * to label-anchored OCR (driver's licenses).
 */
export async function extractIdEvidence(
  buffer: Buffer,
  documentType: IdDocumentType
): Promise<IdEvidence> {
  const text = await ocrText(buffer);
  const clean = text.replace(/[ \t]+/g, ' ');
  if (!clean.trim()) {
    return {
      ok: false,
      code: 'unreadableDocument',
      message: 'We could not read this document. Retake it in bright, even light with no shadows or glare.',
    };
  }

  let dob: string | null = null;
  let source: IdSource | null = null;
  let country: string | null = null;

  const mrz = parseMrzDateOfBirth(clean);
  if (mrz) {
    dob = mrz.dob;
    source = 'mrz';
    country = mrz.country || null;
  } else {
    const ocrDob = parseOcrDateOfBirth(clean);
    if (ocrDob) {
      dob = ocrDob;
      source = 'ocr';
    }
  }

  if (!dob || !source) {
    return {
      ok: false,
      code: 'noDateOfBirth',
      message:
        'We could not find a date of birth on this document. Make sure the DOB line (and the MRZ, if present) is visible and retake it flat and in focus.',
    };
  }

  const age = ageFromIsoDate(dob);
  if (age < 0 || age > 120) {
    return {
      ok: false,
      code: 'impossibleDate',
      message: 'The date of birth read from this document is not plausible. Retake it flat and in focus.',
    };
  }
  if (age < 18) {
    return {
      ok: false,
      code: 'underage',
      message: 'This document shows the holder is under 18. Proximity is strictly for adults 18+.',
    };
  }

  return { ok: true, dob, age, source, country };
}