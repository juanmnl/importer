import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';
import type { MediaFile, ImportConfig, ImportProgress, ImportResult, ImportError } from '../../shared/types';
import { isDuplicate } from './duplicate-detector';

let currentAbortController: AbortController | null = null;

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

  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) break;

    const file = files[i];

    if (!file.destPath) {
      errors.push({ file: file.name, error: 'No destination path computed' });
      continue;
    }

    const destFullPath = path.join(config.destRoot, file.destPath);

    // Check for duplicates
    if (config.skipDuplicates) {
      const dup = await isDuplicate(config.destRoot, file.destPath, file.size);
      if (dup) {
        skipped++;
        onProgress({
          currentFile: file.name,
          currentIndex: i + 1,
          totalFiles: files.length,
          bytesTransferred,
          totalBytes,
          skipped,
          errors: errors.length,
        });
        continue;
      }
    }

    try {
      // Ensure destination directory exists
      await mkdir(path.dirname(destFullPath), { recursive: true });

      // Copy file (COPYFILE_EXCL prevents overwriting)
      await copyFile(file.path, destFullPath, constants.COPYFILE_EXCL);

      // Verify copy by checking size
      const destStat = await stat(destFullPath);
      if (destStat.size !== file.size) {
        errors.push({ file: file.name, error: 'Size mismatch after copy' });
        continue;
      }

      imported++;
      bytesTransferred += file.size;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;

      if (error.code === 'ENOSPC') {
        errors.push({ file: file.name, error: 'Disk full' });
        break; // Stop immediately on disk full
      }

      if (error.code === 'EEXIST') {
        skipped++;
      } else {
        errors.push({ file: file.name, error: error.message || 'Copy failed' });
      }
    }

    onProgress({
      currentFile: file.name,
      currentIndex: i + 1,
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
