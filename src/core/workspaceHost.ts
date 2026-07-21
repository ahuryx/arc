import { exit } from "@tauri-apps/plugin-process";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import type {
  ArrangeSide,
  CalendarMode,
  NotesData,
  ThemeId,
  WidgetId,
} from "./types";
import {
  getWorkspace,
  updateWidgetData,
  updateWorkspace,
} from "./settingsStore";
import {
  arrangeVisible,
  openSettingsWindow,
  setKeepOnTop,
  setVisible,
  setWidgetSide as managerSetWidgetSide,
} from "./widgetManager";

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

export async function setAutoArrange(enabled: boolean): Promise<void> {
  await updateWorkspace({ autoArrange: enabled });
  if (enabled) {
    await arrangeVisible();
  }
}

export async function setArrangeSide(side: ArrangeSide): Promise<void> {
  await updateWorkspace({ arrangeSide: side });
}

export async function setArrangeGaps(
  edgeGap: number,
  widgetGap: number,
): Promise<void> {
  await updateWorkspace({
    edgeGap: Math.max(0, Math.min(80, edgeGap)),
    widgetGap: Math.max(0, Math.min(48, widgetGap)),
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
      work: Math.max(1, Math.min(120, durations.work)),
      short: Math.max(1, Math.min(60, durations.short)),
      long: Math.max(1, Math.min(60, durations.long)),
    },
  });
}

export async function setCalendarMode(mode: CalendarMode): Promise<void> {
  await updateWidgetData({ calendar: { mode } });
}

export async function setTheme(theme: ThemeId): Promise<void> {
  await updateWorkspace({ theme });
}

export async function updateNotesData(notes: NotesData): Promise<void> {
  await updateWidgetData({ notes });
}

export async function openSettings(): Promise<void> {
  await openSettingsWindow();
}

export async function quitApp(): Promise<void> {
  await exit(0);
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

    await updateWorkspace({
      initialized: true,
      hostRecoveryV1: true,
      autoArrange: true,
      widgets: {
        ...workspace.widgets,
        clock: { ...workspace.widgets.clock, visible: true, side: "left" },
      },
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
}
