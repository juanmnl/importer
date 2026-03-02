import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { IPC } from '../shared/types';
import type { ImportConfig, ImportResult, AppSettings, MediaFile } from '../shared/types';
import { listVolumes, startWatching, stopWatching } from './services/volume-watcher';
import { scanFiles, cancelScan } from './services/file-scanner';
import { importFiles, cancelImport } from './services/import-engine';
import { isDuplicate } from './services/duplicate-detector';
import { generatePreview } from './services/exif-parser';

let scannedFiles: MediaFile[] = [];

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await readFile(getSettingsPath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return { lastDestination: '', skipDuplicates: true, saveFormat: 'original', jpegQuality: 90, folderPreset: 'date-flat', customPattern: '{YYYY}-{MM}-{DD}/{filename}', theme: 'dark' };
  }
}

async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await loadSettings();
  const merged = { ...current, ...settings };
  const dir = path.dirname(getSettingsPath());
  await mkdir(dir, { recursive: true });
  await writeFile(getSettingsPath(), JSON.stringify(merged, null, 2));
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send(channel, ...args);
  }
}

export function registerIpcHandlers(): void {
  // Volumes
  ipcMain.handle(IPC.VOLUMES_LIST, async () => {
    return listVolumes();
  });

  startWatching((volumes) => {
    sendToRenderer(IPC.VOLUMES_CHANGED, volumes);
  });

  app.on('before-quit', () => {
    stopWatching();
  });

  // Scanning
  ipcMain.handle(IPC.SCAN_START, async (_event, sourcePath: string, folderPattern?: string) => {
    console.log(`[scan] Starting scan of: ${sourcePath}`);
    scannedFiles = [];
    try {
      const total = await scanFiles(
        sourcePath,
        (batch) => {
          console.log(`[scan] Batch: ${batch.length} files`);
          scannedFiles.push(...batch);
          sendToRenderer(IPC.SCAN_BATCH, batch);
        },
        (filePath, thumbnail) => {
          const file = scannedFiles.find((f) => f.path === filePath);
          if (file) file.thumbnail = thumbnail;
          sendToRenderer(IPC.SCAN_THUMBNAIL, filePath, thumbnail);
        },
        folderPattern,
      );
      console.log(`[scan] Complete: ${total} files`);
      sendToRenderer(IPC.SCAN_COMPLETE, total);
    } catch (err) {
      console.error('[scan] Error:', err);
      sendToRenderer(IPC.SCAN_COMPLETE, 0);
    }
  });

  ipcMain.handle(IPC.SCAN_CHECK_DUPLICATES, async (_event, destRoot: string) => {
    for (const file of scannedFiles) {
      if (!file.destPath) continue;
      const dup = await isDuplicate(destRoot, file.destPath, file.size);
      if (dup) {
        file.duplicate = true;
        sendToRenderer(IPC.SCAN_DUPLICATE, file.path);
      }
    }
  });

  ipcMain.handle(IPC.SCAN_PREVIEW, async (_event, filePath: string) => {
    return generatePreview(filePath);
  });

  ipcMain.handle(IPC.SCAN_CANCEL, async () => {
    cancelScan();
  });

  // Import
  ipcMain.handle(IPC.IMPORT_START, async (_event, config: ImportConfig) => {
    try {
      const filesToImport = scannedFiles.filter((f) => f.destPath);
      const result = await importFiles(filesToImport, config, (progress) => {
        sendToRenderer(IPC.IMPORT_PROGRESS, progress);
      });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown import error';
      return {
        imported: 0,
        skipped: 0,
        errors: [{ file: 'system', error: message }],
        totalBytes: 0,
        durationMs: 0,
      } satisfies ImportResult;
    }
  });

  ipcMain.handle(IPC.IMPORT_CANCEL, async () => {
    cancelImport();
  });

  // Dialogs
  ipcMain.handle(IPC.DIALOG_SELECT_FOLDER, async (_event, title: string) => {
    const result = await dialog.showOpenDialog({
      title,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.DIALOG_OPEN_PATH, async (_event, filePath: string) => {
    await shell.openPath(filePath);
  });

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, async () => {
    return loadSettings();
  });

  ipcMain.handle(IPC.SETTINGS_SET, async (_event, settings: Partial<AppSettings>) => {
    await saveSettings(settings);
  });
}
