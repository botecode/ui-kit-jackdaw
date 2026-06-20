import { describe, it, expect } from 'vitest'
import {
  beatsPerSecond,
  secondsToX,
  xToSeconds,
  snapXToGrid,
  formatBarsBeats,
  buildBarMarks,
} from './rulerMath'

// ─── beatsPerSecond ────────────────────────────────────────────────────────────

describe('beatsPerSecond', () => {
  it('120 BPM → 2 bps',  () => expect(beatsPerSecond(120)).toBe(2))
  it('60 BPM → 1 bps',   () => expect(beatsPerSecond(60)).toBe(1))
  it('90 BPM → 1.5 bps', () => expect(beatsPerSecond(90)).toBe(1.5))
})

// ─── secondsToX ───────────────────────────────────────────────────────────────

describe('secondsToX', () => {
  it('0s → 0px',                   () => expect(secondsToX(0, 64, 120)).toBe(0))
  it('1s at 120 BPM 64px → 128px', () => expect(secondsToX(1, 64, 120)).toBe(128))
  it('0.5s at 120 BPM 64px → 64px',() => expect(secondsToX(0.5, 64, 120)).toBe(64))
  it('1s at 60 BPM 64px → 64px',   () => expect(secondsToX(1, 64, 60)).toBe(64))
})

// ─── xToSeconds ───────────────────────────────────────────────────────────────

describe('xToSeconds', () => {
  it('0px → 0s',                   () => expect(xToSeconds(0, 64, 120)).toBe(0))
  it('128px at 120 BPM 64px → 1s', () => expect(xToSeconds(128, 64, 120)).toBeCloseTo(1))
  it('64px at 120 BPM 64px → 0.5s',() => expect(xToSeconds(64, 64, 120)).toBeCloseTo(0.5))
  it('round-trips with secondsToX', () => {
    const t = 2.317
    expect(xToSeconds(secondsToX(t, 48, 100), 48, 100)).toBeCloseTo(t, 10)
  })
  it('pxPerBeat=0 returns 0 (guard)',() => expect(xToSeconds(64, 0, 120)).toBe(0))
})

// ─── snapXToGrid ──────────────────────────────────────────────────────────────

describe('snapXToGrid', () => {
  it('exact beat → unchanged', () => expect(snapXToGrid(64, 64)).toBe(64))
  it('70px (closer to 64) → 64px', () => expect(snapXToGrid(70, 64)).toBe(64))
  it('100px (closer to 128) → 128px', () => expect(snapXToGrid(100, 64)).toBe(128))
  it('32px (equidistant, rounds up) → 64px', () => expect(snapXToGrid(32, 64)).toBe(64))
  it('0px → 0px', () => expect(snapXToGrid(0, 64)).toBe(0))
  it('pxPerBeat=0 returns x unchanged', () => expect(snapXToGrid(70, 0)).toBe(70))
})

// ─── formatBarsBeats ──────────────────────────────────────────────────────────

describe('formatBarsBeats', () => {
  it('0s, 4/4, 120 BPM → "bar 1, beat 1"', () =>
    expect(formatBarsBeats(0, 120, 4)).toBe('bar 1, beat 1'))

  it('0.5s, 120 BPM (1 beat elapsed), 4/4 → "bar 1, beat 2"', () =>
    expect(formatBarsBeats(0.5, 120, 4)).toBe('bar 1, beat 2'))

  it('2s, 120 BPM (4 beats elapsed), 4/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(2, 120, 4)).toBe('bar 2, beat 1'))

  it('1s, 120 BPM (2 beats), 3/4 → "bar 1, beat 3"', () =>
    expect(formatBarsBeats(1, 120, 3)).toBe('bar 1, beat 3'))

  it('1.5s, 120 BPM (3 beats), 3/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(1.5, 120, 3)).toBe('bar 2, beat 1'))
})

// ─── buildBarMarks ────────────────────────────────────────────────────────────

describe('buildBarMarks', () => {
  it('returns bar marks starting at x=0, bar=1', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    // durationSeconds=4, bps=2, totalBeats=8, bars=2+1 buffer = 3
    expect(marks[0]).toEqual({ x: 0, bar: 1 })
  })

  it('bar 2 at x = numerator × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    expect(marks[1]).toEqual({ x: 256, bar: 2 }) // 4 beats × 64px
  })

  it('returns at least 1 mark even for tiny durations', () => {
    const marks = buildBarMarks(0.1, 120, 4, 64)
    expect(marks.length).toBeGreaterThanOrEqual(1)
  })

  it('3/4 time: bar spacing = 3 × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 3, 48)
    // 4s × 2bps = 8 beats, bars = ceil(8/3)+1 = 4
    expect(marks[1]).toEqual({ x: 144, bar: 2 }) // 3 × 48
  })

  it('6/8 time: bar spacing = 6 × pxPerBeat', () => {
    const marks = buildBarMarks(8, 90, 6, 32)
    // 8s × 1.5bps = 12 beats, bars = ceil(12/6)+1 = 3
    expect(marks[1]).toEqual({ x: 192, bar: 2 }) // 6 × 32
  })
})
