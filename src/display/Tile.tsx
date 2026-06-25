import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Card } from './cards';
import { useData } from '../store/useData';
import { birthdayLabel, youtubeId, daysUntil, formatEventDate } from '../lib/util';
import { useWeather, weatherInfo } from '../lib/useWeather';
import rmitLogo from '../Elements/RMIT_white.svg';

// Renders one bento tile based on its card kind. The outer motion wrapper lives
// in Display; this component only paints the inner content.

export function TileContent({ card, w, h }: { card: Card; w?: number; h?: number }) {
  switch (card.kind) {
    case 'brand':
      return <BrandTile card={card} />;
    case 'clock':
      return <ClockTile w={w} h={h} />;
    case 'hero':
    case 'portrait':
      return <ImageTile card={card} />;
    case 'text':
      return <TextTile card={card} />;
    case 'stat':
      return <StatTile card={card} />;
    case 'video':
      return <VideoTile card={card} />;
    case 'birthday':
      return <BirthdayTile card={card} />;
    case 'countdown':
      return <CountdownTile card={card} />;
    default:
      return null;
  }
}

function BrandTile({ card }: { card: Card }) {
  return (
    <div className="brand" style={{ justifyContent: 'center', height: '100%' }}>
      <div className="brand-mark">
        RMIT<span className="brand-dot">.</span>
      </div>
      <div className="brand-sub">{card.brandName}</div>
    </div>
  );
}

