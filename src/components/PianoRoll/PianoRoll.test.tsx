// src/components/PianoRoll/PianoRoll.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PianoRoll } from './PianoRoll'
import type { PianoNote } from './PianoRoll'
import { getAllActions, clearAll } from '../../lib/keybindingRegistry'

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
    const calls = onSelectNote.mock.calls
    expect(calls[calls.length - 1]?.[0]).toContain('a')
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
    const sc = onSelectNote.mock.calls
    const lastCall = sc[sc.length - 1]?.[0] as string[]
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

  it('⌘+ArrowUp calls onMoveNote with pitch+12 (octave)', () => {
    const onMoveNote = vi.fn()
    // Use pitch=48 so +12=60 fits within pitchRange [36,60]
    const note = { ...NOTE_A, pitch: 48 }
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp', metaKey: true })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('⌘+ArrowDown calls onMoveNote with pitch-12 (octave)', () => {
    const onMoveNote = vi.fn()
    // pitch=60, -12=48, within range [36,60]
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown', metaKey: true })
    expect(onMoveNote).toHaveBeenCalledWith('a', 48, 0)
  })

  it('⌘+ArrowUp clamps to hiNote when pitch+12 exceeds range', () => {
    const onMoveNote = vi.fn()
    // pitch=55, +12=67 > hiNote=60 → clamps to 60
    const note = { ...NOTE_A, pitch: 55 }
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp', metaKey: true })
    expect(onMoveNote).toHaveBeenCalledWith('a', 60, 0)
  })

  it('⌘+ArrowDown clamps to loNote when pitch-12 goes below range', () => {
    const onMoveNote = vi.fn()
    // pitch=40, -12=28 < loNote=36 → clamps to 36
    const note = { ...NOTE_A, pitch: 40 }
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown', metaKey: true })
    expect(onMoveNote).toHaveBeenCalledWith('a', 36, 0)
  })

  it('Shift+ArrowUp does not trigger octave move (freed for selection-extend)', () => {
    const onMoveNote = vi.fn()
    // pitch=55; if Shift still did octave it would go to 60; if semitone to 56
    // Shift is freed so nothing should happen
    const note = { ...NOTE_A, pitch: 55 }
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[note]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowUp', shiftKey: true })
    expect(onMoveNote).not.toHaveBeenCalled()
  })

  it('Shift+ArrowDown does not trigger octave move (freed for selection-extend)', () => {
    const onMoveNote = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />)
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown', shiftKey: true })
    expect(onMoveNote).not.toHaveBeenCalled()
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
    const sc2 = onSelectNote.mock.calls
    const lastCall = sc2[sc2.length - 1]?.[0] as string[]
    expect(lastCall).not.toContain('a')
  })
})

// ─── Keybinding registry integration ─────────────────────────────────────────

describe('PianoRoll keybinding registry', () => {
  afterEach(() => clearAll())

  it('registers piano-roll:note-up-octave on mount', () => {
    render(<PianoRoll {...BASE} />)
    const actions = getAllActions()
    expect(actions.some(a => a.id === 'piano-roll:note-up-octave')).toBe(true)
  })

  it('registers piano-roll:note-down-octave on mount', () => {
    render(<PianoRoll {...BASE} />)
    expect(getAllActions().some(a => a.id === 'piano-roll:note-down-octave')).toBe(true)
  })

  it('registers piano-roll:note-delete on mount', () => {
    render(<PianoRoll {...BASE} />)
    expect(getAllActions().some(a => a.id === 'piano-roll:note-delete')).toBe(true)
  })

  it('"Note up an octave" label for note-up-octave action', () => {
    render(<PianoRoll {...BASE} />)
    const action = getAllActions().find(a => a.id === 'piano-roll:note-up-octave')
    expect(action?.name).toBe('Note up an octave')
  })

  it('note-up-octave default binding is ⌘ArrowUp', () => {
    render(<PianoRoll {...BASE} />)
    const action = getAllActions().find(a => a.id === 'piano-roll:note-up-octave')
    expect(action?.bindings).toContain('⌘ArrowUp')
  })

  it('unregisters piano-roll actions on unmount', () => {
    const { unmount } = render(<PianoRoll {...BASE} />)
    unmount()
    expect(getAllActions().some(a => a.category === 'Piano Roll')).toBe(false)
  })

  it('all actions are in category "Piano Roll"', () => {
    render(<PianoRoll {...BASE} />)
    const pianoActions = getAllActions().filter(a => a.category === 'Piano Roll')
    expect(pianoActions.length).toBeGreaterThan(0)
    pianoActions.forEach(a => expect(a.category).toBe('Piano Roll'))
  })
})

// ─── Vertical zoom ────────────────────────────────────────────────────────────
// pitchRange=[36,60] → 2 octaves max. Default visibleOctaves=2 → shows "2oct".

