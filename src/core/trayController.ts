import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { getWorkspace } from "./settingsStore";
import { APP_STATE_CHANGED_EVENT } from "./types";
import { WIDGET_CATALOG } from "./widgetCatalog";
import {
  openSettings,
  quitApp,
  runAutoArrange,
  setAutostart,
  setKeepOnTopSetting,
  setLocked,
  toggleWidgetVisibility,
} from "./workspaceHost";
import { applyWindowFlags } from "./widgetManager";

let trayInstance: TrayIcon | null = null;
let trayMenu: Menu | null = null;

async function buildTrayMenu(): Promise<Menu> {
  const workspace = getWorkspace();

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
          await setLocked(!getWorkspace().locked);
          await refreshTrayMenu();
        },
      },
      {
        id: "keep-on-top",
        text: "Keep on top",
        checked: workspace.keepOnTop,
        action: async () => {
          await setKeepOnTopSetting(!getWorkspace().keepOnTop);
          await refreshTrayMenu();
        },
      },
      {
        id: "auto-arrange",
        text: "Auto-arrange",
        action: async () => {
          await runAutoArrange();
        },
      },
      {
        id: "start-with-windows",
        text: "Start with Windows",
        checked: workspace.startWithWindows,
        action: async () => {
          await setAutostart(!getWorkspace().startWithWindows);
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

export async function initTray(): Promise<void> {
  if (trayInstance) {
    return;
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
    id: "widget-app-tray",
    menu: trayMenu,
    showMenuOnLeftClick: false,
    tooltip: "Widget App",
    icon,
  });

  await listen(APP_STATE_CHANGED_EVENT, async () => {
    await refreshTrayMenu();
    await applyWindowFlags();
  });
}
