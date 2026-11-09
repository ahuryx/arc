import { useEffect, useState } from 'react';

import { useAppState } from '@/core/useAppState';
import {
  formatGregorianDate,
  formatJalaliDate,
  formatTime,
  timeZoneLabel,
} from '@/lib/dates';
import { cn } from '@/lib/utils';

/** Live clock with seconds. */
export function ClockWidget() {
  const { data } = useAppState();
  const showJalali = data.calendar.mode === 'jalali';
  const { timeFormat, timeZone } = data.clock;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 py-3">
      <div className="text-[44px] leading-none font-extralight tracking-tight text-foreground tabular-nums">
        {formatTime(now, timeFormat, timeZone)}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[12px] font-medium text-muted-foreground">
          {formatGregorianDate(now, timeZone)}
          {timeZone ? ` · ${timeZoneLabel(timeZone)}` : null}
        </div>
        {showJalali ? (
          <div
            className={cn('font-fa text-[12px] font-medium text-foreground/75')}
            dir="rtl"
          >
            {formatJalaliDate(now, timeZone)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
