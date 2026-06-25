import { useEffect, useState } from 'react';

// Live weather for the clock tile, fetched from Open-Meteo. Open-Meteo is free,
// needs no API key, and is CORS-enabled, so the browser can call it directly —
// ideal for an always-on kiosk with no backend. We ask for unix timestamps so
// matching "now + Nh" to an hourly slot is timezone-proof regardless of where
// the kiosk browser thinks it is.

// RMIT University Vietnam — Saigon South campus, Ho Chi Minh City. This matches
// the "VN" clock the tile already shows (Asia/Ho_Chi_Minh).
const RMIT_VN = { lat: 10.7295, lon: 106.6952 };

const ENDPOINT =
  `https://api.open-meteo.com/v1/forecast?latitude=${RMIT_VN.lat}&longitude=${RMIT_VN.lon}` +
  `&current=temperature_2m,weather_code,is_day` +
  `&hourly=temperature_2m,weather_code,is_day` +
  `&timezone=Asia%2FHo_Chi_Minh&timeformat=unixtime&forecast_days=2`;

const REFRESH_MS = 15 * 60 * 1000; // refresh every 15 minutes

export interface WeatherPoint {
  temp: number; // °C, rounded
  code: number; // WMO weather code
  isDay: boolean; // true = daytime at that hour (drives sun vs moon icon)
}

export interface Weather {
  current: WeatherPoint;
  in2h: WeatherPoint; // forecast ~2 hours from now
  in4h: WeatherPoint; // forecast ~4 hours from now
}

interface OMResponse {
  current: { temperature_2m: number; weather_code: number; is_day: number };
  hourly: { time: number[]; temperature_2m: number[]; weather_code: number[]; is_day: number[] };
}

// Find the hourly slot closest to "now + hoursAhead" and read its values.
function pickHour(data: OMResponse, hoursAhead: number): WeatherPoint {
  const targetSec = Math.floor(Date.now() / 1000) + hoursAhead * 3600;
  const times = data.hourly.time;
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(times[i] - targetSec);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return {
    temp: Math.round(data.hourly.temperature_2m[best]),
    code: data.hourly.weather_code[best],
    isDay: data.hourly.is_day[best] === 1,
  };
}

// Subscribe to RMIT Vietnam weather. Returns null until the first fetch lands;
// on a failed refresh it keeps the last-known reading on screen and retries on
// the next interval, so a wifi blip never blanks the tile.
export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`weather request failed (${res.status})`);
        const data = (await res.json()) as OMResponse;
        if (cancelled) return;
        setWeather({
          current: {
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            isDay: data.current.is_day === 1,
          },
          in2h: pickHour(data, 2),
          in4h: pickHour(data, 4),
        });
      } catch (err) {
        console.error('[mkt-dashboard] weather fetch failed', err);
        // Keep the last-known reading; try again on the next interval.
      }
    };

    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return weather;
}

export interface WeatherInfo {
  icon: string;
  label: string;
}

// Map a WMO weather code to an emoji icon + short label. Day/night swaps the
// icon for the clear/mostly-clear codes. Emoji keep the tile asset-free and
// render consistently across the kiosk browsers, matching the app's existing
// emoji use (🎂 etc.).
export function weatherInfo(code: number, isDay = true): WeatherInfo {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', label: 'Clear' };
  if (code === 1) return { icon: isDay ? '🌤️' : '🌙', label: 'Mainly clear' };
  if (code === 2) return { icon: isDay ? '⛅' : '☁️', label: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', label: 'Overcast' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Fog' };
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'Drizzle' };
  if (code >= 61 && code <= 67) return { icon: '🌧️', label: 'Rain' };
  if (code >= 71 && code <= 77) return { icon: '🌨️', label: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', label: 'Showers' };
  if (code >= 85 && code <= 86) return { icon: '🌨️', label: 'Snow showers' };
  if (code >= 95) return { icon: '⛈️', label: 'Thunderstorm' };
  return { icon: '🌡️', label: '—' };
}
