import type { WidgetId } from './types';

/** Settings window navigation targets. */
export type SettingsTabId = 'about' | 'general' | WidgetId;

export const SETTINGS_FOCUS_TAB_EVENT = 'settings-focus-tab';

export const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'clock', label: 'Clock' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'weather', label: 'Weather' },
  { id: 'notes', label: 'Notes' },
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'about', label: 'About' },
];

const TAB_IDS = new Set<string>(SETTINGS_TABS.map((tab) => tab.id));

export function isSettingsTabId(
  value: string | null | undefined,
): value is SettingsTabId {
  return value != null && TAB_IDS.has(value);
}

export function parseSettingsTab(
  value: string | null | undefined,
): SettingsTabId | null {
  return isSettingsTabId(value) ? value : null;
}
