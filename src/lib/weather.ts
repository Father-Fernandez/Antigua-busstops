/** Live weather for St. John's, Antigua, via Open-Meteo (no API key required). */

export const ANTIGUA_LAT = 17.1175;
export const ANTIGUA_LNG = -61.8456;

export interface AntiguaWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  isDay: boolean;
  code: number;
  condition: string;
  icon: string;
  high: number | null;
  low: number | null;
  observedAt: string;
}

function describe(code: number, isDay: boolean): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear sky', icon: isDay ? '☀️' : '🌙' };
    case 1:
      return { condition: 'Mainly clear', icon: isDay ? '🌤️' : '🌙' };
    case 2:
      return { condition: 'Partly cloudy', icon: '⛅' };
    case 3:
      return { condition: 'Overcast', icon: '☁️' };
    case 45:
      return { condition: 'Fog', icon: '🌫️' };
    case 48:
      return { condition: 'Freezing fog', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', icon: '🌦️' };
    case 56:
    case 57:
      return { condition: 'Freezing drizzle', icon: '🌧️' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', icon: '🌧️' };
    case 66:
    case 67:
      return { condition: 'Freezing rain', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snow', icon: '🌨️' };
    case 77:
      return { condition: 'Snow grains', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain showers', icon: '🌦️' };
    case 85:
    case 86:
      return { condition: 'Snow showers', icon: '🌨️' };
    case 95:
      return { condition: 'Thunderstorm', icon: '⛈️' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with hail', icon: '⛈️' };
    default:
      return { condition: 'Current conditions', icon: '🌡️' };
  }
}

export async function fetchAntiguaWeather(signal?: AbortSignal): Promise<AntiguaWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(ANTIGUA_LAT));
  url.searchParams.set('longitude', String(ANTIGUA_LNG));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day'
  );
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'America/Antigua');

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);

  const data = await res.json();
  const current = data.current ?? {};
  const isDay = current.is_day !== 0;
  const code = Number(current.weather_code ?? 0);
  const { condition, icon } = describe(code, isDay);

  const high = Array.isArray(data.daily?.temperature_2m_max)
    ? data.daily.temperature_2m_max[0]
    : null;
  const low = Array.isArray(data.daily?.temperature_2m_min)
    ? data.daily.temperature_2m_min[0]
    : null;

  return {
    temperature: Number(current.temperature_2m),
    feelsLike: Number(current.apparent_temperature),
    humidity: Number(current.relative_humidity_2m),
    precipitation: Number(current.precipitation ?? 0),
    windSpeed: Number(current.wind_speed_10m),
    isDay,
    code,
    condition,
    icon,
    high: high === null ? null : Number(high),
    low: low === null ? null : Number(low),
    observedAt: String(current.time ?? ''),
  };
}
