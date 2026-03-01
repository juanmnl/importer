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
  pick?: 'selected' | 'rejected';
  orientation?: number; // EXIF orientation (1-8), 6/8 = portrait
}

export type SaveFormat = 'original' | 'jpeg' | 'tiff' | 'heic';

// Folder naming presets for organizing imported files
// Tokens: {YYYY}, {MM}, {DD}, {filename}, {ext}
export const FOLDER_PRESETS: Record<string, { label: string; pattern: string }> = {
  'date-flat':   { label: 'YYYY-MM-DD',           pattern: '{YYYY}-{MM}-{DD}/{filename}' },
  'date-nested': { label: 'YYYY / MM / DD',       pattern: '{YYYY}/{MM}/{DD}/{filename}' },
  'year-month':  { label: 'YYYY / MM',            pattern: '{YYYY}/{MM}/{filename}' },
  'year':        { label: 'YYYY',                  pattern: '{YYYY}/{filename}' },
  'flat':        { label: 'No folders',            pattern: '{filename}' },
};

export interface ImportConfig {
  sourcePath: string;
  destRoot: string;
  skipDuplicates: boolean;
  saveFormat: SaveFormat;
  jpegQuality: number; // 1-100, only used when saveFormat is 'jpeg'
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
  saveFormat: SaveFormat;
  jpegQuality: number;
  folderPreset: string;      // key from FOLDER_PRESETS or 'custom'
  customPattern: string;     // user-defined pattern when folderPreset is 'custom'
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
  SCAN_PREVIEW: 'scan:preview',

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
