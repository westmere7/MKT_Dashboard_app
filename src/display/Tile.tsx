import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Card } from './cards';
import { useData } from '../store/useData';
import { birthdayLabel, youtubeId } from '../lib/util';

// Renders one bento tile based on its card kind. The outer motion wrapper lives
// in Display; this component only paints the inner content.

export function TileContent({ card }: { card: Card }) {
  switch (card.kind) {
    case 'brand':
      return <BrandTile card={card} />;
    case 'clock':
      return <ClockTile />;
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

function ClockTile() {
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

  return (
    <div className="clock-dual">
      <div className="clock-timezone">
        <div className="timezone-header">
          <span className="badge-tz">Vietnam</span>
          <span className="date-tz">{dateVN}</span>
        </div>
        <div className="time-tz">{timeVN}</div>
      </div>
      
      <div className="clock-timezone">
        <div className="timezone-header">
          <span className="badge-tz">Melbourne</span>
          <span className="date-tz">{dateMelb}</span>
        </div>
        <div className="time-tz">{timeMelb}</div>
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

function BirthdayTile({ card }: { card: Card }) {
  const people = card.people ?? [];
  return (
    <div className="birthday" style={{ height: '100%' }}>
      <div className="bday-head">
        <span className="cake">🎂</span> Birthdays
      </div>
      <div className="bday-list">
        {people.length === 0 && <div className="bday-meta">No birthdays in this window</div>}
        {people.map((p) => (
          <div className={`bday-row ${p.days === 0 ? 'today' : ''}`} key={p.name}>
            <div className="bday-row-avatar-wrapper">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.name} />
              ) : (
                <div className="bday-avatar-empty">{p.days === 0 ? '🎂' : '👤'}</div>
              )}
            </div>
            <div>
              <div className="bday-name">
                {p.name}
                {p.days === 0 && <span className="bday-row-today-icon">🎉</span>}
              </div>
              <div className="bday-meta">
                {p.team ? `${p.team} · ` : ''}{p.dateLabel}
              </div>
            </div>
            <span className={`bday-when ${p.days === 0 ? 'today' : ''}`}>{birthdayLabel(p.days)}</span>
          </div>
        ))}
      </div>
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
