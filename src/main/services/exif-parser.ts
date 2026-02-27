import exifr from 'exifr';
import { stat, readFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { app } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import type { MediaFile } from '../../shared/types';

const execFileAsync = promisify(execFile);

const EXIFR_SUPPORTED = new Set(['.jpg', '.jpeg', '.heic', '.dng', '.cr2', '.cr3', '.arw', '.nef']);
const THUMB_WIDTH = 320;

let thumbDir: string | null = null;

async function getThumbDir(): Promise<string> {
  if (!thumbDir) {
    thumbDir = path.join(app.getPath('temp'), 'photo-importer-thumbs');
    await mkdir(thumbDir, { recursive: true });
  }
  return thumbDir;
}

function formatDate(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Fast: only extract date, no thumbnail
export async function parseExifDate(
  file: MediaFile,
): Promise<{ dateTaken?: string; destPath?: string }> {
  let dateTaken: Date | null = null;

  if (file.type === 'photo' && EXIFR_SUPPORTED.has(file.extension)) {
    try {
      const exif = await exifr.parse(file.path, {
        pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
        reviveValues: true,
      });
      if (exif) {
        dateTaken = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
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

  const dateStr = formatDate(dateTaken);
  return {
    dateTaken: dateTaken.toISOString(),
    destPath: `${dateStr}/${file.name}`,
  };
}

// Slow: generate thumbnail via macOS sips
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
