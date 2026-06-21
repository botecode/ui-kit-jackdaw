# PianoRoll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a MIDI piano-roll composite component: click-to-add, drag move/resize, right-click delete, keyboard navigation, snap-to-grid, over a warm keyboard+grid — all states in the gallery; tsc + vitest + lint green.

**Architecture:** Two sub-areas rendered as DOM elements — a vertical piano keyboard strip on the left (pitch lane labels) and a scrollable grid on the right (beat/bar lines + pitch-lane rows + note blocks). Notes are positioned `<div>`s; the grid is CSS background-image gradients. Drag state is managed via a mutable ref (no stale-closure bugs). Selection is internal state; notes are a controlled prop (parent owns the array, component fires callbacks).

**Tech Stack:** React 19, CSS Modules, CSS custom properties (tokens), `fireEvent` tests (vitest + @testing-library/react), `@phosphor-icons/react` (none needed here — pure geometry), `useSpring` from `src/motion/spring.ts` for drop-settle animation.

## Global Constraints

- Tokens only — no hardcoded hex/rgb values; every color via `var(--*)` CSS tokens
- CSS Modules for all styling
- `data-*` attributes for state; CSS targets them — no className juggling
- Tests use `fireEvent`, NOT `userEvent`
- `npx tsc --noEmit` + `npx vitest run` must be green before each commit
- Sizes: `sm` / `md` (default `md`); `:focus-visible` only, never `:focus`
- Gallery auto-registers via `import.meta.glob` — no manual registry edits
- Dogfood playground controls from kit `Toggle` and `Fader`
- No animation library — CSS for state transitions, `useSpring` for drop-settle
- KIT-LEAD §4: no premature abstractions; no dead code; build what the spec asks

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/components/PianoRoll/pianoRollMath.ts` | Pure math: pitch↔y, beats↔x, snap, MIDI note names, note labels |
| `src/components/PianoRoll/pianoRollMath.test.ts` | Unit tests for every math function |
| `src/components/PianoRoll/PianoRoll.tsx` | Main composite: keyboard strip + grid + notes + all interactions |
| `src/components/PianoRoll/PianoRoll.module.css` | All styles (keyboard, grid, lanes, notes, selection, drag) |
| `src/components/PianoRoll/PianoRoll.test.tsx` | Component tests: render, add, delete, move, resize, keyboard nav |
| `src/components/PianoRoll/PianoRoll.demo.tsx` | Gallery demo: StatesGrid (all states) + Playground |
| `src/components/PianoRoll/index.ts` | Barrel export |

---

## Task 1: pianoRollMath.ts — Pure Math Utilities

**Files:**
- Create: `src/components/PianoRoll/pianoRollMath.ts`
- Create: `src/components/PianoRoll/pianoRollMath.test.ts`

**Interfaces:**
- Produces:
  - `LANE_H_MD = 14` (px per semitone, md size)
  - `LANE_H_SM = 10` (px per semitone, sm size)
  - `KEY_W_MD = 88` (keyboard strip width, md)
  - `KEY_W_SM = 64` (keyboard strip width, sm)
  - `RESIZE_ZONE = 6` (px from right edge that triggers resize cursor)
  - `isBlackKey(pitch: number): boolean`
  - `midiNoteToName(pitch: number): string` — e.g. 60 → "C4"
  - `noteLabel(pitch: number, startBeats: number, division: number): string` — aria label
  - `pitchToY(pitch: number, hiNote: number, laneH: number): number` — top of lane in px
  - `yToPitch(y: number, hiNote: number, laneH: number): number` — MIDI pitch at y
  - `beatsToX(beats: number, pxPerBeat: number): number`
  - `xToBeats(x: number, pxPerBeat: number): number`
  - `snapToGrid(beats: number, division: number): number`
  - `clampPitch(pitch: number, loNote: number, hiNote: number): number`
  - `buildPitchRange(loNote: number, hiNote: number): number[]` — array descending (hi→lo)

- [ ] **Step 1: Create the math file**

```typescript
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
```

- [ ] **Step 2: Create the math tests**

```typescript
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
  it('0.13 beats → 0.25 (closer)',     () => expect(snapToGrid(0.13, 0.25)).toBe(0.25))
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
```

- [ ] **Step 3: Run the math tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx vitest run src/components/PianoRoll/pianoRollMath.test.ts
```

Expected: All tests pass (green).

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && git add src/components/PianoRoll/pianoRollMath.ts src/components/PianoRoll/pianoRollMath.test.ts && git commit -m "feat(PianoRoll): pitch/beat math utilities + tests"
```

---

## Task 2: PianoRoll.tsx + PianoRoll.module.css — Scaffold + Rendering

**Files:**
- Create: `src/components/PianoRoll/PianoRoll.tsx`
- Create: `src/components/PianoRoll/PianoRoll.module.css`
- Create: `src/components/PianoRoll/index.ts`

**Interfaces:**
- Consumes: all exports from `./pianoRollMath`
- Produces:
  ```typescript
  export interface PianoNote {
    id: string
    pitch: number    // MIDI note number (0-127)
    start: number    // in beats from clip start
    length: number   // in beats
    velocity?: number // 0-127, default 100
  }

  export interface PianoRollProps {
    notes: PianoNote[]
    pitchRange?: [number, number]      // [loNote, hiNote], default [24, 96]
    pxPerBeat: number
    division?: number                  // grid snap division in beats, default 0.25
    snap?: boolean                     // default false
    durationBeats?: number             // default 16
    onAddNote?: (pitch: number, start: number) => void
    onMoveNote?: (id: string, pitch: number, start: number) => void
    onResizeNote?: (id: string, length: number) => void
    onDeleteNote?: (id: string) => void
    onSelectNote?: (ids: string[]) => void
    size?: 'sm' | 'md'
  }
  ```

- [ ] **Step 1: Create PianoRoll.tsx — types, constants, skeleton rendering (no interactions yet)**

```tsx
// src/components/PianoRoll/PianoRoll.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  LANE_H_MD, LANE_H_SM, KEY_W_MD, KEY_W_SM, RESIZE_ZONE,
  isBlackKey, midiNoteToName, noteLabel,
  pitchToY, yToPitch, beatsToX, xToBeats, snapToGrid,
  clampPitch, buildPitchRange,
} from './pianoRollMath'
import styles from './PianoRoll.module.css'

export interface PianoNote {
  id: string
  pitch: number
  start: number
  length: number
  velocity?: number
}

