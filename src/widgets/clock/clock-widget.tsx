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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-5">
      <div className="num text-[52px] font-extralight leading-none tracking-tight text-foreground tabular-nums">
        {formatTime(now)}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-[13px] font-medium text-muted-foreground">
          {formatGregorianDate(now)}
        </div>
        {showJalali ? (
          <div
            className={cn("fa text-[13px] font-medium text-foreground/75")}
            dir="rtl"
          >
            {formatJalaliDate(now)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
