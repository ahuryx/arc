import type { ArrangeSide, WidgetId } from "./types";

/** Widget metadata only — no React (controller-safe). */
export interface WidgetMeta {
  id: WidgetId;
  label: string;
  title: string;
  /** Content area height; window chrome added in widgetManager. */
  height: number;
  /** Default arrange column. */
  defaultSide: ArrangeSide;
}

/**
 * Fitted content heights (no scroll).
 * Clock ≈ time52 + date + pad → 128 (jalali +~20 fits)
 * Calendar ≈ pad16+nav28+gaps16+weekdays20+6×28+10 ≈ 258 → 260
 */
export const WIDGET_CATALOG: WidgetMeta[] = [
  {
    id: "clock",
    label: "widget-clock",
    title: "Clock",
    height: 128,
    defaultSide: "left",
  },
  {
    id: "calendar",
    label: "widget-calendar",
    title: "Calendar",
    height: 260,
    defaultSide: "left",
  },
  {
    id: "crypto",
    label: "widget-crypto",
    title: "Crypto",
    height: 392,
    defaultSide: "left",
  },
  {
    id: "weather",
    label: "widget-weather",
    title: "Weather",
    height: 208,
    defaultSide: "right",
  },
  {
    id: "notes",
    label: "widget-notes",
    title: "Notes",
    height: 268,
    defaultSide: "right",
  },
  {
    id: "pomodoro",
    label: "widget-pomodoro",
    title: "Pomodoro",
    height: 236,
    defaultSide: "right",
  },
];

export const WIDGET_META_BY_ID = Object.fromEntries(
  WIDGET_CATALOG.map((widget) => [widget.id, widget]),
) as Record<WidgetId, WidgetMeta>;

export function getWidgetLabel(id: WidgetId): string {
  return WIDGET_META_BY_ID[id].label;
}
