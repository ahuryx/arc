import type { LiveFeed } from '@/core/liveFeed';

import { createPollingFeed } from '@/core/liveFeed';

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
  results?: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
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

type GeocodePlace = NonNullable<GeocodeResult['results']>[number];

type ForecastDaily = NonNullable<ForecastResult['daily']>;

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  80: 'Showers',
  95: 'Thunderstorm',
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export function weatherConditionLabel(code: number): string {
  return WEATHER_CODES[code] ?? 'Unknown';
}

async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(errorMessage);
  return (await response.json()) as T;
}

async function findPlace(city: string): Promise<GeocodePlace> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geocode = await fetchJson<GeocodeResult>(url, 'Could not look up city');
  const place = geocode.results?.[0];

  if (!place) throw new Error(`City not found: ${city}`);
  return place;
}

async function fetchForecast(place: GeocodePlace): Promise<ForecastResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&forecast_days=4&timezone=auto`;
  return fetchJson<ForecastResult>(url, 'Could not load weather');
}

function roundOptional(value: number | undefined): number | null {
  return typeof value === 'number' ? Math.round(value) : null;
}

function buildWeatherDays(daily?: ForecastDaily): WeatherDay[] {
  const days: WeatherDay[] = [];
  const times = daily?.time ?? [];

  for (let index = 1; index < Math.min(times.length, 4); index += 1) {
    const high = daily?.temperature_2m_max?.[index];
    const low = daily?.temperature_2m_min?.[index];
    if (typeof high !== 'number' || typeof low !== 'number') continue;

    const code = daily?.weather_code?.[index] ?? 0;
    const date = new Date(`${times[index]}T12:00:00`);
    days.push({
      weekday: WEEKDAYS[date.getDay()] ?? '—',
      high: Math.round(high),
      low: Math.round(low),
      code,
      condition: weatherConditionLabel(code),
    });
  }

  return days;
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const trimmed = city.trim();

  if (!trimmed) {
    throw new Error('Enter a city name');
  }

  const place = await findPlace(trimmed);
  const forecast = await fetchForecast(place);
  const { current } = forecast;

  if (!current) {
    throw new Error('Weather unavailable');
  }

  const { daily } = forecast;
  return {
    city: place.name,
    temperature: Math.round(current.temperature_2m),
    code: current.weather_code,
    condition: weatherConditionLabel(current.weather_code),
    humidity: roundOptional(current.relative_humidity_2m),
    wind: roundOptional(current.wind_speed_10m),
    high: roundOptional(daily?.temperature_2m_max?.[0]),
    low: roundOptional(daily?.temperature_2m_min?.[0]),
    days: buildWeatherDays(daily),
  };
}

const feeds = new Map<string, LiveFeed<WeatherData | null>>();

export function getWeatherFeed(city: string): LiveFeed<WeatherData | null> {
  const key = `v2:${city.trim().toLowerCase() || 'tehran'}`;
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
