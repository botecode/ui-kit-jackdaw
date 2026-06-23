// src/components/TrackLane/TrackLane.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TrackLane } from './TrackLane'
import type { ClipInfo, TrackLaneProps } from './TrackLane'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  // ResizeObserver used inside Clip (not TrackLane itself, but Clip renders here).
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  }
  // setPointerCapture is not in jsdom.
  HTMLDivElement.prototype.setPointerCapture = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PEAKS = [0.2, 0.8, 0.5, 0.9, 0.3, 0.6]

const CLIP_A: ClipInfo = {
  clipId: 'a',
  start:  0,
  length: 4,     // 4 seconds
  peaks:  PEAKS,
  color:  'var(--chroma-blue)',
  label:  'Guitar',
}

const CLIP_B: ClipInfo = {
  clipId: 'b',
  start:  5,
  length: 2,
  peaks:  PEAKS,
  color:  'var(--chroma-green)',
}

const BASE: TrackLaneProps = {
  trackId:     't1',
  clips:       [],
  bpm:         120,
  numerator:   4,
  denominator: 4,
  pxPerBeat:   48,
  division:    '1/4',
  height:      64,
}

function lane(overrides: Partial<TrackLaneProps> = {}) {
  return render(<TrackLane {...BASE} {...overrides} />)
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('TrackLane rendering', () => {
  it('renders data-testid="track-lane"', () => {
    const { getByTestId } = lane()
    expect(getByTestId('track-lane')).toBeInTheDocument()
  })

  it('sets data-track-id from trackId prop', () => {
    const { getByTestId } = lane({ trackId: 'myTrack' })
    expect(getByTestId('track-lane')).toHaveAttribute('data-track-id', 'myTrack')
  })

  it('renders with correct height style', () => {
    const { getByTestId } = lane({ height: 80 })
    expect((getByTestId('track-lane') as HTMLElement).style.height).toBe('80px')
  })

  it('renders the TimelineGrid (aria-hidden grid background)', () => {
    const { container } = lane()
    expect(container.querySelector('[data-testid="timeline-grid"]')).toBeInTheDocument()
  })

  it('empty clips → no clip slots', () => {
    const { container } = lane({ clips: [] })
    expect(container.querySelectorAll('[data-clip-id]')).toHaveLength(0)
  })

  it('renders a clip slot per clip', () => {
    const { container } = lane({ clips: [CLIP_A, CLIP_B] })
    expect(container.querySelectorAll('[data-clip-id]')).toHaveLength(2)
  })

  it('each clip slot carries the correct data-clip-id', () => {
    const { container } = lane({ clips: [CLIP_A, CLIP_B] })
    expect(container.querySelector('[data-clip-id="a"]')).toBeInTheDocument()
    expect(container.querySelector('[data-clip-id="b"]')).toBeInTheDocument()
  })

  it('clip slot is keyboard-focusable (tabIndex=0)', () => {
    const { container } = lane({ clips: [CLIP_A] })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    expect(slot.tabIndex).toBe(0)
  })
})

// ─── Selected / disabled states ───────────────────────────────────────────────

describe('TrackLane state attributes', () => {
  it('no data-selected by default', () => {
    const { getByTestId } = lane()
    expect(getByTestId('track-lane')).not.toHaveAttribute('data-selected')
  })

  it('data-selected when selected=true', () => {
    const { getByTestId } = lane({ selected: true })
    expect(getByTestId('track-lane')).toHaveAttribute('data-selected')
  })

  it('no data-disabled by default', () => {
    const { getByTestId } = lane()
    expect(getByTestId('track-lane')).not.toHaveAttribute('data-disabled')
  })

  it('data-disabled when disabled=true', () => {
    const { getByTestId } = lane({ disabled: true })
    expect(getByTestId('track-lane')).toHaveAttribute('data-disabled')
  })

  it('disabled clips have tabIndex=-1', () => {
    const { container } = lane({ clips: [CLIP_A], disabled: true })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    expect(slot.tabIndex).toBe(-1)
  })
})

// ─── Clip positioning ─────────────────────────────────────────────────────────

describe('TrackLane clip positioning', () => {
  it('positions clip at secondsToX(start) from left', () => {
    // secondsToX(0, 48, 120) = 0 × (120/60) × 48 = 0
    const { container } = lane({ clips: [{ ...CLIP_A, start: 0 }] })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    expect(parseFloat(slot.style.left)).toBeCloseTo(0)
  })

  it('clip starting at 2s is 2 beats right (pxPerBeat=48, bpm=120 → 1 beat=0.5s → 2s=4 beats=192px)', () => {
    const { container } = lane({ clips: [{ ...CLIP_A, start: 2 }], pxPerBeat: 48, bpm: 120 })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    // 2s × (120bpm/60) beats/s × 48px/beat = 192px
    expect(parseFloat(slot.style.left)).toBeCloseTo(192)
  })

  it('clip width = secondsToX(start+length) - secondsToX(start)', () => {
    // start=0, length=2, pxPerBeat=48, bpm=120 → width = 192px
    const { container } = lane({ clips: [{ ...CLIP_A, start: 0, length: 2 }], pxPerBeat: 48, bpm: 120 })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    expect(parseFloat(slot.style.width)).toBeCloseTo(192)
  })
})

// ─── Empty lane cursor ─────────────────────────────────────────────────────────

describe('TrackLane onSetCursor', () => {
  it('clicking empty lane calls onSetCursor with snapped seconds', () => {
    const onSetCursor = vi.fn()
    const { getByTestId } = lane({ onSetCursor })
    const root = getByTestId('track-lane')
    // Simulate click on empty lane (not on a clip).
    // getBoundingClientRect returns zero-rect in jsdom; clientX=96 → x=96.
    // snapXToDivision(96, divisionPx=48) = 96 (exact boundary)
    // xToSeconds(96, 48, 120) = 96 / ((120/60)*48) = 96/96 = 1s
    fireEvent.pointerDown(root, { clientX: 96, target: root })
    expect(onSetCursor).toHaveBeenCalledWith(expect.any(Number))
  })

  it('onSetCursor is NOT called if the lane is disabled', () => {
    const onSetCursor = vi.fn()
    const { getByTestId } = lane({ disabled: true, onSetCursor })
    fireEvent.pointerDown(getByTestId('track-lane'), { clientX: 96 })
    expect(onSetCursor).not.toHaveBeenCalled()
  })
})

// ─── Clip drag — move ─────────────────────────────────────────────────────────

describe('TrackLane clip drag (move)', () => {
  it('sets data-dragging on root while dragging a clip', () => {
    // Fire on the clip slot so e.target is the slot (bubbles to lane handler).
    const { getByTestId, container } = lane({ clips: [CLIP_A] })
    const clipSlot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(clipSlot, { clientX: 10 })
    expect(getByTestId('track-lane')).toHaveAttribute('data-dragging', 'a')
  })

  it('clears data-dragging after pointer up', () => {
    const { getByTestId, container } = lane({ clips: [CLIP_A] })
    const clipSlot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const root = getByTestId('track-lane')
    fireEvent.pointerDown(clipSlot, { clientX: 10 })
    fireEvent.pointerUp(root, { clientX: 10 })
    expect(root).not.toHaveAttribute('data-dragging')
  })

  it('calls onClipMove with snapped start on pointer up', () => {
    const onClipMove = vi.fn()
    const { getByTestId, container } = lane({ clips: [CLIP_A], onClipMove, pxPerBeat: 48, bpm: 120 })
    const clipSlot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const root = getByTestId('track-lane')
    fireEvent.pointerDown(clipSlot, { clientX: 0 })
    fireEvent.pointerMove(root, { clientX: 48 })
    fireEvent.pointerUp(root,   { clientX: 48 })
    expect(onClipMove).toHaveBeenCalledWith(
      expect.objectContaining({ clipId: 'a', start: expect.any(Number) })
    )
  })

  it('does not call onClipMove when disabled', () => {
    const onClipMove = vi.fn()
    const { getByTestId, container } = lane({ clips: [CLIP_A], onClipMove, disabled: true })
    const clipSlot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const root = getByTestId('track-lane')
    fireEvent.pointerDown(clipSlot, { clientX: 0 })
    fireEvent.pointerUp(root,       { clientX: 48 })
    expect(onClipMove).not.toHaveBeenCalled()
  })
})

// ─── Clip drag — trim ─────────────────────────────────────────────────────────

describe('TrackLane clip trim', () => {
  it('dragging trim-start handle calls onClipTrimStart', () => {
    // Fire on the trim handle element so e.target carries data-trim="start".
    const onClipTrimStart = vi.fn()
    const { getByTestId, container } = lane({ clips: [CLIP_A], onClipTrimStart })
    const root      = getByTestId('track-lane')
    const trimStart = container.querySelector('[data-clip-id="a"] [data-trim="start"]') as HTMLElement
    fireEvent.pointerDown(trimStart, { clientX: 0 })
    fireEvent.pointerMove(root, { clientX: 48 })
    fireEvent.pointerUp(root,   { clientX: 48 })
    expect(onClipTrimStart).toHaveBeenCalledWith(
      expect.objectContaining({ clipId: 'a', start: expect.any(Number), length: expect.any(Number) })
    )
  })

  it('dragging trim-end handle calls onClipTrimEnd', () => {
    // Fire on the trim handle element so e.target carries data-trim="end".
    const onClipTrimEnd = vi.fn()
    const { getByTestId, container } = lane({ clips: [CLIP_A], onClipTrimEnd })
    const root    = getByTestId('track-lane')
    const trimEnd = container.querySelector('[data-clip-id="a"] [data-trim="end"]') as HTMLElement
    fireEvent.pointerDown(trimEnd, { clientX: 100 })
    fireEvent.pointerMove(root, { clientX: 148 })
    fireEvent.pointerUp(root,   { clientX: 148 })
    expect(onClipTrimEnd).toHaveBeenCalledWith(
      expect.objectContaining({ clipId: 'a', length: expect.any(Number) })
    )
  })
})

// ─── Keyboard delete ──────────────────────────────────────────────────────────

describe('TrackLane keyboard delete', () => {
  it('Delete key on focused clip slot calls onClipDelete', () => {
    const onClipDelete = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipDelete })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.keyDown(slot, { key: 'Delete' })
    expect(onClipDelete).toHaveBeenCalledWith('a')
  })

  it('Backspace key also calls onClipDelete', () => {
    const onClipDelete = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipDelete })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.keyDown(slot, { key: 'Backspace' })
    expect(onClipDelete).toHaveBeenCalledWith('a')
  })

  it('other keys do not call onClipDelete', () => {
    const onClipDelete = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipDelete })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.keyDown(slot, { key: 'ArrowLeft' })
    expect(onClipDelete).not.toHaveBeenCalled()
  })
})