describe('PianoRoll vertical zoom', () => {
  it('renders octave-count display showing default octave count', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    // pitchRange [36,60] = 24 semitones = 2 octaves
    expect(getByTestId('piano-roll-octave-count')).toBeInTheDocument()
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('2oct')
  })

  it('renders zoom-in button', () => {
    const { getByRole } = render(<PianoRoll {...BASE} />)
    expect(getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
  })

  it('renders zoom-out button', () => {
    const { getByRole } = render(<PianoRoll {...BASE} />)
    expect(getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
  })

  it('zoom-in button decreases visible octave count by 1', () => {
    const { getByRole, getByTestId } = render(<PianoRoll {...BASE} />)
    fireEvent.click(getByRole('button', { name: /zoom in/i }))
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('1oct')
  })

  it('zoom-out button increases visible octave count by 1', () => {
    const { getByRole, getByTestId } = render(<PianoRoll {...BASE} />)
    // First zoom in to 1 octave, then zoom back out
    fireEvent.click(getByRole('button', { name: /zoom in/i }))
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('1oct')
    fireEvent.click(getByRole('button', { name: /zoom out/i }))
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('2oct')
  })

  it('zoom-in button is disabled at minimum (1 octave)', () => {
    const { getByRole } = render(<PianoRoll {...BASE} />)
    // Click twice — 2→1→can't go lower
    fireEvent.click(getByRole('button', { name: /zoom in/i }))
    expect(getByRole('button', { name: /zoom in/i })).toBeDisabled()
  })

  it('zoom-out button is disabled at maximum (full range)', () => {
    const { getByRole } = render(<PianoRoll {...BASE} />)
    // At default (2 octaves = max for [36,60]), zoom-out is disabled
    expect(getByRole('button', { name: /zoom out/i })).toBeDisabled()
  })

  it('zoom does not affect note selection or callbacks', () => {
    const onMoveNote = vi.fn()
    const { getByRole, getByTestId } = render(
      <PianoRoll {...BASE} notes={[NOTE_A]} onMoveNote={onMoveNote} />
    )
    fireEvent.click(getByRole('button', { name: /zoom in/i }))
    // Keyboard nav should still work on visible notes
    fireEvent.keyDown(getByTestId('note-a'), { key: 'ArrowDown' })
    expect(onMoveNote).toHaveBeenCalledWith('a', 59, 0)
  })
})

// ─── Wheel / pinch zoom ───────────────────────────────────────────────────────

describe('PianoRoll wheel zoom', () => {
  it('ctrl+wheel with large negative deltaY (pinch-in) decreases visible octaves', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    const scroll = getByTestId('piano-roll-scroll')
    // pitchRange [36,60] = 2 octaves default; ctrlKey pinch-in = zoom in = fewer octaves
    fireEvent.wheel(scroll, { ctrlKey: true, deltaY: -150 })
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('1oct')
  })

  it('ctrl+wheel with large positive deltaY (pinch-out) increases visible octaves', () => {
    const { getByRole, getByTestId } = render(<PianoRoll {...BASE} />)
    // First zoom in so we can zoom back out
    fireEvent.click(getByRole('button', { name: /zoom in/i }))
    const scroll = getByTestId('piano-roll-scroll')
    fireEvent.wheel(scroll, { ctrlKey: true, deltaY: 150 })
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('2oct')
  })

  it('metaKey+wheel with negative deltaY zooms in', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    const scroll = getByTestId('piano-roll-scroll')
    fireEvent.wheel(scroll, { metaKey: true, deltaY: -150 })
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('1oct')
  })

  it('plain wheel without modifier does not change octave count', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    const scroll = getByTestId('piano-roll-scroll')
    fireEvent.wheel(scroll, { deltaY: 150 })
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('2oct')
  })

  it('ctrl+wheel below minimum octave count stays at 1', () => {
    const { getByTestId } = render(<PianoRoll {...BASE} />)
    const scroll = getByTestId('piano-roll-scroll')
    fireEvent.wheel(scroll, { ctrlKey: true, deltaY: -150 })
    fireEvent.wheel(scroll, { ctrlKey: true, deltaY: -150 })  // already at min
    expect(getByTestId('piano-roll-octave-count').textContent).toBe('1oct')
  })

  it('onTimeZoom called when ⌘+horizontal scroll', () => {
    const onTimeZoom = vi.fn()
    const { getByTestId } = render(<PianoRoll {...BASE} onTimeZoom={onTimeZoom} />)
    const scroll = getByTestId('piano-roll-scroll')
    // Large horizontal delta with metaKey → time zoom
    fireEvent.wheel(scroll, { metaKey: true, deltaX: 150, deltaY: 0 })
    expect(onTimeZoom).toHaveBeenCalled()
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
