import { describe, it, expect } from 'vitest';
import type { MediaFile } from '../../../shared/types';
import { selectImportFiles } from '../importSelection';

function makeFile(overrides: Partial<MediaFile> = {}): MediaFile {
  return {
    path: '/src/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: 5000,
    type: 'photo',
    extension: '.jpg',
    ...overrides,
  };
}

describe('selectImportFiles', () => {
  it('returns only picked files when any picks exist', () => {
    const files = [
      makeFile({ path: '/a', pick: 'selected' }),
      makeFile({ path: '/b' }),
      makeFile({ path: '/c', pick: 'rejected' }),
    ];
    expect(selectImportFiles(files, true).map((f) => f.path)).toEqual(['/a']);
  });

  it('excludes rejected files when no picks exist', () => {
    const files = [makeFile({ path: '/a' }), makeFile({ path: '/b', pick: 'rejected' })];
    expect(selectImportFiles(files, false).map((f) => f.path)).toEqual(['/a']);
  });

  it('excludes duplicates only when skipDuplicates is on', () => {
    const files = [makeFile({ path: '/a' }), makeFile({ path: '/b', duplicate: true })];
    expect(selectImportFiles(files, true).map((f) => f.path)).toEqual(['/a']);
    expect(selectImportFiles(files, false).map((f) => f.path)).toEqual(['/a', '/b']);
  });

  it('keeps picked duplicates (explicit pick wins)', () => {
    const files = [makeFile({ path: '/a', pick: 'selected', duplicate: true })];
    expect(selectImportFiles(files, true).map((f) => f.path)).toEqual(['/a']);
  });
});
