import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import jalaliday from 'jalaliday';

import type { CalendarMode } from '@/core/types';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(jalaliday);

const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/** English weekday headers (Sun–Sat). */
export function weekdayLabels(): readonly string[] {
  return WEEKDAYS_EN;
}

/** True for an IANA zone id this runtime can format (e.g. Asia/Tehran, UTC). */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

/** Zones for pickers: UTC first, then the runtime's IANA list. */
export function timeZoneOptions(): string[] {
  return ['UTC', ...Intl.supportedValuesOf('timeZone')];
}

/** Device zone id, e.g. Asia/Dubai. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Short label: America/New_York → New York. */
export function timeZoneLabel(timeZone: string): string {
  return (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');
}

/** null/undefined zone = device time. */
function inZone(date: Date, timeZone?: string | null): dayjs.Dayjs {
  return timeZone ? dayjs(date).tz(timeZone) : dayjs(date);
}

export function formatTime(
  date: Date,
  timeFormat: '12' | '24' = '24',
  timeZone?: string | null,
): string {
  return inZone(date, timeZone).format(
    timeFormat === '12' ? 'h:mm:ss A' : 'HH:mm:ss',
  );
}

/** Short Gregorian date, e.g. Mon, Jul 20. */
export function formatGregorianDate(
  date: Date,
  timeZone?: string | null,
): string {
  return inZone(date, timeZone).format('ddd, MMM D');
}

/** Jalali date with Persian digits/month names when locale is fa. */
export function formatJalaliDate(date: Date, timeZone?: string | null): string {
  // jalaliday drops tz offsets: convert the zoned calendar day at local noon.
  const day = dayjs(`${inZone(date, timeZone).format('YYYY-MM-DD')}T12:00`);
  return day.calendar('jalali').locale('fa').format('dddd D MMMM YYYY');
}

export function formatMonthLabel(date: Date, mode: CalendarMode): string {
  if (mode === 'jalali') {
    return dayjs(date).calendar('jalali').locale('fa').format('MMMM YYYY');
  }

  return dayjs(date).format('MMMM YYYY');
}

export function dayNumber(date: Date, mode: CalendarMode): number {
  if (mode === 'jalali') {
    return Number(dayjs(date).calendar('jalali').format('D'));
  }

  return date.getDate();
}

export function startOfMonth(date: Date, mode: CalendarMode): Date {
  if (mode === 'jalali') {
    return dayjs(date).calendar('jalali').startOf('month').toDate();
  }

  return dayjs(date).startOf('month').toDate();
}

export function addMonths(date: Date, count: number, mode: CalendarMode): Date {
  if (mode === 'jalali') {
    return dayjs(date).calendar('jalali').add(count, 'month').toDate();
  }

  return dayjs(date).add(count, 'month').toDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayjs(a).isSame(b, 'day');
}

/** Build Sun-start month grid; null = empty cell. */
export function buildMonthGrid(
  month: Date,
  mode: CalendarMode,
): (Date | null)[] {
  const start = startOfMonth(month, mode);
  const end =
    mode === 'jalali'
      ? dayjs(start).calendar('jalali').endOf('month').toDate()
      : dayjs(start).endOf('month').toDate();

  const lead = start.getDay();
  const daysInMonth = dayjs(end).diff(dayjs(start), 'day') + 1;
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);

  for (let i = 0; i < daysInMonth; i += 1) {
    cells.push(
      mode === 'jalali'
        ? dayjs(start).calendar('jalali').add(i, 'day').toDate()
        : dayjs(start).add(i, 'day').toDate(),
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
