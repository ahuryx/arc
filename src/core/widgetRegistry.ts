import type { ComponentType } from "react";
import { CalendarWidget } from "@/widgets/calendar/calendar-widget";
import { ClockWidget } from "@/widgets/clock/clock-widget";
import { CryptoWidget } from "@/widgets/crypto/crypto-widget";
import { NotesWidget } from "@/widgets/notes/notes-widget";
import { PomodoroWidget } from "@/widgets/pomodoro/pomodoro-widget";
import { WeatherWidget } from "@/widgets/weather/weather-widget";
import type { WidgetId } from "./types";
import { WIDGET_CATALOG, type WidgetMeta } from "./widgetCatalog";

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

export const WIDGET_BY_LABEL = Object.fromEntries(
  WIDGET_CATALOG.map((meta) => [
    meta.label,
    { ...meta, component: COMPONENTS[meta.id] },
  ]),
) as Record<string, WidgetDefinition>;
