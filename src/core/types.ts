export type WidgetId =
  | "clock"
  | "calendar"
  | "crypto"
  | "notes"
  | "pomodoro"
  | "weather";

export type ArrangeSide = "left" | "right";

/** Preference: fixed dark/light, or follow OS. */
export type ThemeId = "dark" | "light" | "system";

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
  /** One-shot: catalog default left/right columns. */
  sideLayoutV1?: boolean;
  /** App chrome theme preference (Workspace-owned). */
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

/** Clock display: 12-hour (AM/PM) or 24-hour. */
export type TimeFormat = "12" | "24";

/** Per-widget content prefs — separate from WorkspaceSettings. */
export interface WidgetData {
  notes: NotesData;
  weather: { city: string };
  calendar: { mode: CalendarMode };
  clock: { timeFormat: TimeFormat };
  pomodoro: { work: number; short: number; long: number };
}

export interface AppState {
  workspace: WorkspaceSettings;
  data: WidgetData;
}

export const APP_STATE_CHANGED_EVENT = "app-state-changed";
