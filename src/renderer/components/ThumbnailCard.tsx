import type { MediaFile } from '../../shared/types';

interface ThumbnailCardProps {
  file: MediaFile;
  focused?: boolean;
  selected?: boolean;
  compact?: boolean;
  frameNumber?: number;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

function formatExposure(file: MediaFile): string | null {
  const parts: string[] = [];
  if (file.aperture != null) parts.push(file.aperture % 1 === 0 ? `f/${file.aperture}` : `f/${file.aperture.toFixed(1)}`);
  if (file.shutterSpeed != null) parts.push(file.shutterSpeed < 1 ? `1/${Math.round(1 / file.shutterSpeed)}` : `${file.shutterSpeed}s`);
  if (file.iso != null) parts.push(String(file.iso));
  return parts.length > 0 ? parts.join(' ') : null;
}

function isPortrait(orientation?: number): boolean {
  return orientation !== undefined && orientation >= 5 && orientation <= 8;
}

// Subtle corner brackets (thin pick marks)
function CornerBrackets() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-1 left-1 w-3 h-3 border-t-[2px] border-l-[2px] border-yellow-400/80 rounded-tl-sm" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-[2px] border-r-[2px] border-yellow-400/80 rounded-tr-sm" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-[2px] border-l-[2px] border-yellow-400/80 rounded-bl-sm" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-[2px] border-r-[2px] border-yellow-400/80 rounded-br-sm" />
    </div>
  );
}

// Subtle reject mark (small X in corner)
function RejectX() {
  return (
    <div className="absolute top-1 right-1 pointer-events-none z-10">
      <svg className="w-4 h-4" viewBox="0 0 16 16">
        <line x1="3" y1="3" x2="13" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
        <line x1="13" y1="3" x2="3" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
      </svg>
    </div>
  );
}

export function ThumbnailCard({ file, focused = false, selected = false, compact = false, frameNumber, onClick, onDoubleClick }: ThumbnailCardProps) {
  const isVideo = file.type === 'video';
  const portrait = isPortrait(file.orientation);
  const isPicked = file.pick === 'selected';
  const isRejected = file.pick === 'rejected';

  return (
    <div
      className={`group relative cursor-pointer transition-all ${
        isRejected ? 'opacity-50' : ''
      } ${file.duplicate && !file.pick ? 'opacity-40' : ''}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Frame */}
      <div className={`relative bg-surface overflow-hidden ${
        selected ? 'ring-2 ring-blue-500' : focused && !isPicked ? 'ring-2 ring-text-secondary/60' : ''
      }`}>
        {/* Image */}
        <div className="aspect-[4/3] relative flex items-center justify-center">
          {file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className={`w-full h-full object-cover ${portrait ? '-rotate-90 scale-[1.35]' : ''}`}
              style={{ imageOrientation: 'none' }}
              loading="lazy"
            />
          ) : isVideo ? (
            <svg className="w-10 h-10 text-text-faint" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-text-faint" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
            </svg>
          )}

          {/* Pick: yellow corner brackets */}
          {isPicked && <CornerBrackets />}

          {/* Reject: red X */}
          {isRejected && <RejectX />}

          {/* Video badge */}
          {isVideo && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 text-[9px] text-white/80 px-1 py-0.5 rounded font-medium z-20">
              VID
            </div>
          )}

          {/* Imported badge */}
          {file.duplicate && !file.pick && (
            <div className="absolute top-1.5 left-1.5 bg-yellow-600/80 text-[9px] text-white px-1 py-0.5 rounded font-medium z-20">
              IMPORTED
            </div>
          )}

          {/* Frame number (compact/filmstrip mode) */}
          {compact && frameNumber !== undefined && (
            <div className="absolute bottom-1 left-1 text-[9px] text-neutral-500 dark:text-neutral-400 font-mono z-20">
              {String(frameNumber).padStart(3, '0')}
            </div>
          )}
        </div>
      </div>

      {/* File info — hidden in compact/filmstrip mode */}
      {!compact && (
        <div className="mt-1 flex items-center justify-between px-0.5">
          <span className="text-[10px] text-text-secondary font-mono truncate">{file.name}</span>
          <span className="text-[9px] text-text-muted font-mono shrink-0 ml-1">
            {formatExposure(file) || formatFileSize(file.size)}
          </span>
        </div>
      )}
    </div>
  );
}
