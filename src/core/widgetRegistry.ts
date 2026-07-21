import type { ComponentType } from "react";
import { CalendarWidget } from "@/widgets/calendar/calendar-widget";
import { ClockWidget } from "@/widgets/clock/clock-widget";
import { CryptoWidget } from "@/widgets/crypto/crypto-widget";
import { NotesWidget } from "@/widgets/notes/notes-widget";
import { PomodoroWidget } from "@/widgets/pomodoro/pomodoro-widget";
import { WeatherWidget } from "@/widgets/weather/weather-widget";
import type { WidgetId } from "./types";
import { WIDGET_CATALOG, type WidgetMeta } from "./widgetCatalog";

export type { WidgetMeta };

export interface WidgetDefinition extends WidgetMeta {
  component: ComponentType;
}

const COMPONENTS: Record<WidgetId, ComponentType> = {
  clock: ClockWidget,
  calendar: CalendarWidget,
  crypto: CryptoWidget,
  notes: NotesWidget,
  pomodoro: PomodoroWidget,
  weather: WeatherWidget,
};

export const WIDGETS: WidgetDefinition[] = WIDGET_CATALOG.map((meta) => ({
  ...meta,
  component: COMPONENTS[meta.id],
}));

export const WIDGET_BY_ID = Object.fromEntries(
  WIDGETS.map((widget) => [widget.id, widget]),
) as Record<WidgetId, WidgetDefinition>;

export const WIDGET_BY_LABEL = Object.fromEntries(
  WIDGETS.map((widget) => [widget.label, widget]),
) as Record<string, WidgetDefinition>;
