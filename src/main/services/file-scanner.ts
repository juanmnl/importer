import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { PHOTO_EXTENSIONS, VIDEO_EXTENSIONS } from '../../shared/types';
import type { MediaFile } from '../../shared/types';
import { parseExifDate, generateThumbnail } from './exif-parser';

const BATCH_SIZE = 50;
const THUMB_CONCURRENCY = 3; // SD cards have poor random I/O

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

export async function scanFiles(
  sourcePath: string,
  onBatch: (files: MediaFile[]) => void,
  onThumbnail: (filePath: string, thumbnail: string) => void,
): Promise<number> {
  currentAbortController?.abort();
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  // Phase 1: Walk directory and get metadata + dates (fast)
  const allFiles: MediaFile[] = [];
  await walkDirectory(sourcePath, allFiles, signal);
  if (signal.aborted) return 0;

  // Enrich with dates only (no thumbnails yet)
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    if (signal.aborted) return 0;
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const enriched = await Promise.all(
      batch.map(async (file) => {
        const dateInfo = await parseExifDate(file);
        return { ...file, ...dateInfo };
      }),
    );
    onBatch(enriched);
  }

  // Phase 2: Generate thumbnails in background (slow, streamed one by one)
  for (let i = 0; i < allFiles.length; i += THUMB_CONCURRENCY) {
    if (signal.aborted) break;
    const batch = allFiles.slice(i, i + THUMB_CONCURRENCY);
    await Promise.all(
      batch.map(async (file) => {
        if (signal.aborted) return;
        if (file.type !== 'photo') return;
        const thumbnail = await generateThumbnail(file.path, file.name);
        if (thumbnail) {
          onThumbnail(file.path, thumbnail);
        }
      }),
    );
  }

  return allFiles.length;
}

export function cancelScan(): void {
  currentAbortController?.abort();
  currentAbortController = null;
}
