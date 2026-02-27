import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';

export function useFileScanner() {
  const { selectedSource } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubBatch = window.electronAPI.onScanBatch((files) => {
      console.log('[renderer] scan:batch received', files.length, 'files');
      dispatch({ type: 'SCAN_BATCH', files });
    });

    const unsubComplete = window.electronAPI.onScanComplete((total) => {
      console.log('[renderer] scan:complete', total);
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

    console.log('[renderer] starting scan:', target);
    dispatch({ type: 'SCAN_START' });
    try {
      await window.electronAPI.scanFiles(target);
      console.log('[renderer] scanFiles invoke resolved');
    } catch (err) {
      console.error('[renderer] scanFiles error:', err);
    }
  }, [selectedSource, dispatch]);

  const cancelScan = useCallback(async () => {
    await window.electronAPI.cancelScan();
  }, []);

  return { startScan, cancelScan };
}
