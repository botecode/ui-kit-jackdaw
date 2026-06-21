// src/components/PianoRoll/PianoRoll.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PianoRoll } from './PianoRoll'
import type { PianoNote } from './PianoRoll'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE = {
  notes:        [] as PianoNote[],
  pxPerBeat:    64,
  durationBeats: 8,
  pitchRange:   [36, 60] as [number, number],  // C2–C4, small range for tests
  division:     0.25,
  snap:         false,
}

const NOTE_A: PianoNote = { id: 'a', pitch: 60, start: 0,   length: 1,   velocity: 100 }
const NOTE_B: PianoNote = { id: 'b', pitch: 48, start: 2,   length: 0.5, velocity: 64  }

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

  it('renders a note element for each entry in notes prop', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A, NOTE_B]} />)
    expect(getByTestId('note-a')).toBeInTheDocument()
    expect(getByTestId('note-b')).toBeInTheDocument()
  })

  it('each note has role="button"', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    expect(getByTestId('note-a').getAttribute('role')).toBe('button')
  })

  it('note has aria-label containing pitch name', () => {
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
    const { getByTestId: hiGet } = render(
      <PianoRoll {...BASE} notes={[{ ...NOTE_A, id: 'hi', velocity: 127 }]} />
    )
    const { getByTestId: loGet } = render(
      <PianoRoll {...BASE} notes={[{ ...NOTE_A, id: 'lo', velocity: 1 }]} />
    )
    const hiOpacity = parseFloat(hiGet('note-hi').style.opacity)
    const loOpacity = parseFloat(loGet('note-lo').style.opacity)
    expect(hiOpacity).toBeGreaterThan(loOpacity)
  })
})

// ─── Note selection ────────────────────────────────────────────────────────────

describe('PianoRoll selection', () => {
  it('pointerDown on a note sets aria-pressed=true', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    expect(getByTestId('note-a').getAttribute('aria-pressed')).toBe('true')
  })

  it('pointerDown on a note calls onSelectNote with the note id', () => {
    const onSelectNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onSelectNote={onSelectNote} />)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    expect(onSelectNote).toHaveBeenCalled()
    expect(onSelectNote.mock.calls.at(-1)?.[0]).toContain('a')
  })

  it('pointerDown on grid clears selection', () => {
    const { container, getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} />)
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    // Select the note
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    expect(getByTestId('note-a').getAttribute('aria-pressed')).toBe('true')

    // Click on grid (away from note)
    const grid = getByTestId('piano-roll-grid')
    fireEvent.pointerDown(grid, { button: 0, clientX: 500, clientY: 100, pointerId: 2 })
    expect(getByTestId('note-a').getAttribute('aria-pressed')).toBe('false')
  })
})

// ─── Add note ─────────────────────────────────────────────────────────────────

