import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';
import type { ImportConfig, AppSettings, MediaFile, Volume, ImportProgress, ImportResult } from '../shared/types';

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
  scanFiles: (sourcePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SCAN_START, sourcePath),
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
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('electronAPI', api);