export interface PianoRollProps {
  notes: PianoNote[]
  pitchRange?: [number, number]
  pxPerBeat: number
  division?: number
  snap?: boolean
  durationBeats?: number
  onAddNote?: (pitch: number, start: number) => void
  onMoveNote?: (id: string, pitch: number, start: number) => void
  onResizeNote?: (id: string, length: number) => void
  onDeleteNote?: (id: string) => void
  onSelectNote?: (ids: string[]) => void
  size?: 'sm' | 'md'
}

// ─── Drag state ───────────────────────────────────────────────────────────────

type DragKind =
  | { kind: 'none' }
  | { kind: 'drawing'; pitch: number; startBeats: number; lengthBeats: number }
  | { kind: 'moving';  id: string; pitch: number; startBeats: number; offsetX: number; offsetY: number }
  | { kind: 'resizing'; id: string; noteLeft: number; lengthBeats: number }

const CLICK_THRESH = 4  // px moved before a click becomes a drag

// ─── Velocity → opacity (louder = more opaque) ────────────────────────────────

function velocityOpacity(velocity = 100): number {
  return 0.5 + 0.5 * (Math.max(0, Math.min(127, velocity)) / 127)
}

// ─── PianoRoll ────────────────────────────────────────────────────────────────

export function PianoRoll({
  notes,
  pitchRange = [24, 96],
  pxPerBeat,
  division = 0.25,
  snap = false,
  durationBeats = 16,
  onAddNote,
  onMoveNote,
  onResizeNote,
  onDeleteNote,
  onSelectNote,
  size = 'md',
}: PianoRollProps) {
  const [loNote, hiNote] = pitchRange
  const pitches = buildPitchRange(loNote, hiNote)
  const laneH   = size === 'sm' ? LANE_H_SM : LANE_H_MD
  const keyW    = size === 'sm' ? KEY_W_SM  : KEY_W_MD

  const totalHeight = pitches.length * laneH
  const totalWidth  = beatsToX(durationBeats, pxPerBeat)

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function handleSelectNote(id: string, multi: boolean) {
    setSelectedIds(prev => {
      if (multi) {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }
      return new Set([id])
    })
    // Notify callback after state update
  }

  useEffect(() => {
    onSelectNote?.(Array.from(selectedIds))
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag state (mutable ref — avoids stale closures in pointer handlers) ─────
  const dragRef = useRef<DragKind>({ kind: 'none' })
  const [dragDisplay, setDragDisplay] = useState<DragKind>({ kind: 'none' })
  const containerRef = useRef<HTMLDivElement>(null)

  // Stable refs for prop values used inside pointer handlers
  const pxPerBeatRef  = useRef(pxPerBeat)
  const divisionRef   = useRef(division)
  const snapRef       = useRef(snap)
  const notesRef      = useRef(notes)
  const loNoteRef     = useRef(loNote)
  const hiNoteRef     = useRef(hiNote)
  const laneHRef      = useRef(laneH)
  const keyWRef       = useRef(keyW)
  useEffect(() => { pxPerBeatRef.current = pxPerBeat })
  useEffect(() => { divisionRef.current  = division })
  useEffect(() => { snapRef.current      = snap })
  useEffect(() => { notesRef.current     = notes })
  useEffect(() => { loNoteRef.current    = loNote })
  useEffect(() => { hiNoteRef.current    = hiNote })
  useEffect(() => { laneHRef.current     = laneH })
  useEffect(() => { keyWRef.current      = keyW })

  const onAddRef    = useRef(onAddNote)
  const onMoveRef   = useRef(onMoveNote)
  const onResizeRef = useRef(onResizeNote)
  useEffect(() => { onAddRef.current    = onAddNote })
  useEffect(() => { onMoveRef.current   = onMoveNote })
  useEffect(() => { onResizeRef.current = onResizeNote })

  // ── Grid pointer handlers (add + move + resize funneled through grid) ─────────

  function gridXY(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      gx: clientX - rect.left - keyWRef.current,  // x relative to grid (excludes keyboard)
      gy: clientY - rect.top,
    }
  }

  function handleGridPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)

    const { gx, gy }   = gridXY(e.clientX, e.clientY)
    let startBeats      = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
    if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
    startBeats = Math.max(0, startBeats)
    const pitch = clampPitch(yToPitch(gy, hiNoteRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)

    dragRef.current = { kind: 'drawing', pitch, startBeats, lengthBeats: divisionRef.current }
    setDragDisplay({ kind: 'drawing', pitch, startBeats, lengthBeats: divisionRef.current })
    setSelectedIds(new Set())
  }

  function handleGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind !== 'drawing') return
    const { gx } = gridXY(e.clientX, e.clientY)
    let endBeats = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
    if (snapRef.current) endBeats = snapToGrid(endBeats, divisionRef.current)
    const rawLen = endBeats - d.startBeats
    const minLen = divisionRef.current
    const lengthBeats = Math.max(minLen, rawLen)
    const next: DragKind = { ...d, lengthBeats }
    dragRef.current = next
    setDragDisplay(next)
  }

  function handleGridPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind === 'drawing') {
      onAddRef.current?.(d.pitch, d.startBeats)
    }
    dragRef.current = { kind: 'none' }
    setDragDisplay({ kind: 'none' })
  }

  // ── Note pointer handlers ─────────────────────────────────────────────────────

  function handleNotePointerDown(e: React.PointerEvent<HTMLDivElement>, note: PianoNote) {
    if (e.button !== 0) return
    e.stopPropagation()  // don't bubble to grid (would trigger draw)
    e.currentTarget.setPointerCapture(e.pointerId)

    const noteEl  = e.currentTarget
    const noteRect = noteEl.getBoundingClientRect()
    const distFromRight = noteRect.right - e.clientX

    if (distFromRight <= RESIZE_ZONE) {
      // Resize mode
      dragRef.current = {
        kind: 'resizing',
        id: note.id,
        noteLeft: noteRect.left,
        lengthBeats: note.length,
      }
      setDragDisplay({ kind: 'resizing', id: note.id, noteLeft: noteRect.left, lengthBeats: note.length })
    } else {
      // Move mode — offset within note body
      const noteLeft = beatsToX(note.start, pxPerBeatRef.current)
      const noteTop  = pitchToY(note.pitch, hiNoteRef.current, laneHRef.current)
      const containerRect = containerRef.current!.getBoundingClientRect()
      const offsetX = e.clientX - (containerRect.left + keyWRef.current + noteLeft)
      const offsetY = e.clientY - (containerRect.top  + noteTop)
      dragRef.current = { kind: 'moving', id: note.id, pitch: note.pitch, startBeats: note.start, offsetX, offsetY }
      setDragDisplay({ kind: 'moving', id: note.id, pitch: note.pitch, startBeats: note.start, offsetX, offsetY })
    }

    const multi = e.shiftKey || e.metaKey || e.ctrlKey
    handleSelectNote(note.id, multi)
  }

  function handleNotePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind === 'moving') {
      const { gx, gy } = gridXY(e.clientX - d.offsetX + RESIZE_ZONE, e.clientY - d.offsetY + laneHRef.current / 2)
      let startBeats = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
      if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
      startBeats = Math.max(0, startBeats)
      const pitch = clampPitch(yToPitch(gy, hiNoteRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)
      const next: DragKind = { ...d, pitch, startBeats }
      dragRef.current = next
      setDragDisplay(next)
    } else if (d.kind === 'resizing') {
      const containerRect = containerRef.current!.getBoundingClientRect()
      const newWidth = e.clientX - d.noteLeft
      let lengthBeats = xToBeats(Math.max(pxPerBeatRef.current * divisionRef.current, newWidth), pxPerBeatRef.current)
      if (snapRef.current) lengthBeats = snapToGrid(lengthBeats, divisionRef.current)
      const next: DragKind = { ...d, lengthBeats }
      dragRef.current = next
      setDragDisplay(next)
    }
  }

  function handleNotePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind === 'moving') {
      onMoveRef.current?.(d.id, d.pitch, d.startBeats)
    } else if (d.kind === 'resizing') {
      onResizeRef.current?.(d.id, d.lengthBeats)
    }
    dragRef.current = { kind: 'none' }
    setDragDisplay({ kind: 'none' })
  }

  function handleNoteContextMenu(e: React.MouseEvent, note: PianoNote) {
    e.preventDefault()
    onDeleteNote?.(note.id)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(note.id); return n })
  }

  // ── Note keyboard navigation ─────────────────────────────────────────────────

  function handleNoteKeyDown(e: React.KeyboardEvent, note: PianoNote) {
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const delta = e.shiftKey ? 12 : 1
        onMoveNote?.(note.id, clampPitch(note.pitch + delta, loNote, hiNote), note.start)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const delta = e.shiftKey ? 12 : 1
        onMoveNote?.(note.id, clampPitch(note.pitch - delta, loNote, hiNote), note.start)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        onMoveNote?.(note.id, note.pitch, note.start + division)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        onMoveNote?.(note.id, note.pitch, Math.max(0, note.start - division))
        break
      }
      case 'Delete':
      case 'Backspace': {
        e.preventDefault()
        onDeleteNote?.(note.id)
        setSelectedIds(prev => { const n = new Set(prev); n.delete(note.id); return n })
        break
      }
      default: return
    }
  }

  // ── Resolve display positions (drag overrides for the dragged note) ───────────

  function resolveNote(note: PianoNote): { pitch: number; start: number; length: number } {
    const d = dragDisplay
    if (d.kind === 'moving'  && d.id === note.id) return { pitch: d.pitch, start: d.startBeats, length: note.length }
    if (d.kind === 'resizing' && d.id === note.id) return { pitch: note.pitch, start: note.start, length: d.lengthBeats }
    return { pitch: note.pitch, start: note.start, length: note.length }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={styles.root}
      data-testid="piano-roll"
      data-size={size}
      style={{ '--lane-h': `${laneH}px`, '--key-w': `${keyW}px` } as React.CSSProperties}
    >
      <div
        ref={containerRef}
        className={styles.scrollArea}
      >
        <div
          className={styles.inner}
          style={{ width: keyW + totalWidth, height: totalHeight }}
        >
          {/* ── Piano keyboard strip ── */}
          <div className={styles.keyboard} aria-hidden="true" style={{ width: keyW }}>
            {pitches.map(p => (
              <div
                key={p}
                className={styles.key}
                data-black-key={isBlackKey(p) || undefined}
                data-octave-c={p % 12 === 0 || undefined}
                style={{ height: laneH }}
              >
                {p % 12 === 0 && (
                  <span className={styles.keyLabel}>{midiNoteToName(p)}</span>
                )}
              </div>
            ))}
          </div>

          {/* ── Grid + notes ── */}
          <div
            className={styles.grid}
            data-testid="piano-roll-grid"
            style={{ width: totalWidth, '--beat-px': `${pxPerBeat}px` } as React.CSSProperties}
            onPointerDown={handleGridPointerDown}
            onPointerMove={handleGridPointerMove}
            onPointerUp={handleGridPointerUp}
            onPointerCancel={handleGridPointerUp}
            onContextMenu={e => e.preventDefault()}
          >
            {/* Pitch lane backgrounds */}
            {pitches.map(p => (
              <div
                key={p}
                className={styles.laneRow}
                data-black-key={isBlackKey(p) || undefined}
                style={{ height: laneH }}
                aria-hidden="true"
              />
            ))}

            {/* Notes */}
            {notes.map(note => {
              const { pitch, start, length } = resolveNote(note)
              const left    = beatsToX(start, pxPerBeat)
              const top     = pitchToY(pitch, hiNote, laneH)
              const width   = Math.max(4, beatsToX(length, pxPerBeat))
              const opacity = velocityOpacity(note.velocity)
              const isSel   = selectedIds.has(note.id)
              const isDrag  = dragDisplay.kind !== 'none' && (dragDisplay as {id?: string}).id === note.id

              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={noteLabel(note.pitch, note.start, division)}
                  data-testid={`note-${note.id}`}
                  data-selected={isSel || undefined}
                  data-dragging={isDrag || undefined}
                  className={styles.note}
                  style={{
                    left,
                    top,
                    width,
                    height: laneH,
                    opacity,
                  }}
                  onPointerDown={ev => handleNotePointerDown(ev, note)}
                  onPointerMove={ev => handleNotePointerMove(ev)}
                  onPointerUp={ev => handleNotePointerUp(ev)}
                  onPointerCancel={ev => handleNotePointerUp(ev)}
                  onContextMenu={ev => handleNoteContextMenu(ev, note)}
                  onKeyDown={ev => handleNoteKeyDown(ev, note)}
                >
                  <div className={styles.noteResizeHandle} aria-hidden="true" />
                </div>
              )
            })}

            {/* Ghost note while drawing */}
            {dragDisplay.kind === 'drawing' && (() => {
              const d = dragDisplay
              const left  = beatsToX(d.startBeats, pxPerBeat)
              const top   = pitchToY(d.pitch, hiNote, laneH)
              const width = Math.max(4, beatsToX(d.lengthBeats, pxPerBeat))
              return (
                <div
                  className={styles.noteGhost}
                  aria-hidden="true"
                  style={{ left, top, width, height: laneH }}
                />
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PianoRoll.module.css**

```css
/* src/components/PianoRoll/PianoRoll.module.css */

/* ─── Root ─────────────────────────────────────────────────────────────────── */

.root {
  display: flex;
  flex-direction: column;
  background-color: var(--arrange-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  outline: none;

  --_white-key-bg:      var(--strip-bg);
  --_black-key-bg:      var(--stage);
  --_white-lane-bg:     var(--arrange-bg);
  --_black-lane-bg:     color-mix(in srgb, var(--arrange-bg) 78%, var(--stage) 22%);
  --_note-color:        var(--accent);
  --_note-selected-bg:  color-mix(in srgb, var(--accent) 90%, var(--accent-contrast) 10%);
  --_bar-line:          var(--border-strong);
  --_beat-line:         var(--border);
  --_key-border:        var(--border);
}

/* ─── Scroll container ─────────────────────────────────────────────────────── */

.scrollArea {
  overflow: auto;
  flex: 1;
  /* Thin webkit scrollbar so it doesn't dominate the UI */
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) var(--stage);
}

.scrollArea::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollArea::-webkit-scrollbar-track { background: var(--stage); }
.scrollArea::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }

/* ─── Inner layout (keyboard + grid side by side) ──────────────────────────── */

.inner {
  position: relative;
  display: flex;
  min-width: fit-content;
}

/* ─── Piano keyboard strip ─────────────────────────────────────────────────── */

.keyboard {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-strong);
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: var(--strip-bg);
}

.key {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--space-1);
  border-bottom: 1px solid var(--_key-border);
  background-color: var(--_white-key-bg);
  box-sizing: border-box;
  transition: background-color var(--dur-fast) var(--ease-out);
}

.key[data-black-key] {
  background-color: var(--_black-key-bg);
}

.key[data-octave-c] {
  border-bottom: 1px solid var(--border-strong);
}

.keyLabel {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-dim);
  line-height: 1;
  pointer-events: none;
}

/* ─── Grid ─────────────────────────────────────────────────────────────────── */

/*
  Grid area: pitch lane rows stacked vertically, beat/bar lines as CSS gradients.
  --beat-px is set via inline style; same coordinate system as TimelineRuler.
*/

.grid {
  position: relative;
  flex: 1;
  flex-shrink: 0;
  cursor: crosshair;
  overflow: hidden;
}

/* ─── Lane rows (pitch backgrounds) ───────────────────────────────────────── */

.laneRow {
  position: relative;
  width: 100%;
  background-color: var(--_white-lane-bg);
  box-sizing: border-box;
  border-bottom: 1px solid var(--_beat-line);
  background-image:
    repeating-linear-gradient(
      to right,
      var(--_bar-line)  0px,
      var(--_bar-line)  1.5px,
      transparent       1.5px,
      transparent       calc(var(--beat-px) * 4)
    ),
    repeating-linear-gradient(
      to right,
      var(--_beat-line) 0px,
      var(--_beat-line) 1px,
      transparent       1px,
      transparent       var(--beat-px)
    );
}

.laneRow[data-black-key] {
  background-color: var(--_black-lane-bg);
}

/* ─── Notes ─────────────────────────────────────────────────────────────────── */

.note {
  position: absolute;
  box-sizing: border-box;
  background-color: var(--_note-color);
  border-radius: calc(var(--radius) * 0.6);
  border-top: 1px solid color-mix(in srgb, var(--_note-color) 0%, white 30%);
  cursor: grab;
  outline: none;
  transition:
    box-shadow var(--dur-fast) var(--ease-out),
    background-color var(--dur-led-on) var(--ease-out);
  /* Keep note inset from lane edge by 1px top+bottom */
  top: 1px !important;
  height: calc(var(--lane-h) - 2px) !important;
}

.note:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  outline-offset: 1px;
  z-index: 2;
}

.note[data-selected] {
  background-color: var(--_note-selected-bg);
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, var(--accent) 80%, transparent),
    0 0 6px 1px  color-mix(in srgb, var(--accent) 30%, transparent);
  z-index: 1;
}

.note[data-dragging] {
  cursor: grabbing;
  z-index: 3;
  box-shadow:
    0 0 0 1px var(--accent),
    0 2px 8px hsl(0 0% 0% / 0.4);
}

/* ─── Resize handle (right edge of note) ──────────────────────────────────── */

.noteResizeHandle {
  position: absolute;
  right: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  border-radius: 0 calc(var(--radius) * 0.6) calc(var(--radius) * 0.6) 0;
  background: color-mix(in srgb, var(--accent-contrast) 0%, transparent 100%);
}

.note:hover .noteResizeHandle {
  background: color-mix(in srgb, var(--accent) 0%, white 15%);
}

/* ─── Ghost note (draw preview) ───────────────────────────────────────────── */

.noteGhost {
  position: absolute;
  box-sizing: border-box;
  background-color: color-mix(in srgb, var(--accent) 45%, transparent);
  border: 1px dashed color-mix(in srgb, var(--accent) 80%, transparent);
  border-radius: calc(var(--radius) * 0.6);
  pointer-events: none;
  z-index: 1;
  top: 1px !important;
  height: calc(var(--lane-h) - 2px) !important;
}

/* ─── Size variants ─────────────────────────────────────────────────────────── */

/* sm: tighter lane height is set via --lane-h CSS var. Key labels suppressed. */
.root[data-size="sm"] .keyLabel { display: none; }

/* ─── Reduced motion ────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .note { transition: none; }
}
```

- [ ] **Step 3: Create index.ts**

```typescript
// src/components/PianoRoll/index.ts
export { PianoRoll } from './PianoRoll'
export type { PianoNote, PianoRollProps } from './PianoRoll'
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && git add src/components/PianoRoll/PianoRoll.tsx src/components/PianoRoll/PianoRoll.module.css src/components/PianoRoll/index.ts && git commit -m "feat(PianoRoll): scaffold — keyboard strip, grid, note rendering, drag state machine"
```

---

## Task 3: PianoRoll.test.tsx — Component Tests

**Files:**
- Create: `src/components/PianoRoll/PianoRoll.test.tsx`

**Interfaces:**
- Consumes: `PianoRoll`, `PianoNote`, `PianoRollProps` from `./PianoRoll`

- [ ] **Step 1: Create the test file**

```tsx
// src/components/PianoRoll/PianoRoll.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PianoRoll } from './PianoRoll'
import type { PianoNote } from './PianoRoll'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE = {
  notes: [] as PianoNote[],
  pxPerBeat: 64,
  durationBeats: 8,
  pitchRange: [36, 60] as [number, number],  // C2–C4, small range for tests
  division: 0.25,
  snap: false,
}

const NOTE_A: PianoNote = { id: 'a', pitch: 60, start: 0, length: 1, velocity: 100 }
const NOTE_B: PianoNote = { id: 'b', pitch: 48, start: 2, length: 0.5, velocity: 64 }

function mockContainerRect(container: HTMLElement) {
  const el = container.querySelector('[data-testid="piano-roll"]') as HTMLElement
  el.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
    toJSON: () => {},
  } as DOMRect)
  return el
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('PianoRoll rendering', () => {
  it('renders without crash', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    expect(getByTestId('piano-roll')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    expect(getByTestId('piano-roll').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} size="sm" />)
    expect(getByTestId('piano-roll').getAttribute('data-size')).toBe('sm')
  })

  it('renders a note for each entry in notes prop', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A, NOTE_B]} />)
    expect(getByTestId('note-a')).toBeInTheDocument()
    expect(getByTestId('note-b')).toBeInTheDocument()
  })

  it('each note has role="button"', () => {
    const { getAllByRole } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    const buttons = getAllByRole('button')
    expect(buttons.some(b => b.getAttribute('data-testid') === 'note-a')).toBe(true)
  })

  it('note has aria-label with pitch name', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    expect(getByTestId('note-a').getAttribute('aria-label')).toContain('C4')
  })

  it('note aria-pressed=false when not selected', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    expect(getByTestId('note-a').getAttribute('aria-pressed')).toBe('false')
  })

  it('renders piano-roll-grid', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    expect(getByTestId('piano-roll-grid')).toBeInTheDocument()
  })

  it('lower velocity note has lower opacity than max-velocity note', () => {
    const hi = render(<PianoRoll {...BASE} notes={[{ ...NOTE_A, velocity: 127 }]} />)
    const lo = render(<PianoRoll {...BASE} notes={[{ ...NOTE_A, id: 'lo', velocity: 1 }]} />)
    const hiStyle = parseFloat(hi.getByTestId('note-a').style.opacity)
    const loStyle = parseFloat(lo.getByTestId('note-lo').style.opacity)
    expect(hiStyle).toBeGreaterThan(loStyle)
  })
})

// ─── Note selection ────────────────────────────────────────────────────────────

describe('PianoRoll selection', () => {
  it('clicking a note sets aria-pressed=true', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    fireEvent.pointerDown(getByTestId('note-a'), { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(getByTestId('note-a'), { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    expect(getByTestId('note-a').getAttribute('aria-pressed')).toBe('true')
  })

  it('clicking note calls onSelectNote with the note id', () => {
    const onSelectNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onSelectNote={onSelectNote} />)
    fireEvent.pointerDown(getByTestId('note-a'), { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    expect(onSelectNote).toHaveBeenCalled()
    expect(onSelectNote.mock.calls.at(-1)?.[0]).toContain('a')
  })

  it('clicking grid clears selection', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    const noteEl = getByTestId('note-a')
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(noteEl, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    expect(noteEl.getAttribute('aria-pressed')).toBe('true')

    // Click on grid
    const grid = getByTestId('piano-roll-grid')
    fireEvent.pointerDown(grid, { button: 0, clientX: 500, clientY: 500, pointerId: 2 })
    fireEvent.pointerUp(grid, { button: 0, clientX: 500, clientY: 500, pointerId: 2 })
    expect(noteEl.getAttribute('aria-pressed')).toBe('false')
  })
})

// ─── Add note ─────────────────────────────────────────────────────────────────

describe('PianoRoll add note', () => {
  it('pointerDown on grid calls onAddNote', () => {
    const onAddNote = vi.fn()
    const { container, getByTestId } = render(<PianoRoll {...BASE} onAddNote={onAddNote} />)
    mockContainerRect(container)
    const grid = getByTestId('piano-roll-grid')
    grid.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 800, bottom: 600, width: 712, height: 600,
      toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(grid, { button: 0, clientX: 152, clientY: 10, pointerId: 1 })  // 152-88=64px → 1 beat
    fireEvent.pointerUp(grid, { button: 0, clientX: 152, clientY: 10, pointerId: 1 })
    expect(onAddNote).toHaveBeenCalledTimes(1)
  })

  it('right-button pointerDown on grid does not call onAddNote', () => {
    const onAddNote = vi.fn()
    const { container, getByTestId } = render(<PianoRoll {...BASE} onAddNote={onAddNote} />)
    mockContainerRect(container)
    const grid = getByTestId('piano-roll-grid')
    fireEvent.pointerDown(grid, { button: 2, clientX: 200, clientY: 10, pointerId: 1 })
    expect(onAddNote).not.toHaveBeenCalled()
  })
})

// ─── Delete note ──────────────────────────────────────────────────────────────

describe('PianoRoll delete note', () => {
  it('right-click on note calls onDeleteNote with note id', () => {
    const onDeleteNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onDeleteNote={onDeleteNote} />)
    fireEvent.contextMenu(getByTestId('note-a'))
    expect(onDeleteNote).toHaveBeenCalledWith('a')
  })

  it('Delete key on focused note calls onDeleteNote', () => {
    const onDeleteNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onDeleteNote={onDeleteNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'Delete' })
    expect(onDeleteNote).toHaveBeenCalledWith('a')
  })

  it('Backspace key on focused note calls onDeleteNote', () => {
    const onDeleteNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onDeleteNote={onDeleteNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'Backspace' })
    expect(onDeleteNote).toHaveBeenCalledWith('a')
  })
})

// ─── Keyboard navigation ───────────────────────────────────────────────────────

describe('PianoRoll keyboard navigation', () => {
  it('ArrowUp calls onMoveNote with pitch+1', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 61, 0)
  })

  it('ArrowDown calls onMoveNote with pitch-1', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 59, 0)
  })

  it('Shift+ArrowUp calls onMoveNote with pitch+12', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp', shiftKey: true })
    // pitch 60 + 12 = 72, clamped to hiNote=60, but pitchRange=[36,60] so 60
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('Shift+ArrowDown calls onMoveNote with pitch-12', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown', shiftKey: true })
    expect(onMoveNote).toHaveBeenCalledWith('a', 48, 0)
  })

  it('ArrowRight calls onMoveNote with start+division', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowRight' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0.25)
  })

  it('ArrowLeft calls onMoveNote with start-division (clamped to 0)', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    // NOTE_A.start = 0, so ArrowLeft → max(0, 0-0.25) = 0
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowLeft' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('ArrowLeft from start=1 → 0.75', () => {
    const onMoveNote = vi.fn()
    const note = { ...NOTE_A, start: 1 }
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowLeft' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0.75)
  })

  it('unrelated key does not call onMoveNote', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'Space' })
    expect(onMoveNote).not.toHaveBeenCalled()
  })

  it('pitch clamped to hiNote on ArrowUp at ceiling', () => {
    const onMoveNote = vi.fn()
    const note = { ...NOTE_A, pitch: 60 }  // pitch=60 = hiNote in this pitchRange
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('pitch clamped to loNote on ArrowDown at floor', () => {
    const onMoveNote = vi.fn()
    const note = { ...NOTE_A, pitch: 36 }  // pitch=36 = loNote in this pitchRange
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 36, 0)
  })
})

// ─── Drag move ────────────────────────────────────────────────────────────────

describe('PianoRoll drag move', () => {
  it('pointerUp after move drag calls onMoveNote', () => {
    const onMoveNote = vi.fn()
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14,
      toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    fireEvent.pointerMove(noteEl, { clientX: 200, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 200, clientY: 7, pointerId: 1 })
    expect(onMoveNote).toHaveBeenCalledTimes(1)
    expect(onMoveNote.mock.calls[0][0]).toBe('a')
  })
})

// ─── Drag resize ──────────────────────────────────────────────────────────────

describe('PianoRoll drag resize', () => {
  it('pointerUp after resize drag calls onResizeNote', () => {
    const onResizeNote = vi.fn()
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onResizeNote={onResizeNote} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    // clientX near right edge (right - RESIZE_ZONE = 154-6=148 → click at 150)
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14,
      toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 152, clientY: 7, pointerId: 1 })
    fireEvent.pointerMove(noteEl, { clientX: 250, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 250, clientY: 7, pointerId: 1 })
    expect(onResizeNote).toHaveBeenCalledTimes(1)
    expect(onResizeNote.mock.calls[0][0]).toBe('a')
  })
})
```

- [ ] **Step 2: Run the component tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx vitest run src/components/PianoRoll/PianoRoll.test.tsx
```

Expected: All tests pass.

**If a test fails due to pointer capture not being available in jsdom:** Add this to `src/test-setup.ts` (after reading it first):
```typescript
// jsdom doesn't implement setPointerCapture
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
}
```

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx vitest run
```

Expected: All tests pass (no regressions).

- [ ] **Step 4: Type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && git add src/components/PianoRoll/PianoRoll.test.tsx src/test-setup.ts && git commit -m "test(PianoRoll): 20 tests — render, select, add, delete, keyboard nav, drag move/resize"
```

---

## Task 4: PianoRoll.demo.tsx — Gallery Demo (All States)

**Files:**
- Create: `src/components/PianoRoll/PianoRoll.demo.tsx`

**Interfaces:**
- Consumes: `PianoRoll`, `PianoNote`, `PianoRollProps` from `./PianoRoll`
- Consumes: `DemoShell` from `../../gallery/ui/DemoShell`
- Consumes: `StatesGrid`, `State` from `../../gallery/ui/StatesGrid`
- Consumes: `Playground` from `../../gallery/ui/Playground`
- Consumes: `Toggle` from `../Toggle`
- Consumes: `Fader` from `../Fader`
- Consumes: `ThemeProvider` from `../../theme/ThemeProvider`
- Produces: `meta` (DemoMeta), default export `PianoRollDemo`

- [ ] **Step 1: Create the demo file**

```tsx
// src/components/PianoRoll/PianoRoll.demo.tsx
import { useState, useCallback } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { PianoRoll } from './PianoRoll'
import type { PianoNote } from './PianoRoll'

export const meta: DemoMeta = {
  name:  'PianoRoll',
  group: 'Composites',
  route: '/piano-roll',
  order: 25,
}

// ─── Fixture notes ────────────────────────────────────────────────────────────

const FIXTURE_NOTES: PianoNote[] = [
  { id: 'n1', pitch: 60, start: 0,    length: 1,    velocity: 100 },
  { id: 'n2', pitch: 62, start: 1,    length: 0.5,  velocity: 80  },
  { id: 'n3', pitch: 64, start: 1.5,  length: 0.5,  velocity: 60  },
  { id: 'n4', pitch: 60, start: 2,    length: 2,    velocity: 110  },
  { id: 'n5', pitch: 55, start: 4,    length: 1,    velocity: 90  },
  { id: 'n6', pitch: 57, start: 5,    length: 0.5,  velocity: 70  },
  { id: 'n7', pitch: 59, start: 5.5,  length: 0.5,  velocity: 85  },
  { id: 'n8', pitch: 55, start: 6,    length: 2,    velocity: 100  },
]

const SMALL_RANGE: [number, number] = [48, 72]  // C3–C5

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function RollWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 440, height: 220, overflow: 'hidden', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Empty (grid + keyboard)">
        <RollWrap>
          <PianoRoll notes={[]} pxPerBeat={40} durationBeats={8} pitchRange={SMALL_RANGE} />
        </RollWrap>
      </State>

      <State label="With notes">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={40} durationBeats={8} pitchRange={SMALL_RANGE} />
        </RollWrap>
      </State>

      <State label="Note selected">
        <RollWrap>
          <SelectedNoteState />
        </RollWrap>
      </State>

      <State label="Multi-select">
        <RollWrap>
          <MultiSelectState />
        </RollWrap>
      </State>

      <State label="Snap on">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={40} durationBeats={8} pitchRange={SMALL_RANGE} snap />
        </RollWrap>
      </State>

      <State label="Small size (sm)">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} size="sm" />
        </RollWrap>
      </State>

      <State label="Chroma (light) vs Nocturne (dark)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <ThemeProvider theme="chroma">
            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 2 }}>chroma</div>
            <RollWrap>
              <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} />
            </RollWrap>
          </ThemeProvider>
          <ThemeProvider theme="nocturne">
            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: 2 }}>nocturne</div>
            <RollWrap>
              <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} />
            </RollWrap>
          </ThemeProvider>
        </div>
      </State>

      <State label="Scrolled (dense range)">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={40} durationBeats={8} pitchRange={[24, 96]} />
        </RollWrap>
      </State>
    </StatesGrid>
  )
}

