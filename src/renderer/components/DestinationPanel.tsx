import { useMemo } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';
import { useImport } from '../hooks/useImport';
import type { SaveFormat } from '../../shared/types';
import { FOLDER_PRESETS, resolvePattern } from '../../shared/types';
import { formatSize } from '../utils/formatters';

const FORMAT_EXT: Record<string, string> = {
  jpeg: '.jpg',
  tiff: '.tiff',
  heic: '.heic',
};

function applyFormat(destPath: string, format: SaveFormat): string {
  if (format === 'original') return destPath;
  const ext = FORMAT_EXT[format];
  const lastDot = destPath.lastIndexOf('.');
  if (lastDot < 0) return destPath + ext;
  return destPath.slice(0, lastDot) + ext;
}

export function DestinationPanel() {
  const { destination, skipDuplicates, saveFormat, jpegQuality, folderPreset, customPattern, files, phase, selectedSource } = useAppState();
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

  const handleFolderPreset = (preset: string) => {
    dispatch({ type: 'SET_FOLDER_PRESET', preset });
    window.electronAPI.setSettings({ folderPreset: preset });
  };

  const handleCustomPattern = (pattern: string) => {
    dispatch({ type: 'SET_CUSTOM_PATTERN', pattern });
    window.electronAPI.setSettings({ customPattern: pattern });
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

  const importFiles = hasPicks
    ? files.filter((f) => f.pick === 'selected')
    : skipDuplicates
      ? files.filter((f) => !f.duplicate && f.pick !== 'rejected')
      : files.filter((f) => f.pick !== 'rejected');

  const canImport = selectedSource && destination && importFiles.length > 0 && phase === 'ready';
  const totalSize = importFiles.reduce((sum, f) => sum + f.size, 0);

  const activePattern = folderPreset === 'custom'
    ? customPattern
    : FOLDER_PRESETS[folderPreset]?.pattern ?? '{YYYY}-{MM}-{DD}/{filename}';

  const folders = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const f of files) {
      if (!f.dateTaken) continue;
      const date = new Date(f.dateTaken);
      let resolved = resolvePattern(activePattern, date, f.name, f.extension);
      resolved = applyFormat(resolved, saveFormat);
      const slashIdx = resolved.lastIndexOf('/');
      const folder = slashIdx >= 0 ? resolved.slice(0, slashIdx) : '.';
      const fileName = slashIdx >= 0 ? resolved.slice(slashIdx + 1) : resolved;
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(fileName);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [files, activePattern, saveFormat]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-2.5 py-2">
        <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Output</h2>
        {destination && (
          <div className="text-[10px] text-text-muted truncate mt-0.5" title={destination}>
            {destination}
          </div>
        )}
      </div>

      {/* Destination folder */}
      <div className="px-2.5 mb-2.5">
        <button
          onClick={handleChooseDestination}
          className="w-full px-2 py-1 text-xs bg-surface-raised hover:bg-border rounded text-text transition-colors text-left cursor-pointer"
        >
          {destination ? (
            <span className="truncate block" title={destination}>{destination.split('/').pop()}</span>
          ) : (
            'Choose Destination...'
          )}
        </button>
      </div>

      {/* Settings */}
      <div className="px-2.5 mb-2.5">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={handleToggleDuplicates}
          />
          <span className="text-xs text-text">Skip duplicates</span>
        </label>
        <p className="text-[10px] text-text-muted mt-0.5 ml-5">
          Files matching name + size
        </p>
      </div>

      {/* Folder structure */}
      <div className="px-2.5 mb-2.5">
        <h3 className="text-[10px] text-text-secondary mb-1 uppercase tracking-wider">Folder Structure</h3>
        <select
          value={folderPreset}
          onChange={(e) => handleFolderPreset(e.target.value)}
          className="w-full px-1.5 py-1 text-[11px] font-mono bg-surface-raised border border-border rounded text-text focus:border-text focus:outline-none appearance-none cursor-pointer"
        >
          {Object.entries(FOLDER_PRESETS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {folderPreset === 'custom' && (
          <div className="mt-1.5">
            <input
              type="text"
              value={customPattern}
              onChange={(e) => handleCustomPattern(e.target.value)}
              placeholder="{YYYY}-{MM}-{DD}/{filename}"
              className="w-full px-1.5 py-1 text-[11px] font-mono bg-surface-raised border border-border rounded text-text placeholder-text-muted focus:border-text focus:outline-none"
            />
            <p className="text-[9px] text-text-muted mt-0.5">
              {'{YYYY}'} {'{MM}'} {'{DD}'} {'{filename}'} {'{name}'} {'{ext}'}
            </p>
          </div>
        )}
      </div>

      {/* Save format */}
      <div className="px-2.5 mb-2.5">
        <h3 className="text-[10px] text-text-secondary mb-1 uppercase tracking-wider">Save Format</h3>
        <div className="grid grid-cols-2 gap-1">
          {([
            ['original', 'Original'],
            ['jpeg', 'JPEG'],
            ['tiff', 'TIFF'],
            ['heic', 'HEIC'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => handleFormatChange(value)}
              className={`px-1.5 py-1 text-[11px] rounded transition-colors ${
                saveFormat === value
                  ? 'bg-accent text-white'
                  : 'bg-surface-raised text-text-secondary hover:text-text hover:bg-accent/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {saveFormat === 'jpeg' && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-text-secondary">Quality</span>
              <span className="text-[10px] text-text-secondary font-mono">{jpegQuality}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={jpegQuality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full h-1 bg-surface-raised rounded appearance-none cursor-pointer accent-accent"
            />
          </div>
        )}
        {saveFormat !== 'original' && (
          <p className="text-[10px] text-text-muted mt-1">
            Files will be converted via sips
          </p>
        )}
      </div>

      {/* Folder structure preview */}
      {folders.length > 0 && destination && (
        <div className="px-2.5 mb-2.5 flex-1 min-h-0 overflow-y-auto">
          <h3 className="text-[10px] text-text-secondary mb-1 uppercase tracking-wider">Folder Preview</h3>
          <div className="space-y-1.5">
            {folders.map(([folder, fileNames]) => (
              <div key={folder}>
                <div className="text-[10px] text-text-secondary font-mono font-medium">
                  {folder}/
                </div>
                {fileNames.slice(0, 5).map((name) => (
                  <div key={name} className="text-[10px] text-text-muted font-mono pl-2.5 truncate">
                    {name}
                  </div>
                ))}
                {fileNames.length > 5 && (
                  <div className="text-[10px] text-text-muted pl-2.5">
                    +{fileNames.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import summary + button */}
      <div className="mt-auto px-2.5 py-2 border-t border-border">
        {files.length > 0 && (
          <div className="text-[11px] text-text-secondary mb-2">
            {importFiles.length} file{importFiles.length !== 1 ? 's' : ''} &middot; {formatSize(totalSize)}
            {hasPicks && <span className="text-yellow-400/70"> &middot; {pickedCount} picked</span>}
            {skipDuplicates && duplicateCount > 0 && (
              <span className="text-yellow-500/70"> &middot; {duplicateCount} already imported</span>
            )}
          </div>
        )}
        <button
          onClick={startImport}
          disabled={!canImport}
          className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
            canImport
              ? 'bg-accent hover:bg-accent-hover text-white'
              : 'bg-surface-raised text-text-muted cursor-not-allowed'
          }`}
        >
          Import {importFiles.length > 0 ? `${importFiles.length} Files` : ''}
        </button>
      </div>
    </div>
  );
}
