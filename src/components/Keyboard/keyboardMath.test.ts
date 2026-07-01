// src/components/Keyboard/keyboardMath.test.ts
import { describe, it, expect } from 'vitest'
import {
  isBlackKey,
  midiNoteToName,
  clampNote,
  normalizeRange,
  buildKeys,
  keyGeometry,
  keybedWidth,
  velocityFromRatio,
  baseCFor,
  QWERTY_TO_SEMITONE,
  BLACK_W_RATIO,
  VEL_MIN,
  VEL_MAX,
  DEFAULT_VELOCITY,
} from './keyboardMath'

describe('isBlackKey', () => {
  it('flags the five black pitch classes', () => {
    // C# D# F# G# A# within the C4 octave (60..71)
    expect([61, 63, 66, 68, 70].every(isBlackKey)).toBe(true)
  })
  it('white pitch classes are not black', () => {
    expect([60, 62, 64, 65, 67, 69, 71].some(isBlackKey)).toBe(false)
  })
  it('handles low octaves without going negative', () => {
    expect(isBlackKey(1)).toBe(true) // C#-1
    expect(isBlackKey(0)).toBe(false) // C-1
  })
})

describe('midiNoteToName', () => {
  it('names middle C as C4', () => {
    expect(midiNoteToName(60)).toBe('C4')
  })
  it('names accidentals with octave', () => {
    expect(midiNoteToName(61)).toBe('C#4')
    expect(midiNoteToName(69)).toBe('A4')
  })
})

describe('clampNote', () => {
  it('clamps below/above range', () => {
    expect(clampNote(20, 48, 72)).toBe(48)
    expect(clampNote(90, 48, 72)).toBe(72)
    expect(clampNote(60, 48, 72)).toBe(60)
  })
})

describe('normalizeRange', () => {
  it('leaves a white..white range untouched', () => {
    expect(normalizeRange(48, 72)).toEqual([48, 72])
  })
  it('widens a black start down and a black end up', () => {
    // 49 = C#3 → 48; 70 = A#4 → 71
    expect(normalizeRange(49, 70)).toEqual([48, 71])
  })
  it('orders a reversed range', () => {
    expect(normalizeRange(72, 48)).toEqual([48, 72])
  })
})

describe('buildKeys', () => {
  it('counts an octave C..C as 8 white + 5 black = 13 keys, 8 whites', () => {
    const { keys, whiteCount } = buildKeys(60, 72)
    expect(keys).toHaveLength(13)
    expect(whiteCount).toBe(8)
    expect(keys[0]).toMatchObject({ note: 60, isBlack: false, whiteIndex: 0 })
  })
  it('assigns a black key the boundary index of the white below it', () => {
    const { keys } = buildKeys(60, 72)
    const cSharp = keys.find(k => k.note === 61)!
    // C# straddles the C(index0)|D(index1) boundary → whiteIndex 1
    expect(cSharp).toMatchObject({ isBlack: true, whiteIndex: 1 })
  })
  it('normalizes the range so both ends are white', () => {
    const { keys } = buildKeys(61, 70) // C#4..A#4
    expect(keys[0].isBlack).toBe(false)
    expect(keys[keys.length - 1].isBlack).toBe(false)
  })
})

describe('keyGeometry', () => {
  const whiteW = 34
  it('lays white keys edge-to-edge', () => {
    const { keys } = buildKeys(60, 72)
    const d = keys.find(k => k.note === 62)! // D4, second white
    expect(keyGeometry(d, whiteW)).toEqual({ left: whiteW, width: whiteW })
  })
  it('centres a black key on the white boundary', () => {
    const { keys } = buildKeys(60, 72)
    const cSharp = keys.find(k => k.note === 61)!
    const blackW = whiteW * BLACK_W_RATIO
    expect(keyGeometry(cSharp, whiteW)).toEqual({
      left: whiteW - blackW / 2,
      width: blackW,
    })
  })
})

describe('keybedWidth', () => {
  it('multiplies white count by white width', () => {
    expect(keybedWidth(8, 34)).toBe(272)
  })
})

describe('velocityFromRatio', () => {
  it('top of key is soft (floor), bottom is max', () => {
    expect(velocityFromRatio(0)).toBe(VEL_MIN)
    expect(velocityFromRatio(1)).toBe(VEL_MAX)
  })
  it('clamps out-of-range ratios', () => {
    expect(velocityFromRatio(-1)).toBe(VEL_MIN)
    expect(velocityFromRatio(2)).toBe(VEL_MAX)
  })
  it('falls back to default for NaN (no measurable rect)', () => {
    expect(velocityFromRatio(NaN)).toBe(DEFAULT_VELOCITY)
  })
})

describe('QWERTY layout', () => {
  it('maps the home row to an ascending octave', () => {
    expect(QWERTY_TO_SEMITONE.a).toBe(0)
    expect(QWERTY_TO_SEMITONE.k).toBe(12)
    expect(QWERTY_TO_SEMITONE.w).toBe(1) // C# sits above A/S
  })
})

describe('baseCFor', () => {
  it('returns the lowest C at or above the note', () => {
    expect(baseCFor(48)).toBe(48) // already a C
    expect(baseCFor(50)).toBe(60) // D3 → C4
  })
})
