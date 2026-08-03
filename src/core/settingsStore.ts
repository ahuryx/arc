import { emit, listen } from '@tauri-apps/api/event';
import { LazyStore } from '@tauri-apps/plugin-store';

import { defaultCryptoData } from '@/feeds/crypto/defaults';

import type {
  AppState,
  CryptoData,
  CryptoRow,
  NotesData,
  WidgetData,
  WidgetId,
  WidgetState,
  WorkspaceSettings,
} from './types';

import { ARRANGE_GAP, ARRANGE_MARGIN, STORE_PATH } from './constants';
import { APP_STATE_CHANGED_EVENT } from './types';
import { WIDGET_CATALOG } from './widgetCatalog';

function createDefaultWidgets(): WorkspaceSettings['widgets'] {
  return Object.fromEntries(
    WIDGET_CATALOG.map((widget, index) => [
      widget.id,
      {
        visible: true,
        x: 100,
        y: 100 + index * (widget.height + 12),
        side: widget.defaultSide,
      },
    ]),
  ) as WorkspaceSettings['widgets'];
}

function defaultNotes(): NotesData {
  const id = 'tab-1';
  return { tabs: [{ id, body: '' }], active: id };
}

function defaultCrypto(): CryptoData {
  return defaultCryptoData();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isCryptoRow(value: unknown): value is CryptoRow {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.symbol === 'string' &&
    (value.quote === 'usd' || value.quote === 'toman')
  );
}

function migrateCrypto(raw: unknown): CryptoData {
  const defaults = defaultCrypto();

  if (!isRecord(raw)) {
    return defaults;
  }

  const rows: CryptoRow[] = Array.isArray(raw.rows)
    ? raw.rows.filter(isCryptoRow).map((row) => ({
        id: row.id,
        symbol: row.symbol.toUpperCase(),
        quote: row.quote,
      }))
    : defaults.rows;

  return {
    rows: rows.length > 0 ? rows : defaults.rows,
  };
}

export const DEFAULT_WORKSPACE: WorkspaceSettings = {
  widgets: createDefaultWidgets(),
  locked: true,
  keepOnTop: false,
  arrangeSide: 'left',
  autoArrange: true,
  edgeGap: ARRANGE_MARGIN,
  widgetGap: ARRANGE_GAP,
  startWithWindows: true,
  initialized: false,
  theme: 'system',
};

export const DEFAULT_WIDGET_DATA: WidgetData = {
  notes: defaultNotes(),
  weather: { city: 'New York' },
  calendar: { mode: 'gregorian' },
  clock: { timeFormat: '12' },
  pomodoro: { work: 25, short: 5, long: 15 },
  crypto: defaultCrypto(),
};

export const DEFAULT_STATE: AppState = {
  workspace: DEFAULT_WORKSPACE,
  data: DEFAULT_WIDGET_DATA,
};

const store = new LazyStore(STORE_PATH, {
  defaults: { app: DEFAULT_STATE },
});

let cached: AppState = structuredClone(DEFAULT_STATE);
let remoteSyncStarted = false;

/** Keep this webview's cache aligned with writes from other windows. */
function startRemoteCacheSync(): void {
  if (remoteSyncStarted) return;
  remoteSyncStarted = true;
  void listen<AppState>(APP_STATE_CHANGED_EVENT, (event) => {
    cached = migrateStored(event.payload);
  }).catch(() => {
    /* no event bus outside Tauri */
  });
}

function mergeWidgets(stored: unknown): WorkspaceSettings['widgets'] {
  const widgets = createDefaultWidgets();
  const storedWidgets = isRecord(stored) ? stored : {};

  for (const meta of WIDGET_CATALOG) {
    const previous = storedWidgets[meta.id];

    if (isRecord(previous)) {
      const fallback = widgets[meta.id];
      widgets[meta.id] = {
        visible:
          typeof previous.visible === 'boolean'
            ? previous.visible
            : fallback.visible,
        x: typeof previous.x === 'number' ? previous.x : fallback.x,
        y: typeof previous.y === 'number' ? previous.y : fallback.y,
        side:
          previous.side === 'right' || previous.side === 'left'
            ? previous.side
            : fallback.side,
      };
    }
  }

  return widgets;
}

