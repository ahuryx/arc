import { useEffect, useState } from "react";
import { useAppState } from "@/core/useAppState";
import {
  formatGregorianDate,
  formatJalaliDate,
  formatTime,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Live clock with seconds. */
export function ClockWidget() {
  const { data } = useAppState();
  const showJalali = data.calendar.mode === "jalali";
  const timeFormat = data.clock?.timeFormat === "12" ? "12" : "24";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 py-3">
      <div className="num text-[44px] font-extralight leading-none tracking-tight text-foreground tabular-nums">
        {formatTime(now, timeFormat)}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[12px] font-medium text-muted-foreground">
          {formatGregorianDate(now)}
        </div>
        {showJalali ? (
          <div
            className={cn("fa text-[12px] font-medium text-foreground/75")}
            dir="rtl"
          >
            {formatJalaliDate(now)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