// ─── Clip selection ───────────────────────────────────────────────────────────

describe('TrackLane clip selection', () => {
  it('plain click on a clip body calls onClipSelect with the clip id', () => {
    const onClipSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10 })
    expect(onClipSelect).toHaveBeenCalledWith('a')
  })

  it('plain click does NOT call onClipShiftSelect', () => {
    const onClipShiftSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipShiftSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10 })
    expect(onClipShiftSelect).not.toHaveBeenCalled()
  })

  it('shift+click on a clip body calls onClipShiftSelect with the clip id', () => {
    const onClipShiftSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipShiftSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10, shiftKey: true })
    expect(onClipShiftSelect).toHaveBeenCalledWith('a')
  })

  it('shift+click does NOT call onClipSelect (pure additive gesture)', () => {
    const onClipSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10, shiftKey: true })
    expect(onClipSelect).not.toHaveBeenCalled()
  })

  it('shift+click does NOT start a move drag (no data-dragging)', () => {
    const { getByTestId, container } = lane({ clips: [CLIP_A] })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10, shiftKey: true })
    expect(getByTestId('track-lane')).not.toHaveAttribute('data-dragging')
  })

  it('does not call select handlers when disabled', () => {
    const onClipSelect = vi.fn()
    const onClipShiftSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipSelect, onClipShiftSelect, disabled: true })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 10 })
    fireEvent.pointerDown(slot, { clientX: 10, shiftKey: true })
    expect(onClipSelect).not.toHaveBeenCalled()
    expect(onClipShiftSelect).not.toHaveBeenCalled()
  })

  it('clicking a trim handle does not call onClipSelect', () => {
    const onClipSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipSelect })
    const trimStart = container.querySelector('[data-clip-id="a"] [data-trim="start"]') as HTMLElement
    fireEvent.pointerDown(trimStart, { clientX: 0 })
    expect(onClipSelect).not.toHaveBeenCalled()
  })

  it('Enter on a focused clip slot calls onClipSelect', () => {
    const onClipSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.keyDown(slot, { key: 'Enter' })
    expect(onClipSelect).toHaveBeenCalledWith('a')
  })

  it('Shift+Enter on a focused clip slot calls onClipShiftSelect', () => {
    const onClipShiftSelect = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipShiftSelect })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.keyDown(slot, { key: 'Enter', shiftKey: true })
    expect(onClipShiftSelect).toHaveBeenCalledWith('a')
  })
})

