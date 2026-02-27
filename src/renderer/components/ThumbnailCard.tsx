import type { MediaFile } from '../../shared/types';

interface ThumbnailCardProps {
  file: MediaFile;
  focused?: boolean;
  onClick?: () => void;
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

function cardBorder(file: MediaFile, focused: boolean): string {
  if (file.pick === 'selected') return 'border-emerald-500/70 ring-1 ring-emerald-500/30';
  if (file.pick === 'rejected') return 'border-red-500/50 ring-1 ring-red-500/20';
  if (focused) return 'border-blue-500/70 ring-1 ring-blue-500/30';
  if (file.duplicate) return 'border-neutral-700/50 opacity-40';
  return 'border-neutral-700/50 hover:border-neutral-600';
}

function cardOpacity(file: MediaFile): string {
  if (file.pick === 'rejected') return 'opacity-30';
  return '';
}

function isPortrait(orientation?: number): boolean {
  return orientation !== undefined && orientation >= 5 && orientation <= 8;
}

export function ThumbnailCard({ file, focused = false, onClick }: ThumbnailCardProps) {
  const isVideo = file.type === 'video';
  const portrait = isPortrait(file.orientation);

  return (
    <div
      className={`group bg-neutral-800 rounded-lg overflow-hidden border transition-all cursor-pointer ${cardBorder(file, focused)} ${cardOpacity(file)}`}
      onClick={onClick}
    >
      {/* Thumbnail area */}
      <div className="aspect-[4/3] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
        {file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className={`w-full h-full object-cover ${portrait ? '-rotate-90 scale-[1.35]' : ''}`}
            style={{ imageOrientation: 'none' }}
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
        {/* Badges */}
        {isVideo && (
          <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            VIDEO
          </div>
        )}
        {file.duplicate && !file.pick && (
          <div className="absolute top-2 left-2 bg-yellow-600/80 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
            IMPORTED
          </div>
        )}
        {file.pick === 'selected' && (
          <div className="absolute top-2 left-2 bg-emerald-600/90 text-[10px] text-white px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            PICK
          </div>
        )}
        {file.pick === 'rejected' && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-[10px] text-white px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            REJ
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
