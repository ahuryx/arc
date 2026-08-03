import { cn } from '@/lib/utils';

export type WeatherIconName =
  | 'clear-night'
  | 'clear'
  | 'cloudy'
  | 'drizzle-night'
  | 'drizzle'
  | 'fog'
  | 'haze'
  | 'heavy-rain'
  | 'heavy-snow'
  | 'partly-cloudy-night'
  | 'partly-cloudy'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'sunrise'
  | 'sunset'
  | 'thunderstorm'
  | 'windy';

const ICON_SRC: Record<WeatherIconName, string> = {
  sunrise: '/weather-icons/sunrise.png',
  sunset: '/weather-icons/sunset.png',
  clear: '/weather-icons/clear.png',
  'clear-night': '/weather-icons/clear-night.png',
  'partly-cloudy': '/weather-icons/partly-cloudy.png',
  'partly-cloudy-night': '/weather-icons/partly-cloudy-night.png',
  haze: '/weather-icons/haze.png',
  fog: '/weather-icons/fog.png',
  windy: '/weather-icons/windy.png',
  cloudy: '/weather-icons/cloudy.png',
  thunderstorm: '/weather-icons/thunderstorm.png',
  rain: '/weather-icons/rain.png',
  'heavy-rain': '/weather-icons/heavy-rain.png',
  drizzle: '/weather-icons/drizzle.png',
  'drizzle-night': '/weather-icons/drizzle-night.png',
  snow: '/weather-icons/snow.png',
  'heavy-snow': '/weather-icons/heavy-snow.png',
  sleet: '/weather-icons/sleet.png',
};

const DAY_NIGHT_ICONS: Partial<
  Record<number, { day: WeatherIconName; night: WeatherIconName }>
> = {
  0: { day: 'clear', night: 'clear-night' },
  1: { day: 'clear', night: 'clear-night' },
  2: { day: 'partly-cloudy', night: 'partly-cloudy-night' },
  51: { day: 'drizzle', night: 'drizzle-night' },
  53: { day: 'drizzle', night: 'drizzle-night' },
  55: { day: 'drizzle', night: 'drizzle-night' },
  56: { day: 'drizzle', night: 'drizzle-night' },
  57: { day: 'drizzle', night: 'drizzle-night' },
};

const ICON_BY_CODE: Partial<Record<number, WeatherIconName>> = {
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'sleet',
  67: 'sleet',
  71: 'snow',
  73: 'snow',
  75: 'heavy-snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'heavy-rain',
  85: 'snow',
  86: 'heavy-snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

interface WeatherIconProps {
  code: number;
  className?: string;
  size?: 'lg' | 'sm';
  /** Force night variants when true; omit to use local hour. */
  night?: boolean;
  alt?: string;
}

function isNightHour(date = new Date()): boolean {
  const hour = date.getHours();
  return hour < 6 || hour >= 20;
}

/** Map Open-Meteo WMO weather code → Apple Weather PNG. */
function weatherIconForCode(
  code: number,
  night = isNightHour(),
): WeatherIconName {
  const dayNightIcon = DAY_NIGHT_ICONS[code];
  if (dayNightIcon) return night ? dayNightIcon.night : dayNightIcon.day;
  return ICON_BY_CODE[code] ?? 'cloudy';
}

/** Apple Weather PNG from Open-Meteo WMO code. */
export function WeatherIcon({
  code,
  className,
  size = 'sm',
  night,
  alt = '',
}: WeatherIconProps) {
  const name = weatherIconForCode(code, night ?? isNightHour());
  const dim = size === 'lg' ? 'size-14' : 'size-7';

  return (
    <img
      src={ICON_SRC[name]}
      alt={alt}
      draggable={false}
      className={cn(dim, 'object-contain', className)}
    />
  );
}
