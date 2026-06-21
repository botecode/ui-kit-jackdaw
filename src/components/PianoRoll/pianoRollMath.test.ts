// src/components/PianoRoll/pianoRollMath.test.ts
import { describe, it, expect } from 'vitest'
import {
  isBlackKey,
  midiNoteToName,
  noteLabel,
  pitchToY,
  yToPitch,
  beatsToX,
  xToBeats,
  snapToGrid,
  clampPitch,
  buildPitchRange,
} from './pianoRollMath'

describe('isBlackKey', () => {
  it('C (0 mod 12) is white',  () => expect(isBlackKey(60)).toBe(false))
  it('C# (1 mod 12) is black', () => expect(isBlackKey(61)).toBe(true))
  it('D (2 mod 12) is white',  () => expect(isBlackKey(62)).toBe(false))
  it('D# (3 mod 12) is black', () => expect(isBlackKey(63)).toBe(true))
  it('F# (6 mod 12) is black', () => expect(isBlackKey(54)).toBe(true))
  it('G# (8 mod 12) is black', () => expect(isBlackKey(56)).toBe(true))
  it('A# (10 mod 12) is black',() => expect(isBlackKey(58)).toBe(true))
  it('B (11 mod 12) is white', () => expect(isBlackKey(59)).toBe(false))
})

describe('midiNoteToName', () => {
  it('60 → C4',  () => expect(midiNoteToName(60)).toBe('C4'))
  it('61 → C#4', () => expect(midiNoteToName(61)).toBe('C#4'))
  it('69 → A4',  () => expect(midiNoteToName(69)).toBe('A4'))
  it('24 → C1',  () => expect(midiNoteToName(24)).toBe('C1'))
  it('48 → C3',  () => expect(midiNoteToName(48)).toBe('C3'))
  it('36 → C2',  () => expect(midiNoteToName(36)).toBe('C2'))
})

describe('noteLabel', () => {
  it('C4 at beat 0, div 0.25 → "C4, bar 1 beat 1, 1/16"', () =>
    expect(noteLabel(60, 0, 0.25)).toBe('C4, bar 1 beat 1, 1/16'))
  it('C4 at beat 4, div 0.5 → "C4, bar 2 beat 1, 1/8"', () =>
    expect(noteLabel(60, 4, 0.5)).toBe('C4, bar 2 beat 1, 1/8'))
  it('C4 at beat 1, div 1 → "C4, bar 1 beat 2, 1/4"', () =>
    expect(noteLabel(60, 1, 1)).toBe('C4, bar 1 beat 2, 1/4'))
})

describe('pitchToY', () => {
  it('hiNote=96, pitch=96, laneH=14 → y=0 (top)', () => expect(pitchToY(96, 96, 14)).toBe(0))
  it('hiNote=96, pitch=95, laneH=14 → y=14',      () => expect(pitchToY(95, 96, 14)).toBe(14))
  it('hiNote=96, pitch=84, laneH=14 → y=168',     () => expect(pitchToY(84, 96, 14)).toBe(168))
})

describe('yToPitch', () => {
  it('y=0, hiNote=96, laneH=14 → 96',    () => expect(yToPitch(0, 96, 14)).toBe(96))
  it('y=14, hiNote=96, laneH=14 → 95',   () => expect(yToPitch(14, 96, 14)).toBe(95))
  it('y=13, hiNote=96, laneH=14 → 96',   () => expect(yToPitch(13, 96, 14)).toBe(96))
  it('y=168, hiNote=96, laneH=14 → 84',  () => expect(yToPitch(168, 96, 14)).toBe(84))
})

describe('beatsToX', () => {
  it('0 beats → 0px',              () => expect(beatsToX(0, 64)).toBe(0))
  it('1 beat at 64px → 64px',      () => expect(beatsToX(1, 64)).toBe(64))
  it('4 beats at 64px → 256px',    () => expect(beatsToX(4, 64)).toBe(256))
  it('0.25 beats at 64px → 16px',  () => expect(beatsToX(0.25, 64)).toBe(16))
})

describe('xToBeats', () => {
  it('0px → 0 beats',         () => expect(xToBeats(0, 64)).toBe(0))
  it('64px at 64px → 1 beat', () => expect(xToBeats(64, 64)).toBe(1))
  it('round-trips',           () => expect(xToBeats(beatsToX(2.5, 48), 48)).toBeCloseTo(2.5))
  it('pxPerBeat=0 → 0 guard', () => expect(xToBeats(64, 0)).toBe(0))
})

describe('snapToGrid', () => {
  it('0 beats, div=0.25 → 0',         () => expect(snapToGrid(0, 0.25)).toBe(0))
  it('0.12 beats → 0 (closer to 0)',   () => expect(snapToGrid(0.12, 0.25)).toBe(0))
  it('0.13 beats → 0.25 (closer)',     () => expect(snapToGrid(0.13, 0.25)).toBeCloseTo(0.25))
  it('exact grid → unchanged',         () => expect(snapToGrid(1.0, 0.25)).toBe(1.0))
  it('div=0 → beats unchanged (guard)',() => expect(snapToGrid(0.37, 0)).toBe(0.37))
})

describe('clampPitch', () => {
  it('within range → unchanged', () => expect(clampPitch(60, 24, 96)).toBe(60))
  it('below lo → lo',            () => expect(clampPitch(10, 24, 96)).toBe(24))
  it('above hi → hi',            () => expect(clampPitch(100, 24, 96)).toBe(96))
  it('at lo → lo',               () => expect(clampPitch(24, 24, 96)).toBe(24))
  it('at hi → hi',               () => expect(clampPitch(96, 24, 96)).toBe(96))
})

describe('buildPitchRange', () => {
  it('descends hi→lo',         () => expect(buildPitchRange(24, 26)).toEqual([26, 25, 24]))
  it('single note',            () => expect(buildPitchRange(60, 60)).toEqual([60]))
  it('first element = hiNote', () => expect(buildPitchRange(24, 96)[0]).toBe(96))
  it('last element = loNote',  () => {
    const r = buildPitchRange(24, 96)
    expect(r[r.length - 1]).toBe(24)
  })
  it('length = hiNote - loNote + 1', () => expect(buildPitchRange(24, 96).length).toBe(73))
})
