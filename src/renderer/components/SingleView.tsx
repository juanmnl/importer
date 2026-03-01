import { useState, useEffect } from 'react';
import type { MediaFile } from '../../shared/types';

interface SingleViewProps {
  file: MediaFile;
  index: number;
  total: number;
}

function isPortrait(orientation?: number): boolean {
  return orientation !== undefined && orientation >= 5 && orientation <= 8;
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

export function SingleView({ file, index, total }: SingleViewProps) {
  const portrait = isPortrait(file.orientation);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const isPicked = file.pick === 'selected';
  const isRejected = file.pick === 'rejected';

  useEffect(() => {
    let cancelled = false;
    setPreview(undefined);
    setLoading(true);

    window.electronAPI.getPreview(file.path).then((result) => {
      if (!cancelled) {
        setPreview(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [file.path]);

  const imageSrc = preview || file.thumbnail;

  return (
    <div className="h-full flex flex-col">
      {/* Image area */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-black p-6 relative">
        <div className={`relative max-h-full max-w-full ${isRejected ? 'opacity-40' : ''}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={file.name}
              className={`max-h-[calc(100vh-10rem)] max-w-full object-contain ${portrait ? '-rotate-90' : ''}`}
              style={{ imageOrientation: 'none' }}
            />
          ) : (
            <div className="text-neutral-600 text-sm">No preview</div>
          )}

          {/* Yellow corner brackets for picked */}
          {isPicked && imageSrc && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-2 w-8 h-8 border-t-[4px] border-l-[4px] border-yellow-400" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-[4px] border-r-[4px] border-yellow-400" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-[4px] border-l-[4px] border-yellow-400" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-[4px] border-r-[4px] border-yellow-400" />
            </div>
          )}

          {/* Red X for rejected */}
          {isRejected && imageSrc && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="15" y1="15" x2="85" y2="85" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
                <line x1="85" y1="15" x2="15" y2="85" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {loading && file.thumbnail && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-[11px] text-neutral-500">loading full preview</span>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="shrink-0 px-4 py-2.5 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-neutral-200 font-mono truncate">{file.name}</span>
          <span className="text-xs text-neutral-500 shrink-0">{formatFileSize(file.size)}</span>
          {file.dateTaken && (
            <span className="text-xs text-neutral-600 shrink-0">{formatDate(file.dateTaken)}</span>
          )}
          {file.extension && (
            <span className="text-[10px] text-neutral-600 uppercase font-mono shrink-0">{file.extension.replace('.', '')}</span>
          )}
          {isPicked && (
            <span className="text-[11px] text-yellow-400 font-mono font-medium shrink-0">PICK</span>
          )}
          {isRejected && (
            <span className="text-[11px] text-red-500 font-mono font-medium shrink-0">REJ</span>
          )}
          {file.duplicate && !file.pick && (
            <span className="text-[11px] text-neutral-500 font-mono shrink-0">IMPORTED</span>
          )}
        </div>
        <div className="text-xs text-neutral-500 font-mono shrink-0 ml-4">
          {index + 1} / {total}
        </div>
      </div>
    </div>
  );
}
