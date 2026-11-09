import type { Update } from '@tauri-apps/plugin-updater';

import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

export type { Update };

/** Newer release from the updater feed, or null when already up to date. */
export function checkForUpdate(): Promise<Update | null> {
  return check();
}

/**
 * Download, verify and install. `onProgress` gets 0–1, or null when the size
 * is unknown. On Windows the installer quits the app, so relaunch may not run.
 */
export async function installUpdate(
  update: Update,
  onProgress: (fraction: number | null) => void,
): Promise<void> {
  let total = 0;
  let received = 0;

  await update.downloadAndInstall((event) => {
    if (event.event === 'Started') {
      total = event.data.contentLength ?? 0;
    } else if (event.event === 'Progress') {
      received += event.data.chunkLength;
      onProgress(total > 0 ? Math.min(received / total, 1) : null);
    }
  });

  await relaunch();
}
