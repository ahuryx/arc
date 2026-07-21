export type WidgetId =
  | "clock"
  | "calendar"
  | "crypto"
  | "notes"
  | "pomodoro"
  | "weather";

export type ArrangeSide = "left" | "right";

export type ThemeId = "dark" | "light";

export interface WidgetState {
  visible: boolean;
  x: number;
  y: number;
  /** Which edge column auto-arrange uses. */
  side: ArrangeSide;
}

/** Shell / layout prefs — not widget content. */
export interface WorkspaceSettings {
  widgets: Record<WidgetId, WidgetState>;
  locked: boolean;
  keepOnTop: boolean;
  /** Default side for newly enabled widgets. */
  arrangeSide: ArrangeSide;
  /** When true, show/hide/side/gap changes re-stack widgets. */
  autoArrange: boolean;
  edgeGap: number;
  widgetGap: number;
  startWithWindows: boolean;
  initialized: boolean;
  /** One-shot: show Clock when every widget was left hidden. */
  hostRecoveryV1?: boolean;
  /** App chrome theme (Workspace-owned). */
  theme: ThemeId;
}

export interface NoteTab {
  id: string;
  body: string;
}

export interface NotesData {
  tabs: NoteTab[];
  active: string;
}

export type CalendarMode = "gregorian" | "jalali";

/** Per-widget content prefs — separate from WorkspaceSettings. */
export interface WidgetData {
  notes: NotesData;
  weather: { city: string };
  calendar: { mode: CalendarMode };
  pomodoro: { work: number; short: number; long: number };
}

export interface AppState {
  workspace: WorkspaceSettings;
  data: WidgetData;
}

/** @deprecated Prefer AppState — kept for event name stability. */
export type AppSettings = AppState;

export const APP_STATE_CHANGED_EVENT = "app-state-changed";
/** Alias used by older listeners. */
export const SETTINGS_CHANGED_EVENT = APP_STATE_CHANGED_EVENT;
