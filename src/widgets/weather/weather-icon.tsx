import { cn } from "@/lib/utils";

export type WeatherIconName =
  | "sunrise"
  | "sunset"
  | "clear"
  | "clear-night"
  | "partly-cloudy"
  | "partly-cloudy-night"
  | "haze"
  | "fog"
  | "windy"
  | "cloudy"
  | "thunderstorm"
  | "rain"
  | "heavy-rain"
  | "drizzle"
  | "drizzle-night"
  | "snow"
  | "heavy-snow"
  | "sleet";

const ICON_SRC: Record<WeatherIconName, string> = {
  sunrise: "/weather-icons/sunrise.png",
  sunset: "/weather-icons/sunset.png",
  clear: "/weather-icons/clear.png",
  "clear-night": "/weather-icons/clear-night.png",
  "partly-cloudy": "/weather-icons/partly-cloudy.png",
  "partly-cloudy-night": "/weather-icons/partly-cloudy-night.png",
  haze: "/weather-icons/haze.png",
  fog: "/weather-icons/fog.png",
  windy: "/weather-icons/windy.png",
  cloudy: "/weather-icons/cloudy.png",
  thunderstorm: "/weather-icons/thunderstorm.png",
  rain: "/weather-icons/rain.png",
  "heavy-rain": "/weather-icons/heavy-rain.png",
  drizzle: "/weather-icons/drizzle.png",
  "drizzle-night": "/weather-icons/drizzle-night.png",
  snow: "/weather-icons/snow.png",
  "heavy-snow": "/weather-icons/heavy-snow.png",
  sleet: "/weather-icons/sleet.png",
};

interface WeatherIconProps {
  code: number;
  className?: string;
  size?: "sm" | "lg";
  /** Force night variants when true; omit to use local hour. */
  night?: boolean;
  alt?: string;
}

function isNightHour(date = new Date()): boolean {
  const hour = date.getHours();
  return hour < 6 || hour >= 20;
}

/** Map Open-Meteo WMO weather code → Apple Weather PNG. */
export function weatherIconForCode(
  code: number,
  night = isNightHour(),
): WeatherIconName {
  if (code === 0 || code === 1) return night ? "clear-night" : "clear";
  if (code === 2) return night ? "partly-cloudy-night" : "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) {
    return night ? "drizzle-night" : "drizzle";
  }
  if (code === 66 || code === 67) return "sleet";
  if (code === 65 || code === 82) return "heavy-rain";
  if ((code >= 61 && code <= 63) || code === 80 || code === 81) return "rain";
  if (code === 75 || code === 86) return "heavy-snow";
  if ((code >= 71 && code <= 77) || code === 85) return "snow";
  if (code >= 95) return "thunderstorm";
  return "cloudy";
}

/** Apple Weather PNG from Open-Meteo WMO code. */
export function WeatherIcon({
  code,
  className,
  size = "sm",
  night,
  alt = "",
}: WeatherIconProps) {
  const name = weatherIconForCode(code, night ?? isNightHour());
  const dim = size === "lg" ? "size-14" : "size-7";

  return (
    <img
      src={ICON_SRC[name]}
      alt={alt}
      draggable={false}
      className={cn(dim, "object-contain", className)}
    />
  );
}
