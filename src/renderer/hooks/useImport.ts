import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';

export function useImport() {
  const { selectedSource, destination, skipDuplicates } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsub = window.electronAPI.onImportProgress((progress) => {
      dispatch({ type: 'IMPORT_PROGRESS', progress });
    });
    return () => { unsub(); };
  }, [dispatch]);

  const startImport = useCallback(async () => {
    if (!selectedSource || !destination) return;

    dispatch({ type: 'IMPORT_START' });
    const result = await window.electronAPI.startImport({
      sourcePath: selectedSource,
      destRoot: destination,
      skipDuplicates,
    });
    dispatch({ type: 'IMPORT_COMPLETE', result });
  }, [selectedSource, destination, skipDuplicates, dispatch]);

  const cancelImport = useCallback(async () => {
    await window.electronAPI.cancelImport();
  }, []);

  return { startImport, cancelImport };
}