describe('PianoRoll add note', () => {
  it('pointerDown+Up on grid calls onAddNote once', () => {
    const onAddNote = vi.fn()
    const { container, getByTestId } = render(<PianoRoll {...BASE} onAddNote={onAddNote} />)
    mockContainerRect(container)
    const grid = getByTestId('piano-roll-grid')
    fireEvent.pointerDown(grid, { button: 0, clientX: 152, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(grid,   { button: 0, clientX: 152, clientY: 10, pointerId: 1 })
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

  it('no onAddNote prop → no crash on grid click', () => {
    const { container, getByTestId } = render(<PianoRoll {...BASE} />)
    mockContainerRect(container)
    const grid = getByTestId('piano-roll-grid')
    expect(() => {
      fireEvent.pointerDown(grid, { button: 0, clientX: 200, clientY: 10, pointerId: 1 })
      fireEvent.pointerUp(grid,   { button: 0, clientX: 200, clientY: 10, pointerId: 1 })
    }).not.toThrow()
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

  it('right-click removes note from selectedIds', () => {
    const onSelectNote = vi.fn()
    const { getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onSelectNote={onSelectNote} />
    )
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    // Select it first
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    // Then right-click (delete)
    fireEvent.contextMenu(noteEl)
    const lastCall = onSelectNote.mock.calls.at(-1)?.[0] as string[]
    expect(lastCall).not.toContain('a')
  })
})

// ─── Keyboard navigation ───────────────────────────────────────────────────────

describe('PianoRoll keyboard navigation', () => {
  it('ArrowUp calls onMoveNote with pitch+1', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)  // clamped to hiNote=60
  })

  it('ArrowDown calls onMoveNote with pitch-1', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 59, 0)
  })

  it('Shift+ArrowUp calls onMoveNote with pitch+12 clamped to hiNote', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp', shiftKey: true })
    // pitch 60 + 12 = 72, clamped to hiNote=60 in pitchRange=[36,60]
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('Shift+ArrowDown calls onMoveNote with pitch-12', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown', shiftKey: true })
    // pitch 60 - 12 = 48, within range [36,60]
    expect(onMoveNote).toHaveBeenCalledWith('a', 48, 0)
  })

  it('ArrowRight calls onMoveNote with start+division', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowRight' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0.25)
  })

  it('ArrowLeft at start=0 stays at 0', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
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

  it('pitch clamped to hiNote on ArrowUp at ceiling (pitch=60=hiNote)', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[{ ...NOTE_A, pitch: 60 }]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('pitch clamped to loNote on ArrowDown at floor (pitch=36=loNote)', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[{ ...NOTE_A, pitch: 36 }]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 36, 0)
  })

  it('Delete removes note from selection', () => {
    const onSelectNote = vi.fn()
    const { getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onSelectNote={onSelectNote} />
    )
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    fireEvent.keyDown(noteEl, { key: 'Delete' })
    const lastCall = onSelectNote.mock.calls.at(-1)?.[0] as string[]
    expect(lastCall).not.toContain('a')
  })
})

// ─── Drag move ────────────────────────────────────────────────────────────────

describe('PianoRoll drag move', () => {
  it('pointerUp after move drag calls onMoveNote once', () => {
    const onMoveNote = vi.fn()
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    // Click in the body (not the resize zone — left of right edge by >6px)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    fireEvent.pointerMove(noteEl, { clientX: 200, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 200, clientY: 7, pointerId: 1 })
    expect(onMoveNote).toHaveBeenCalledTimes(1)
    expect(onMoveNote.mock.calls[0][0]).toBe('a')
  })

  it('note shows data-dragging during move drag', () => {
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    expect(noteEl.hasAttribute('data-dragging')).toBe(true)
  })

  it('data-dragging removed after pointerUp', () => {
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 100, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 100, clientY: 7, pointerId: 1 })
    expect(noteEl.hasAttribute('data-dragging')).toBe(false)
  })
})

// ─── Drag resize ──────────────────────────────────────────────────────────────

describe('PianoRoll drag resize', () => {
  it('pointerUp after resize drag calls onResizeNote once', () => {
    const onResizeNote = vi.fn()
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onResizeNote={onResizeNote} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    // right edge at 154 — click at 152 (within RESIZE_ZONE=6 of right=154)
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 152, clientY: 7, pointerId: 1 })
    fireEvent.pointerMove(noteEl, { clientX: 250, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 250, clientY: 7, pointerId: 1 })
    expect(onResizeNote).toHaveBeenCalledTimes(1)
    expect(onResizeNote.mock.calls[0][0]).toBe('a')
  })

  it('resize does not call onMoveNote', () => {
    const onMoveNote   = vi.fn()
    const onResizeNote = vi.fn()
    const { container, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} onResizeNote={onResizeNote} />
    )
    mockContainerRect(container)
    const noteEl = getByTestId('note-a')
    noteEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 88, top: 0, right: 154, bottom: 14, width: 66, height: 14, toJSON: () => {},
    } as DOMRect)
    fireEvent.pointerDown(noteEl, { button: 0, clientX: 152, clientY: 7, pointerId: 1 })
    fireEvent.pointerUp(noteEl,   { clientX: 152, clientY: 7, pointerId: 1 })
    expect(onMoveNote).not.toHaveBeenCalled()
    expect(onResizeNote).toHaveBeenCalled()
  })
})
