import type { Volume } from '../../shared/types';

interface VolumeItemProps {
  volume: Volume;
  isSelected: boolean;
  onSelect: (path: string) => void;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
}

export function VolumeItem({ volume, isSelected, onSelect }: VolumeItemProps) {
  return (
    <button
      onClick={() => onSelect(volume.path)}
      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
        isSelected
          ? 'bg-blue-600/20 text-blue-400'
          : 'hover:bg-neutral-700/50 text-neutral-300'
      }`}
    >
      <svg className="w-5 h-5 mt-0.5 shrink-0 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 4.75C2 3.784 2.784 3 3.75 3h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0116.25 17H3.75A1.75 1.75 0 012 15.25V4.75z" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{volume.name}</div>
        {volume.totalSize && (
          <div className="text-xs text-neutral-500 mt-0.5">
            {formatSize(volume.freeSpace)} free of {formatSize(volume.totalSize)}
          </div>
        )}
      </div>
    </button>
  );
}
