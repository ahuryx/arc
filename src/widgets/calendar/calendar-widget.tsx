import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/core/useAppState";
import {
  addMonths,
  buildMonthGrid,
  dayNumber,
  formatMonthLabel,
  isSameDay,
  isWeekend,
  startOfMonth,
  weekdayLabels,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Layout budget (content height):
 * pad 16 + nav 28 + gaps 16 + weekdays 20 + 6×28 day rows + 5×2 gaps ≈ 258
 */
export function CalendarWidget() {
  const { data } = useAppState();
  const mode = data.calendar.mode;
  const [cursor, setCursor] = useState(() => startOfMonth(new Date(), mode));
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    setCursor(startOfMonth(new Date(), mode));
  }, [mode]);

  const month = useMemo(() => startOfMonth(cursor, mode), [cursor, mode]);
  const cells = useMemo(() => buildMonthGrid(month, mode), [month, mode]);

  return (
    <div className="flex h-full flex-col gap-2 px-2.5 py-2">
      <div className="flex h-7 shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Previous month"
          onClick={() => setCursor((d) => addMonths(d, -1, mode))}
        >
          <ChevronLeft />
        </Button>
        <div
          className={cn(
            "min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-foreground",
            mode === "jalali" && "font-fa",
          )}
          dir={mode === "jalali" ? "rtl" : "ltr"}
        >
          {formatMonthLabel(month, mode)}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Next month"
          onClick={() => setCursor((d) => addMonths(d, 1, mode))}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid shrink-0 grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
        {weekdayLabels().map((day, i) => (
          <div key={`${day}-${i}`} className="py-0.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="size-7 mx-auto" />;
          }

          const isToday = isSameDay(day, today);
          const weekend = isWeekend(day);

          return (
            <div
              key={`${day.getTime()}-${index}`}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-[12px] tabular-nums",
                isToday && "bg-primary text-primary-foreground",
                !isToday && weekend && "text-down",
                !isToday && !weekend && "text-foreground/85",
                mode === "jalali" && "font-fa",
              )}
            >
              {dayNumber(day, mode)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
