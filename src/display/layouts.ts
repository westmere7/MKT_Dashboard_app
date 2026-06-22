// The bento canvas is 12 columns x 6 rows. A scene is always composed of two
// utility tiles (clock, birthday) plus N "campaign" tiles — one per
// distinct campaign, so the same campaign is never shown twice in one scene.
//
// We pick a template family by N (the number of campaign tiles): fewer distinct
// campaigns means fewer, BIGGER tiles that still fill the screen, rather than
// repeating a campaign or leaving a gap. Each family has multiple templates so
// the layout keeps rotating/morphing. Every template below is a verified perfect
// tiling of the 12x6 canvas.
//
// Slot order in every template: [clock, birthday, campaign0, campaign1, …].

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

// Indexed by campaign-tile count (0..4).
//
// In every template:
// - template[0] is for Clock (permanent left column, col: 1, w: 3)
// - template[1] is for Birthday (permanent left column, col: 1, w: 3)
// - template[2...] tile the remaining area on the right (col: 4, w: 9, h: 6)
//
// Clock and Birthday geometries are placeholders here; their height will be
// dynamically calculated and overridden in Display.tsx based on the contents.
export const TEMPLATES_BY_COUNT: Geom[][][] = [
  // 0 campaigns: Clock and Birthday fill the left column
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
    ],
  ],
  // 1 campaign: Campaign 0 takes the entire remaining space on the right
  [
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 9, h: 6 }, // c0
    ],
  ],
  // 2 campaigns: Tiling the 9x6 area into 2 tiles
  [
    // Variant A: Horizontal split
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 9, h: 3 }, // c0
      { col: 4, row: 4, w: 9, h: 3 }, // c1
    ],
    // Variant B: Horizontal split reversed
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 4, w: 9, h: 3 }, // c0
      { col: 4, row: 1, w: 9, h: 3 }, // c1
    ],
    // Variant C: Vertical split
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 5, h: 6 }, // c0
      { col: 9, row: 1, w: 4, h: 6 }, // c1
    ],
    // Variant D: Vertical split reversed
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 8, row: 1, w: 5, h: 6 }, // c0
      { col: 4, row: 1, w: 4, h: 6 }, // c1
    ],
  ],
  // 3 campaigns: Tiling the 9x6 area into 3 tiles
  [
    // Variant A: One wide column, two stacked on the right
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 5, h: 6 }, // c0
      { col: 9, row: 1, w: 4, h: 3 }, // c1
      { col: 9, row: 4, w: 4, h: 3 }, // c2
    ],
    // Variant B: One full-width top row, two split on bottom
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 9, h: 3 }, // c0
      { col: 4, row: 4, w: 5, h: 3 }, // c1
      { col: 9, row: 4, w: 4, h: 3 }, // c2
    ],
    // Variant C: One wide column on right, two stacked on left
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 8, row: 1, w: 5, h: 6 }, // c0
      { col: 4, row: 1, w: 4, h: 3 }, // c1
      { col: 4, row: 4, w: 4, h: 3 }, // c2
    ],
    // Variant D: One full-width bottom row, two split on top
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 4, w: 9, h: 3 }, // c0
      { col: 4, row: 1, w: 5, h: 3 }, // c1
      { col: 9, row: 1, w: 4, h: 3 }, // c2
    ],
  ],
  // 4 campaigns: Tiling the 9x6 area into 4 tiles
  [
    // Variant A: Regular 2x2 grid
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 5, h: 3 }, // c0
      { col: 4, row: 4, w: 5, h: 3 }, // c1
      { col: 9, row: 1, w: 4, h: 3 }, // c2
      { col: 9, row: 4, w: 4, h: 3 }, // c3
    ],
    // Variant B: Asymmetric 2x2 grid
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 4, h: 3 }, // c0
      { col: 4, row: 4, w: 4, h: 3 }, // c1
      { col: 8, row: 1, w: 5, h: 3 }, // c2
      { col: 8, row: 4, w: 5, h: 3 }, // c3
    ],
    // Variant C: One large on left, three stacked/split
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 5, h: 4 }, // c0
      { col: 4, row: 5, w: 5, h: 2 }, // c1
      { col: 9, row: 1, w: 4, h: 3 }, // c2
      { col: 9, row: 4, w: 4, h: 3 }, // c3
    ],
    // Variant D: One large full-width top row, three split bottom rows (matches user screenshot)
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 9, h: 4 }, // c0
      { col: 4, row: 5, w: 3, h: 2 }, // c1
      { col: 7, row: 5, w: 3, h: 2 }, // c2
      { col: 10, row: 5, w: 3, h: 2 }, // c3
    ],
  ],
  // 5 campaigns: Tiling the 9x6 area into 5 tiles
  [
    // Variant A: 2 tiles top, 3 tiles bottom
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 4, h: 3 }, // c0
      { col: 8, row: 1, w: 5, h: 3 }, // c1
      { col: 4, row: 4, w: 3, h: 3 }, // c2
      { col: 7, row: 4, w: 3, h: 3 }, // c3
      { col: 10, row: 4, w: 3, h: 3 }, // c4
    ],
    // Variant B: 3 tiles top, 2 tiles bottom
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 3, h: 3 }, // c0
      { col: 7, row: 1, w: 3, h: 3 }, // c1
      { col: 10, row: 1, w: 3, h: 3 }, // c2
      { col: 4, row: 4, w: 4, h: 3 }, // c3
      { col: 8, row: 4, w: 5, h: 3 }, // c4
    ],
    // Variant C: 1 large column on left, 4 stacked/split on right
    [
      { col: 1, row: 1, w: 3, h: 3 }, // clock
      { col: 1, row: 4, w: 3, h: 3 }, // birthday
      { col: 4, row: 1, w: 4, h: 6 }, // c0
      { col: 8, row: 1, w: 2, h: 3 }, // c1
      { col: 8, row: 4, w: 2, h: 3 }, // c2
      { col: 10, row: 1, w: 3, h: 3 }, // c3
      { col: 10, row: 4, w: 3, h: 3 }, // c4
    ],
  ],
];

export const TEMPLATES_BY_COUNT_SHORT_BDAY = TEMPLATES_BY_COUNT;

