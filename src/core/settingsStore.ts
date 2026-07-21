import { LazyStore } from "@tauri-apps/plugin-store";
import { emit } from "@tauri-apps/api/event";
import { WIDGET_CATALOG } from "./widgetCatalog";
import type {
  AppState,
  NotesData,
  WidgetData,
  WidgetId,
  WidgetState,
  WorkspaceSettings,
} from "./types";
import { APP_STATE_CHANGED_EVENT } from "./types";
import { ARRANGE_GAP, ARRANGE_MARGIN, STORE_PATH } from "./constants";

function createDefaultWidgets(): WorkspaceSettings["widgets"] {
  return Object.fromEntries(
    WIDGET_CATALOG.map((widget, index) => [
      widget.id,
      {
        visible: false,
        x: 100,
        y: 100 + index * (widget.height + 12),
        side: "left" as const,
      },
    ]),
  ) as WorkspaceSettings["widgets"];
}

function defaultNotes(): NotesData {
  const id = "tab-1";
  return { tabs: [{ id, body: "" }], active: id };
}

export const DEFAULT_WORKSPACE: WorkspaceSettings = {
  widgets: createDefaultWidgets(),
  locked: false,
  keepOnTop: true,
  arrangeSide: "left",
  autoArrange: true,
  edgeGap: ARRANGE_MARGIN,
  widgetGap: ARRANGE_GAP,
  startWithWindows: true,
  initialized: false,
  theme: "dark",
};

export const DEFAULT_WIDGET_DATA: WidgetData = {
  notes: defaultNotes(),
  weather: { city: "Tehran" },
  calendar: { mode: "gregorian" },
  pomodoro: { work: 25, short: 5, long: 15 },
};

export const DEFAULT_STATE: AppState = {
  workspace: DEFAULT_WORKSPACE,
  data: DEFAULT_WIDGET_DATA,
};

const store = new LazyStore(STORE_PATH, {
  defaults: { app: DEFAULT_STATE },
});

let cached: AppState = structuredClone(DEFAULT_STATE);

function mergeWidgets(
  stored: Partial<Record<WidgetId, WidgetState>> | undefined,
): WorkspaceSettings["widgets"] {
  const widgets = createDefaultWidgets();
  for (const meta of WIDGET_CATALOG) {
    const previous = stored?.[meta.id];
    if (previous) {
      widgets[meta.id] = {
        visible: Boolean(previous.visible),
        x: typeof previous.x === "number" ? previous.x : widgets[meta.id].x,
        y: typeof previous.y === "number" ? previous.y : widgets[meta.id].y,
        side: previous.side === "right" ? "right" : "left",
      };
    }
  }
  return widgets;
}

function migrateNotes(raw: unknown): NotesData {
  if (typeof raw === "string") {
    const notes = defaultNotes();
    notes.tabs[0].body = raw;
    return notes;
  }
  if (raw && typeof raw === "object") {
    const obj = raw as NotesData;
    if (Array.isArray(obj.tabs) && obj.tabs.length > 0) {
      return {
        tabs: obj.tabs.map((tab, index) => ({
          id: tab.id || `tab-${index + 1}`,
          body: typeof tab.body === "string" ? tab.body : "",
        })),
        active: obj.active || obj.tabs[0].id || "tab-1",
      };
    }
  }
  return defaultNotes();
}

/** Accepts new AppState or legacy flat AppSettings. */
function migrateStored(raw: unknown): AppState {
  const defaults: AppState = {
    workspace: {
      ...DEFAULT_WORKSPACE,
      widgets: createDefaultWidgets(),
    },
    data: {
      ...DEFAULT_WIDGET_DATA,
      notes: defaultNotes(),
      weather: { ...DEFAULT_WIDGET_DATA.weather },
      calendar: { ...DEFAULT_WIDGET_DATA.calendar },
      pomodoro: { ...DEFAULT_WIDGET_DATA.pomodoro },
    },
  };

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  // New shape
  if (obj.workspace && obj.data) {
    const workspace = obj.workspace as Partial<WorkspaceSettings>;
    const data = obj.data as Partial<WidgetData>;
    return {
      workspace: {
        ...defaults.workspace,
        ...workspace,
        widgets: mergeWidgets(workspace.widgets),
        autoArrange:
          typeof workspace.autoArrange === "boolean"
            ? workspace.autoArrange
            : defaults.workspace.autoArrange,
        edgeGap:
          typeof workspace.edgeGap === "number"
            ? workspace.edgeGap
            : defaults.workspace.edgeGap,
        widgetGap:
          typeof workspace.widgetGap === "number"
            ? workspace.widgetGap
            : defaults.workspace.widgetGap,
        theme: workspace.theme === "light" ? "light" : "dark",
      },
      data: {
        notes: migrateNotes(data.notes),
        weather: {
          city:
            typeof data.weather?.city === "string"
              ? data.weather.city
              : defaults.data.weather.city,
        },
        calendar: {
          mode: data.calendar?.mode === "jalali" ? "jalali" : "gregorian",
        },
        pomodoro: {
          work: Number(data.pomodoro?.work) || defaults.data.pomodoro.work,
          short: Number(data.pomodoro?.short) || defaults.data.pomodoro.short,
          long: Number(data.pomodoro?.long) || defaults.data.pomodoro.long,
        },
      },
    };
  }

  // Legacy flat shape
  const legacy = obj as Record<string, unknown> & {
    widgets?: Partial<Record<WidgetId, WidgetState>>;
    weatherCity?: string;
    notes?: unknown;
  };

  return {
    workspace: {
      ...defaults.workspace,
      locked: Boolean(legacy.locked),
      keepOnTop: legacy.keepOnTop !== false,
      arrangeSide: legacy.arrangeSide === "right" ? "right" : "left",
      startWithWindows: legacy.startWithWindows !== false,
      initialized: Boolean(legacy.initialized),
      hostRecoveryV1: Boolean(legacy.hostRecoveryV1),
      widgets: mergeWidgets(legacy.widgets),
    },
    data: {
      notes: migrateNotes(legacy.notes),
      weather: {
        city:
          typeof legacy.weatherCity === "string"
            ? legacy.weatherCity
            : defaults.data.weather.city,
      },
      calendar: { ...defaults.data.calendar },
      pomodoro: { ...defaults.data.pomodoro },
    },
  };
}