// ─── Selected note state ──────────────────────────────────────────────────────

function SelectedNoteState() {
  const [notes, setNotes] = useState<PianoNote[]>(FIXTURE_NOTES)
  const [sel,   setSel]   = useState<string[]>(['n1'])
  return (
    <PianoRoll
      notes={notes}
      pxPerBeat={40}
      durationBeats={8}
      pitchRange={SMALL_RANGE}
      onSelectNote={setSel}
      onDeleteNote={id => setNotes(n => n.filter(x => x.id !== id))}
      onMoveNote={(id, pitch, start) => setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))}
      onResizeNote={(id, length) => setNotes(n => n.map(x => x.id === id ? { ...x, length } : x))}
    />
  )
}

// ─── Multi-select state ────────────────────────────────────────────────────────

function MultiSelectState() {
  const [notes, setNotes] = useState<PianoNote[]>(FIXTURE_NOTES)
  return (
    <PianoRoll
      notes={notes}
      pxPerBeat={40}
      durationBeats={8}
      pitchRange={SMALL_RANGE}
      onDeleteNote={id => setNotes(n => n.filter(x => x.id !== id))}
      onMoveNote={(id, pitch, start) => setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))}
      onResizeNote={(id, length) => setNotes(n => n.map(x => x.id === id ? { ...x, length } : x))}
    />
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [notes,      setNotes]      = useState<PianoNote[]>(FIXTURE_NOTES)
  const [pxPerBeat,  setPxPerBeat]  = useState(48)
  const [snap,       setSnap]       = useState(false)
  const [division,   setDivision]   = useState(0.25)
  const [loNote,     setLoNote]     = useState(48)
  const [hiNote,     setHiNote]     = useState(72)
  const [lastAction, setLastAction] = useState('—')

  const nextId = useCallback(() => `n${Date.now()}`, [])

  const handleAdd = useCallback((pitch: number, start: number) => {
    const id = nextId()
    setNotes(n => [...n, { id, pitch, start, length: division, velocity: 100 }])
    setLastAction(`add ${id} pitch=${pitch} start=${start.toFixed(2)}`)
  }, [division, nextId])

  const handleMove = useCallback((id: string, pitch: number, start: number) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))
    setLastAction(`move ${id} → pitch=${pitch} start=${start.toFixed(2)}`)
  }, [])

  const handleResize = useCallback((id: string, length: number) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, length } : x))
    setLastAction(`resize ${id} → length=${length.toFixed(2)}`)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNotes(n => n.filter(x => x.id !== id))
    setLastAction(`delete ${id}`)
  }, [])

  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Piano roll */}
        <div style={{ flex: '1 1 400px', height: 300, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <PianoRoll
            notes={notes}
            pxPerBeat={pxPerBeat}
            durationBeats={16}
            pitchRange={[loNote, hiNote]}
            division={division}
            snap={snap}
            onAddNote={handleAdd}
            onMoveNote={handleMove}
            onResizeNote={handleResize}
            onDeleteNote={handleDelete}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0 }}>
          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader value={pxPerBeat} onChange={v => setPxPerBeat(Math.max(16, Math.round(v)))}
              min={16} max={120} orientation="horizontal" size="sm" aria-label="Pixels per beat" />
          </label>

          <Toggle checked={snap} onChange={setSnap} label="snap" size="sm" />

          <label style={labelStyle}>
            division
            <select
              value={division}
              onChange={e => setDivision(Number(e.target.value))}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value={0.25}>1/16</option>
              <option value={0.5}>1/8</option>
              <option value={1}>1/4</option>
              <option value={2}>1/2</option>
            </select>
          </label>

          <label style={labelStyle}>
            pitch lo ({loNote})
            <Fader value={loNote} onChange={v => setLoNote(Math.round(v))}
              min={0} max={60} orientation="horizontal" size="sm" aria-label="Low pitch" />
          </label>

          <label style={labelStyle}>
            pitch hi ({hiNote})
            <Fader value={hiNote} onChange={v => setHiNote(Math.round(v))}
              min={60} max={96} orientation="horizontal" size="sm" aria-label="High pitch" />
          </label>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 'var(--space-2)',
            padding: 'var(--space-2)', background: 'var(--stage)', borderRadius: 'var(--radius)',
          }}>
            last: {lastAction}<br />
            notes: {notes.length}
          </div>

          <button
            onClick={() => { setNotes([]); setLastAction('clear all') }}
            style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', padding: '4px 12px',
              background: 'var(--stage)', color: 'var(--text-muted)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', cursor: 'pointer' }}
          >
            clear
          </button>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function PianoRollDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx tsc --noEmit
