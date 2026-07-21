import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/core/useAppState";
import { useLiveFeed } from "@/hooks/use-live-feed";
import { getWeatherFeed } from "@/feeds/weatherFeed";

function WeatherSkeleton() {
  return (
    <div
      className="flex h-full flex-col gap-3 px-4 py-4"
      aria-busy="true"
      aria-label="Loading weather"
    >
      <Skeleton className="h-11 w-24" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-40" />
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

  return (
    <div className="flex h-full flex-col justify-between gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="num text-[44px] font-extralight leading-none text-foreground">
            {w.temperature}°
          </div>
          <div className="text-[13px] text-muted-foreground">{w.condition}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-[13px] font-medium text-foreground/80">
          {w.city}
        </div>
        <div className="num flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {w.high != null && w.low != null ? (
            <span>
              H {w.high}° · L {w.low}°
            </span>
          ) : null}
          {w.wind != null ? <span>Wind {w.wind}</span> : null}
          {w.humidity != null ? <span>Humidity {w.humidity}%</span> : null}
        </div>
      </div>
    </div>
  );
}
