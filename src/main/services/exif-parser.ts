import exifr from 'exifr';
import { stat, readFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { app } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import type { MediaFile } from '../../shared/types';
import { resolvePattern } from '../../shared/types';

const execFileAsync = promisify(execFile);

export const EXIFR_SUPPORTED = new Set(['.jpg', '.jpeg', '.heic', '.dng', '.cr2', '.cr3', '.arw', '.nef', '.raf']);
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

// Fast: only extract date, no thumbnail
export async function parseExifDate(
  file: MediaFile,
  folderPattern?: string,
): Promise<{
  dateTaken?: string;
  destPath?: string;
  orientation?: number;
  iso?: number;
  aperture?: number;
  shutterSpeed?: number;
  focalLength?: number;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
}> {
  let dateTaken: Date | null = null;
  let orientation: number | undefined;
  let iso: number | undefined;
  let aperture: number | undefined;
  let shutterSpeed: number | undefined;
  let focalLength: number | undefined;
  let cameraMake: string | undefined;
  let cameraModel: string | undefined;
  let lensModel: string | undefined;

  if (file.type === 'photo' && EXIFR_SUPPORTED.has(file.extension)) {
    try {
      const exif = await exifr.parse(file.path, {
        pick: [
          'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'Orientation',
          'ISO', 'FNumber', 'ExposureTime', 'FocalLength',
          'Make', 'Model', 'LensModel',
        ],
        reviveValues: true,
      });
      if (exif) {
        dateTaken = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
        if (typeof exif.Orientation === 'number') orientation = exif.Orientation;
        if (typeof exif.ISO === 'number') iso = exif.ISO;
        if (typeof exif.FNumber === 'number') aperture = exif.FNumber;
        if (typeof exif.ExposureTime === 'number') shutterSpeed = exif.ExposureTime;
        if (typeof exif.FocalLength === 'number') focalLength = exif.FocalLength;
        if (typeof exif.Make === 'string') cameraMake = exif.Make;
        if (typeof exif.Model === 'string') cameraModel = exif.Model;
        if (typeof exif.LensModel === 'string') lensModel = exif.LensModel;
        if (iso || aperture) console.log('[exif]', file.name, { iso, aperture, shutterSpeed, focalLength, cameraModel });
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
    iso,
    aperture,
    shutterSpeed,
    focalLength,
    cameraMake,
    cameraModel,
    lensModel,
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
