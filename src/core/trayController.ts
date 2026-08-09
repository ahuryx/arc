import type { UnlistenFn } from '@tauri-apps/api/event';

import { defaultWindowIcon } from '@tauri-apps/api/app';
import { listen } from '@tauri-apps/api/event';
import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';

import { watchSystemTheme } from './theme';
import { APP_STATE_CHANGED_EVENT } from './types';
import { WIDGET_CATALOG } from './widgetCatalog';
import {
  getWorkspaceSnapshot,
  openSettings,
  quitApp,
  runAutoArrange,
  setAutostart,
  setKeepOnTopSetting,
  setLocked,
  syncSystemThemeWindowAppearance,
  syncWindowFlags,
  toggleWidgetVisibility,
} from './workspaceHost';

const TRAY_ID = 'arc-tray';

let trayInstance: TrayIcon | null = null;
let trayMenu: Menu | null = null;
let unlistenState: UnlistenFn | null = null;
let unwatchSystem: (() => void) | null = null;
let initPromise: Promise<void> | null = null;

function trayAction(action: () => Promise<void>): () => void {
  return () => {
    void action().catch((error: unknown) => {
      console.error('[tray] action failed', error);
    });
  };
}

async function buildTrayMenu(): Promise<Menu> {
  const workspace = getWorkspaceSnapshot();

  const widgetItems = WIDGET_CATALOG.map((widget) => ({
    id: `widget-${widget.id}`,
    text: widget.title,
    checked: workspace.widgets[widget.id].visible,
    action: trayAction(async () => {
      await toggleWidgetVisibility(widget.id);
      await refreshTrayMenu();
    }),
  }));

  return Menu.new({
    items: [
      {
        id: 'settings',
        text: 'Settings…',
        action: trayAction(async () => {
          await openSettings();
        }),
      },
      { item: 'Separator' },
      ...widgetItems,
      { item: 'Separator' },
      {
        id: 'lock',
        text: 'Lock widgets',
        checked: workspace.locked,
        action: trayAction(async () => {
          await setLocked(!getWorkspaceSnapshot().locked);
          await refreshTrayMenu();
        }),
      },
      {
        id: 'keep-on-top',
        text: 'Keep on top',
        checked: workspace.keepOnTop,
        action: trayAction(async () => {
          await setKeepOnTopSetting(!getWorkspaceSnapshot().keepOnTop);
          await refreshTrayMenu();
        }),
      },
      {
        id: 'arrange-now',
        text: 'Arrange now',
        action: trayAction(async () => {
          await runAutoArrange();
        }),
      },
      {
        id: 'start-with-os',
        text: 'Launch at startup',
        checked: workspace.startWithWindows,
        action: trayAction(async () => {
          await setAutostart(!getWorkspaceSnapshot().startWithWindows);
          await refreshTrayMenu();
        }),
      },
      { item: 'Separator' },
      {
        id: 'quit',
        text: 'Quit',
        action: trayAction(async () => {
          await quitApp();
        }),
      },
    ],
  });
}

async function refreshTrayMenu(): Promise<void> {
  if (!trayInstance) {
    return;
  }

  trayMenu = await buildTrayMenu();
  await trayInstance.setMenu(trayMenu);
}

async function onStateChanged(): Promise<void> {
  await refreshTrayMenu();
  await syncWindowFlags();
  await syncSystemThemeWindowAppearance();
}

const STATE_SYNC_MS = 150;
let stateSyncTimer: number | undefined;

function scheduleStateSync(): void {
  if (stateSyncTimer != null) window.clearTimeout(stateSyncTimer);
  stateSyncTimer = window.setTimeout(() => {
    stateSyncTimer = undefined;
    void onStateChanged();
  }, STATE_SYNC_MS);
}

export function initTray(): Promise<void> {
  if (trayInstance) {
    return Promise.resolve();
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    // Kill orphans from HMR / prior boots (same id can stack on Windows).
    try {
      await TrayIcon.removeById(TRAY_ID);
    } catch {
      /* none */
    }

    trayMenu = await buildTrayMenu();

    let icon;

    try {
      icon = await defaultWindowIcon();
    } catch (error) {
      console.error('[tray] defaultWindowIcon failed', error);
    }

    if (!icon) {
      throw new Error(
        'Tray icon unavailable: defaultWindowIcon returned null. Check core:app:allow-default-window-icon and bundle icons.',
      );
    }

    trayInstance = await TrayIcon.new({
      id: TRAY_ID,
      menu: trayMenu,
      showMenuOnLeftClick: false,
      tooltip: 'Widget App',
      icon,
    });

    if (unlistenState) {
      unlistenState();
      unlistenState = null;
    }

    await listen(APP_STATE_CHANGED_EVENT, () => {
      scheduleStateSync();
    }).then((nextUnlisten) => {
      unlistenState = nextUnlisten;
    });

    unwatchSystem?.();
    unwatchSystem = watchSystemTheme(() => {
      void syncSystemThemeWindowAppearance();
    });
  })();

  const initialization = initPromise;
  return initialization.finally(() => {
    if (initPromise === initialization) {
      initPromise = null;
    }
  });
}
