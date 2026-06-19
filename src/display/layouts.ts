import type { Card, CardKind, CardPools, Tone } from './cards';

// The bento canvas is 12 columns x 6 rows. Every template places the SAME set of
// roles (the INVENTORY below) — only their position and size change between
// templates. Because each role keeps a stable identity across templates, Framer
// Motion slides and resizes each tile to its new slot when the layout rotates,
// so the wall rearranges like a sliding puzzle instead of hard-cutting.
//
// Fewer, larger tiles (a big hero, a tall portrait) make it read as an editorial
// bento rather than a uniform grid. Sizes are aligned to a 3-col x 2-row base
// unit so every template tiles the canvas perfectly with no gaps.

export const GRID_COLS = 12;
export const GRID_ROWS = 6;

export interface Geom {
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface Role {
  cat: CardKind;
  tone?: Tone; // colour override for rhythm
}

// The fixed roster, in a stable order. Each TEMPLATE below is an array of
// geometries aligned to this same order (index 0 = brand, 1 = clock, ...).
export const INVENTORY: Role[] = [
  { cat: 'brand', tone: 'navy' }, // 0
  { cat: 'clock', tone: 'white' }, // 1
  { cat: 'hero' }, // 2  — the big feature
  { cat: 'portrait' }, // 3  — tall image
  { cat: 'video', tone: 'navy' }, // 4
  { cat: 'stat', tone: 'white' }, // 5
  { cat: 'birthday', tone: 'white' }, // 6
];

// Each template: one Geom per INVENTORY role, in the same order. All four are
// verified perfect tilings of the 12x6 canvas.
//
// The VIDEO role is always given a landscape slot close to its native 16:9 (a
// 6x3 cell is ~1.9:1, a 4x2 cell is ~1.95:1) so video fills with minimal crop,
// rather than being forced into a wide/short or tall cell. It still moves and
// (mildly) resizes between templates, so the layout stays dynamic.
export const TEMPLATES: Geom[][] = [
  // A — hero top-left, video beneath it, tall portrait right
  [
    { col: 7, row: 1, w: 3, h: 2 }, // brand
    { col: 7, row: 3, w: 3, h: 2 }, // clock
    { col: 1, row: 1, w: 6, h: 3 }, // hero
    { col: 10, row: 1, w: 3, h: 4 }, // portrait
    { col: 1, row: 4, w: 6, h: 3 }, // video (6x3 ~ landscape)
    { col: 7, row: 5, w: 3, h: 2 }, // stat
    { col: 10, row: 5, w: 3, h: 2 }, // birthday
  ],
  // B — tall portrait left, hero over video in the centre
  [
    { col: 1, row: 5, w: 3, h: 2 }, // brand
    { col: 10, row: 1, w: 3, h: 2 }, // clock
    { col: 4, row: 1, w: 6, h: 3 }, // hero
    { col: 1, row: 1, w: 3, h: 4 }, // portrait
    { col: 4, row: 4, w: 6, h: 3 }, // video (6x3 ~ landscape)
    { col: 10, row: 3, w: 3, h: 2 }, // stat
    { col: 10, row: 5, w: 3, h: 2 }, // birthday
  ],
  // C — hero/video stack on the right, info column left
  [
    { col: 4, row: 1, w: 3, h: 2 }, // brand
    { col: 4, row: 3, w: 3, h: 2 }, // clock
    { col: 7, row: 1, w: 6, h: 3 }, // hero
    { col: 1, row: 1, w: 3, h: 4 }, // portrait
    { col: 7, row: 4, w: 6, h: 3 }, // video (6x3 ~ landscape)
    { col: 4, row: 5, w: 3, h: 2 }, // stat
    { col: 1, row: 5, w: 3, h: 2 }, // birthday
  ],
  // D — wide hero banner top, compact landscape video mid-left
  [
    { col: 4, row: 5, w: 5, h: 2 }, // brand
    { col: 10, row: 1, w: 3, h: 2 }, // clock
    { col: 1, row: 1, w: 9, h: 2 }, // hero
    { col: 1, row: 3, w: 3, h: 4 }, // portrait
    { col: 4, row: 3, w: 4, h: 2 }, // video (4x2 ~ landscape)
    { col: 9, row: 5, w: 4, h: 2 }, // stat
    { col: 8, row: 3, w: 5, h: 2 }, // birthday
  ],
];

// If a role's preferred category has no cards, fall back to a related one so the
// canvas never shows a hole.
const FALLBACK: Record<CardKind, CardKind[]> = {
  brand: ['text', 'clock'],
  clock: ['brand', 'stat'],
  hero: ['portrait', 'text'],
  portrait: ['hero', 'text'],
  text: ['hero', 'stat'],
  stat: ['text', 'countdown'],
  video: ['hero', 'portrait'],
  birthday: ['text', 'stat'],
  countdown: ['hero', 'text'],
};

function pickPool(pools: CardPools, cat: CardKind): { cat: CardKind; cards: Card[] } | null {
  if (pools[cat].length) return { cat, cards: pools[cat] };
  for (const alt of FALLBACK[cat]) {
    if (pools[alt].length) return { cat: alt, cards: pools[alt] };
  }
  return null;
}

export interface PlacedTile extends Geom {
  role: number; // stable key across templates → smooth morph
  card: Card;
}

// Build one scene. The geometry comes from the rotating template; the content for
// each role advances on `contentCycle` (which ticks once per full loop of
// templates) so cards cycle without disrupting the layout rearrangement.
export function buildScene(template: Geom[], pools: CardPools, contentCycle: number): PlacedTile[] {
  const tiles: PlacedTile[] = [];

  INVENTORY.forEach((role, i) => {
    const picked = pickPool(pools, role.cat);
    if (!picked) return;
    const card = picked.cards[(contentCycle + i) % picked.cards.length];
    tiles.push({
      ...template[i],
      role: i,
      card: role.tone ? { ...card, tone: role.tone } : card,
    });
  });

  return tiles;
}
