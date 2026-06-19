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

// Indexed by campaign-tile count (0..4). Index 4 also covers 5+ campaigns
// (extra campaigns rotate through the slots over time).
//
// Fixed skeleton: birthday card is tall/portrait (h: 6) so the full list is
// never cropped.
export const TEMPLATES_BY_COUNT: Geom[][][] = [
  // 0 campaigns — just the utility tiles; birthday still tall.
  [
    // Template 0A: Birthday on left, Clock on right
    [
      { col: 4, row: 1, w: 9, h: 6 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday (tall)
    ],
    // Template 0B: Birthday on right, Clock on left
    [
      { col: 1, row: 1, w: 9, h: 6 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
    ],
  ],
  // 1 campaign — one big feature, birthday is tall.
  [
    // Template 1A: 3-column split (Clock left, Birthday right)
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 6 }, // c0
    ],
    // Template 1B: Clock laying horizontally at the bottom
    [
      { col: 4, row: 5, w: 9, h: 2 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 9, h: 4 }, // c0
    ],
    // Template 1C: Clock on right, Campaign 0 on left
    [
      { col: 9, row: 1, w: 4, h: 6 }, // clock
      { col: 6, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 1, row: 1, w: 5, h: 6 }, // c0
    ],
    // Template 1D: Clock on left, Campaign 0 on right
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 5, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 8, row: 1, w: 5, h: 6 }, // c0
    ],
  ],
  // 2 campaigns.
  [
    // Template 2A: Birthday left, Clock right
    [
      { col: 10, row: 1, w: 3, h: 6 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 4 }, // c0
      { col: 4, row: 5, w: 6, h: 2 }, // c1
    ],
    // Template 2B: Clock left, Birthday middle, Campaigns right
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 5, row: 1, w: 3, h: 6 }, // birthday
      { col: 8, row: 1, w: 5, h: 3 }, // c0
      { col: 8, row: 4, w: 5, h: 3 }, // c1
    ],
    // Template 2C: Asymmetrical Clock bottom-right
    [
      { col: 7, row: 5, w: 6, h: 2 }, // clock
      { col: 4, row: 1, w: 3, h: 6 }, // birthday
      { col: 7, row: 1, w: 6, h: 4 }, // c0
      { col: 1, row: 1, w: 3, h: 6 }, // c1
    ],
    // Template 2D: Birthday middle-right, Clock right
    [
      { col: 10, row: 1, w: 3, h: 6 }, // clock
      { col: 7, row: 1, w: 3, h: 6 }, // birthday
      { col: 1, row: 1, w: 6, h: 4 }, // c0
      { col: 1, row: 5, w: 6, h: 2 }, // c1
    ],
  ],
  // 3 campaigns.
  [
    // Template 3A: Clock left tower
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 6, h: 4 }, // c0
      { col: 4, row: 5, w: 3, h: 2 }, // c1
      { col: 7, row: 5, w: 3, h: 2 }, // c2
    ],
    // Template 3B: Clock right tower
    [
      { col: 10, row: 1, w: 3, h: 6 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 6, h: 3 }, // c0
      { col: 4, row: 4, w: 3, h: 3 }, // c1
      { col: 7, row: 4, w: 3, h: 3 }, // c2
    ],
    // Template 3C: Asymmetrical Clock bottom-right
    [
      { col: 11, row: 4, w: 2, h: 3 }, // clock
      { col: 5, row: 1, w: 3, h: 6 }, // birthday
      { col: 1, row: 1, w: 4, h: 6 }, // c0
      { col: 8, row: 1, w: 5, h: 3 }, // c1
      { col: 8, row: 4, w: 3, h: 3 }, // c2
    ],
    // Template 3D: Clock right tower, Birthday left tower
    [
      { col: 10, row: 1, w: 3, h: 6 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 6, h: 2 }, // c0
      { col: 4, row: 3, w: 3, h: 4 }, // c1
      { col: 7, row: 3, w: 3, h: 4 }, // c2
    ],
  ],
  // 4 (and 5+) campaigns.
  [
    // Template 4A: Clock left tower, Birthday right tower
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday (tall)
      { col: 4, row: 1, w: 3, h: 4 }, // c0
      { col: 4, row: 5, w: 3, h: 2 }, // c1
      { col: 7, row: 1, w: 3, h: 4 }, // c2
      { col: 7, row: 5, w: 3, h: 2 }, // c3
    ],
    // Template 4B: Clock left tower, Birthday right tower, split bottom campaigns
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 6, h: 4 }, // c0
      { col: 4, row: 5, w: 2, h: 2 }, // c1
      { col: 6, row: 5, w: 2, h: 2 }, // c2
      { col: 8, row: 5, w: 2, h: 2 }, // c3
    ],
    // Template 4C: Clock left tower, Birthday middle-left
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 4, row: 1, w: 3, h: 6 }, // birthday
      { col: 7, row: 1, w: 3, h: 4 }, // c0
      { col: 7, row: 5, w: 3, h: 2 }, // c1
      { col: 10, row: 1, w: 3, h: 4 }, // c2
      { col: 10, row: 5, w: 3, h: 2 }, // c3
    ],
    // Template 4D: Clock bottom-right banner
    [
      { col: 9, row: 5, w: 4, h: 2 }, // clock
      { col: 1, row: 1, w: 3, h: 6 }, // birthday
      { col: 4, row: 1, w: 5, h: 4 }, // c0
      { col: 4, row: 5, w: 3, h: 2 }, // c1
      { col: 7, row: 5, w: 2, h: 2 }, // c2
      { col: 9, row: 1, w: 4, h: 4 }, // c3
    ],
  ],
];

