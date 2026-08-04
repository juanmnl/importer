import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';
import { selectImportFiles } from '../utils/importSelection';

export function useImport() {
  const { selectedSource, destination, skipDuplicates, saveFormat, jpegQuality, importMode, files, phase } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsub = window.electronAPI.onImportProgress((progress) => {
      dispatch({ type: 'IMPORT_PROGRESS', progress });
    });
    return () => { unsub(); };
  }, [dispatch]);

  const startImport = useCallback(async () => {
    if (!selectedSource || !destination) return;

    // Cancel any in-progress scan so thumbnail I/O doesn't compete with import
    if (phase === 'scanning') {
      await window.electronAPI.cancelScan();
    }

    dispatch({ type: 'IMPORT_START' });
    try {
      const result = await window.electronAPI.startImport({
        sourcePath: selectedSource,
        destRoot: destination,
        skipDuplicates,
        saveFormat,
        jpegQuality,
        mode: importMode,
        filePaths: selectImportFiles(files, skipDuplicates).map((f) => f.path),
      });
      dispatch({ type: 'IMPORT_COMPLETE', result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed unexpectedly';
      dispatch({
        type: 'IMPORT_COMPLETE',
        result: {
          imported: 0,
          skipped: 0,
          errors: [{ file: 'system', error: message }],
          totalBytes: 0,
          durationMs: 0,
        },
      });
    }
  }, [selectedSource, destination, skipDuplicates, saveFormat, jpegQuality, importMode, files, phase, dispatch]);

  const cancelImport = useCallback(async () => {
    await window.electronAPI.cancelImport();
  }, []);

  return { startImport, cancelImport };
}
