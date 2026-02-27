import exifr from 'exifr';
import { stat } from 'node:fs/promises';
import type { MediaFile } from '../../shared/types';

// Formats exifr can reliably parse
const EXIFR_SUPPORTED = new Set(['.jpg', '.jpeg', '.heic', '.dng', '.cr2', '.cr3', '.arw', '.nef']);

function formatDate(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function parseExif(
  file: MediaFile,
): Promise<{ dateTaken?: string; destPath?: string; thumbnail?: string }> {
  let dateTaken: Date | null = null;
  let thumbnail: string | undefined;

  const canParse = file.type === 'photo' && EXIFR_SUPPORTED.has(file.extension);

  if (canParse) {
    try {
      const exif = await exifr.parse(file.path, {
        pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'],
        reviveValues: true,
      });

      if (exif) {
        dateTaken = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || null;
      }
    } catch {
      // EXIF parsing failed
    }

    try {
      const thumbBuffer = await exifr.thumbnail(file.path);
      if (thumbBuffer) {
        const base64 = Buffer.from(thumbBuffer).toString('base64');
        thumbnail = `data:image/jpeg;base64,${base64}`;
      }
    } catch {
      // No embedded thumbnail
    }
  }

  // Fallback to file modification time
  if (!dateTaken) {
    try {
      const fileStat = await stat(file.path);
      dateTaken = fileStat.mtime;
    } catch {
      dateTaken = new Date();
    }
  }

  const dateStr = formatDate(dateTaken);
  const destPath = `${dateStr}/${file.name}`;

  return {
    dateTaken: dateTaken.toISOString(),
    destPath,
    thumbnail,
  };
}