// Alternate template families selected when the birthday card is short (h: 3 or h: 2).
export const TEMPLATES_BY_COUNT_SHORT_BDAY: Geom[][][] = [
  // 0 campaigns — just the utility tiles; birthday card is short.
  [
    // Template 0S_A: Horizontal split
    [
      { col: 1, row: 1, w: 12, h: 3 }, // clock
      { col: 1, row: 4, w: 12, h: 3 }, // birthday (short)
    ],
    // Template 0S_B: Vertical split
    [
      { col: 8, row: 1, w: 5, h: 6 }, // clock
      { col: 1, row: 1, w: 7, h: 6 }, // birthday (short)
    ],
    // Template 0S_C: Asymmetrical towers
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 5, row: 1, w: 8, h: 6 }, // birthday (short)
    ],
  ],
  // 1 campaign — campaign in the middle, birthday is short.
  [
    // Template 1S_A: Clock taking top-right stack
    [
      { col: 8, row: 1, w: 5, h: 4 }, // clock
      { col: 8, row: 5, w: 5, h: 2 }, // birthday (short)
      { col: 1, row: 1, w: 7, h: 6 }, // c0
    ],
    // Template 1S_B: Clock left tower, Campaign 0 right stack
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 5, row: 5, w: 8, h: 2 }, // birthday (short)
      { col: 5, row: 1, w: 8, h: 4 }, // c0
    ],
    // Template 1S_C: Campaign 0 full height left, clock/birthday split right
    [
      { col: 9, row: 1, w: 4, h: 3 }, // clock
      { col: 9, row: 4, w: 4, h: 3 }, // birthday (short)
      { col: 1, row: 1, w: 8, h: 6 }, // c0
    ],
  ],
  // 2 campaigns — birthday is short.
  [
    // Template 2S_A: Clock left tower
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 4, w: 3, h: 3 }, // birthday (short)
      { col: 4, row: 1, w: 9, h: 3 }, // c0
      { col: 4, row: 4, w: 6, h: 3 }, // c1
    ],
    // Template 2S_B: Clock left tower, split campaign stacks
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 9, row: 5, w: 4, h: 2 }, // birthday (short)
      { col: 5, row: 1, w: 8, h: 4 }, // c0
      { col: 5, row: 5, w: 4, h: 2 }, // c1
    ],
    // Template 2S_C: Clock right tower
    [
      { col: 9, row: 1, w: 4, h: 6 }, // clock
      { col: 1, row: 5, w: 4, h: 2 }, // birthday (short)
      { col: 1, row: 1, w: 8, h: 4 }, // c0
      { col: 5, row: 5, w: 4, h: 2 }, // c1
    ],
    // Template 2S_D: Clock middle-bottom
    [
      { col: 4, row: 4, w: 6, h: 3 }, // clock
      { col: 10, row: 4, w: 3, h: 3 }, // birthday (short)
      { col: 4, row: 1, w: 9, h: 3 }, // c0
      { col: 1, row: 1, w: 3, h: 6 }, // c1
    ],
  ],
  // 3 campaigns — birthday is short.
  [
    // Template 3S_A: Clock left tower
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 5, w: 3, h: 2 }, // birthday (short)
      { col: 4, row: 1, w: 6, h: 4 }, // c0
      { col: 4, row: 5, w: 6, h: 2 }, // c1
      { col: 10, row: 1, w: 3, h: 4 }, // c2
    ],
    // Template 3S_B: Clock left tower, split height columns
    [
      { col: 1, row: 1, w: 4, h: 6 }, // clock
      { col: 10, row: 4, w: 3, h: 3 }, // birthday (short)
      { col: 5, row: 1, w: 5, h: 3 }, // c0
      { col: 5, row: 4, w: 5, h: 3 }, // c1
      { col: 10, row: 1, w: 3, h: 3 }, // c2
    ],
    // Template 3S_C: Clock bottom-left banner
    [
      { col: 1, row: 5, w: 6, h: 2 }, // clock
      { col: 7, row: 5, w: 2, h: 2 }, // birthday (short)
      { col: 1, row: 1, w: 8, h: 4 }, // c0
      { col: 9, row: 1, w: 4, h: 3 }, // c1
      { col: 9, row: 4, w: 4, h: 3 }, // c2
    ],
    // Template 3S_D: Clock bottom-right banner
    [
      { col: 7, row: 5, w: 6, h: 2 }, // clock
      { col: 5, row: 5, w: 2, h: 2 }, // birthday (short)
      { col: 5, row: 1, w: 8, h: 4 }, // c0
      { col: 1, row: 1, w: 4, h: 3 }, // c1
      { col: 1, row: 4, w: 4, h: 3 }, // c2
    ],
  ],
  // 4 (and 5+) campaigns — birthday is short.
  [
    // Template 4S_A: Clock left tower
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 5, w: 3, h: 2 }, // birthday (short)
      { col: 4, row: 1, w: 6, h: 4 }, // c0
      { col: 4, row: 5, w: 3, h: 2 }, // c1
      { col: 7, row: 5, w: 3, h: 2 }, // c2
      { col: 10, row: 1, w: 3, h: 4 }, // c3
    ],
    // Template 4S_B: Clock left tower, split campaigns bottom
    [
      { col: 1, row: 1, w: 3, h: 6 }, // clock
      { col: 10, row: 4, w: 3, h: 3 }, // birthday (short)
      { col: 4, row: 1, w: 9, h: 3 }, // c0
      { col: 4, row: 4, w: 2, h: 3 }, // c1
      { col: 6, row: 4, w: 2, h: 3 }, // c2
      { col: 8, row: 4, w: 2, h: 3 }, // c3
    ],
    // Template 4S_C: Clock bottom-left banner
    [
      { col: 1, row: 5, w: 6, h: 2 }, // clock
      { col: 7, row: 5, w: 2, h: 2 }, // birthday (short)
      { col: 1, row: 1, w: 8, h: 4 }, // c0
      { col: 9, row: 1, w: 4, h: 2 }, // c1
      { col: 9, row: 3, w: 4, h: 2 }, // c2
      { col: 9, row: 5, w: 4, h: 2 }, // c3
    ],
    // Template 4S_D: Clock left stack
    [
      { col: 1, row: 1, w: 4, h: 4 }, // clock
      { col: 1, row: 5, w: 4, h: 2 }, // birthday (short)
      { col: 5, row: 1, w: 8, h: 4 }, // c0
      { col: 5, row: 5, w: 3, h: 2 }, // c1
      { col: 8, row: 5, w: 3, h: 2 }, // c2
      { col: 11, row: 5, w: 2, h: 2 }, // c3
    ],
  ],
];
