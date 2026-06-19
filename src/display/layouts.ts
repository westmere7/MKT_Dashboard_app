// The bento canvas is 12 columns x 6 rows. A scene is always composed of three
// utility tiles (brand, clock, birthday) plus N "campaign" tiles — one per
// distinct campaign, so the same campaign is never shown twice in one scene.
//
// We pick a template family by N (the number of campaign tiles): fewer distinct
// campaigns means fewer, BIGGER tiles that still fill the screen, rather than
// repeating a campaign or leaving a gap. Each family has multiple templates so
// the layout keeps rotating/morphing. Every template below is a verified perfect
// tiling of the 12x6 canvas.
//
// Slot order in every template: [brand, clock, birthday, campaign0, campaign1, …].

export const GRID_COLS = 12;
export const GRID_ROWS = 6;

export interface Geom {
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface PlacedTile extends Geom {
  role: number; // stable key across templates in a family → smooth morph
  card: import('./cards').Card;
}

// Indexed by campaign-tile count (0..4). Index 4 also covers 5+ campaigns
// (extra campaigns rotate through the four slots over time).
//
// Fixed skeleton (keeps the birthday card ALWAYS tall/portrait so the full list
// is never cropped): a 3-wide utility column (brand + clock) on one side, a
// 3-wide full-height birthday column on the other, and the campaign tiles in the
// 6-wide middle. Variants mirror the columns and re-tile the middle for variety.
export const TEMPLATES_BY_COUNT: Geom[][][] = [
  // 0 campaigns — just the utility tiles; birthday still tall.
  [
    [
      { col: 1, row: 1, w: 4, h: 6 }, // brand
      { col: 5, row: 1, w: 4, h: 6 }, // clock
      { col: 9, row: 1, w: 4, h: 6 }, // birthday (tall)
    ],
  ],
  // 1 campaign — one big feature in the middle.
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // brand
      { col: 1, row: 4, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 6 }, // c0
    ],
    [
      { col: 1, row: 4, w: 3, h: 3 }, // brand (shifted down)
      { col: 1, row: 1, w: 3, h: 3 }, // clock (shifted up)
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 6 }, // c0
    ],
  ],
  // 2 campaigns.
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // brand
      { col: 1, row: 4, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 3 }, // c0
      { col: 4, row: 4, w: 6, h: 3 }, // c1
    ],
    [
      { col: 1, row: 4, w: 3, h: 3 }, // brand
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 3, h: 6 }, // c0 (vertical split!)
      { col: 7, row: 1, w: 3, h: 6 }, // c1
    ],
  ],
  // 3 campaigns.
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // brand
      { col: 1, row: 4, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 3 }, // c0
      { col: 4, row: 4, w: 3, h: 3 }, // c1
      { col: 7, row: 4, w: 3, h: 3 }, // c2
    ],
    [
      { col: 1, row: 4, w: 3, h: 3 }, // brand
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 3, h: 3 }, // c0
      { col: 4, row: 4, w: 3, h: 3 }, // c1
      { col: 7, row: 1, w: 3, h: 6 }, // c2 (tall!)
    ],
  ],
  // 4 (and 5+) campaigns — campaigns rotate through the slots over time.
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // brand
      { col: 1, row: 4, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 3, h: 3 }, // c0
      { col: 7, row: 1, w: 3, h: 3 }, // c1
      { col: 4, row: 4, w: 3, h: 3 }, // c2
      { col: 7, row: 4, w: 3, h: 3 }, // c3
    ],
    [
      { col: 1, row: 4, w: 3, h: 3 }, // brand
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 6, h: 3 }, // c0 (wide banner!)
      { col: 4, row: 4, w: 2, h: 3 }, // c1
      { col: 6, row: 4, w: 2, h: 3 }, // c2
      { col: 8, row: 4, w: 2, h: 3 }, // c3
    ],
    [
      { col: 1, row: 1, w: 3, h: 3 }, // brand
      { col: 1, row: 4, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 3, h: 6 }, // c0
      { col: 7, row: 1, w: 3, h: 2 }, // c1
      { col: 7, row: 3, w: 3, h: 2 }, // c2
      { col: 7, row: 5, w: 3, h: 2 }, // c3
    ],
    [
      { col: 1, row: 4, w: 3, h: 3 }, // brand
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 3, h: 6 }, // c0
      { col: 7, row: 1, w: 3, h: 2 }, // c1
      { col: 7, row: 3, w: 3, h: 2 }, // c2
      { col: 7, row: 5, w: 3, h: 2 }, // c3
    ],
  ],
];
