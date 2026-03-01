import { useAppState, useAppDispatch } from '../context/ImportContext';
import { useFileScanner } from '../hooks/useFileScanner';
import { VolumeItem } from './VolumeItem';

function formatSize(bytes: number): string {
  const gb = bytes / 1e9;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(0)} MB`;
}

export function SourcePanel() {
  const { volumes, selectedSource, files, phase } = useAppState();
  const dispatch = useAppDispatch();
  const { startScan } = useFileScanner();

  const handleSelectVolume = (volumePath: string) => {
    dispatch({ type: 'SELECT_SOURCE', path: volumePath });
    startScan(volumePath);
  };

  const handleChooseFolder = async () => {
    const folder = await window.electronAPI.selectFolder('Select Source Folder');
    if (folder) {
      dispatch({ type: 'SELECT_SOURCE', path: folder });
      startScan(folder);
    }
  };

  const photoCount = files.filter((f) => f.type === 'photo').length;
  const videoCount = files.filter((f) => f.type === 'video').length;
  const pickedCount = files.filter((f) => f.pick === 'selected').length;
  const rejectedCount = files.filter((f) => f.pick === 'rejected').length;
  const duplicateCount = files.filter((f) => f.duplicate).length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-2.5 py-2">
        <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Source</h2>
      </div>

      {/* Detected volumes */}
      {volumes.length > 0 && (
        <div className="border-b border-border">
          <div className="px-2.5 pb-0.5">
            <span className="text-[10px] text-text-secondary">Detected Devices</span>
          </div>
          {volumes.map((volume) => (
            <VolumeItem
              key={volume.path}
              volume={volume}
              isSelected={selectedSource === volume.path}
              onSelect={handleSelectVolume}
            />
          ))}
        </div>
      )}

      {/* Choose folder button */}
      <div className="px-2.5 py-1.5">
        <button
          onClick={handleChooseFolder}
          className="text-xs text-text-secondary hover:text-text transition-colors"
        >
          Choose Folder...
        </button>
      </div>

      {/* Selected source */}
      {selectedSource && (
        <div className="px-2.5 pt-1 pb-2 border-b border-border">
          <div className="text-[10px] text-text-muted truncate" title={selectedSource}>
            {selectedSource}
          </div>
        </div>
      )}

      {/* File stats */}
      {files.length > 0 && (
        <div className="px-2.5 py-2 space-y-1.5">
          <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Library</h3>
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">Photos</span>
              <span className="text-text font-mono">{photoCount}</span>
            </div>
            {videoCount > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Videos</span>
                <span className="text-text font-mono">{videoCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Total size</span>
              <span className="text-text font-mono">{formatSize(totalSize)}</span>
            </div>
          </div>

          {(pickedCount > 0 || rejectedCount > 0 || duplicateCount > 0) && (
            <div className="pt-1.5 border-t border-border space-y-0.5 text-[11px]">
              {pickedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Selected</span>
                  <span className="text-yellow-400 font-mono">{pickedCount}</span>
                </div>
              )}
              {rejectedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Rejected</span>
                  <span className="text-red-400 font-mono">{rejectedCount}</span>
                </div>
              )}
              {duplicateCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Duplicates</span>
                  <span className="text-text-muted font-mono">{duplicateCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scanning indicator */}
      {phase === 'scanning' && (
        <div className="px-2.5 py-2 flex items-center gap-1.5">
          <div className="w-3 h-3 border-[1.5px] border-text-muted border-t-text rounded-full animate-spin" />
          <span className="text-[10px] text-text-muted">Scanning...</span>
        </div>
      )}

      {/* Keyboard shortcuts */}
      {files.length > 0 && (
        <div className="mt-auto px-2.5 py-2 border-t border-border">
          <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Shortcuts</h3>
          <div className="space-y-0.5 text-[10px] text-text-muted">
            <div className="flex justify-between">
              <span>Click</span>
              <span className="text-text-secondary">Focus</span>
            </div>
            <div className="flex justify-between">
              <span>Double-click</span>
              <span className="text-text-secondary">Detail view</span>
            </div>
            <div className="flex justify-between">
              <span>&#8984;+Click</span>
              <span className="text-text-secondary">Toggle select</span>
            </div>
            <div className="flex justify-between">
              <span>Shift+Click</span>
              <span className="text-text-secondary">Range select</span>
            </div>
            <div className="flex justify-between">
              <span>&#8984;+A</span>
              <span className="text-text-secondary">Select all</span>
            </div>
            <div className="flex justify-between">
              <span>P / X / U</span>
              <span className="text-text-secondary">Pick / Reject / Clear</span>
            </div>
            <div className="flex justify-between">
              <span>Arrows</span>
              <span className="text-text-secondary">Navigate</span>
            </div>
            <div className="flex justify-between">
              <span>Esc</span>
              <span className="text-text-secondary">Deselect / Back</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