function ClockTile({ w = 3, h = 6 }: { w?: number; h?: number }) {
  const { data } = useData();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(data.settings.showSeconds ? { second: '2-digit' } : {}),
  };

  const timeVN = now.toLocaleTimeString('en-AU', {
    ...options,
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const timeMelb = now.toLocaleTimeString('en-AU', {
    ...options,
    timeZone: 'Australia/Melbourne',
  });

  const dateVN = now.toLocaleDateString('en-AU', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const dateMelb = now.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Calculate upcoming events to show under the clock
  const campaigns = data.campaigns || [];
  const settings = data.settings;
  const eventWindowDays = settings.eventWindowDays ?? 60;
  const upcomingEvents = campaigns
    .filter((c) => {
      if (c.status !== 'upcoming') return false;
      const d = daysUntil(c.startDate);
      return d >= 0 && d <= eventWindowDays;
    })
    .map((c) => ({
      title: c.title,
      days: daysUntil(c.startDate),
      dateLabel: formatEventDate(c.startDate),
      tags: c.tags || [],
    }))
    .sort((a, b) => a.days - b.days);

  const isWide = w > h;

  return (
    <div className={`clock-and-events ${isWide ? 'tile-layout-wide' : 'tile-layout-vertical'}`}>
      <div className="clock-time-group">
        <div className="clock-logo-container">
          <img src={rmitLogo} className="clock-logo" alt="RMIT Logo" />
          <span className="clock-tagline">Ready for<br />what's next</span>
        </div>
        <hr className="clock-divider" />
        <div className="clock-dual">
          <div className="time-tz">{timeVN}</div>
          <div className="timezone-info-right">
            <span className="badge-tz">VN</span>
            <span className="date-tz">{dateVN}</span>
          </div>
          
          <div className="time-tz">{timeMelb}</div>
          <div className="timezone-info-right">
            <span className="badge-tz">Mel</span>
            <span className="date-tz">{dateMelb}</span>
          </div>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="clock-events-section">
          <div className="clock-events-list">
            {upcomingEvents.map((e) => (
              <div className="clock-event-row" key={e.title}>
                <div className="clock-event-date-box">
                  <span className="clock-event-date-label">{e.dateLabel}</span>
                </div>
                <div className="clock-event-info">
                  <div className="clock-event-title" title={e.title}>{e.title}</div>
                </div>
                <span className={`clock-event-days ${e.days === 0 ? 'today' : e.days === 1 ? 'tomorrow' : ''}`}>
                  {e.days === 0 ? 'Today' : e.days === 1 ? 'Tomorrow' : `in ${e.days}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Live weather for the RMIT Vietnam campus, anchored to the bottom of the
// birthday tile: current conditions plus a short look-ahead (+2h, +4h). Renders
// nothing until the first reading arrives, so it never leaves an empty gap.
function WeatherStrip() {
  const weather = useWeather();
  if (!weather) return null;

  const now = weatherInfo(weather.current.code, weather.current.isDay);
  const f2 = weatherInfo(weather.in2h.code, weather.in2h.isDay);
  const f4 = weatherInfo(weather.in4h.code, weather.in4h.isDay);

  return (
    <div className="weather-strip">
      <div className="weather-now">
        <span className="weather-now-icon">{now.icon}</span>
        <div className="weather-now-main">
          <span className="weather-now-temp">{weather.current.temp}°</span>
          <span className="weather-now-label">{now.label}</span>
        </div>
      </div>
      <div className="weather-forecast">
        <div className="weather-fc">
          <span className="weather-fc-when">+2h</span>
          <span className="weather-fc-icon">{f2.icon}</span>
          <span className="weather-fc-temp">{weather.in2h.temp}°</span>
        </div>
        <div className="weather-fc">
          <span className="weather-fc-when">+4h</span>
          <span className="weather-fc-icon">{f4.icon}</span>
          <span className="weather-fc-temp">{weather.in4h.temp}°</span>
        </div>
      </div>
    </div>
  );
}

function ImageTile({ card }: { card: Card }) {
  const images = card.images && card.images.length ? card.images : card.imageUrl ? [card.imageUrl] : [];
  const [idx, setIdx] = useState(0);

  // Preload all images in background to prime the browser cache
  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  // Cycle through the gallery when there's more than one image.
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), card.intervalMs ?? 4000);
    return () => clearInterval(t);
  }, [images.length, card.intervalMs]);

  const targetSrc = images[idx % images.length] || null;
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!targetSrc) {
      setDisplaySrc(null);
      return;
    }

    // Set immediately on first render if nothing is displayed yet
    if (!displaySrc) {
      setDisplaySrc(targetSrc);
      return;
    }

    // Preload the target image
    const img = new Image();
    img.src = targetSrc;
    const handleLoad = () => {
      setDisplaySrc(targetSrc);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.onload = handleLoad;
    }

    return () => {
      img.onload = null;
    };
  }, [targetSrc, displaySrc]);

  return (
    <>
      <AnimatePresence initial={false}>
        {displaySrc && (
          <motion.img
            key={displaySrc}
            src={displaySrc}
            alt={card.title ?? ''}
            loading="eager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>
      <div className="overlay" />
      <div className="img-content">
        {card.status === 'upcoming' && <span className="badge soft">Upcoming</span>}
        <div className="img-title">{card.title}</div>
        {card.dateLabel && <div className="img-date">{card.dateLabel}</div>}
        {images.length > 1 && (
          <div className="img-dots">
            {images.map((_, i) => (
              <span key={i} className={`img-dot ${i === idx % images.length ? 'on' : ''}`} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function TextTile({ card }: { card: Card }) {
  return (
    <div className="text-tile" style={{ height: '100%', justifyContent: 'space-between' }}>
      {card.status && <div className="text-status">{card.status}</div>}
      <div className="tagline">{card.tagline}</div>
      <div className="text-title">{card.title}</div>
    </div>
  );
}

function StatTile({ card }: { card: Card }) {
  const trendClass = card.trend === 'down' ? 'down' : 'up';
  return (
    <div className="stat">
      <div className="stat-label">{card.label}</div>
      <div className="stat-value">{card.value}</div>
      <div className="stat-foot">
        {card.delta && <span className={`delta ${trendClass}`}>{card.delta}</span>}
        {card.platform && <span className="platform">{card.platform}</span>}
      </div>
    </div>
  );
}

function VideoTile({ card }: { card: Card }) {
  const id = youtubeId(card.url);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1${
        origin ? `&origin=${encodeURIComponent(origin)}` : ''
      }`
    : '';

  return (
    <>
      {id && (
        <iframe
          src={embedUrl}
          title={card.title ?? 'video'}
          allow="autoplay; encrypted-media"
        />
      )}
      <div className="v-overlay" />
      <div className="v-content">
        <span className="play-dot" />
        <span className="v-title">{card.title}</span>
      </div>
    </>
  );
}

const BDAY_MIN_SCALE = 0.6;

function BirthdayTile({ card }: { card: Card }) {
  const { data } = useData();
  const people = card.people ?? [];

  const todayPeople = useMemo(() => people.filter((p) => p.days === 0), [people]);
  const upcomingPeople = useMemo(() => people.filter((p) => p.days > 0), [people]);

  // A stable signature of the current roster — changes only when the actual
  // birthdays change, so we can reset the fit without firing on every render.
  const peopleKey = useMemo(
    () => people.map((p) => `${p.name}:${p.days}`).join('|'),
    [people],
  );

  const listRef = useRef<HTMLDivElement>(null);
  const passRef = useRef(0);
  const settledRef = useRef(false);

  // Auto-fit: shrink font/avatar (scale) so the whole list fits the card. If it
  // still overflows at the minimum scale, drop upcoming rows one at a time and
  // cycle through them (today's birthdays stay pinned and are never dropped).
  const [scale, setScale] = useState(1);
  const [visibleUpcoming, setVisibleUpcoming] = useState(upcomingPeople.length);
  const [resizeToken, setResizeToken] = useState(0);

  // Reset the fit whenever the roster or the available size changes.
  useLayoutEffect(() => {
    passRef.current = 0;
    settledRef.current = false;
    setScale(1);
    setVisibleUpcoming(upcomingPeople.length);
  }, [peopleKey, resizeToken, upcomingPeople.length]);

  // A template/layout change resizes the tile; re-run the fit when it does.
  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setResizeToken((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isScrolling = visibleUpcoming < upcomingPeople.length;

  // Cycle the upcoming window only when we had to drop rows to fit.
  const [scrollIdx, setScrollIdx] = useState(0);
  useEffect(() => {
    setScrollIdx(0);
  }, [peopleKey, visibleUpcoming]);
  useEffect(() => {
    if (!isScrolling) return;
    const t = setInterval(() => {
      setScrollIdx((i) => (i + 1) % upcomingPeople.length);
    }, 4000);
    return () => clearInterval(t);
  }, [isScrolling, upcomingPeople.length]);

  const shownUpcoming = useMemo(() => {
    if (!isScrolling) return upcomingPeople;
    const rotated = [...upcomingPeople.slice(scrollIdx), ...upcomingPeople.slice(0, scrollIdx)];
    return rotated.slice(0, Math.max(1, visibleUpcoming));
  }, [isScrolling, upcomingPeople, scrollIdx, visibleUpcoming]);

  // After each render, measure overflow and take ONE corrective step: first
  // shrink the scale, then (once at the minimum) drop an upcoming row to enable
  // cycling. Monotonic and capped, so it always converges before paint.
  useLayoutEffect(() => {
    const el = listRef.current;
    // Once we've fit, stop measuring so row enter/exit animations can't nudge
    // the window smaller. The latch is cleared by the reset effect above.
    if (!el || settledRef.current || passRef.current > 60) return;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= 1) {
      settledRef.current = true;
      return; // fits — done
    }
    passRef.current += 1;
    if (scale > BDAY_MIN_SCALE + 0.001) {
      const target = (scale * el.clientHeight) / el.scrollHeight;
      setScale((s) => Math.max(BDAY_MIN_SCALE, Math.min(target, s - 0.04)));
    } else if (visibleUpcoming > 1) {
      setVisibleUpcoming((v) => v - 1);
    }
  });

  return (
    <div className="birthday">
      <div className="bday-head">
        <span className="cake">🎂</span> Birthdays
      </div>
      <div
        className="bday-list"
        ref={listRef}
        style={{ '--bday-scale': scale } as React.CSSProperties}
      >
        {people.length === 0 && <div className="bday-meta">No birthdays in this window</div>}

        {/* Pinned Today Birthdays */}
        {todayPeople.map((p) => (
          <div className="bday-row today" key={p.name}>
            <div className="bday-row-avatar-wrapper">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.name} />
              ) : (
                <div className="bday-avatar-empty">🎂</div>
              )}
            </div>
            <div>
              <div className="bday-name">
                {p.name}
                <span className="bday-row-today-icon">🎉</span>
              </div>
              <div className="bday-meta">
                {p.team ? `${p.team} · ` : ''}{p.dateLabel}
              </div>
            </div>
            <span className="bday-when today">Today</span>
          </div>
        ))}

        {/* Scrolling/Cycling Upcoming Birthdays */}
        {shownUpcoming.length > 0 && (
          <div className="bday-upcoming-container">
            <AnimatePresence mode="popLayout" initial={false}>
              {shownUpcoming.map((p) => (
                <motion.div
                  className="bday-row"
                  key={p.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                >
                  <div className="bday-row-avatar-wrapper">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} />
                    ) : (
                      <div className="bday-avatar-empty">👤</div>
                    )}
                  </div>
                  <div>
                    <div className="bday-name">{p.name}</div>
                    <div className="bday-meta">
                      {p.team ? `${p.team} · ` : ''}{p.dateLabel}
                    </div>
                  </div>
                  <span className="bday-when">{birthdayLabel(p.days)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      {data.settings.weatherEnabled !== false && <WeatherStrip />}
    </div>
  );
}

function CountdownTile({ card }: { card: Card }) {
  const days = card.days ?? 0;
  const images = card.images && card.images.length ? card.images : [];
  const [idx, setIdx] = useState(0);

  // Preload all images in background to prime the browser cache
  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  // Cycle through the gallery when there's more than one image.
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), card.intervalMs ?? 4000);
    return () => clearInterval(t);
  }, [images.length, card.intervalMs]);

  const hasBg = images.length > 0;
  const targetSrc = hasBg ? images[idx % images.length] : null;
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!targetSrc) {
      setDisplaySrc(null);
      return;
    }

    // Set immediately on first render if nothing is displayed yet
    if (!displaySrc) {
      setDisplaySrc(targetSrc);
      return;
    }

    // Preload the target image
    const img = new Image();
    img.src = targetSrc;
    const handleLoad = () => {
      setDisplaySrc(targetSrc);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.onload = handleLoad;
    }

    return () => {
      img.onload = null;
    };
  }, [targetSrc, displaySrc]);

  return (
    <>
      {hasBg && displaySrc && (
        <>
          <AnimatePresence initial={false}>
            <motion.img
              className="countdown-bg-img"
              key={displaySrc}
              src={displaySrc}
              alt={card.title ?? ''}
              loading="eager"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </AnimatePresence>
          <div
            className="overlay"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0, 0, 40, 0.85) 0%, rgba(0, 0, 40, 0.5) 60%, rgba(0, 0, 40, 0.3) 100%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      <div className="countdown" style={hasBg ? { position: 'absolute', inset: 0, padding: '30px' } : undefined}>
        <div className="cd-title">{card.title}</div>
        <div>
          <span className="cd-days">{days >= 0 ? days : 0}</span>
          <div className="cd-unit">{days === 1 ? 'day to go' : 'days to go'}</div>
        </div>
        <div className="cd-unit">{card.dateLabel}</div>
      </div>
    </>
  );
}



