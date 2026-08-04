import type { MediaFile } from '../../shared/types';

// The set of files an import will actually transfer. Explicit picks win;
// otherwise everything except rejects (and duplicates when skipping them).
export function selectImportFiles(files: MediaFile[], skipDuplicates: boolean): MediaFile[] {
  const picked = files.filter((f) => f.pick === 'selected');
  if (picked.length > 0) return picked;
  return skipDuplicates
    ? files.filter((f) => !f.duplicate && f.pick !== 'rejected')
    : files.filter((f) => f.pick !== 'rejected');
}
