import { useEffect, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';
import { FOLDER_PRESETS } from '../../shared/types';

export function useFileScanner() {
  const { selectedSource, destination, files, phase, folderPreset, customPattern } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubBatch = window.electronAPI.onScanBatch((files) => {
      dispatch({ type: 'SCAN_BATCH', files });
    });

    const unsubComplete = window.electronAPI.onScanComplete(() => {
      dispatch({ type: 'SCAN_COMPLETE' });
    });

    const unsubThumb = window.electronAPI.onScanThumbnail((filePath, thumbnail) => {
      dispatch({ type: 'SET_THUMBNAIL', filePath, thumbnail });
    });

    const unsubDuplicate = window.electronAPI.onScanDuplicate((filePath) => {
      dispatch({ type: 'SET_DUPLICATE', filePath });
    });

    return () => {
      unsubBatch();
      unsubComplete();
      unsubThumb();
      unsubDuplicate();
    };
  }, [dispatch]);

  // Check duplicates when destination changes and files are ready
  useEffect(() => {
    if (!destination || files.length === 0 || phase !== 'ready') return;
    dispatch({ type: 'CLEAR_DUPLICATES' });
    window.electronAPI.checkDuplicates(destination);
  }, [destination, phase, dispatch]);

  const startScan = useCallback(async (sourcePath?: string) => {
    const target = sourcePath || selectedSource;
    if (!target) return;

    const pattern = folderPreset === 'custom'
      ? customPattern
      : FOLDER_PRESETS[folderPreset]?.pattern;

    await window.electronAPI.cancelScan();
    dispatch({ type: 'SCAN_START' });
    try {
      await window.electronAPI.scanFiles(target, pattern);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      dispatch({ type: 'SCAN_ERROR', message });
    }
  }, [selectedSource, folderPreset, customPattern, dispatch]);

  const cancelScan = useCallback(async () => {
    await window.electronAPI.cancelScan();
  }, []);

  return { startScan, cancelScan };
}
