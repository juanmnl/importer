import { useAppState } from '../context/ImportContext';
import { useImport } from '../hooks/useImport';

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export function ImportProgress() {
  const { phase, importProgress } = useAppState();
  const { cancelImport } = useImport();

  if (phase !== 'importing' || !importProgress) return null;

  const percent = importProgress.totalFiles > 0
    ? Math.round((importProgress.currentIndex / importProgress.totalFiles) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-medium text-neutral-100 mb-6">Importing Photos</h2>

        {/* Progress bar */}
        <div className="h-2 bg-neutral-700 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Stats */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Progress</span>
            <span className="text-neutral-200 font-mono">
              {importProgress.currentIndex} / {importProgress.totalFiles}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Transferred</span>
            <span className="text-neutral-200 font-mono">
              {formatSize(importProgress.bytesTransferred)} / {formatSize(importProgress.totalBytes)}
            </span>
          </div>
          {importProgress.skipped > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Skipped</span>
              <span className="text-yellow-400 font-mono">{importProgress.skipped}</span>
            </div>
          )}
          {importProgress.errors > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Errors</span>
              <span className="text-red-400 font-mono">{importProgress.errors}</span>
            </div>
          )}
        </div>

        {/* Current file */}
        <div className="text-xs text-neutral-500 truncate mb-6" title={importProgress.currentFile}>
          {importProgress.currentFile}
        </div>

        {/* Cancel button */}
        <button
          onClick={cancelImport}
          className="w-full py-2 rounded-md text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
