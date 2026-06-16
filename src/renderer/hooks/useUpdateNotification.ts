import { useState, useEffect } from 'react';
import type { UpdateInfo } from '../../shared/types';

export function useUpdateNotification() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = window.electronAPI.onUpdateAvailable((info) => {
      setUpdate(info);
    });
    return () => { unsub(); };
  }, []);

  const dismiss = () => setDismissed(true);
  const install = () => {
    if (update) {
      window.electronAPI.installUpdate();
    }
  };

  return {
    update: dismissed ? null : update,
    dismiss,
    install,
  };
}
