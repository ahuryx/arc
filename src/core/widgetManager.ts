import {
  WebviewWindow,
  getAllWebviewWindows,
} from "@tauri-apps/api/webviewWindow";
import { availableMonitors, currentMonitor } from "@tauri-apps/api/window";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import {
  WIDGET_CATALOG,
  WIDGET_META_BY_ID,
  getWidgetLabel,
} from "./widgetCatalog";
import {
  getWorkspace,
  patchWidgetStateLocal,
  persistCachedState,
  updateWidgetState,
  updateWorkspace,
} from "./settingsStore";
import type { ArrangeSide, WidgetId } from "./types";
import {
  SETTINGS_HEIGHT,
  SETTINGS_LABEL,
  SETTINGS_WIDTH,
  WIDGET_CHROME_HEIGHT,
  WIDGET_WIDTH,
} from "./constants";

/** Opaque window chrome; color follows theme. */
function windowOptions(theme: "dark" | "light" = "dark") {
  return {
    transparent: false,
    decorations: false,
    shadow: true,
    backgroundColor:
      theme === "light"
        ? ([244, 244, 245, 255] as [number, number, number, number])
        : ([14, 14, 16, 255] as [number, number, number, number]),
  };
}

function appUrl(role?: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  if (role) {
    url.searchParams.set("role", role);
  }
  return url.toString();
}

export async function getWidgetWindow(
  id: WidgetId,
): Promise<WebviewWindow | null> {
  return WebviewWindow.getByLabel(getWidgetLabel(id));
}

export async function ensureWindow(id: WidgetId): Promise<WebviewWindow> {
  const widget = WIDGET_META_BY_ID[id];
  const height = widget.height + WIDGET_CHROME_HEIGHT;
  const existing = await WebviewWindow.getByLabel(widget.label);
  if (existing) {
    await existing.setSize(new LogicalSize(WIDGET_WIDTH, height));
    return existing;
  }

  const win = new WebviewWindow(widget.label, {
    url: appUrl(),
    title: widget.title,
    width: WIDGET_WIDTH,
    height,
    resizable: false,
    skipTaskbar: true,
    visible: false,
    alwaysOnTop: getWorkspace().keepOnTop,
    focus: false,
    ...windowOptions(getWorkspace().theme ?? "dark"),
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`Timed out creating window ${widget.label}`));
    }, 10000);

    win.once("tauri://created", () => {
      window.clearTimeout(timeout);
      resolve();
    });
    win.once("tauri://error", (event) => {
      window.clearTimeout(timeout);
      reject(new Error(String(event.payload)));
    });
  });

  return win;
}

export async function ensureAllWindows(): Promise<void> {
  for (const widget of WIDGET_CATALOG) {
    await ensureWindow(widget.id);
  }
}

export async function openSettingsWindow(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(SETTINGS_LABEL);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return;
  }

  const win = new WebviewWindow(SETTINGS_LABEL, {
    url: appUrl("settings"),
    title: "Settings",
    width: SETTINGS_WIDTH,
    height: SETTINGS_HEIGHT,
    resizable: false,
    skipTaskbar: true,
    visible: true,
    alwaysOnTop: true,
    focus: true,
    ...windowOptions(getWorkspace().theme ?? "dark"),
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out creating settings window"));
    }, 10000);

    win.once("tauri://created", () => {
      window.clearTimeout(timeout);
      resolve();
    });
    win.once("tauri://error", (event) => {
      window.clearTimeout(timeout);
      reject(new Error(String(event.payload)));
    });
  });
}

export async function setVisible(
  id: WidgetId,
  visible: boolean,
  opts: { focus?: boolean } = {},
): Promise<void> {
  const previous = getWorkspace().widgets[id].visible;
  await updateWidgetState(id, { visible });

  try {
    const win = await ensureWindow(id);
    if (visible) {
      const workspace = getWorkspace();
      const state = workspace.widgets[id];
      if (!workspace.autoArrange) {
        await win.setPosition(new PhysicalPosition(state.x, state.y));
      }
      await win.show();
      if (opts.focus !== false && !workspace.autoArrange) {
        await win.setFocus();
      }
    } else {
      await win.hide();
    }

    if (getWorkspace().autoArrange) {
      await arrangeVisible();
    }
  } catch (error) {
    await updateWidgetState(id, { visible: previous });
    throw error;
  }
}

export async function applyVisibilityFromSettings(): Promise<void> {
  const workspace = getWorkspace();
  for (const widget of WIDGET_CATALOG) {
    const win = await ensureWindow(widget.id);
    const state = workspace.widgets[widget.id];
    if (state.visible) {
      if (!workspace.autoArrange) {
        await win.setPosition(new PhysicalPosition(state.x, state.y));
      }
      await win.show();
    } else {
      await win.hide();
    }
  }

  if (workspace.autoArrange) {
    await arrangeVisible();
  }
}

export async function setKeepOnTop(enabled: boolean): Promise<void> {
  const windows = await getAllWebviewWindows();
  for (const win of windows) {
    if (win.label.startsWith("widget-") || win.label === SETTINGS_LABEL) {
      await win.setAlwaysOnTop(enabled || win.label === SETTINGS_LABEL);
    }
  }
}

/** Hot path during drag — memory only, no disk / no event storm. */
export function noteWindowPosition(id: WidgetId, x: number, y: number): void {
  patchWidgetStateLocal(id, { x, y });
}

/** Flush drag position after debounce. */
export async function flushWindowPosition(): Promise<void> {
  await persistCachedState();
}

export async function setWidgetSide(
  id: WidgetId,
  side: ArrangeSide,
): Promise<void> {
  await updateWidgetState(id, { side });
  if (getWorkspace().autoArrange) {
    await arrangeVisible();
  }
}

/** Stack visible widgets into left/right columns. */
export async function arrangeVisible(): Promise<void> {
  const workspace = getWorkspace();
  const monitors = await availableMonitors();
  const monitor = (await currentMonitor()) ?? monitors[0] ?? null;

  if (!monitor) {
    return;
  }

  const workArea = monitor.workArea;
  const margin = workspace.edgeGap;
  const gap = workspace.widgetGap;
  const maxY = workArea.position.y + workArea.size.height - margin;
  const nextWidgets = { ...workspace.widgets };

  async function stack(side: ArrangeSide): Promise<void> {
    const baseX =
      side === "left"
        ? workArea.position.x + margin
        : workArea.position.x + workArea.size.width - WIDGET_WIDTH - margin;

    let y = workArea.position.y + margin;
    let col = 0;
    const colWidth = WIDGET_WIDTH + gap;

    for (const widget of WIDGET_CATALOG) {
      const state = workspace.widgets[widget.id];
      if (!state.visible || state.side !== side) {
        continue;
      }

      const height = widget.height + WIDGET_CHROME_HEIGHT;
      if (y + height > maxY && y > workArea.position.y + margin) {
        col += 1;
        y = workArea.position.y + margin;
      }

      const posX =
        side === "left" ? baseX + col * colWidth : baseX - col * colWidth;

      const win = await ensureWindow(widget.id);
      await win.setPosition(new PhysicalPosition(posX, y));
      nextWidgets[widget.id] = { ...state, x: posX, y };
      y += height + gap;
    }
  }

  await stack("left");
  await stack("right");
  await updateWorkspace({ widgets: nextWidgets });
}

export async function applyWindowFlags(): Promise<void> {
  const workspace = getWorkspace();
  await setKeepOnTop(workspace.keepOnTop);
}
