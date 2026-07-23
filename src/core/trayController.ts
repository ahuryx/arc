import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { APP_STATE_CHANGED_EVENT } from "./types";
import { WIDGET_CATALOG } from "./widgetCatalog";
import { watchSystemTheme } from "./theme";
import {
  getWorkspaceSnapshot,
  openSettings,
  quitApp,
  runAutoArrange,
  setAutostart,
  setKeepOnTopSetting,
  setLocked,
  syncSystemThemeChrome,
  syncWindowFlags,
  toggleWidgetVisibility,
} from "./workspaceHost";

const TRAY_ID = "widget-app-tray";

let trayInstance: TrayIcon | null = null;
let trayMenu: Menu | null = null;
let unlistenState: UnlistenFn | null = null;
let unwatchSystem: (() => void) | null = null;
let initPromise: Promise<void> | null = null;

async function buildTrayMenu(): Promise<Menu> {
  const workspace = getWorkspaceSnapshot();

  const widgetItems = WIDGET_CATALOG.map((widget) => ({
    id: `widget-${widget.id}`,
    text: widget.title,
    checked: workspace.widgets[widget.id].visible,
    action: async () => {
      await toggleWidgetVisibility(widget.id);
      await refreshTrayMenu();
    },
  }));

  return Menu.new({
    items: [
      {
        id: "settings",
        text: "Settings…",
        action: async () => {
          await openSettings();
        },
      },
      { item: "Separator" },
      ...widgetItems,
      { item: "Separator" },
      {
        id: "lock",
        text: "Lock widgets",
        checked: workspace.locked,
        action: async () => {
          await setLocked(!getWorkspaceSnapshot().locked);
          await refreshTrayMenu();
        },
      },
      {
        id: "keep-on-top",
        text: "Keep on top",
        checked: workspace.keepOnTop,
        action: async () => {
          await setKeepOnTopSetting(!getWorkspaceSnapshot().keepOnTop);
          await refreshTrayMenu();
        },
      },
      {
        id: "arrange-now",
        text: "Arrange now",
        action: async () => {
          await runAutoArrange();
        },
      },
      {
        id: "start-with-os",
        text: "Launch at startup",
        checked: workspace.startWithWindows,
        action: async () => {
          await setAutostart(!getWorkspaceSnapshot().startWithWindows);
          await refreshTrayMenu();
        },
      },
      { item: "Separator" },
      {
        id: "quit",
        text: "Quit",
        action: async () => {
          await quitApp();
        },
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
  await syncSystemThemeChrome();
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

export async function initTray(): Promise<void> {
  if (trayInstance) {
    return;
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
      console.error("[tray] defaultWindowIcon failed", error);
    }

    if (!icon) {
      throw new Error(
        "Tray icon unavailable: defaultWindowIcon returned null. Check core:app:allow-default-window-icon and bundle icons.",
      );
    }

    trayInstance = await TrayIcon.new({
      id: TRAY_ID,
      menu: trayMenu,
      showMenuOnLeftClick: false,
      tooltip: "Widget App",
      icon,
    });

    if (unlistenState) {
      unlistenState();
      unlistenState = null;
    }
    unlistenState = await listen(APP_STATE_CHANGED_EVENT, () => {
      scheduleStateSync();
    });

    unwatchSystem?.();
    unwatchSystem = watchSystemTheme(() => {
      void syncSystemThemeChrome();
    });
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}