function migrateNotes(raw: unknown): NotesData {
  if (typeof raw === 'string') {
    const notes = defaultNotes();
    notes.tabs[0].body = raw;
    return notes;
  }
  if (isRecord(raw)) {
    const { tabs } = raw;

    if (Array.isArray(tabs) && tabs.length > 0) {
      const validTabs = tabs.filter(isRecord);
      if (validTabs.length === 0) return defaultNotes();

      return {
        tabs: validTabs.map((tab, index) => ({
          id: isNonEmptyString(tab.id) ? tab.id : `tab-${index + 1}`,
          body: typeof tab.body === 'string' ? tab.body : '',
        })),
        active: isNonEmptyString(raw.active)
          ? raw.active
          : isNonEmptyString(validTabs[0].id)
            ? validTabs[0].id
            : 'tab-1',
      };
    }
  }

  return defaultNotes();
}

function createFreshDefaults(): AppState {
  return {
    workspace: {
      ...DEFAULT_WORKSPACE,
      widgets: createDefaultWidgets(),
    },
    data: {
      ...DEFAULT_WIDGET_DATA,
      notes: defaultNotes(),
      weather: { ...DEFAULT_WIDGET_DATA.weather },
      calendar: { ...DEFAULT_WIDGET_DATA.calendar },
      clock: { ...DEFAULT_WIDGET_DATA.clock },
      pomodoro: { ...DEFAULT_WIDGET_DATA.pomodoro },
      crypto: defaultCrypto(),
    },
  };
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function numberOr(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric !== 0 ? numeric : fallback;
}

function migrateWorkspace(
  raw: Record<string, unknown>,
  defaults: WorkspaceSettings,
): WorkspaceSettings {
  const theme =
    raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system'
      ? raw.theme
      : defaults.theme;
  const arrangeSide = raw.arrangeSide === 'right' ? 'right' : 'left';

  return {
    widgets: mergeWidgets(raw.widgets),
    locked: booleanOr(raw.locked, defaults.locked),
    keepOnTop: booleanOr(raw.keepOnTop, defaults.keepOnTop),
    arrangeSide,
    autoArrange: booleanOr(raw.autoArrange, defaults.autoArrange),
    edgeGap: typeof raw.edgeGap === 'number' ? raw.edgeGap : defaults.edgeGap,
    widgetGap:
      typeof raw.widgetGap === 'number' ? raw.widgetGap : defaults.widgetGap,
    startWithWindows: booleanOr(
      raw.startWithWindows,
      defaults.startWithWindows,
    ),
    initialized: booleanOr(raw.initialized, defaults.initialized),
    hostRecoveryV1: booleanOr(
      raw.hostRecoveryV1,
      defaults.hostRecoveryV1 ?? false,
    ),
    sideLayoutV1: booleanOr(raw.sideLayoutV1, defaults.sideLayoutV1 ?? false),
    theme,
  };
}

function migrateWidgetData(
  raw: Record<string, unknown>,
  defaults: WidgetData,
): WidgetData {
  const weather = isRecord(raw.weather) ? raw.weather : {};
  const calendar = isRecord(raw.calendar) ? raw.calendar : {};
  const clock = isRecord(raw.clock) ? raw.clock : {};
  const pomodoro = isRecord(raw.pomodoro) ? raw.pomodoro : {};

  return {
    notes: migrateNotes(raw.notes),
    weather: {
      city:
        typeof weather.city === 'string' ? weather.city : defaults.weather.city,
    },
    calendar: {
      mode: calendar.mode === 'jalali' ? 'jalali' : 'gregorian',
    },
    clock: {
      timeFormat:
        clock.timeFormat === '12' || clock.timeFormat === '24'
          ? clock.timeFormat
          : defaults.clock.timeFormat,
    },
    pomodoro: {
      work: numberOr(pomodoro.work, defaults.pomodoro.work),
      short: numberOr(pomodoro.short, defaults.pomodoro.short),
      long: numberOr(pomodoro.long, defaults.pomodoro.long),
    },
    crypto: migrateCrypto(raw.crypto),
  };
}

function migrateLegacy(
  raw: Record<string, unknown>,
  defaults: AppState,
): AppState {
  return {
    workspace: {
      ...defaults.workspace,
      locked: raw.locked === true,
      keepOnTop: raw.keepOnTop !== false,
      arrangeSide: raw.arrangeSide === 'right' ? 'right' : 'left',
      startWithWindows: raw.startWithWindows !== false,
      initialized: raw.initialized === true,
      hostRecoveryV1: raw.hostRecoveryV1 === true,
      widgets: mergeWidgets(raw.widgets),
    },
    data: {
      ...defaults.data,
      notes: migrateNotes(raw.notes),
      weather: {
        city:
          typeof raw.weatherCity === 'string'
            ? raw.weatherCity
            : defaults.data.weather.city,
      },
    },
  };
}

/** Accepts new AppState or legacy flat shape. */
function migrateStored(raw: unknown): AppState {
  const defaults = createFreshDefaults();

  if (!isRecord(raw)) {
    return defaults;
  }

  if (isRecord(raw.workspace) && isRecord(raw.data)) {
    return {
      workspace: migrateWorkspace(raw.workspace, defaults.workspace),
      data: migrateWidgetData(raw.data, defaults.data),
    };
  }

  return migrateLegacy(raw, defaults);
}

async function persist(): Promise<void> {
  const snapshot = getState();

  // The cache is already updated. Notify this webview before disk and IPC work
  // so controlled settings reflect a click immediately.
  window.dispatchEvent(
    new CustomEvent(APP_STATE_CHANGED_EVENT, { detail: snapshot }),
  );

  try {
    await store.set('app', snapshot);
  } catch (error) {
    console.error('[store] persist failed', error);
  }

  try {
    await emit(APP_STATE_CHANGED_EVENT, snapshot);
  } catch {
    // No Tauri event bus in plain Vite.
  }
}

export async function loadSettings(): Promise<AppState> {
  await store.init();
  const stored = await store.get<unknown>('app');
  cached = migrateStored(stored);
  startRemoteCacheSync();
  return getState();
}

export function getState(): AppState {
  return structuredClone(cached);
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

/** Wipe prefs — next host boot path treats as first run when initialized is false. */
export async function resetSettingsToDefaults(): Promise<AppState> {
  cached = migrateStored({
    workspace: {
      ...DEFAULT_WORKSPACE,
      widgets: createDefaultWidgets(),
      initialized: false,
    },
    data: {
      ...DEFAULT_WIDGET_DATA,
      notes: defaultNotes(),
      weather: { ...DEFAULT_WIDGET_DATA.weather },
      calendar: { ...DEFAULT_WIDGET_DATA.calendar },
      clock: { ...DEFAULT_WIDGET_DATA.clock },
      pomodoro: { ...DEFAULT_WIDGET_DATA.pomodoro },
      crypto: defaultCrypto(),
    },
  });
  await persist();
  return getState();
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
      clock: patch.clock
        ? { ...cached.data.clock, ...patch.clock }
        : cached.data.clock,
      pomodoro: patch.pomodoro
        ? { ...cached.data.pomodoro, ...patch.pomodoro }
        : cached.data.pomodoro,
      crypto: patch.crypto
        ? migrateCrypto({
            ...cached.data.crypto,
            ...patch.crypto,
            rows: patch.crypto.rows,
          })
        : cached.data.crypto,
    },
  });
  await persist();
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
