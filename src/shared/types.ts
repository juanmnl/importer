export interface Volume {
  name: string;
  path: string;
  isRemovable: boolean;
  isExternal: boolean;
  totalSize?: number;
  freeSpace?: number;
}

export interface MediaFile {
  path: string;
  name: string;
  size: number;
  type: 'photo' | 'video';
  extension: string;
  dateTaken?: string;
  destPath?: string;
  thumbnail?: string; // base64 data URI
  duplicate?: boolean;
}

export interface ImportConfig {
  sourcePath: string;
  destRoot: string;
  skipDuplicates: boolean;
}

export interface ImportProgress {
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  bytesTransferred: number;
  totalBytes: number;
  skipped: number;
  errors: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
  totalBytes: number;
  durationMs: number;
}

export interface ImportError {
  file: string;
  error: string;
}

export interface AppSettings {
  lastDestination: string;
  skipDuplicates: boolean;
}

export const PHOTO_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.cr2', '.cr3', '.arw', '.nef', '.dng', '.raf', '.heic',
]);

export const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov',
]);

export const ALL_MEDIA_EXTENSIONS = new Set([
  ...PHOTO_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
]);

export const IPC = {
  // Volumes
  VOLUMES_LIST: 'volumes:list',
  VOLUMES_CHANGED: 'volumes:changed',

  // Scanning
  SCAN_START: 'scan:start',
  SCAN_BATCH: 'scan:batch',
  SCAN_COMPLETE: 'scan:complete',
  SCAN_THUMBNAIL: 'scan:thumbnail',
  SCAN_CHECK_DUPLICATES: 'scan:check-duplicates',
  SCAN_DUPLICATE: 'scan:duplicate',
  SCAN_CANCEL: 'scan:cancel',

  // Import
  IMPORT_START: 'import:start',
  IMPORT_PROGRESS: 'import:progress',
  IMPORT_COMPLETE: 'import:complete',
  IMPORT_CANCEL: 'import:cancel',

  // Dialogs
  DIALOG_SELECT_FOLDER: 'dialog:select-folder',
  DIALOG_OPEN_PATH: 'dialog:open-path',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
} as const;
