import type { DashboardData } from '../types';
import { daysUntil, daysUntilBirthday, formatEventDate, upcomingBirthdays } from '../lib/util';

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
  imageUrl?: string;
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

  for (const c of campaigns) {
    if (c.keyVisualUrl) {
      pools.hero.push({
        id: `${c.id}-hero`,
        kind: 'hero',
        tone: 'navy',
        title: c.title,
        status: c.status,
        imageUrl: c.keyVisualUrl,
        dateLabel: formatEventDate(c.startDate),
      });
    }
    if (c.portraitUrl) {
      pools.portrait.push({
        id: `${c.id}-portrait`,
        kind: 'portrait',
        tone: 'navy',
        title: c.title,
        imageUrl: c.portraitUrl,
      });
    }
    pools.text.push({
      id: `${c.id}-text`,
      kind: 'text',
      tone: 'navy',
      title: c.title,
      tagline: c.tagline,
      status: c.status,
    });
    if (c.youtubeUrl) {
      pools.video.push({
        id: `${c.id}-video`,
        kind: 'video',
        tone: 'navy',
        title: c.title,
        url: c.youtubeUrl,
      });
    }
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

  const people = upcomingBirthdays(birthdays, settings.birthdayWindowDays)
    .slice(0, 5)
    .map((b) => ({ name: b.name, photoUrl: b.photoUrl, team: b.team, days: daysUntilBirthday(b.date) }));
  pools.birthday.push({ id: 'birthday', kind: 'birthday', tone: 'white', people });

  return pools;
}
