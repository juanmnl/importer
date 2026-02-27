import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';

export function useFileScanner() {
  const { selectedSource } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubBatch = window.electronAPI.onScanBatch((files) => {
      dispatch({ type: 'SCAN_BATCH', files });
    });

    const unsubComplete = window.electronAPI.onScanComplete(() => {
      dispatch({ type: 'SCAN_COMPLETE' });
    });

    return () => {
      unsubBatch();
      unsubComplete();
    };
  }, [dispatch]);

  const startScan = useCallback(async (sourcePath?: string) => {
    const target = sourcePath || selectedSource;
    if (!target) return;

    dispatch({ type: 'SCAN_START' });
    await window.electronAPI.scanFiles(target);
  }, [selectedSource, dispatch]);

  const cancelScan = useCallback(async () => {
    await window.electronAPI.cancelScan();
  }, []);

  return { startScan, cancelScan };
}
