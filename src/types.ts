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
  showSeconds: boolean;
  tickerMessages: string[];
  cornerRadius?: number;
  backgroundColor?: string;
  navyColor?: string;
  whiteColor?: string;
}

export interface DashboardData {
  campaigns: Campaign[];
  birthdays: Birthday[];
  settings: Settings;
  pictures?: string[]; // "Pictures of the week" — standalone images, shown at random
  picturesShowPermanently?: boolean;
}
