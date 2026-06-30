// src/lib/highSession.test.ts
import { describe, it, expect } from 'vitest'
import { generateMockTakes, clampTrim } from './highSession'

describe('highSession — generateMockTakes', () => {
  it('generates the requested number of takes', () => {
    expect(generateMockTakes({ count: 3 })).toHaveLength(3)
    expect(generateMockTakes({ count: 1 })).toHaveLength(1)
  })

  it('defaults to 3 takes', () => {
    expect(generateMockTakes()).toHaveLength(3)
  })

  it('starts each take fully kept (trim spans the whole take)', () => {
    for (const t of generateMockTakes({ seed: 7 })) {
      expect(t.trimStart).toBe(0)
      expect(t.trimEnd).toBe(t.durationSeconds)
      expect(t.saved).toBe(false)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = generateMockTakes({ seed: 42 })
    const b = generateMockTakes({ seed: 42 })
    expect(a).toEqual(b)
  })

  it('varies takes across seeds', () => {
    const a = generateMockTakes({ seed: 1 })
    const b = generateMockTakes({ seed: 2 })
    expect(a[0].durationSeconds).not.toBe(b[0].durationSeconds)
  })

  it('produces peaks within [0,1] and near-silent boundaries', () => {
    const [t] = generateMockTakes({ seed: 3 })
    expect(t.peaks.length).toBeGreaterThan(0)
    expect(Math.max(...t.peaks)).toBeLessThanOrEqual(1)
    expect(Math.min(...t.peaks)).toBeGreaterThanOrEqual(0)
    // Envelope: the edges are quieter than the middle.
    const mid = t.peaks[Math.floor(t.peaks.length / 2)]
    expect(t.peaks[0]).toBeLessThan(mid)
  })
})

describe('highSession — clampTrim', () => {
  it('keeps a valid range untouched', () => {
    expect(clampTrim(2, 8, 10)).toEqual({ start: 2, end: 8 })
  })

  it('clamps to the take bounds', () => {
    expect(clampTrim(-5, 99, 10)).toEqual({ start: 0, end: 10 })
  })

  it('enforces a minimum kept span (no cross/collapse)', () => {
    const { start, end } = clampTrim(9, 9, 10, 0.05)
    expect(end - start).toBeGreaterThanOrEqual(0.05)
  })
})
