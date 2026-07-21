import { createPollingFeed, type LiveFeed } from "@/core/liveFeed";

export interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
  humidity: number | null;
  wind: number | null;
  high: number | null;
  low: number | null;
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
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    throw new Error("Could not load weather");
  }

  const forecast = (await forecastResponse.json()) as ForecastResult;
  const current = forecast.current;
  if (!current) {
    throw new Error("Weather unavailable");
  }

  return {
    city: place.name,
    temperature: Math.round(current.temperature_2m),
    condition: WEATHER_CODES[current.weather_code] ?? "Unknown",
    humidity:
      typeof current.relative_humidity_2m === "number"
        ? Math.round(current.relative_humidity_2m)
        : null,
    wind:
      typeof current.wind_speed_10m === "number"
        ? Math.round(current.wind_speed_10m)
        : null,
    high:
      typeof forecast.daily?.temperature_2m_max?.[0] === "number"
        ? Math.round(forecast.daily.temperature_2m_max[0])
        : null,
    low:
      typeof forecast.daily?.temperature_2m_min?.[0] === "number"
        ? Math.round(forecast.daily.temperature_2m_min[0])
        : null,
  };
}

const feeds = new Map<string, LiveFeed<WeatherData | null>>();

export function getWeatherFeed(city: string): LiveFeed<WeatherData | null> {
  const key = city.trim().toLowerCase() || "tehran";
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
