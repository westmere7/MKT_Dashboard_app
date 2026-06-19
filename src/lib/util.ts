import type { Birthday, Campaign } from '../types';

// Extract a YouTube video id from any common url form.
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function youtubeThumb(url?: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// Days until the next occurrence of a MM-DD birthday from `from`.
export function daysUntilBirthday(mmdd: string, from = new Date()): number {
  const [mm, dd] = mmdd.split('-').map(Number);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(from.getFullYear(), mm - 1, dd);
  if (next < today) next = new Date(from.getFullYear() + 1, mm - 1, dd);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export function upcomingBirthdays(birthdays: Birthday[], windowDays: number): Birthday[] {
  return birthdays
    .map((b) => ({ b, d: daysUntilBirthday(b.date) }))
    .filter(({ d }) => d <= windowDays)
    .sort((a, b) => a.d - b.d)
    .map(({ b }) => b);
}

// Days until an event date (ISO yyyy-mm-dd). Negative once it has passed.
export function daysUntil(iso: string, from = new Date()): number {
  const target = new Date(iso + 'T00:00:00');
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function birthdayLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

// Clean a list of URLs: trim, drop blanks and duplicates.
export function cleanUrls(raw: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const u = (s ?? '').trim();
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

// All of a campaign's images as one flat list, regardless of how they were
// stored. Prefers the unified `images` field, falling back to (and merging) the
// older landscape/portrait fields so previously saved data keeps working. There
// is no landscape/portrait distinction any more — just a bunch of images.
export function campaignImages(c: Campaign): string[] {
  if (c.images && c.images.length) return cleanUrls(c.images);
  return cleanUrls([...(c.keyVisualUrls ?? []), ...(c.portraitUrls ?? []), c.keyVisualUrl, c.portraitUrl]);
}
