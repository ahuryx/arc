import { exit } from "@tauri-apps/plugin-process";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { WIDGET_CATALOG } from "./widgetCatalog";
import type {
  ArrangeSide,
  CalendarMode,
  NotesData,
  ThemeId,
  TimeFormat,
  WidgetId,
  WorkspaceSettings,
} from "./types";
import {
  getWidgetData,
  getWorkspace,
  updateWidgetData,
  updateWorkspace,
} from "./settingsStore";
import {
  applyThemeChrome,
  applyVisibilityFromSettings,
  applyWindowFlags,
  arrangeVisible,
  ensureAllWindows,
  flushWindowPosition,
  noteWindowPosition,
  openSettingsWindow,
  setKeepOnTop,
  setVisible,
  setWidgetSide as managerSetWidgetSide,
} from "./widgetManager";
import { clamp } from "@/lib/utils";
import { SETTINGS_LABEL } from "./constants";
import { resolveTheme } from "./theme";

/** Read-only workspace snapshot for tray / UI. */
export function getWorkspaceSnapshot(): WorkspaceSettings {
  return getWorkspace();
}

export async function setWidgetVisibility(
  id: WidgetId,
  visible: boolean,
): Promise<void> {
  await setVisible(id, visible);
}

export async function toggleWidgetVisibility(id: WidgetId): Promise<void> {
  const workspace = getWorkspace();
  await setVisible(id, !workspace.widgets[id].visible);
}

export async function setWidgetSide(
  id: WidgetId,
  side: ArrangeSide,
): Promise<void> {
  await managerSetWidgetSide(id, side);
}

export async function setLocked(locked: boolean): Promise<void> {
  await updateWorkspace({ locked });
}

export async function setKeepOnTopSetting(enabled: boolean): Promise<void> {
  await updateWorkspace({ keepOnTop: enabled });
  await setKeepOnTop(enabled);
}

export async function syncWindowFlags(): Promise<void> {
  await applyWindowFlags();
}

export async function setAutoArrange(enabled: boolean): Promise<void> {
  await updateWorkspace({ autoArrange: enabled });
  if (enabled) {
    await arrangeVisible();
  }
}

export async function setArrangeGaps(
  edgeGap: number,
  widgetGap: number,
): Promise<void> {
  await updateWorkspace({
    edgeGap: clamp(edgeGap, 0, 80),
    widgetGap: clamp(widgetGap, 0, 48),
  });
  if (getWorkspace().autoArrange) {
    await arrangeVisible();
  }
}

export async function runAutoArrange(): Promise<void> {
  await arrangeVisible();
}

export async function setAutostart(enabled: boolean): Promise<void> {
  const previous = getWorkspace().startWithWindows;
  await updateWorkspace({ startWithWindows: enabled });

  try {
    if (enabled) {
      await enableAutostart();
    } else {
      await disableAutostart();
    }
  } catch (error) {
    await updateWorkspace({ startWithWindows: previous });
    throw error;
  }
}

export async function setWeatherCity(city: string): Promise<void> {
  const trimmed = city.trim();
  if (!trimmed) return;
  await updateWidgetData({ weather: { city: trimmed } });
}

export async function setPomodoroDurations(durations: {
  work: number;
  short: number;
  long: number;
}): Promise<void> {
  await updateWidgetData({
    pomodoro: {
      work: clamp(durations.work, 1, 120),
      short: clamp(durations.short, 1, 60),
      long: clamp(durations.long, 1, 60),
    },
  });
}

export async function setCalendarMode(mode: CalendarMode): Promise<void> {
  await updateWidgetData({ calendar: { mode } });
}

export async function setTimeFormat(timeFormat: TimeFormat): Promise<void> {
  await updateWidgetData({ clock: { timeFormat } });
}

export async function setTheme(theme: ThemeId): Promise<void> {
  await updateWorkspace({ theme });
  await applyThemeChrome(resolveTheme(theme));
}

/** When preference is `system`, refresh native chrome to match OS. */
export async function syncSystemThemeChrome(): Promise<void> {
  if (getWorkspace().theme !== "system") return;
  await applyThemeChrome(resolveTheme("system"));
}

export async function updateNotesData(notes: NotesData): Promise<void> {
  await updateWidgetData({ notes });
}

/** Patch one tab body from latest store — avoids stale-closure races. */
export async function updateNoteTabBody(
  tabId: string,
  body: string,
): Promise<void> {
  const notes = getWidgetData().notes;
  await updateWidgetData({
    notes: {
      ...notes,
      tabs: notes.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, body } : tab,
      ),
    },
  });
}

export function noteWidgetPosition(
  id: WidgetId,
  x: number,
  y: number,
): void {
  noteWindowPosition(id, x, y);
}

export async function flushWidgetPosition(): Promise<void> {
  await flushWindowPosition();
}

export async function openSettings(): Promise<void> {
  await openSettingsWindow();
}

export async function closeSettings(): Promise<void> {
  const win = getCurrentWebviewWindow();
  if (win.label === SETTINGS_LABEL) {
    await win.hide();
  }
}

export async function quitApp(): Promise<void> {
  await exit(0);
}

/** Ensure windows + visibility + flags match persisted workspace. */
export async function syncWindowsFromWorkspace(): Promise<void> {
  await ensureAllWindows();
  await applyVisibilityFromSettings();
  await applyWindowFlags();
}

export async function applyFirstRunDefaults(): Promise<void> {
  const workspace = getWorkspace();

  if (!workspace.initialized) {
    if (workspace.startWithWindows) {
      try {
        await enableAutostart();
      } catch (error) {
        console.error("[host] enableAutostart failed", error);
      }
    }

    const widgets = { ...workspace.widgets };
    for (const meta of WIDGET_CATALOG) {
      widgets[meta.id] = {
        ...widgets[meta.id],
        visible: true,
        side: meta.defaultSide,
      };
    }

    await updateWorkspace({
      initialized: true,
      hostRecoveryV1: true,
      sideLayoutV1: true,
      autoArrange: true,
      locked: true,
      keepOnTop: false,
      startWithWindows: workspace.startWithWindows !== false,
      theme: workspace.theme ?? "system",
      widgets,
    });
    return;
  }

  if (!workspace.hostRecoveryV1) {
    const anyVisible = Object.values(workspace.widgets).some((w) => w.visible);
    if (!anyVisible) {
      await updateWorkspace({
        hostRecoveryV1: true,
        widgets: {
          ...workspace.widgets,
          clock: { ...workspace.widgets.clock, visible: true },
        },
      });
    } else {
      await updateWorkspace({ hostRecoveryV1: true });
    }
  }

  if (!getWorkspace().sideLayoutV1) {
    const current = getWorkspace();
    const widgets = { ...current.widgets };
    for (const meta of WIDGET_CATALOG) {
      widgets[meta.id] = {
        ...widgets[meta.id],
        side: meta.defaultSide,
      };
    }
    await updateWorkspace({ widgets, sideLayoutV1: true });
  }
}

/** Controller boot after store load: first-run → windows. */
export async function bootWorkspace(): Promise<void> {
  await applyFirstRunDefaults();
  await syncWindowsFromWorkspace();
}