```

Expected: 0 errors. Fix any.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && git add src/components/PianoRoll/PianoRoll.demo.tsx && git commit -m "feat(PianoRoll): gallery demo — all states + interactive playground"
```

---

## Task 5: Fix pointer-capture in jsdom + polish

This task handles jsdom polyfilling (needed for tests), ensures the `onSelectNote` effect doesn't fire on mount with an empty array (a subtle UX issue), and adds CSS for the `note.top` override needed when notes in a lane with CSS lane rows stack correctly.

**Files:**
- Read then potentially modify: `src/test-setup.ts`
- Read then potentially modify: `src/components/PianoRoll/PianoRoll.tsx` (fix subtle issues found during test run)

- [ ] **Step 1: Read test-setup.ts**

```bash
cat /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll/src/test-setup.ts
```

- [ ] **Step 2: Add pointer capture polyfill if not already present**

Read the file content. If `setPointerCapture` is not already polyfilled, add it. The file typically has:
```typescript
import '@testing-library/jest-dom'
```

Add after the import:
```typescript
// jsdom does not implement pointer capture — polyfill for components that use it
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
}
```

- [ ] **Step 3: Fix note CSS — position override**

The `.note` CSS rule sets `top: 1px !important` and `height: calc(var(--lane-h) - 2px) !important` which conflicts with the `style={{ top, height: laneH }}` inline styles. The `!important` won't override inline style. Fix: use a CSS variable approach in the CSS, OR remove the `!important` overrides from CSS and apply the inset via CSS (1px padding from lane bottom via border) — i.e. render notes with their lane's top as-is and use `top: 1px` only through the class (this wins since there's no inline top on note — remove `top` from inline style, it's set by `pitchToY`).

