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
    });
  }, [dispatch]);
}
