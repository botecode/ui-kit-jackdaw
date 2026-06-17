import { describe, it, expect } from 'vitest'
import { clamp, linearScale, dbScale, quantizeValue } from './faderScales'

// ─── clamp ───────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(0.5, 0, 1)).toBe(0.5))
  it('clamps below min',           () => expect(clamp(-0.1, 0, 1)).toBe(0))
  it('clamps above max',           () => expect(clamp(1.1, 0, 1)).toBe(1))
  it('returns min exactly',        () => expect(clamp(0, 0, 1)).toBe(0))
  it('returns max exactly',        () => expect(clamp(1, 0, 1)).toBe(1))
})

// ─── linearScale ─────────────────────────────────────────────────────────────

describe('linearScale.toPosition', () => {
  const s = linearScale()
  it('min → 0',            () => expect(s.toPosition(0, 0, 1)).toBeCloseTo(0))
  it('max → 1',            () => expect(s.toPosition(1, 0, 1)).toBeCloseTo(1))
  it('midpoint → 0.5',     () => expect(s.toPosition(0.5, 0, 1)).toBeCloseTo(0.5))
  it('works for dB range', () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.4545, 3))
})

describe('linearScale.toValue', () => {
  const s = linearScale()
  it('position 0 → min',   () => expect(s.toValue(0, 0, 1)).toBeCloseTo(0))
  it('position 1 → max',   () => expect(s.toValue(1, 0, 1)).toBeCloseTo(1))
  it('position 0.5 → mid', () => expect(s.toValue(0.5, 0, 1)).toBeCloseTo(0.5))
  it('round-trips',        () => {
    const v = 0.312
    expect(s.toValue(s.toPosition(v, 0, 1), 0, 1)).toBeCloseTo(v, 10)
  })
})

describe('linearScale.defaultFormat', () => {
  const s = linearScale()
  it('formats 0.5 → "0.50"', () => expect(s.defaultFormat(0.5)).toBe('0.50'))
  it('formats 1   → "1.00"', () => expect(s.defaultFormat(1)).toBe('1.00'))
})

// ─── dbScale ─────────────────────────────────────────────────────────────────

describe('dbScale with defaults { min:-60, max:6, unityAt:0.75 }', () => {
  const s = dbScale()
  it('0 dB (unity) → position ≈ 0.75', () => expect(s.toPosition(0, -60, 6)).toBeCloseTo(0.75, 5))
  it('-60 dB → position 0',            () => expect(s.toPosition(-60, -60, 6)).toBeCloseTo(0))
  it('6 dB → position 1',             () => expect(s.toPosition(6, -60, 6)).toBeCloseTo(1))
  it('-30 dB → position ≈ 0.375',     () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.375, 5))
  it('position 0 → -60 dB',           () => expect(s.toValue(0, -60, 6)).toBeCloseTo(-60))
  it('position 1 → 6 dB',            () => expect(s.toValue(1, -60, 6)).toBeCloseTo(6))
  it('position 0.75 → 0 dB',         () => expect(s.toValue(0.75, -60, 6)).toBeCloseTo(0))
  it('round-trips unity',             () => {
    expect(s.toValue(s.toPosition(0, -60, 6), -60, 6)).toBeCloseTo(0, 5)
  })
  it('round-trips -30 dB', () => {
    expect(s.toValue(s.toPosition(-30, -60, 6), -60, 6)).toBeCloseTo(-30, 5)
  })
  it('round-trips 3 dB', () => {
    expect(s.toValue(s.toPosition(3, -60, 6), -60, 6)).toBeCloseTo(3, 5)
  })
})

describe('dbScale.defaultFormat', () => {
  const s = dbScale()
  it('-60 dB → "-∞ dB"',  () => expect(s.defaultFormat(-60)).toBe('-∞ dB'))
  it('-6 dB  → "-6.0 dB"', () => expect(s.defaultFormat(-6)).toBe('-6.0 dB'))
  it('0 dB   → "+0.0 dB"', () => expect(s.defaultFormat(0)).toBe('+0.0 dB'))
  it('+3 dB  → "+3.0 dB"', () => expect(s.defaultFormat(3)).toBe('+3.0 dB'))
  it('+6 dB  → "+6.0 dB"', () => expect(s.defaultFormat(6)).toBe('+6.0 dB'))
})

// ─── quantizeValue ────────────────────────────────────────────────────────────

describe('quantizeValue', () => {
  it('undefined step → passthrough',   () => expect(quantizeValue(0.312, undefined, 0, 1)).toBe(0.312))
  it('step=0.1 snaps 0.35 → 0.4',     () => expect(quantizeValue(0.35, 0.1, 0, 1)).toBeCloseTo(0.4))
  it('step=0.1 snaps 0.31 → 0.3',     () => expect(quantizeValue(0.31, 0.1, 0, 1)).toBeCloseTo(0.3))
  it('clamps to max',                  () => expect(quantizeValue(0.99, 0.1, 0, 1)).toBeCloseTo(1.0))
  it('clamps to min',                  () => expect(quantizeValue(0.001, 0.1, 0, 1)).toBeCloseTo(0.0))
  it('step=1 snaps 2.6 → 3 in dB range', () => expect(quantizeValue(2.6, 1, -60, 6)).toBeCloseTo(3))
})
