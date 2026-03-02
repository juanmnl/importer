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
  iso?: number;
  aperture?: number;
  shutterSpeed?: number;
  focalLength?: number;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
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
  theme: 'light' | 'dark';
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

export function resolvePattern(pattern: string, date: Date, fileName: string, ext: string): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const baseName = fileName.replace(new RegExp(`\\${ext}$`, 'i'), '');
  return pattern
    .replace(/\{YYYY\}/g, y)
    .replace(/\{MM\}/g, m)
    .replace(/\{DD\}/g, d)
    .replace(/\{filename\}/g, fileName)
    .replace(/\{name\}/g, baseName)
    .replace(/\{ext\}/g, ext.replace('.', ''));
}

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
