import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';
import type { ImportConfig, AppSettings, MediaFile, Volume, ImportProgress, ImportResult, UpdateInfo } from '../shared/types';

const api = {
  // Volumes
  listVolumes: (): Promise<Volume[]> =>
    ipcRenderer.invoke(IPC.VOLUMES_LIST),
  onVolumesChanged: (cb: (volumes: Volume[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, volumes: Volume[]) => cb(volumes);
    ipcRenderer.on(IPC.VOLUMES_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC.VOLUMES_CHANGED, handler);
  },

  // Scanning
  scanFiles: (sourcePath: string, folderPattern?: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SCAN_START, sourcePath, folderPattern),
  onScanBatch: (cb: (files: MediaFile[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, files: MediaFile[]) => cb(files);
    ipcRenderer.on(IPC.SCAN_BATCH, handler);
    return () => ipcRenderer.removeListener(IPC.SCAN_BATCH, handler);
  },
  onScanComplete: (cb: (totalFiles: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, total: number) => cb(total);
    ipcRenderer.on(IPC.SCAN_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC.SCAN_COMPLETE, handler);
  },
  onScanThumbnail: (cb: (filePath: string, thumbnail: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string, thumbnail: string) => cb(filePath, thumbnail);
    ipcRenderer.on(IPC.SCAN_THUMBNAIL, handler);
    return () => ipcRenderer.removeListener(IPC.SCAN_THUMBNAIL, handler);
  },
  checkDuplicates: (destRoot: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SCAN_CHECK_DUPLICATES, destRoot),
  onScanDuplicate: (cb: (filePath: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string) => cb(filePath);
    ipcRenderer.on(IPC.SCAN_DUPLICATE, handler);
    return () => ipcRenderer.removeListener(IPC.SCAN_DUPLICATE, handler);
  },
  getPreview: (filePath: string): Promise<string | undefined> =>
    ipcRenderer.invoke(IPC.SCAN_PREVIEW, filePath),
  cancelScan: (): Promise<void> =>
    ipcRenderer.invoke(IPC.SCAN_CANCEL),

  // Import
  startImport: (config: ImportConfig): Promise<ImportResult> =>
    ipcRenderer.invoke(IPC.IMPORT_START, config),
  onImportProgress: (cb: (progress: ImportProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ImportProgress) => cb(progress);
    ipcRenderer.on(IPC.IMPORT_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC.IMPORT_PROGRESS, handler);
  },
  cancelImport: (): Promise<void> =>
    ipcRenderer.invoke(IPC.IMPORT_CANCEL),

  // Dialogs
  selectFolder: (title: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.DIALOG_SELECT_FOLDER, title),
  openPath: (path: string): Promise<void> =>
    ipcRenderer.invoke(IPC.DIALOG_OPEN_PATH, path),

  // Settings
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, settings),

  // Updates
  onUpdateAvailable: (cb: (info: UpdateInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => cb(info);
    ipcRenderer.on(IPC.UPDATE_AVAILABLE, handler);
    return () => ipcRenderer.removeListener(IPC.UPDATE_AVAILABLE, handler);
  },
  openReleaseUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke(IPC.UPDATE_OPEN_RELEASE, url),
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('electronAPI', api);
