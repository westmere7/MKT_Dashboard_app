import type { DashboardData } from '../types';
import { campaignImages, daysUntil, daysUntilBirthday, formatEventDate, upcomingBirthdays } from '../lib/util';

// A Card is one renderable bento tile. We keep it a single flat shape (rather
// than a union) so tiles can read just the fields they need. `id` is stable
// across layout rotations so Framer Motion can smoothly morph a tile when it
// moves to a new slot.

export type CardKind =
  | 'brand'
  | 'clock'
  | 'hero'
  | 'portrait'
  | 'text'
  | 'stat'
  | 'video'
  | 'birthday'
  | 'countdown';

export type Tone = 'navy' | 'white';

export interface BirthdayPerson {
  name: string;
  photoUrl?: string;
  days: number;
  team?: string;
}

export interface Card {
  id: string;
  kind: CardKind;
  tone: Tone;
  title?: string;
  tagline?: string;
  status?: string;
  imageUrl?: string; // first image (back-compat / single-image cards)
  images?: string[]; // full gallery to cycle through
  intervalMs?: number; // per-image dwell time when cycling
  url?: string;
  label?: string;
  value?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  platform?: string;
  brandName?: string;
  days?: number;
  dateLabel?: string;
  people?: BirthdayPerson[];
}

export type CardPools = Record<CardKind, Card[]>;

export function buildPools(data: DashboardData): CardPools {
  const { campaigns, birthdays, settings } = data;

  const pools: CardPools = {
    brand: [{ id: 'brand', kind: 'brand', tone: 'navy', brandName: settings.brandName }],
    clock: [{ id: 'clock', kind: 'clock', tone: 'white' }],
    hero: [],
    portrait: [],
    text: [],
    stat: [],
    video: [],
    birthday: [],
    countdown: [],
  };

  // Default per-image dwell: aim to show ~3 images before the layout rotates, so
  // a gallery cycles through "some" of its pictures within one scene. Clamped to
  // a comfortable 2-4s. A per-campaign override wins when set (> 0).
  const autoIntervalMs = Math.max(2000, Math.min(4000, Math.round((settings.rotationSeconds * 1000) / 3)));

  // One unified image pool — no landscape/portrait distinction; image tiles
  // cover-fill whatever slot they land in. Both image roles draw from this.
  const imageCards: Card[] = [];

  for (const c of campaigns) {
    const intervalMs = c.imageIntervalSeconds && c.imageIntervalSeconds > 0 ? c.imageIntervalSeconds * 1000 : autoIntervalMs;
    const hasVideo = !!(c.youtubeUrl && c.youtubeUrl.trim());

    if (hasVideo) {
      // A video campaign is represented by its video — prioritise it over its
      // stills, which are not also shown as image tiles.
      pools.video.push({
        id: `${c.id}-video`,
        kind: 'video',
        tone: 'navy',
        title: c.title,
        url: c.youtubeUrl,
      });
    } else {
      const imgs = campaignImages(c);
      if (imgs.length) {
        imageCards.push({
          id: `${c.id}-img`,
          kind: 'hero',
          tone: 'navy',
          title: c.title,
          status: c.status,
          imageUrl: imgs[0],
          images: imgs,
          intervalMs,
          dateLabel: formatEventDate(c.startDate),
        });
      }
    }

    pools.text.push({
      id: `${c.id}-text`,
      kind: 'text',
      tone: 'navy',
      title: c.title,
      tagline: c.tagline,
      status: c.status,
    });
    if (c.status === 'upcoming') {
      pools.countdown.push({
        id: `${c.id}-cd`,
        kind: 'countdown',
        tone: 'navy',
        title: c.title,
        days: daysUntil(c.startDate),
        dateLabel: formatEventDate(c.startDate),
      });
    }
    for (const s of c.stats) {
      pools.stat.push({
        id: s.id,
        kind: 'stat',
        tone: 'white',
        label: s.label,
        value: s.value,
        delta: s.delta,
        trend: s.trend,
        platform: s.platform,
      });
    }
  }

  // Both image roles share the one pool; the content offset per role spreads
  // different campaigns across the two image slots in a scene.
  pools.hero = imageCards;
  pools.portrait = imageCards;

  const people = upcomingBirthdays(birthdays, settings.birthdayWindowDays)
    .slice(0, 5)
    .map((b) => ({ name: b.name, photoUrl: b.photoUrl, team: b.team, days: daysUntilBirthday(b.date) }));
  pools.birthday.push({ id: 'birthday', kind: 'birthday', tone: 'white', people });

  return pools;
}
