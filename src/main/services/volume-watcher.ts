import { execFile } from 'node:child_process';
import { watch, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Volume } from '../../shared/types';

const execFileAsync = promisify(execFile);

const VOLUMES_DIR = '/Volumes';
const DEBOUNCE_MS = 500;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let watcher: ReturnType<typeof watch> | null = null;
let changeCallback: ((volumes: Volume[]) => void) | null = null;

async function getVolumeInfo(volumePath: string): Promise<Volume | null> {
  try {
    const { stdout } = await execFileAsync('diskutil', ['info', '-plist', volumePath]);
    const isRemovable = stdout.includes('<key>Removable</key>\n\t<true/>') ||
      stdout.includes('<key>RemovableMedia</key>\n\t<true/>');
    const isExternal = stdout.includes('<key>Internal</key>\n\t<false/>');
    const isNetwork = stdout.includes('<key>Network</key>\n\t<true/>');

    if (isNetwork) return null;

    let totalSize: number | undefined;
    let freeSpace: number | undefined;
    const totalMatch = stdout.match(/<key>TotalSize<\/key>\s*<integer>(\d+)<\/integer>/);
    const freeMatch = stdout.match(/<key>ContainerFree<\/key>\s*<integer>(\d+)<\/integer>/) ||
      stdout.match(/<key>APFSContainerFree<\/key>\s*<integer>(\d+)<\/integer>/) ||
      stdout.match(/<key>FreeSpace<\/key>\s*<integer>(\d+)<\/integer>/);

    if (totalMatch) totalSize = parseInt(totalMatch[1], 10);
    if (freeMatch) freeSpace = parseInt(freeMatch[1], 10);

    return {
      name: path.basename(volumePath),
      path: volumePath,
      isRemovable,
      isExternal,
      totalSize,
      freeSpace,
    };
  } catch {
    return null;
  }
}

export async function listVolumes(): Promise<Volume[]> {
  if (!existsSync(VOLUMES_DIR)) return [];

  const entries = await readdir(VOLUMES_DIR);
  const volumes: Volume[] = [];

  for (const entry of entries) {
    if (entry === 'Macintosh HD' || entry === 'Macintosh HD - Data') continue;
    const volumePath = path.join(VOLUMES_DIR, entry);
    const info = await getVolumeInfo(volumePath);
    if (info && (info.isExternal || info.isRemovable)) {
      volumes.push(info);
    }
  }

  return volumes;
}

export function startWatching(onChange: (volumes: Volume[]) => void): void {
  changeCallback = onChange;

  if (!existsSync(VOLUMES_DIR)) return;

  watcher = watch(VOLUMES_DIR, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const volumes = await listVolumes();
      changeCallback?.(volumes);
    }, DEBOUNCE_MS);
  });
}

export function stopWatching(): void {
  watcher?.close();
  watcher = null;
  if (debounceTimer) clearTimeout(debounceTimer);
  changeCallback = null;
}
