export interface BarMark {
  x: number
  bar: number
}

export function beatsPerSecond(bpm: number): number {
  return bpm / 60
}

export function secondsToX(seconds: number, pxPerBeat: number, bpm: number): number {
  return seconds * beatsPerSecond(bpm) * pxPerBeat
}

export function xToSeconds(x: number, pxPerBeat: number, bpm: number): number {
  if (pxPerBeat <= 0 || bpm <= 0) return 0
  return x / (beatsPerSecond(bpm) * pxPerBeat)
}

export function snapXToGrid(x: number, pxPerBeat: number): number {
  if (pxPerBeat <= 0) return x
  return Math.round(x / pxPerBeat) * pxPerBeat
}

export function formatBarsBeats(seconds: number, bpm: number, numerator: number): string {
  const totalBeats = seconds * beatsPerSecond(bpm)
  const bar  = Math.floor(totalBeats / numerator) + 1
  const beat = Math.floor(totalBeats % numerator) + 1
  return `bar ${bar}, beat ${beat}`
}

export function buildBarMarks(
  durationSeconds: number,
  bpm: number,
  numerator: number,
  pxPerBeat: number,
): BarMark[] {
  const bps       = beatsPerSecond(bpm)
  const totalBars = Math.ceil(durationSeconds * bps / numerator) + 1
  return Array.from({ length: totalBars }, (_, i) => ({
    x:   i * numerator * pxPerBeat,
    bar: i + 1,
  }))
}
