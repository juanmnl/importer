import exifr from 'exifr';
import { stat, readFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { app } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import type { MediaFile } from '../../shared/types';

const execFileAsync = promisify(execFile);

export const EXIFR_SUPPORTED = new Set(['.jpg', '.jpeg', '.heic', '.dng', '.cr2', '.cr3', '.arw', '.nef']);
const THUMB_WIDTH = 320;
const PREVIEW_WIDTH = 1920;
const PREVIEW_QUALITY = 85;

let thumbDir: string | null = null;

async function getThumbDir(): Promise<string> {
  if (!thumbDir) {
    thumbDir = path.join(app.getPath('temp'), 'photo-importer-thumbs');
    await mkdir(thumbDir, { recursive: true });
  }
  return thumbDir;
}

// Resolve a folder pattern like "{YYYY}-{MM}-{DD}/{filename}" with actual values
export function resolvePattern(pattern: string, date: Date, fileName: string, ext: string): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const baseName = path.basename(fileName, ext);
  return pattern
    .replace(/\{YYYY\}/g, y)
    .replace(/\{MM\}/g, m)
    .replace(/\{DD\}/g, d)
    .replace(/\{filename\}/g, fileName)
    .replace(/\{name\}/g, baseName)
    .replace(/\{ext\}/g, ext.replace('.', ''));
}

// Fast: only extract date, no thumbnail
export async function parseExifDate(
  file: MediaFile,
  folderPattern?: string,
): Promise<{ dateTaken?: string; destPath?: string; orientation?: number }> {
  let dateTaken: Date | null = null;
  let orientation: number | undefined;

  if (file.type === 'photo' && EXIFR_SUPPORTED.has(file.extension)) {
    try {
      const exif = await exifr.parse(file.path, {
        pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'Orientation'],
        reviveValues: true,
      });
      if (exif) {
        dateTaken = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
        if (typeof exif.Orientation === 'number') orientation = exif.Orientation;
      }
    } catch {
      // EXIF parse failed
    }
  }

  if (!dateTaken) {
    try {
      const fileStat = await stat(file.path);
      dateTaken = fileStat.mtime;
    } catch {
      dateTaken = new Date();
    }
  }

  const pattern = folderPattern || '{YYYY}-{MM}-{DD}/{filename}';
  const destPath = resolvePattern(pattern, dateTaken, file.name, file.extension);
  return {
    dateTaken: dateTaken.toISOString(),
    destPath,
    orientation,
  };
}

// Fast: extract embedded JPEG thumbnail from EXIF data (no RAW decoding)
export async function extractEmbeddedThumbnail(
  filePath: string,
  extension: string,
): Promise<string | undefined> {
  if (!EXIFR_SUPPORTED.has(extension)) return undefined;
  try {
    const thumbData = await exifr.thumbnail(filePath);
    if (!thumbData || thumbData.byteLength === 0) return undefined;
    const buffer = Buffer.isBuffer(thumbData) ? thumbData : Buffer.from(thumbData);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

// Large preview for single/loupe view (1920px, high quality, cached)
export async function generatePreview(filePath: string): Promise<string | undefined> {
  try {
    const dir = await getThumbDir();
    const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 12);
    const outPath = path.join(dir, `${hash}_preview.jpg`);

    // Check cache first
    try {
      await stat(outPath);
      const buf = await readFile(outPath);
      return `data:image/jpeg;base64,${buf.toString('base64')}`;
    } catch {
      // Not cached, generate
    }

    await execFileAsync('sips', [
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', String(PREVIEW_QUALITY),
      '--resampleWidth', String(PREVIEW_WIDTH),
      filePath,
      '--out', outPath,
    ], { timeout: 30000 });

    const previewBuffer = await readFile(outPath);
    return `data:image/jpeg;base64,${previewBuffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

// Slow: generate thumbnail via macOS sips (fallback for unsupported formats)
export async function generateThumbnail(filePath: string, fileName: string): Promise<string | undefined> {
  try {
    const dir = await getThumbDir();
    const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0, 12);
    const outPath = path.join(dir, `${hash}.jpg`);

    await execFileAsync('sips', [
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', '60',
      '--resampleWidth', String(THUMB_WIDTH),
      filePath,
      '--out', outPath,
    ], { timeout: 15000 });

    const thumbBuffer = await readFile(outPath);
    return `data:image/jpeg;base64,${thumbBuffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}