Actually, re-examine: the note `style` sets `left`, NOT `top`. The `top` in `.note` comes from CSS `top: 1px !important` which is fine because the `style` attribute on note doesn't set `top` — it sets `left`, `width`, `height`, `opacity`. But `height: laneH` in inline style would override `height: calc(...)` in CSS even without `!important`. Fix: remove `height: laneH` from the inline style and instead use the CSS variable:

In `PianoRoll.tsx`, change note render:
```tsx
style={{
  left,
  top,       // pitchToY gives the top of the lane row; CSS .note adds 1px via top:1px relative to this? NO.
  width,
  // height: laneH,  ← REMOVE this; CSS handles it via calc(var(--lane-h) - 2px)
  opacity,
}}
```

Wait — `top` IS set in inline style (= result of `pitchToY`). So the note is absolutely positioned at `top: pitchToY(pitch, hiNote, laneH)`. The CSS `.note { top: 1px !important }` would override this to `1px` regardless of pitch! That's wrong.

Fix: Remove `top: 1px !important` from `.note` CSS. Instead, use `translateY(1px)` or use padding on the note element, or compute the 1px inset in the `top` calculation. The cleanest solution: compute `top = pitchToY(...) + 1` in the tsx, and set `height = laneH - 2` in the tsx. Remove the `!important` overrides from CSS.

