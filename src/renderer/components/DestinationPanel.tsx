import { useAppState, useAppDispatch } from '../context/ImportContext';
import { useImport } from '../hooks/useImport';
import type { SaveFormat } from '../../shared/types';

function formatSize(bytes: number): string {
  const gb = bytes / 1e9;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(0)} MB`;
}

export function DestinationPanel() {
  const { destination, skipDuplicates, saveFormat, jpegQuality, files, phase, selectedSource } = useAppState();
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

  const handleFormatChange = (format: SaveFormat) => {
    dispatch({ type: 'SET_SAVE_FORMAT', format });
    window.electronAPI.setSettings({ saveFormat: format });
  };

  const handleQualityChange = (quality: number) => {
    dispatch({ type: 'SET_JPEG_QUALITY', quality });
    window.electronAPI.setSettings({ jpegQuality: quality });
  };

  const duplicateCount = files.filter((f) => f.duplicate).length;
  const pickedCount = files.filter((f) => f.pick === 'selected').length;
  const hasPicks = pickedCount > 0;

  // If any files are explicitly picked, import only those.
  // Otherwise import all non-rejected (respecting skip-duplicates).
  const importFiles = hasPicks
    ? files.filter((f) => f.pick === 'selected')
    : skipDuplicates
      ? files.filter((f) => !f.duplicate && f.pick !== 'rejected')
      : files.filter((f) => f.pick !== 'rejected');

  const canImport = selectedSource && destination && importFiles.length > 0 && phase === 'ready';
  const totalSize = importFiles.reduce((sum, f) => sum + f.size, 0);

  // Group files by date folder for preview
  const folderMap = new Map<string, string[]>();
  for (const f of files) {
    if (!f.destPath) continue;
    const parts = f.destPath.split('/');
    const folder = parts[0]; // e.g. "2026-02-21"
    const fileName = parts.slice(1).join('/');
    if (!folderMap.has(folder)) folderMap.set(folder, []);
    folderMap.get(folder)!.push(fileName);
  }
  const folders = [...folderMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

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

      {/* Save format */}
      <div className="px-3 mb-4">
        <h3 className="text-[11px] text-neutral-500 mb-2 uppercase tracking-wider">Save Format</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ['original', 'Original'],
            ['jpeg', 'JPEG'],
            ['tiff', 'TIFF'],
            ['heic', 'HEIC'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => handleFormatChange(value)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                saveFormat === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {saveFormat === 'jpeg' && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-500">Quality</span>
              <span className="text-[11px] text-neutral-400 font-mono">{jpegQuality}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={jpegQuality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
        {saveFormat !== 'original' && (
          <p className="text-[11px] text-neutral-600 mt-1.5">
            Files will be converted via sips
          </p>
        )}
      </div>

      {/* Folder structure preview */}
      {folders.length > 0 && destination && (
        <div className="px-3 mb-4 flex-1 min-h-0 overflow-y-auto">
          <h3 className="text-[11px] text-neutral-500 mb-2 uppercase tracking-wider">Folder Preview</h3>
          <div className="space-y-2">
            {folders.map(([folder, fileNames]) => (
              <div key={folder}>
                <div className="text-[11px] text-neutral-400 font-mono font-medium">
                  {folder}/
                </div>
                {fileNames.slice(0, 5).map((name) => (
                  <div key={name} className="text-[11px] text-neutral-600 font-mono pl-3 truncate">
                    {name}
                  </div>
                ))}
                {fileNames.length > 5 && (
                  <div className="text-[11px] text-neutral-600 pl-3">
                    +{fileNames.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import summary + button */}
      <div className="mt-auto p-3 border-t border-neutral-700">
        {files.length > 0 && (
          <div className="text-xs text-neutral-500 mb-3">
            {importFiles.length} file{importFiles.length !== 1 ? 's' : ''} &middot; {formatSize(totalSize)}
            {hasPicks && <span className="text-emerald-400/70"> &middot; {pickedCount} picked</span>}
            {skipDuplicates && duplicateCount > 0 && (
              <span className="text-yellow-500/70"> &middot; {duplicateCount} already imported</span>
            )}
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
          Import {importFiles.length > 0 ? `${importFiles.length} Files` : ''}
        </button>
      </div>
    </div>
  );
}
