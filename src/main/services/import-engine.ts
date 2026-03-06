import { copyFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { constants } from 'node:fs';
import type { MediaFile, ImportConfig, ImportProgress, ImportResult, ImportError, SaveFormat } from '../../shared/types';
import { isDuplicate } from './duplicate-detector';

const execFileAsync = promisify(execFile);

let currentAbortController: AbortController | null = null;

const COPY_CONCURRENCY = 4;

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

async function convertAndCopy(
  srcPath: string,
  destFullPath: string,
  format: Exclude<SaveFormat, 'original'>,
  jpegQuality: number,
): Promise<void> {
  const args = [
    '-s', 'format', format,
    ...(format === 'jpeg' ? ['-s', 'formatOptions', String(jpegQuality)] : []),
    srcPath,
    '--out', destFullPath,
  ];
  await execFileAsync('sips', args, { timeout: 60000 });
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
        await copyFile(file.path, destFullPath, constants.COPYFILE_EXCL);
      } else {
        await convertAndCopy(file.path, destFullPath, saveFormat, jpegQuality);
      }

      imported++;
      bytesTransferred += file.size;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;

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

  // Process files in parallel batches
  for (let i = 0; i < files.length; i += COPY_CONCURRENCY) {
    if (signal.aborted) break;

    const batch = files.slice(i, i + COPY_CONCURRENCY);
    await Promise.all(batch.map((file) => importOne(file)));
    processedCount += batch.length;

    onProgress({
      currentFile: batch[batch.length - 1].name,
      currentIndex: processedCount,
      totalFiles: files.length,
      bytesTransferred,
      totalBytes,
      skipped,
      errors: errors.length,
    });
  }

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