Updated `.note` in CSS:
```css
.note {
  position: absolute;
  box-sizing: border-box;
  background-color: var(--_note-color);
  border-radius: calc(var(--radius) * 0.6);
  border-top: 1px solid color-mix(in srgb, var(--_note-color) 0%, white 30%);
  cursor: grab;
  outline: none;
  transition:
    box-shadow var(--dur-fast) var(--ease-out),
    background-color var(--dur-led-on) var(--ease-out);
  /* top and height are fully controlled by inline style */
}
```

And in PianoRoll.tsx note render:
```tsx
const top    = pitchToY(pitch, hiNote, laneH) + 1
const height = laneH - 2
// ...
style={{ left, top, width, height, opacity }}
```

Similarly for `.noteGhost`:
```css
.noteGhost {
  position: absolute;
  box-sizing: border-box;
  background-color: color-mix(in srgb, var(--accent) 45%, transparent);
  border: 1px dashed color-mix(in srgb, var(--accent) 80%, transparent);
  border-radius: calc(var(--radius) * 0.6);
  pointer-events: none;
  z-index: 1;
  /* top and height are fully controlled by inline style */
}
```

And in the ghost render:
```tsx
const top    = pitchToY(d.pitch, hiNote, laneH) + 1
const height = laneH - 2
return (
  <div className={styles.noteGhost} aria-hidden="true"
    style={{ left, top, width, height }} />
)
```

