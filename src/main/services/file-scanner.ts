import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { ALL_MEDIA_EXTENSIONS, PHOTO_EXTENSIONS, VIDEO_EXTENSIONS } from '../../shared/types';
import type { MediaFile } from '../../shared/types';
import { parseExif } from './exif-parser';

const BATCH_SIZE = 50;
const EXIF_CONCURRENCY = 10;

let currentAbortController: AbortController | null = null;

function getFileType(ext: string): 'photo' | 'video' | null {
  if (PHOTO_EXTENSIONS.has(ext)) return 'photo';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
}

async function walkDirectory(
  dirPath: string,
  files: MediaFile[],
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return;

  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (signal.aborted) return;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files, signal);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const type = getFileType(ext);
      if (type) {
        try {
          const fileStat = await stat(fullPath);
          files.push({
            path: fullPath,
            name: entry.name,
            size: fileStat.size,
            type,
            extension: ext,
          });
        } catch {
          // Skip files we can't stat
        }
      }
    }
  }
}

async function enrichBatch(files: MediaFile[]): Promise<MediaFile[]> {
  const results: MediaFile[] = [];
  for (let i = 0; i < files.length; i += EXIF_CONCURRENCY) {
    const batch = files.slice(i, i + EXIF_CONCURRENCY);
    const enriched = await Promise.all(
      batch.map(async (file) => {
        const exifData = await parseExif(file);
        return { ...file, ...exifData };
      }),
    );
    results.push(...enriched);
  }
  return results;
}

export async function scanFiles(
  sourcePath: string,
  onBatch: (files: MediaFile[]) => void,
): Promise<number> {
  currentAbortController?.abort();
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  const allFiles: MediaFile[] = [];
  await walkDirectory(sourcePath, allFiles, signal);

  if (signal.aborted) return 0;

  let totalSent = 0;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    if (signal.aborted) return totalSent;

    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const enriched = await enrichBatch(batch);
    onBatch(enriched);
    totalSent += enriched.length;
  }

  return totalSent;
}

export function cancelScan(): void {
  currentAbortController?.abort();
  currentAbortController = null;
}
