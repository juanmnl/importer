import { access, mkdir, rename, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { MediaFile, ImportConfig, ImportProgress, ImportResult, ImportError, SaveFormat } from '../../shared/types';
import { isDuplicate } from './duplicate-detector';

const execFileAsync = promisify(execFile);

let currentAbortController: AbortController | null = null;

const COPY_CONCURRENCY = 8;

const FORMAT_EXT: Record<Exclude<SaveFormat, 'original'>, string> = {
  jpeg: '.jpg',
  tiff: '.tiff',
  heic: '.heic',
};

export function convertedDestPath(destPath: string, format: SaveFormat): string {
  if (format === 'original') return destPath;
  const ext = FORMAT_EXT[format];
  const parsed = path.parse(destPath);
  return path.join(parsed.dir, `${parsed.name}${ext}`);
}

// rename() silently replaces an existing destination, so refuse first to
// mirror COPYFILE_EXCL semantics; EEXIST is treated as a skip upstream.

/** True for the error a stream/exec abort raises, so callers can tell it from a real failure. */
function isAbortError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === 'ABORT_ERR' || (err as Error)?.name === 'AbortError';
}

/**
 * copyFile() cannot be interrupted, so a cancel had to wait for every in-flight
 * copy to finish — minutes on large RAW files. Streaming the copy lets the abort
 * signal tear it down immediately. The 'wx' flag keeps COPYFILE_EXCL semantics:
 * an existing destination fails with EEXIST and is never touched.
 */
async function copyFileInterruptible(
  srcPath: string,
  destFullPath: string,
  signal: AbortSignal,
): Promise<void> {
  try {
    await pipeline(
      createReadStream(srcPath),
      createWriteStream(destFullPath, { flags: 'wx' }),
      { signal },
    );
  } catch (err: unknown) {
    // A partial file is worse than no file: drop it. EEXIST means the
    // destination was already there and is not ours to remove.
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      await unlink(destFullPath).catch(() => {});
    }
    throw err;
  }
}

async function moveFile(
  srcPath: string,
  destFullPath: string,
  signal: AbortSignal,
): Promise<void> {
  let destExists = true;
  try {
    await access(destFullPath);
  } catch {
    destExists = false;
  }
  if (destExists) {
    const err = new Error('Destination already exists') as NodeJS.ErrnoException;
    err.code = 'EEXIST';
    throw err;
  }
  try {
    await rename(srcPath, destFullPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
    // Different volume — copy then remove the original
    await copyFileInterruptible(srcPath, destFullPath, signal);
    await unlink(srcPath);
  }
}

async function convertAndCopy(
  srcPath: string,
  destFullPath: string,
  format: Exclude<SaveFormat, 'original'>,
  jpegQuality: number,
  signal: AbortSignal,
): Promise<void> {
  const args = [
    '-s', 'format', format,
    ...(format === 'jpeg' ? ['-s', 'formatOptions', String(jpegQuality)] : []),
    srcPath,
    '--out', destFullPath,
  ];
  try {
    await execFileAsync('sips', args, { timeout: 60000, signal });
  } catch (err) {
    // Killing sips mid-encode leaves a truncated file behind.
    await unlink(destFullPath).catch(() => {});
    throw err;
  }
}

export async function importFiles(
  files: MediaFile[],
  config: ImportConfig,
  onProgress: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  currentAbortController?.abort();
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  const startTime = Date.now();
  let imported = 0;
  let skipped = 0;
  let bytesTransferred = 0;
  const errors: ImportError[] = [];
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const { saveFormat, jpegQuality } = config;
  const mode = config.mode ?? 'copy';
  const createdDirs = new Set<string>();
  let processedCount = 0;

  async function ensureDir(dirPath: string): Promise<void> {
    if (createdDirs.has(dirPath)) return;
    await mkdir(dirPath, { recursive: true });
    createdDirs.add(dirPath);
  }

  async function importOne(file: MediaFile): Promise<void> {
    if (!file.destPath) {
      errors.push({ file: file.name, error: 'No destination path computed' });
      return;
    }

    const finalDestPath = convertedDestPath(file.destPath, saveFormat);
    const destFullPath = path.join(config.destRoot, finalDestPath);

    if (config.skipDuplicates) {
      const dup = await isDuplicate(config.destRoot, finalDestPath, file.size);
      if (dup) {
        skipped++;
        return;
      }
    }

    try {
      await ensureDir(path.dirname(destFullPath));

      if (saveFormat === 'original') {
        if (mode === 'move') {
          await moveFile(file.path, destFullPath, signal);
        } else {
          await copyFileInterruptible(file.path, destFullPath, signal);
        }
      } else {
        await convertAndCopy(file.path, destFullPath, saveFormat, jpegQuality, signal);
        if (mode === 'move') {
          await unlink(file.path);
        }
      }

      imported++;
      bytesTransferred += file.size;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;

      // Cancelled mid-file: the partial output is already cleaned up, and this
      // is not a failure to report.
      if (isAbortError(error) || signal.aborted) return;

      if (error.code === 'ENOSPC') {
        errors.push({ file: file.name, error: 'Disk full' });
        currentAbortController?.abort();
        return;
      }

      if (error.code === 'EEXIST') {
        skipped++;
      } else {
        errors.push({ file: file.name, error: error.message || 'Import failed' });
      }
    }
  }

  // Concurrent pool — keeps all slots busy instead of waiting for whole batches
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (!signal.aborted) {
      const idx = nextIndex++;
      if (idx >= files.length) break;

      await importOne(files[idx]);
      processedCount++;

      onProgress({
        currentFile: files[idx].name,
        currentIndex: processedCount,
        totalFiles: files.length,
        bytesTransferred,
        totalBytes,
        skipped,
        errors: errors.length,
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(COPY_CONCURRENCY, files.length) }, () => worker()));

  return {
    imported,
    skipped,
    errors,
    totalBytes: bytesTransferred,
    durationMs: Date.now() - startTime,
  };
}

export function cancelImport(): void {
  currentAbortController?.abort();
  currentAbortController = null;
}
