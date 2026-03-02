import { useEffect } from 'react';
import { useAppDispatch } from '../context/ImportContext';

export function useSettings() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    window.electronAPI.getSettings().then((settings) => {
      if (settings.lastDestination) {
        dispatch({ type: 'SET_DESTINATION', path: settings.lastDestination });
      }
      dispatch({ type: 'SET_SKIP_DUPLICATES', value: settings.skipDuplicates });
      if (settings.saveFormat) {
        dispatch({ type: 'SET_SAVE_FORMAT', format: settings.saveFormat });
      }
      if (typeof settings.jpegQuality === 'number') {
        dispatch({ type: 'SET_JPEG_QUALITY', quality: settings.jpegQuality });
      }
      if (settings.folderPreset) {
        dispatch({ type: 'SET_FOLDER_PRESET', preset: settings.folderPreset });
      }
      if (settings.customPattern) {
        dispatch({ type: 'SET_CUSTOM_PATTERN', pattern: settings.customPattern });
      }
      if (settings.theme) {
        dispatch({ type: 'SET_THEME', theme: settings.theme });
      }
    });
  }, [dispatch]);
}
