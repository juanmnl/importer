import { app, autoUpdater } from 'electron';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
import type { UpdateInfo } from '../../shared/types';

const REPO = 'juanmnl/importer';

/**
 * Wire up background auto-updates via Squirrel (electron-updater style) using
 * the free update.electronjs.org feed, which serves the latest signed GitHub
 * release. Updates download silently; `onUpdateReady` fires once an update has
 * been downloaded and is ready to install on the next restart.
 *
 * Squirrel auto-update only works for packaged, code-signed builds, so this is
 * a no-op in development.
 */
export function initAutoUpdater(onUpdateReady: (info: UpdateInfo) => void): void {
  if (!app.isPackaged) return;

  updateElectronApp({
    updateSource: { type: UpdateSourceType.ElectronPublicUpdateService, repo: REPO },
    updateInterval: '1 hour',
    notifyUser: false,
  });

  autoUpdater.on('update-downloaded', (_event, _releaseNotes, releaseName) => {
    onUpdateReady({
      currentVersion: app.getVersion(),
      latestVersion: (releaseName ?? '').replace(/^v/, ''),
      releaseName: releaseName ?? '',
    });
  });
}

/** Quit and install a downloaded update. Safe to call only after `update-downloaded`. */
export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
