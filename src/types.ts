// Shared data model for the dashboard. This mirrors what will later live in
// Firestore, so swapping the demo data layer for Firebase is a drop-in change.

export type CampaignStatus = 'ongoing' | 'upcoming';

export interface SocialStat {
  id: string;
  label: string; // e.g. "New followers", "Video views"
  value: string; // pre-formatted, e.g. "78K", "$24,414"
  delta?: string; // e.g. "+10%" — optional change indicator
  trend?: 'up' | 'down' | 'flat';
  platform?: string; // e.g. "Instagram", "TikTok"
}

export type CardKind =
  | 'brand'
  | 'clock'
  | 'hero'
  | 'portrait'
  | 'text'
  | 'stat'
  | 'video'
  | 'birthday'
  | 'countdown'
  | 'upcoming-events';

export type Tone = 'navy' | 'white';

export interface BirthdayPerson {
  name: string;
  photoUrl?: string;
  days: number;
  team?: string;
  dateLabel?: string;
}

export interface EventItem {
  title: string;
  startDate: string;
  days: number;
  dateLabel: string;
  tags?: string[];
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
  events?: EventItem[];
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

export interface Campaign {
  id: string;
  title: string;
  tagline: string; // short headline shown on the text tile
  status: CampaignStatus;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  images?: string[]; // all campaign images (cycled in image tiles); no orientation distinction
  imageIntervalSeconds?: number; // how long each image shows; 0/absent = auto
  youtubeUrl?: string; // full youtube watch/share url
  stats: SocialStat[];
  tags?: string[];
  showPermanently?: boolean;
  // Legacy image fields, kept so previously saved data still renders/migrates.
  keyVisualUrls?: string[];
  portraitUrls?: string[];
  keyVisualUrl?: string;
  portraitUrl?: string;
}

export interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
  photoUrl?: string;
  team?: string;
}

export interface Settings {
  brandName: string;
  rotationSeconds: number; // how often the bento layout rotates
  birthdayWindowDays: number; // how far ahead "upcoming" birthdays look
  eventWindowDays?: number; // how far ahead "upcoming" events look
  showSeconds: boolean;
  tickerMessages: string[];
  cornerRadius?: number;
  backgroundColor?: string;
  navyColor?: string;
  whiteColor?: string;
  minCards?: number;
  maxCards?: number;
}

export interface DashboardData {
  campaigns: Campaign[];
  birthdays: Birthday[];
  settings: Settings;
  pictures?: string[]; // "Pictures of the week" — standalone images, shown at random
  picturesShowPermanently?: boolean;
}
