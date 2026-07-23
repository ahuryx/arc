import {
  WebviewWindow,
  getAllWebviewWindows,
} from "@tauri-apps/api/webviewWindow";
import { availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
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
import { resolveTheme, type ResolvedTheme } from "./theme";
import {
  SETTINGS_HEIGHT,
  SETTINGS_LABEL,
  SETTINGS_WIDTH,
  WIDGET_CHROME_HEIGHT,
  WIDGET_WIDTH,
} from "./constants";

const WINDOW_CREATE_TIMEOUT_MS = 10_000;

const CHROME_RGB: Record<ResolvedTheme, [number, number, number, number]> = {
  light: [244, 244, 245, 255],
  dark: [14, 14, 16, 255],
};

/** Opaque window chrome; color follows resolved theme. */
function windowOptions(theme: ResolvedTheme = "dark") {
  return {
    transparent: false,
    decorations: false,
    shadow: true,
    backgroundColor: CHROME_RGB[theme],
  };
}

function currentChromeTheme(): ResolvedTheme {
  return resolveTheme(getWorkspace().theme);
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

function waitForWebviewCreated(
  win: WebviewWindow,
  label: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`Timed out creating window ${label}`));
    }, WINDOW_CREATE_TIMEOUT_MS);

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
    ...windowOptions(currentChromeTheme()),
  });

  await waitForWebviewCreated(win, widget.label);
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
    ...windowOptions(currentChromeTheme()),
  });

  await waitForWebviewCreated(win, SETTINGS_LABEL);
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

/** Update native chrome color on existing windows after theme change. */
export async function applyThemeChrome(theme: ResolvedTheme): Promise<void> {
  const color = CHROME_RGB[theme];
  const windows = await getAllWebviewWindows();
  for (const win of windows) {
    if (win.label.startsWith("widget-") || win.label === SETTINGS_LABEL) {
      try {
        await win.setBackgroundColor(color);
      } catch (error) {
        console.error("[manager] setBackgroundColor failed", win.label, error);
      }
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
  // Controller/settings webviews may not sit on the user's display — prefer primary.
  const monitor = (await primaryMonitor()) ?? monitors[0] ?? null;

  if (!monitor) {
    return;
  }

  const scale = monitor.scaleFactor || 1;
  const workArea = monitor.workArea;
  // Gaps/sizes are logical CSS px; workArea + setPosition use physical px.
  const margin = workspace.edgeGap * scale;
  const gap = workspace.widgetGap * scale;
  const widgetWidth = WIDGET_WIDTH * scale;
  const maxY = workArea.position.y + workArea.size.height - margin;
  const nextWidgets = { ...workspace.widgets };

  async function stack(side: ArrangeSide): Promise<void> {
    const baseX =
      side === "left"
        ? workArea.position.x + margin
        : workArea.position.x + workArea.size.width - widgetWidth - margin;

    let y = workArea.position.y + margin;
    let col = 0;
    const colWidth = widgetWidth + gap;

    for (const widget of WIDGET_CATALOG) {
      const state = workspace.widgets[widget.id];
      if (!state.visible || state.side !== side) {
        continue;
      }

      const height = (widget.height + WIDGET_CHROME_HEIGHT) * scale;
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
  await setKeepOnTop(getWorkspace().keepOnTop);
}
