// src/components/PianoRoll/pianoRollMath.ts

export const LANE_H_MD   = 14   // px per semitone, md
export const LANE_H_SM   = 10   // px per semitone, sm
export const KEY_W_MD    = 88   // keyboard strip width, md
export const KEY_W_SM    = 64   // keyboard strip width, sm
export const RESIZE_ZONE = 6    // px from note right edge → resize cursor

const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

export function isBlackKey(pitch: number): boolean {
  return BLACK_KEYS.has(pitch % 12)
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function midiNoteToName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1
  return `${NOTE_NAMES[pitch % 12]}${octave}`
}

export function noteLabel(pitch: number, startBeats: number, division: number): string {
  const name = midiNoteToName(pitch)
  const bar  = Math.floor(startBeats / 4) + 1
  const beat = Math.floor(startBeats % 4) + 1
  const divStr =
    division === 0.25 ? '1/16' :
    division === 0.5  ? '1/8'  :
    division === 1    ? '1/4'  :
    `${division} beat`
  return `${name}, bar ${bar} beat ${beat}, ${divStr}`
}

// pitchToY: top of the lane row for `pitch`.
// Pitches rendered top=hi → bottom=lo (standard piano-roll orientation).
export function pitchToY(pitch: number, hiNote: number, laneH: number): number {
  return (hiNote - pitch) * laneH
}

// yToPitch: MIDI pitch at y (y=0 → hiNote).
export function yToPitch(y: number, hiNote: number, laneH: number): number {
  return hiNote - Math.floor(y / laneH)
}

export function beatsToX(beats: number, pxPerBeat: number): number {
  return beats * pxPerBeat
}

export function xToBeats(x: number, pxPerBeat: number): number {
  if (pxPerBeat <= 0) return 0
  return x / pxPerBeat
}

export function snapToGrid(beats: number, division: number): number {
  if (division <= 0) return beats
  return Math.round(beats / division) * division
}

export function clampPitch(pitch: number, loNote: number, hiNote: number): number {
  return Math.max(loNote, Math.min(hiNote, pitch))
}

// Returns pitches in descending order (highest → lowest) for top→bottom rendering.
export function buildPitchRange(loNote: number, hiNote: number): number[] {
  const result: number[] = []
  for (let p = hiNote; p >= loNote; p--) result.push(p)
  return result
}
