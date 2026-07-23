import { createPollingFeed, type LiveFeed } from "@/core/liveFeed";

export interface WeatherDay {
  weekday: string;
  high: number;
  low: number;
  code: number;
  condition: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  code: number;
  city: string;
  humidity: number | null;
  wind: number | null;
  high: number | null;
  low: number | null;
  days: WeatherDay[];
}

interface GeocodeResult {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
  }>;
}

interface ForecastResult {
  current?: {
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  80: "Showers",
  95: "Thunderstorm",
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export function weatherConditionLabel(code: number): string {
  return WEATHER_CODES[code] ?? "Unknown";
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const trimmed = city.trim();
  if (!trimmed) {
    throw new Error("Enter a city name");
  }

  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  const geocodeResponse = await fetch(geocodeUrl);
  if (!geocodeResponse.ok) {
    throw new Error("Could not look up city");
  }

  const geocode = (await geocodeResponse.json()) as GeocodeResult;
  const place = geocode.results?.[0];
  if (!place) {
    throw new Error(`City not found: ${trimmed}`);
  }

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&forecast_days=4&timezone=auto`;

  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    throw new Error("Could not load weather");
  }

  const forecast = (await forecastResponse.json()) as ForecastResult;
  const current = forecast.current;
  if (!current) {
    throw new Error("Weather unavailable");
  }

  const daily = forecast.daily;
  const days: WeatherDay[] = [];
  const times = daily?.time ?? [];
  for (let i = 1; i < Math.min(times.length, 4); i += 1) {
    const code = daily?.weather_code?.[i] ?? 0;
    const high = daily?.temperature_2m_max?.[i];
    const low = daily?.temperature_2m_min?.[i];
    if (typeof high !== "number" || typeof low !== "number") continue;
    const date = new Date(`${times[i]}T12:00:00`);
    days.push({
      weekday: WEEKDAYS[date.getDay()] ?? "—",
      high: Math.round(high),
      low: Math.round(low),
      code,
      condition: weatherConditionLabel(code),
    });
  }

  return {
    city: place.name,
    temperature: Math.round(current.temperature_2m),
    code: current.weather_code,
    condition: weatherConditionLabel(current.weather_code),
    humidity:
      typeof current.relative_humidity_2m === "number"
        ? Math.round(current.relative_humidity_2m)
        : null,
    wind:
      typeof current.wind_speed_10m === "number"
        ? Math.round(current.wind_speed_10m)
        : null,
    high:
      typeof daily?.temperature_2m_max?.[0] === "number"
        ? Math.round(daily.temperature_2m_max[0])
        : null,
    low:
      typeof daily?.temperature_2m_min?.[0] === "number"
        ? Math.round(daily.temperature_2m_min[0])
        : null,
    days,
  };
}

const feeds = new Map<string, LiveFeed<WeatherData | null>>();

export function getWeatherFeed(city: string): LiveFeed<WeatherData | null> {
  const key = `v2:${city.trim().toLowerCase() || "tehran"}`;
  let feed = feeds.get(key);
  if (!feed) {
    feed = createPollingFeed({
      intervalMs: 15 * 60 * 1000,
      initial: null,
      fetch: async () => fetchWeather(city),
    });
    feeds.set(key, feed);
  }
  return feed;
}
