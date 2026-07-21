import dayjs from "dayjs";
import jalaliday from "jalaliday";
import type { CalendarMode } from "@/core/types";

dayjs.extend(jalaliday);

const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** English weekday headers (Sun–Sat). */
export function weekdayLabels(): readonly string[] {
  return WEEKDAYS_EN;
}

export function formatTime(date: Date): string {
  return dayjs(date).format("HH:mm:ss");
}

/** Short Gregorian date, e.g. Mon, Jul 20. */
export function formatGregorianDate(date: Date): string {
  return dayjs(date).format("ddd, MMM D");
}

/** Jalali date with Persian digits/month names when locale is fa. */
export function formatJalaliDate(date: Date): string {
  return dayjs(date)
    .calendar("jalali")
    .locale("fa")
    .format("dddd D MMMM YYYY");
}

export function formatMonthLabel(date: Date, mode: CalendarMode): string {
  if (mode === "jalali") {
    return dayjs(date).calendar("jalali").locale("fa").format("MMMM YYYY");
  }
  return dayjs(date).format("MMMM YYYY");
}

export function dayNumber(date: Date, mode: CalendarMode): number {
  if (mode === "jalali") {
    return Number(dayjs(date).calendar("jalali").format("D"));
  }
  return date.getDate();
}

export function startOfMonth(date: Date, mode: CalendarMode): Date {
  if (mode === "jalali") {
    return dayjs(date).calendar("jalali").startOf("month").toDate();
  }
  return dayjs(date).startOf("month").toDate();
}

export function addMonths(date: Date, count: number, mode: CalendarMode): Date {
  if (mode === "jalali") {
    return dayjs(date).calendar("jalali").add(count, "month").toDate();
  }
  return dayjs(date).add(count, "month").toDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayjs(a).isSame(b, "day");
}

/** Build Sun-start month grid; null = empty cell. */
export function buildMonthGrid(month: Date, mode: CalendarMode): Array<Date | null> {
  const start = startOfMonth(month, mode);
  const end =
    mode === "jalali"
      ? dayjs(start).calendar("jalali").endOf("month").toDate()
      : dayjs(start).endOf("month").toDate();

  const lead = start.getDay();
  const daysInMonth = dayjs(end).diff(dayjs(start), "day") + 1;
  const cells: Array<Date | null> = Array.from({ length: lead }, () => null);

  for (let i = 0; i < daysInMonth; i += 1) {
    cells.push(
      mode === "jalali"
        ? dayjs(start).calendar("jalali").add(i, "day").toDate()
        : dayjs(start).add(i, "day").toDate(),
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Iran weekends: Fri + Sat. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

export { dayjs };
