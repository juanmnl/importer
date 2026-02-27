import { useAppState } from '../context/ImportContext';
import { ThumbnailCard } from './ThumbnailCard';
import { EmptyState } from './EmptyState';

export function ThumbnailGrid() {
  const { files, phase, selectedSource } = useAppState();

  if (!selectedSource) {
    return <EmptyState />;
  }

  if (phase === 'scanning' && files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Scanning files...</p>
      </div>
    );
  }

  if (files.length === 0 && phase !== 'scanning') {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-neutral-500">No supported files found</p>
      </div>
    );
  }

  const photoCount = files.filter((f) => f.type === 'photo').length;
  const videoCount = files.filter((f) => f.type === 'video').length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-medium text-neutral-300">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          {photoCount > 0 && <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>}
          {photoCount > 0 && videoCount > 0 && <span>&middot;</span>}
          {videoCount > 0 && <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>}
        </div>
        {phase === 'scanning' && (
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        {files.map((file) => (
          <ThumbnailCard key={file.path} file={file} />
        ))}
      </div>
    </div>
  );
}
