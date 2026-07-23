import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/core/useAppState";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { getWeatherFeed } from "@/feeds/weatherFeed";
import { WeatherIcon } from "./weather-icon";

function WeatherSkeleton() {
  return (
    <div
      className="flex h-full flex-col gap-3 px-4 py-4"
      aria-busy="true"
      aria-label="Loading weather"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

export function WeatherWidget() {
  const { data } = useAppState();
  const city = data.weather.city;
  const feed = useMemo(() => getWeatherFeed(city), [city]);
  const snapshot = useLiveFeed(feed);

  if (snapshot.status === "connecting" && !snapshot.data) {
    return <WeatherSkeleton />;
  }

  if (!snapshot.data) {
    return (
      <div className="px-4 py-4 text-[12px] text-down" role="alert">
        {snapshot.error ?? "Weather unavailable"}
      </div>
    );
  }

  const w = snapshot.data;
  const range =
    w.low != null && w.high != null ? `${w.low}~${w.high}°` : null;

  return (
    <div className="flex h-full flex-col justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center">
          <WeatherIcon code={w.code} size="lg" alt={w.condition} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="num text-[40px] font-extralight leading-none tracking-tight text-foreground">
            {w.temperature}°
          </div>
          <div className="mt-1 truncate text-[12px] text-muted-foreground">
            {w.condition}
            {range ? ` · ${range}` : ""}
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-foreground/85">
            {w.city}
          </div>
        </div>
      </div>

      {w.days.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/80 px-2 py-2">
          {w.days.map((day) => (
            <div
              key={day.weekday}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {day.weekday}
              </span>
              <WeatherIcon
                code={day.code}
                night={false}
                alt={day.condition}
              />
              <span className="num text-[11px] text-foreground/80">
                {day.low}/{day.high}°
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="num flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {w.wind != null ? <span>Wind {w.wind}</span> : null}
          {w.humidity != null ? <span>Humidity {w.humidity}%</span> : null}
        </div>
      )}
    </div>
  );
}
