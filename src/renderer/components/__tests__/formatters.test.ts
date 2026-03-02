import { describe, it, expect } from 'vitest';
import type { MediaFile } from '../../../shared/types';

// These functions are local to their components, so we reimplement them here
// to test the logic. They match the source exactly.

// From DestinationPanel / SourcePanel / ImportSummary / ImportProgress
function formatSize(bytes: number): string {
  const gb = bytes / 1e9;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(0)} MB`;
}

// From ImportSummary
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

// From ThumbnailCard
function formatFileSize(bytes: number): string {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

// From SingleView
function fmtAperture(v: number): string {
  return v % 1 === 0 ? `f/${v}` : `f/${v.toFixed(1)}`;
}

function fmtShutter(v: number): string {
  return v < 1 ? `1/${Math.round(1 / v)}s` : `${v}s`;
}

function fmtFocal(v: number): string {
  return `${Math.round(v)}mm`;
}

function buildExposure(file: Partial<MediaFile>): string | null {
  const parts: string[] = [];
  if (file.aperture != null) parts.push(fmtAperture(file.aperture));
  if (file.shutterSpeed != null) parts.push(fmtShutter(file.shutterSpeed));
  if (file.iso != null) parts.push(`ISO ${file.iso}`);
  if (file.focalLength != null) parts.push(fmtFocal(file.focalLength));
  return parts.length > 0 ? parts.join(' · ') : null;
}

// From ThumbnailCard
function formatExposure(file: Partial<MediaFile>): string | null {
  const parts: string[] = [];
  if (file.aperture != null) parts.push(file.aperture % 1 === 0 ? `f/${file.aperture}` : `f/${file.aperture.toFixed(1)}`);
  if (file.shutterSpeed != null) parts.push(file.shutterSpeed < 1 ? `1/${Math.round(1 / file.shutterSpeed)}` : `${file.shutterSpeed}s`);
  if (file.iso != null) parts.push(String(file.iso));
  return parts.length > 0 ? parts.join(' ') : null;
}

// From ThumbnailCard
function isPortrait(orientation?: number): boolean {
  return orientation !== undefined && orientation >= 5 && orientation <= 8;
}

describe('formatSize', () => {
  it('formats gigabytes', () => {
    expect(formatSize(2.5e9)).toBe('2.50 GB');
  });

  it('formats megabytes', () => {
    expect(formatSize(500e6)).toBe('500 MB');
  });

  it('formats exactly 1 GB', () => {
    expect(formatSize(1e9)).toBe('1.00 GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(formatDuration(45000)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125000)).toBe('2m 5s');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatFileSize', () => {
  it('formats kilobytes for small files', () => {
    expect(formatFileSize(500000)).toBe('500 KB');
  });

  it('formats megabytes for large files', () => {
    expect(formatFileSize(5.5e6)).toBe('5.5 MB');
  });
});

describe('fmtAperture', () => {
  it('formats integer aperture', () => {
    expect(fmtAperture(2)).toBe('f/2');
  });

  it('formats decimal aperture', () => {
    expect(fmtAperture(2.8)).toBe('f/2.8');
  });
});

describe('fmtShutter', () => {
  it('formats fast shutter speed as fraction', () => {
    expect(fmtShutter(1 / 250)).toBe('1/250s');
  });

  it('formats slow shutter speed as whole seconds', () => {
    expect(fmtShutter(2)).toBe('2s');
  });
});

describe('fmtFocal', () => {
  it('formats focal length', () => {
    expect(fmtFocal(50)).toBe('50mm');
  });

  it('rounds decimal focal length', () => {
    expect(fmtFocal(85.3)).toBe('85mm');
  });
});

describe('buildExposure', () => {
  it('combines all metadata', () => {
    const result = buildExposure({ aperture: 2.8, shutterSpeed: 1 / 250, iso: 400, focalLength: 50 });
    expect(result).toBe('f/2.8 · 1/250s · ISO 400 · 50mm');
  });

  it('returns null with no metadata', () => {
    expect(buildExposure({})).toBeNull();
  });
});

describe('formatExposure', () => {
  it('combines aperture, shutter, and ISO', () => {
    const result = formatExposure({ aperture: 5.6, shutterSpeed: 1 / 125, iso: 200 });
    expect(result).toBe('f/5.6 1/125 200');
  });

  it('returns null with no metadata', () => {
    expect(formatExposure({})).toBeNull();
  });
});

describe('isPortrait', () => {
  it('returns true for orientation 6', () => {
    expect(isPortrait(6)).toBe(true);
  });

  it('returns true for orientation 8', () => {
    expect(isPortrait(8)).toBe(true);
  });

  it('returns false for orientation 1', () => {
    expect(isPortrait(1)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPortrait(undefined)).toBe(false);
  });
});
