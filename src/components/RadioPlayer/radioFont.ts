// src/components/RadioPlayer/radioFont.ts
//
// A hand-authored 5×7 dot-matrix font for the RadioPlayer readout. Glyphs are
// written ROW-major as '#'/'.' strings so the letterforms are auditable by eye in
// source (a column-packed bitmask would not be). They're converted once at module
// load into lit [col,row] cell lists, which is the shape the SVG renderer wants.
//
// Coverage is deliberately small — uppercase only (the authentic LED-sign look,
// and half the glyphs to maintain), digits, the punctuation a title/time needs,
// and three status glyphs keyed by private-use chars (play / pause / skip).

export const GLYPH_W = 5
export const GLYPH_H = 7
/** Blank columns inserted between glyphs. */
export const GLYPH_GAP = 1

// Status glyph keys — private symbols so they never collide with real text.
export const GLYPH_PLAY = ''
export const GLYPH_PAUSE = ''
export const GLYPH_SKIP = ''

const RAW: Record<string, string[]> = {
  ' ': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
  A: [
    '.###.',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  B: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#...#',
    '#...#',
    '####.',
  ],
  C: [
    '.####',
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '.####',
  ],
  D: [
    '###..',
    '#..#.',
    '#...#',
    '#...#',
    '#...#',
    '#..#.',
    '###..',
  ],
  E: [
    '#####',
    '#....',
    '#....',
    '####.',
    '#....',
    '#....',
    '#####',
  ],
  F: [
    '#####',
    '#....',
    '#....',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  G: [
    '.####',
    '#....',
    '#....',
    '#.###',
    '#...#',
    '#...#',
    '.####',
  ],
  H: [
    '#...#',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  I: [
    '#####',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '#####',
  ],
  J: [
    '..###',
    '...#.',
    '...#.',
    '...#.',
    '#..#.',
    '#..#.',
    '.##..',
  ],
  K: [
    '#...#',
    '#..#.',
    '#.#..',
    '##...',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  L: [
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#####',
  ],
  M: [
    '#...#',
    '##.##',
    '#.#.#',
    '#.#.#',
    '#...#',
    '#...#',
    '#...#',
  ],
  N: [
    '#...#',
    '##..#',
    '#.#.#',
    '#.#.#',
    '#..##',
    '#...#',
    '#...#',
  ],
  O: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  P: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  Q: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#..#.',
    '.##.#',
  ],
  R: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  S: [
    '.####',
    '#....',
    '#....',
    '.###.',
    '....#',
    '....#',
    '####.',
  ],
  T: [
    '#####',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  U: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  V: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
  ],
  W: [
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#.#.#',
    '##.##',
    '#...#',
  ],
  X: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '.#.#.',
    '#...#',
    '#...#',
  ],
  Y: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  Z: [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#####',
  ],
  '0': [
    '.###.',
    '#...#',
    '#..##',
    '#.#.#',
    '##..#',
    '#...#',
    '.###.',
  ],
  '1': [
    '..#..',
    '.##..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  '2': [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#####',
  ],
  '3': [
    '#####',
    '...#.',
    '..#..',
    '...#.',
    '....#',
    '#...#',
    '.###.',
  ],
  '4': [
    '...#.',
    '..##.',
    '.#.#.',
    '#..#.',
    '#####',
    '...#.',
    '...#.',
  ],
  '5': [
    '#####',
    '#....',
    '####.',
    '....#',
    '....#',
    '#...#',
    '.###.',
  ],
  '6': [
    '..##.',
    '.#...',
    '#....',
    '####.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '7': [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '.#...',
    '.#...',
  ],
  '8': [
    '.###.',
    '#...#',
    '#...#',
    '.###.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '9': [
    '.###.',
    '#...#',
    '#...#',
    '.####',
    '....#',
    '...#.',
    '.##..',
  ],
  ':': [
    '.....',
    '..#..',
    '..#..',
    '.....',
    '..#..',
    '..#..',
    '.....',
  ],
  '.': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '..#..',
    '..#..',
  ],
  '-': [
    '.....',
    '.....',
    '.....',
    '#####',
    '.....',
    '.....',
    '.....',
  ],
  "'": [
    '..#..',
    '..#..',
    '..#..',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
  '/': [
    '....#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#....',
  ],
  '!': [
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.....',
    '..#..',
  ],
  '?': [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '.....',
    '..#..',
  ],
  '&': [
    '.##..',
    '#..#.',
    '#..#.',
    '.##..',
    '#.#.#',
    '#..#.',
    '.##.#',
  ],
  '+': [
    '.....',
    '..#..',
    '..#..',
    '#####',
    '..#..',
    '..#..',
    '.....',
  ],
  '(': [
    '..##.',
    '.#...',
    '.#...',
    '.#...',
    '.#...',
    '.#...',
    '..##.',
  ],
  ')': [
    '.##..',
    '...#.',
    '...#.',
    '...#.',
    '...#.',
    '...#.',
    '.##..',
  ],
  ',': [
    '.....',
    '.....',
    '.....',
    '.....',
    '..#..',
    '..#..',
    '.#...',
  ],
  // ── Status glyphs ──────────────────────────────────────────────────────────
  [GLYPH_PLAY]: [
    '#....',
    '##...',
    '###..',
    '####.',
    '###..',
    '##...',
    '#....',
  ],
  [GLYPH_PAUSE]: [
    '.#.#.',
    '.#.#.',
    '.#.#.',
    '.#.#.',
    '.#.#.',
    '.#.#.',
    '.#.#.',
  ],
  [GLYPH_SKIP]: [
    '#...#',
    '##..#',
    '###.#',
    '#####',
    '###.#',
    '##..#',
    '#...#',
  ],
}

/** Lit cells for one glyph, as [col, row] pairs in a 5×7 box. */
export type GlyphCells = ReadonlyArray<readonly [number, number]>

function toCells(rows: string[]): GlyphCells {
  const cells: Array<readonly [number, number]> = []
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r]
    for (let c = 0; c < GLYPH_W; c++) {
      if (line[c] === '#') cells.push([c, r])
    }
  }
  return cells
}

const FONT: Record<string, GlyphCells> = Object.fromEntries(
  Object.entries(RAW).map(([ch, rows]) => [ch, toCells(rows)]),
)

/** Unknown glyphs fall back to a hollow box so a missing char is visible, not blank. */
const UNKNOWN: GlyphCells = toCells([
  '#####',
  '#...#',
  '#...#',
  '#...#',
  '#...#',
  '#...#',
  '#####',
])

export interface MatrixLayout {
  /** Lit cells across the whole string, [col, row]. */
  cells: Array<readonly [number, number]>
  /** Total column count (incl. inter-glyph gaps, excl. trailing gap). */
  cols: number
  rows: number
}

/**
 * Lay a string out into a single dot grid. Lowercase is upper-cased (the readout
 * is an LED sign). Returns absolute lit cells plus the grid width in columns.
 */
export function layoutText(text: string): MatrixLayout {
  const upper = text.toUpperCase()
  const cells: Array<readonly [number, number]> = []
  let x = 0
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i]
    const glyph = FONT[ch] ?? UNKNOWN
    for (const [c, r] of glyph) cells.push([x + c, r])
    x += GLYPH_W
    if (i < upper.length - 1) x += GLYPH_GAP
  }
  return { cells, cols: upper.length === 0 ? 0 : x, rows: GLYPH_H }
}