async function persist(): Promise<void> {
  const snapshot = getState();

  // The cache is already updated. Notify this webview before disk and IPC work
  // so controlled settings reflect a click immediately.
  window.dispatchEvent(
    new CustomEvent(APP_STATE_CHANGED_EVENT, { detail: snapshot }),
  );

  try {
    await store.set("app", snapshot);
  } catch {
    // Offline / browser preview — keep in-memory cache.
  }
  try {
    await emit(APP_STATE_CHANGED_EVENT, snapshot);
  } catch {
    // No Tauri event bus in plain Vite.
  }
}

export async function loadSettings(): Promise<AppState> {
  await store.init();
  const stored = await store.get<unknown>("app");
  cached = migrateStored(stored);
  return getState();
}

export function getState(): AppState {
  return structuredClone(cached);
}

/** @deprecated use getState */
export function getSettings(): AppState {
  return getState();
}

export function getWorkspace(): WorkspaceSettings {
  return structuredClone(cached.workspace);
}

export function getWidgetData(): WidgetData {
  return structuredClone(cached.data);
}

export async function saveState(state: AppState): Promise<void> {
  cached = migrateStored(state);
  await persist();
}

export async function updateWorkspace(
  patch: Partial<WorkspaceSettings>,
): Promise<AppState> {
  cached = migrateStored({
    workspace: { ...cached.workspace, ...patch },
    data: cached.data,
  });
  await persist();
  return getState();
}

export async function updateWidgetData(
  patch: Partial<WidgetData>,
): Promise<AppState> {
  cached = migrateStored({
    workspace: cached.workspace,
    data: {
      ...cached.data,
      ...patch,
      notes: patch.notes ? migrateNotes(patch.notes) : cached.data.notes,
      weather: patch.weather
        ? { ...cached.data.weather, ...patch.weather }
        : cached.data.weather,
      calendar: patch.calendar
        ? { ...cached.data.calendar, ...patch.calendar }
        : cached.data.calendar,
      pomodoro: patch.pomodoro
        ? { ...cached.data.pomodoro, ...patch.pomodoro }
        : cached.data.pomodoro,
    },
  });
  await persist();
  return getState();
}

/** @deprecated Prefer updateWorkspace / updateWidgetData */
export async function updateSettings(
  patch: Partial<WorkspaceSettings> & {
    weatherCity?: string;
    notes?: string | NotesData;
  },
): Promise<AppState> {
  const { weatherCity, notes, ...workspacePatch } = patch;
  if (Object.keys(workspacePatch).length > 0) {
    await updateWorkspace(workspacePatch);
  }
  if (weatherCity !== undefined || notes !== undefined) {
    await updateWidgetData({
      ...(weatherCity !== undefined ? { weather: { city: weatherCity } } : {}),
      ...(notes !== undefined ? { notes: migrateNotes(notes) } : {}),
    });
  }
  return getState();
}

export async function updateWidgetState(
  id: WidgetId,
  patch: Partial<WidgetState>,
): Promise<AppState> {
  return updateWorkspace({
    widgets: {
      ...cached.workspace.widgets,
      [id]: { ...cached.workspace.widgets[id], ...patch },
    },
  });
}

/** In-memory only — for drag. No disk write, no cross-window emit. */
export function patchWidgetStateLocal(
  id: WidgetId,
  patch: Partial<WidgetState>,
): void {
  cached = {
    ...cached,
    workspace: {
      ...cached.workspace,
      widgets: {
        ...cached.workspace.widgets,
        [id]: { ...cached.workspace.widgets[id], ...patch },
      },
    },
  };
}

/** Persist + emit current cache (after drag debounce). */
export async function persistCachedState(): Promise<void> {
  await persist();
}
