import { useAppState, useAppDispatch } from '../context/ImportContext';
import { useImport } from '../hooks/useImport';

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function DestinationPanel() {
  const { destination, skipDuplicates, files, phase, selectedSource } = useAppState();
  const dispatch = useAppDispatch();
  const { startImport } = useImport();

  const handleChooseDestination = async () => {
    const folder = await window.electronAPI.selectFolder('Select Destination Folder');
    if (folder) {
      dispatch({ type: 'SET_DESTINATION', path: folder });
      window.electronAPI.setSettings({ lastDestination: folder });
    }
  };

  const handleToggleDuplicates = () => {
    const value = !skipDuplicates;
    dispatch({ type: 'SET_SKIP_DUPLICATES', value });
    window.electronAPI.setSettings({ skipDuplicates: value });
  };

  const canImport = selectedSource && destination && files.length > 0 && phase === 'ready';
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // Collect unique date folders for preview
  const dateFolders = [...new Set(
    files.map((f) => f.destPath?.split('/').slice(0, 3).join('/') || '').filter(Boolean),
  )].sort();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Destination</h2>
      </div>

      {/* Destination folder */}
      <div className="px-3 mb-4">
        <button
          onClick={handleChooseDestination}
          className="w-full px-3 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded-md text-neutral-200 transition-colors text-left"
        >
          {destination ? (
            <span className="truncate block" title={destination}>{destination.split('/').pop()}</span>
          ) : (
            'Choose Destination...'
          )}
        </button>
        {destination && (
          <div className="text-[11px] text-neutral-500 mt-1 truncate" title={destination}>
            {destination}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="px-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={handleToggleDuplicates}
            className="rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-neutral-300">Skip duplicates</span>
        </label>
        <p className="text-[11px] text-neutral-600 mt-1 ml-6">
          Files matching name + size
        </p>
      </div>

      {/* Folder structure preview */}
      {files.length > 0 && destination && (
        <div className="px-3 mb-4 flex-1 min-h-0 overflow-y-auto">
          <h3 className="text-[11px] text-neutral-500 mb-2 uppercase tracking-wider">Folder Preview</h3>
          <div className="space-y-0.5">
            {dateFolders.slice(0, 20).map((folder) => (
              <div key={folder} className="text-[11px] text-neutral-500 font-mono">
                {folder}/
              </div>
            ))}
            {dateFolders.length > 20 && (
              <div className="text-[11px] text-neutral-600">
                ...and {dateFolders.length - 20} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import summary + button */}
      <div className="mt-auto p-3 border-t border-neutral-700">
        {files.length > 0 && (
          <div className="text-xs text-neutral-500 mb-3">
            {files.length} files &middot; {formatSize(totalSize)}
          </div>
        )}
        <button
          onClick={startImport}
          disabled={!canImport}
          className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
            canImport
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
          }`}
        >
          Import {files.length > 0 ? `${files.length} Files` : ''}
        </button>
      </div>
    </div>
  );
}
