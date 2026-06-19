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
  dateLabel?: string;
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

// A CampaignUnit is everything one campaign could show, as an ordered list of
// candidate cards. The display shows exactly ONE of these per scene, so a
// campaign is never represented by two tiles at once. variants[0] is the
// campaign's primary card (its video if it has one — prioritised — else its
// image gallery, else its tagline); the rest are its stats / countdown, which
// get airtime on later scenes.
export interface CampaignUnit {
  id: string;
  variants: Card[];
  showPermanently?: boolean;
}

export function buildCampaignUnits(data: DashboardData): CampaignUnit[] {
  const { campaigns, settings } = data;

  // Default per-image dwell: aim to show ~3 images before the layout rotates.
  const autoIntervalMs = Math.max(2000, Math.min(4000, Math.round((settings.rotationSeconds * 1000) / 3)));

  const units = campaigns.map((c) => {
    const intervalMs = c.imageIntervalSeconds && c.imageIntervalSeconds > 0 ? c.imageIntervalSeconds * 1000 : autoIntervalMs;
    const variants: Card[] = [];

    // Primary card — video wins, then images, then tagline.
    if (c.youtubeUrl && c.youtubeUrl.trim()) {
      variants.push({ id: `${c.id}-video`, kind: 'video', tone: 'navy', title: c.title, url: c.youtubeUrl });
    } else {
      const imgs = campaignImages(c);
      if (imgs.length) {
        variants.push({
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

    // Secondary cards — stats and an upcoming-event countdown.
    for (const s of c.stats) {
      variants.push({
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
    if (c.status === 'upcoming') {
      const imgs = campaignImages(c);
      variants.push({
        id: `${c.id}-cd`,
        kind: 'countdown',
        tone: 'navy',
        title: c.title,
        days: daysUntil(c.startDate),
        dateLabel: formatEventDate(c.startDate),
        images: imgs,
        intervalMs: autoIntervalMs,
      });
    }

    // Always have at least one card to show.
    if (variants.length === 0) {
      variants.push({ id: `${c.id}-text`, kind: 'text', tone: 'navy', title: c.title, tagline: c.tagline, status: c.status });
    }

    return { id: c.id, variants, showPermanently: c.showPermanently };
  });

  if (data.pictures && data.pictures.length > 0) {
    const shuffledPictures = [...data.pictures];
    // Fisher-Yates shuffle
    for (let i = shuffledPictures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPictures[i], shuffledPictures[j]] = [shuffledPictures[j], shuffledPictures[i]];
    }

    units.push({
      id: 'pictures-of-the-week',
      showPermanently: data.picturesShowPermanently,
      variants: [
        {
          id: 'pictures-of-the-week-card',
          kind: 'hero',
          tone: 'navy',
          title: 'Pictures of the week',
          images: shuffledPictures,
          intervalMs: autoIntervalMs,
        },
      ],
    });
  }

  return units;
}

function formatBirthdayDate(dateStr: string): string {
  const [mm, dd] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(mm, 10) - 1;
  const day = parseInt(dd, 10);
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${day} ${months[monthIdx]}`;
  }
  return dateStr;
}

// The fixed, non-campaign tiles shown in every scene.
export function buildUtilities(data: DashboardData): { brand: Card; clock: Card; birthday: Card } {
  const { settings, birthdays } = data;
  // Show every upcoming birthday in the window — the birthday tile is always a
  // tall portrait card, so the full list fits without cropping.
  const people = upcomingBirthdays(birthdays, settings.birthdayWindowDays).map((b) => ({
    name: b.name,
    photoUrl: b.photoUrl,
    team: b.team,
    days: daysUntilBirthday(b.date),
    dateLabel: formatBirthdayDate(b.date),
  }));

  return {
    brand: { id: 'brand', kind: 'brand', tone: 'navy', brandName: settings.brandName },
    clock: { id: 'clock', kind: 'clock', tone: 'white' },
    birthday: { id: 'birthday', kind: 'birthday', tone: 'white', people },
  };
}
