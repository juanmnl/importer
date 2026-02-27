import { useAppState, useAppDispatch } from '../context/ImportContext';
import { useFileScanner } from '../hooks/useFileScanner';
import { VolumeItem } from './VolumeItem';

export function SourcePanel() {
  const { volumes, selectedSource } = useAppState();
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Source</h2>
      </div>

      {/* Detected volumes */}
      {volumes.length > 0 && (
        <div className="border-b border-neutral-700">
          <div className="px-3 pb-1">
            <span className="text-[11px] text-neutral-500">Detected Devices</span>
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
      <div className="p-3">
        <button
          onClick={handleChooseFolder}
          className="w-full px-3 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded-md text-neutral-200 transition-colors"
        >
          Choose Folder...
        </button>
      </div>

      {/* Selected source info */}
      {selectedSource && (
        <div className="px-3 mt-auto pb-3">
          <div className="text-[11px] text-neutral-500 truncate" title={selectedSource}>
            {selectedSource}
          </div>
        </div>
      )}
    </div>
  );
}
