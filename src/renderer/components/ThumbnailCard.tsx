import type { MediaFile } from '../../shared/types';

interface ThumbnailCardProps {
  file: MediaFile;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ThumbnailCard({ file }: ThumbnailCardProps) {
  const isVideo = file.type === 'video';

  return (
    <div className={`group bg-neutral-800 rounded-lg overflow-hidden border transition-colors ${
      file.duplicate
        ? 'border-neutral-700/50 opacity-40'
        : 'border-neutral-700/50 hover:border-neutral-600'
    }`}>
      {/* Thumbnail area */}
      <div className="aspect-[4/3] bg-neutral-800 relative flex items-center justify-center">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isVideo ? (
          <svg className="w-10 h-10 text-neutral-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-neutral-600" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
          </svg>
        )}
        {isVideo && (
          <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            VIDEO
          </div>
        )}
        {file.duplicate && (
          <div className="absolute top-2 left-2 bg-yellow-600/80 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            IMPORTED
          </div>
        )}
      </div>

      {/* File info */}
      <div className="p-2">
        <div className="text-xs text-neutral-300 truncate" title={file.name}>
          {file.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-neutral-500">{formatDate(file.dateTaken)}</span>
          <span className="text-[11px] text-neutral-600">{formatFileSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
}