- [ ] **Step 4: Apply the fixes described in Step 3 to PianoRoll.tsx and PianoRoll.module.css**

In `PianoRoll.tsx`, update the note section in the notes map:
```tsx
const top    = pitchToY(pitch, hiNote, laneH) + 1
const height = laneH - 2
```
and change `style={{ left, top, width, height, opacity }}` (no `height: laneH` override).

Update ghost render similarly.

In `PianoRoll.module.css`, remove `top: 1px !important` and `height: calc(var(--lane-h) - 2px) !important` from `.note`, and `top: 1px !important; height: calc(var(--lane-h) - 2px) !important;` from `.noteGhost`.

- [ ] **Step 5: Run all tests, type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && npx tsc --noEmit && npx vitest run
```

Expected: 0 type errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/piano-roll && git add src/test-setup.ts src/components/PianoRoll/PianoRoll.tsx src/components/PianoRoll/PianoRoll.module.css && git commit -m "fix(PianoRoll): polyfill pointer capture in jsdom; fix note top/height CSS conflict"
```

---

## Self-Review Against Spec

**Spec requirements → tasks:**

| Requirement | Task |
|------------|------|
| Piano keyboard on left, pitch lanes | Task 2 (keyboard strip, laneRow, key CSS) |
| Grid: beat/bar lines, pitch lanes, black-key shading | Task 2 (laneRow CSS with gradient, data-black-key) |
| Notes = rounded blocks at pitch row × time span | Task 2 (note CSS, positioned div) |
| Velocity as note opacity | Task 2 (`velocityOpacity`) |
| Click empty lane → add note | Task 2 (handleGridPointerDown) |
| Click-drag to draw longer | Task 2 (handleGridPointerMove while drawing) |
| Resize by dragging note edge | Task 2 (RESIZE_ZONE, handleNotePointerDown resize branch) |
| Move by dragging note body | Task 2 (handleNotePointerDown move branch) |
| 1:1 drag, snap to grid | Task 2 (snapToGrid in handlers) |
| Right-click note → delete | Task 2 (handleNoteContextMenu) |
| Delete/Backspace on selection → remove | Task 2 (handleNoteKeyDown) |
| ↑/↓ = ±1 semitone | Task 2 (handleNoteKeyDown ArrowUp/Down) |
| Shift+↑/↓ = ±1 octave | Task 2 (handleNoteKeyDown shiftKey) |
| ←/→ = move by grid | Task 2 (handleNoteKeyDown ArrowLeft/Right) |
| Click selects, Shift/⌘-click multi-select | Task 2 (handleSelectNote with multi flag) |
| Callbacks: onAddNote, onMoveNote, onResizeNote, onDeleteNote, onSelectNote | Task 2 (prop interface) |
| MIDI note accessible labels ("C4, bar 1, 1/4") | Task 1 (noteLabel), Task 2 (aria-label) |
| focus-visible rings | Task 2 (`.note:focus-visible` CSS) |
| Scrollable (pitch + time) | Task 2 (.scrollArea overflow: auto) |
| Tokens only | Task 2 (all CSS uses var(--*)) |
| Compare light + dark | Task 4 (chroma vs nocturne in StatesGrid) |
| Reduced-motion | Task 2 (CSS @media prefers-reduced-motion) |
| All states in gallery | Task 4 (StatesGrid with 8 states) |
| tsc + vitest + lint green | All tasks |
| Sizes sm/md | Task 1 (LANE_H_SM/MD, KEY_W_SM/MD), Task 2 (data-size) |
| Dogfood Toggle + Fader | Task 4 (Playground uses Toggle and Fader) |
| Typed against real contract | Task 2 (PianoNote, PianoRollProps match MIDI clip edit intents) |

**No gaps found.**

**Placeholder scan:** No TBD, TODO, or vague steps present.

**Type consistency:** All functions used in later tasks match definitions in Task 1. `PianoNote`, `PianoRollProps` defined in Task 2, used in Tasks 3 and 4 — consistent.
