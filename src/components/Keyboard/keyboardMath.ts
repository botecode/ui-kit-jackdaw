// src/components/Keyboard/keyboardMath.ts
//
// Pure layout + note math for the on-screen Keyboard. Kept per-component (not
// imported from PianoRoll) so the two can evolve independently — a keyboard
// lays keys out horizontally (white keys tiled, black keys straddling the
// boundary), a piano-roll stacks pitch lanes vertically. Shared conventions
// (MIDI ints, black-key set, note names) are cheap to restate and avoid a
// premature cross-component abstraction.

export const KEY_W_MD = 34 // white-key width (px), md
export const KEY_W_SM = 22 // white-key width (px), sm

export const KEY_H_MD = 132 // keybed height (px), md
export const KEY_H_SM = 92 // keybed height (px), sm

// Black keys are narrower and shorter than white keys (fractions of white).
export const BLACK_W_RATIO = 0.62
export const BLACK_H_RATIO = 0.62

// Velocity mapping: a strike near the top (back) of a key is soft, near the
// bottom (front, where a finger naturally lands) is loud — mirrors real key
// dynamics. Clamp to a musical floor so a top-edge tap still sounds.
export const VEL_MIN = 45
export const VEL_MAX = 127
export const DEFAULT_VELOCITY = 100

const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

export function isBlackKey(note: number): boolean {
  return BLACK_KEYS.has(((note % 12) + 12) % 12)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1
  return `${NOTE_NAMES[((note % 12) + 12) % 12]}${octave}`
}

export function clampNote(note: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, note))
}

// A keyboard reads best when both ends are white keys (real pianos never end on
// a black key). Widen the range outward to the nearest white keys.
export function normalizeRange(startNote: number, endNote: number): [number, number] {
  let lo = Math.min(startNote, endNote)
  let hi = Math.max(startNote, endNote)
  if (isBlackKey(lo)) lo -= 1
  if (isBlackKey(hi)) hi += 1
  return [lo, hi]
}

export interface KeyDescriptor {
  note: number
  name: string
  isBlack: boolean
  // Index of this key among the white keys. White keys: their own 0-based
  // position. Black keys: the count of white keys below them — i.e. the
  // white/white boundary they straddle. Drives the pixel `left` in `keyLeft`.
  whiteIndex: number
}

// Build the ascending list of keys for the (already-normalized) range, plus the
// total white-key count. Order is chromatic (note-ascending) so roving focus
// with ←/→ walks the keys left-to-right as drawn.
export function buildKeys(startNote: number, endNote: number): {
  keys: KeyDescriptor[]
  whiteCount: number
} {
  const [lo, hi] = normalizeRange(startNote, endNote)
  const keys: KeyDescriptor[] = []
  let whiteSeen = 0
  for (let note = lo; note <= hi; note++) {
    const black = isBlackKey(note)
    keys.push({
      note,
      name: midiNoteToName(note),
      isBlack: black,
      // A black key straddles the boundary after the white keys seen so far.
      whiteIndex: whiteSeen,
    })
    if (!black) whiteSeen++
  }
  return { keys, whiteCount: whiteSeen }
}

// Pixel geometry for a single key given the white-key width.
export function keyGeometry(
  key: KeyDescriptor,
  whiteW: number,
): { left: number; width: number } {
  const blackW = whiteW * BLACK_W_RATIO
  if (key.isBlack) {
    // Centre the black key on the boundary between its lower and upper white.
    return { left: key.whiteIndex * whiteW - blackW / 2, width: blackW }
  }
  return { left: key.whiteIndex * whiteW, width: whiteW }
}

// Total drawn width of the keybed.
export function keybedWidth(whiteCount: number, whiteW: number): number {
  return whiteCount * whiteW
}

// Velocity from a vertical strike ratio (0 = top/back → 1 = bottom/front).
export function velocityFromRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return DEFAULT_VELOCITY
  const r = Math.max(0, Math.min(1, ratio))
  return Math.round(VEL_MIN + r * (VEL_MAX - VEL_MIN))
}

// QWERTY musical-typing layout (one screen of a piano, home row = white keys).
// Values are semitone offsets from the base C. Opt-in via the `computerKeyboard`
// prop; letters never collide with the roving keys (←/→/Home/End/Enter/Space).
export const QWERTY_TO_SEMITONE: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6,
  g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15,
}

// z / x shift the typing octave down / up.
export const QWERTY_OCTAVE_DOWN = 'z'
export const QWERTY_OCTAVE_UP = 'x'

// Lowest C at or above `note` — the base for QWERTY typing.
export function baseCFor(note: number): number {
  return Math.ceil(note / 12) * 12
}