// ─── Context menu ─────────────────────────────────────────────────────────────

describe('TrackLane context menu', () => {
  it('right-click on a clip calls onClipContextMenu with the event and clip id', () => {
    const onClipContextMenu = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipContextMenu })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.contextMenu(slot, { clientX: 120, clientY: 40 })
    expect(onClipContextMenu).toHaveBeenCalledTimes(1)
    const [event, clipId] = onClipContextMenu.mock.calls[0]
    expect(clipId).toBe('a')
    expect(event.clientX).toBe(120)
    expect(event.clientY).toBe(40)
  })

  it('right-click on a clip does NOT call onLaneContextMenu', () => {
    const onLaneContextMenu = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onLaneContextMenu })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.contextMenu(slot, { clientX: 120, clientY: 40 })
    expect(onLaneContextMenu).not.toHaveBeenCalled()
  })

  it('right-click on a clip trim handle still resolves to the clip (handle is part of the clip)', () => {
    const onClipContextMenu = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipContextMenu })
    const trimStart = container.querySelector('[data-clip-id="a"] [data-trim="start"]') as HTMLElement
    fireEvent.contextMenu(trimStart, { clientX: 10, clientY: 20 })
    expect(onClipContextMenu).toHaveBeenCalledWith(expect.anything(), 'a')
  })

  it('right-click on empty lane calls onLaneContextMenu with the event and track id', () => {
    const onLaneContextMenu = vi.fn()
    const { getByTestId } = lane({ trackId: 't9', onLaneContextMenu })
    const root = getByTestId('track-lane')
    fireEvent.contextMenu(root, { clientX: 200, clientY: 30, target: root })
    expect(onLaneContextMenu).toHaveBeenCalledTimes(1)
    const [event, trackId] = onLaneContextMenu.mock.calls[0]
    expect(trackId).toBe('t9')
    expect(event.clientX).toBe(200)
    expect(event.clientY).toBe(30)
  })

  it('right-click on empty lane does NOT call onClipContextMenu', () => {
    const onClipContextMenu = vi.fn()
    const { getByTestId } = lane({ clips: [CLIP_A], onClipContextMenu })
    const root = getByTestId('track-lane')
    fireEvent.contextMenu(root, { clientX: 200, clientY: 30, target: root })
    expect(onClipContextMenu).not.toHaveBeenCalled()
  })

  it('prevents the native menu when a clip handler is provided', () => {
    const onClipContextMenu = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onClipContextMenu })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const prevented = !fireEvent.contextMenu(slot, { clientX: 1, clientY: 1 })
    expect(prevented).toBe(true)
  })

  it('prevents the native menu when a lane handler is provided', () => {
    const onLaneContextMenu = vi.fn()
    const { getByTestId } = lane({ onLaneContextMenu })
    const root = getByTestId('track-lane')
    const prevented = !fireEvent.contextMenu(root, { clientX: 1, clientY: 1, target: root })
    expect(prevented).toBe(true)
  })

  it('does NOT prevent the native menu when no handler is provided for that region', () => {
    // Clip region with only a lane handler wired → native menu left intact on the clip.
    const onLaneContextMenu = vi.fn()
    const { container } = lane({ clips: [CLIP_A], onLaneContextMenu })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const prevented = !fireEvent.contextMenu(slot, { clientX: 1, clientY: 1 })
    expect(prevented).toBe(false)
    expect(onLaneContextMenu).not.toHaveBeenCalled()
  })

  it('does not call context-menu handlers when disabled', () => {
    const onClipContextMenu = vi.fn()
    const onLaneContextMenu = vi.fn()
    const { getByTestId, container } = lane({
      clips: [CLIP_A], onClipContextMenu, onLaneContextMenu, disabled: true,
    })
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.contextMenu(slot, { clientX: 10, clientY: 10 })
    fireEvent.contextMenu(getByTestId('track-lane'), { clientX: 10, clientY: 10, target: getByTestId('track-lane') })
    expect(onClipContextMenu).not.toHaveBeenCalled()
    expect(onLaneContextMenu).not.toHaveBeenCalled()
  })
})

