import { copyFile, mkdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { constants } from 'node:fs';
import type { MediaFile, ImportConfig, ImportProgress, ImportResult, ImportError, SaveFormat } from '../../shared/types';
import { isDuplicate } from './duplicate-detector';

const execFileAsync = promisify(execFile);

let currentAbortController: AbortController | null = null;

const FORMAT_EXT: Record<Exclude<SaveFormat, 'original'>, string> = {
  jpeg: '.jpg',
  tiff: '.tiff',
  heic: '.heic',
};

function convertedDestPath(destPath: string, format: SaveFormat): string {
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

  for (let i = 0; i < files.length; i++) {
    if (signal.aborted) break;

    const file = files[i];

    if (!file.destPath) {
      errors.push({ file: file.name, error: 'No destination path computed' });
      continue;
    }

    const finalDestPath = convertedDestPath(file.destPath, saveFormat);
    const destFullPath = path.join(config.destRoot, finalDestPath);

    // Check for duplicates
    if (config.skipDuplicates) {
      const dup = await isDuplicate(config.destRoot, finalDestPath, file.size);
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

      if (saveFormat === 'original') {
        // Copy file as-is (COPYFILE_EXCL prevents overwriting)
        await copyFile(file.path, destFullPath, constants.COPYFILE_EXCL);

        // Verify copy by checking size
        const destStat = await stat(destFullPath);
        if (destStat.size !== file.size) {
          errors.push({ file: file.name, error: 'Size mismatch after copy' });
          continue;
        }
      } else {
        // Convert via sips
        await convertAndCopy(file.path, destFullPath, saveFormat, jpegQuality);

        // Verify output exists
        await stat(destFullPath);
      }

      imported++;
      bytesTransferred += file.size;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;

      if (error.code === 'ENOSPC') {
        errors.push({ file: file.name, error: 'Disk full' });
        break;
      }

      if (error.code === 'EEXIST') {
        skipped++;
      } else {
        errors.push({ file: file.name, error: error.message || 'Import failed' });
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
