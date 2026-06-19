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
  const time = now.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    ...(data.settings.showSeconds ? { second: '2-digit' } : {}),
  });
  const date = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="clock" style={{ justifyContent: 'center', height: '100%' }}>
      <div className="time">{time}</div>
      <div className="date">{date}</div>
    </div>
  );
}

function ImageTile({ card }: { card: Card }) {
  const images = card.images && card.images.length ? card.images : card.imageUrl ? [card.imageUrl] : [];
  const [idx, setIdx] = useState(0);

  // Cycle through the gallery when there's more than one image.
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), card.intervalMs ?? 4000);
    return () => clearInterval(t);
  }, [images.length, card.intervalMs]);

  const src = images[idx % images.length];

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.img
          key={src}
          src={src}
          alt={card.title ?? ''}
          loading="eager"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
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
    <div className="stat" style={{ height: '100%', justifyContent: 'space-between' }}>
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
  return (
    <>
      {id && (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1`}
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
        <span className="cake">🎂</span> Upcoming birthdays
      </div>
      <div className="bday-list">
        {people.length === 0 && <div className="bday-meta">No birthdays in this window</div>}
        {people.map((p) => (
          <div className="bday-row" key={p.name}>
            {p.photoUrl && <img src={p.photoUrl} alt={p.name} />}
            <div>
              <div className="bday-name">{p.name}</div>
              {p.team && <div className="bday-meta">{p.team}</div>}
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
  return (
    <div className="countdown" style={{ height: '100%', justifyContent: 'space-between' }}>
      <div className="cd-title">{card.title}</div>
      <div>
        <span className="cd-days">{days >= 0 ? days : 0}</span>
        <div className="cd-unit">{days === 1 ? 'day to go' : 'days to go'}</div>
      </div>
      <div className="cd-unit">{card.dateLabel}</div>
    </div>
  );
}