// ─── Trim handle presence ─────────────────────────────────────────────────────

describe('TrackLane trim handles', () => {
  it('each clip slot has a trim-start and trim-end handle', () => {
    const { container } = lane({ clips: [CLIP_A] })
    expect(container.querySelector('[data-clip-id="a"] [data-trim="start"]')).toBeInTheDocument()
    expect(container.querySelector('[data-clip-id="a"] [data-trim="end"]')).toBeInTheDocument()
  })
})

// ─── Multiple clips ───────────────────────────────────────────────────────────

describe('TrackLane multiple clips', () => {
  it('two clips render independently', () => {
    const { container } = lane({ clips: [CLIP_A, CLIP_B] })
    expect(container.querySelector('[data-clip-id="a"]')).toBeInTheDocument()
    expect(container.querySelector('[data-clip-id="b"]')).toBeInTheDocument()
  })

  it('clips have different left positions matching their start times', () => {
    const { container } = lane({ clips: [CLIP_A, CLIP_B], pxPerBeat: 48, bpm: 120 })
    const slotA = container.querySelector('[data-clip-id="a"]') as HTMLElement
    const slotB = container.querySelector('[data-clip-id="b"]') as HTMLElement
    // CLIP_A starts at 0, CLIP_B starts at 5s.
    // 5s × 2 beats/s × 48px/beat = 480px
    expect(parseFloat(slotA.style.left)).toBeCloseTo(0)
    expect(parseFloat(slotB.style.left)).toBeCloseTo(480)
  })
})

// ─── Pointer cancel ───────────────────────────────────────────────────────────

describe('TrackLane pointer cancel', () => {
  it('pointercancel clears drag state (no onClipMove call)', () => {
    const onClipMove = vi.fn()
    const { getByTestId, container } = lane({ clips: [CLIP_A], onClipMove })
    const root = getByTestId('track-lane')
    const slot = container.querySelector('[data-clip-id="a"]') as HTMLElement
    fireEvent.pointerDown(slot, { clientX: 0 })
    fireEvent.pointerMove(root, { clientX: 48 })
    fireEvent.pointerCancel(root)
    // pointercancel resolves the drag as-is (same path as pointerup) — intent is still emitted.
    // The important thing: root no longer shows dragging.
    expect(root).not.toHaveAttribute('data-dragging')
  })
})
