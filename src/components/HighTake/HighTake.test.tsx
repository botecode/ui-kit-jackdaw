import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { HighTake } from './HighTake'
import type { HighTakeProps } from './HighTake'

// ─── Fixtures ───────────────────────────────────────────────────────────────
//
// Waveform track is mocked to left=0, width=1000 (see mockTrack). With
// DURATION=10 that makes 1px = 0.01s, i.e. seconds = clientX / 100.

const DURATION = 10
const PEAKS = Array.from({ length: 32 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i)))

const secondsToClientX = (s: number) => (s / DURATION) * 1000

function setup(overrides: Partial<HighTakeProps> = {}) {
  const onTrim = overrides.onTrim ?? vi.fn()
  const onSave = overrides.onSave ?? vi.fn()
  const utils = render(
    <HighTake
      peaks={PEAKS}
      durationSeconds={DURATION}
      trimStart={2}
      trimEnd={8}
      onTrim={onTrim}
      onSave={onSave}
      {...overrides}
    />
  )
  return { ...utils, onTrim, onSave }
}

// Mock the waveform track rect so clientX maps linearly to fractions.
function mockTrack(container: HTMLElement, left = 0, width = 1000) {
  const track = container.querySelector('[data-testid="high-take-waveform"]') as HTMLElement
  track.getBoundingClientRect = vi.fn().mockReturnValue({
    left, top: 0, right: left + width, bottom: 80,
    width, height: 80, x: left, y: 0, toJSON: () => {},
  } as DOMRect)
  return track
}

const startHandle = (c: HTMLElement) =>
  c.querySelector('[data-testid="high-take-handle-start"]') as HTMLElement
const endHandle = (c: HTMLElement) =>
  c.querySelector('[data-testid="high-take-handle-end"]') as HTMLElement

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('HighTake — rendering', () => {
  it('renders the root', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-root"]')).not.toBeNull()
  })

  it('renders the waveform track', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-waveform"]')).not.toBeNull()
  })

  it('renders a waveform path (peaks)', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-wave-base"]')).not.toBeNull()
  })

  it('renders both boundary handles', () => {
    const { container } = setup()
    expect(startHandle(container)).not.toBeNull()
    expect(endHandle(container)).not.toBeNull()
  })

  it('renders the kept-span highlight band', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-kept"]')).not.toBeNull()
  })

  it('renders the + save button', () => {
    const { getByRole } = setup()
    expect(getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('shows the label when given', () => {
    const { getByText } = setup({ label: 'Take 3' })
    expect(getByText('Take 3')).toBeInTheDocument()
  })

  it('positions the start handle at trimStart fraction', () => {
    const { container } = setup({ trimStart: 2, trimEnd: 8 })
    // 2 / 10 = 20%
    expect(startHandle(container).style.left).toBe('20%')
  })

  it('positions the end handle at trimEnd fraction', () => {
    const { container } = setup({ trimStart: 2, trimEnd: 8 })
    // 8 / 10 = 80%
    expect(endHandle(container).style.left).toBe('80%')
  })
})

// ─── Data attributes / sizes ───────────────────────────────────────────────────

describe('HighTake — data attributes', () => {
  it('data-size="md" by default', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = setup({ size: 'sm' })
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .toHaveAttribute('data-size', 'sm')
  })

  it('no data-disabled by default', () => {
    const { container } = setup()
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .not.toHaveAttribute('data-disabled')
  })

  it('data-disabled when disabled', () => {
    const { container } = setup({ disabled: true })
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .toHaveAttribute('data-disabled')
  })

  it('data-trimmed when the kept span is narrower than the take', () => {
    const { container } = setup({ trimStart: 2, trimEnd: 8 })
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .toHaveAttribute('data-trimmed')
  })

  it('no data-trimmed when the kept span is the full take', () => {
    const { container } = setup({ trimStart: 0, trimEnd: DURATION })
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .not.toHaveAttribute('data-trimmed')
  })
})

// ─── ARIA ───────────────────────────────────────────────────────────────────

describe('HighTake — ARIA', () => {
  it('handles have role="slider"', () => {
    const { getAllByRole } = setup()
    expect(getAllByRole('slider').length).toBe(2)
  })

  it('start handle is labelled "Trim start"', () => {
    const { getByRole } = setup()
    expect(getByRole('slider', { name: 'Trim start' })).toBeInTheDocument()
  })

  it('end handle is labelled "Trim end"', () => {
    const { getByRole } = setup()
    expect(getByRole('slider', { name: 'Trim end' })).toBeInTheDocument()
  })

  it('start handle aria-valuemin=0 / valuemax=duration / valuenow=trimStart', () => {
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8 })
    const h = getByRole('slider', { name: 'Trim start' })
    expect(h).toHaveAttribute('aria-valuemin', '0')
    expect(h).toHaveAttribute('aria-valuemax', String(DURATION))
    expect(h).toHaveAttribute('aria-valuenow', '2')
  })

  it('end handle aria-valuenow=trimEnd', () => {
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8 })
    expect(getByRole('slider', { name: 'Trim end' })).toHaveAttribute('aria-valuenow', '8')
  })

  it('group labels the take region', () => {
    const { getByRole } = setup({ 'aria-label': 'Take 3 trim' })
    expect(getByRole('group', { name: 'Take 3 trim' })).toBeInTheDocument()
  })

  it('handles are in tab order by default', () => {
    const { getAllByRole } = setup()
    getAllByRole('slider').forEach(h => expect(h).toHaveAttribute('tabindex', '0'))
  })

  it('handles leave tab order when disabled', () => {
    const { getAllByRole } = setup({ disabled: true })
    getAllByRole('slider').forEach(h => expect(h).toHaveAttribute('tabindex', '-1'))
  })
})

// ─── Drag — start handle ───────────────────────────────────────────────────────

describe('HighTake — drag start handle', () => {
  it('dragging start inward reports the new start via onTrim (end unchanged)', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = startHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: secondsToClientX(3), pointerId: 1 })

    expect(onTrim).toHaveBeenCalled()
    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeCloseTo(3)
    expect(end).toBe(8)
  })

  it('start clamps to 0 when dragged past the left edge', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = startHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: -9999, pointerId: 1 })

    const [start] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeGreaterThanOrEqual(0)
  })

  it('start never crosses end (stops at end - min keep)', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = startHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 9999, pointerId: 1 })  // way past the end handle

    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeLessThan(end)
    expect(start).toBeLessThanOrEqual(8)
  })

  it('sets data-dragging on the start handle during a drag', () => {
    const { container } = setup()
    mockTrack(container)
    const h = startHandle(container)
    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    expect(h).toHaveAttribute('data-dragging')
  })

  it('clears data-dragging after pointerUp', () => {
    const { container } = setup()
    mockTrack(container)
    const h = startHandle(container)
    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    fireEvent.pointerUp(h, { pointerId: 1 })
    expect(h).not.toHaveAttribute('data-dragging')
  })
})

// ─── Drag — end handle ─────────────────────────────────────────────────────────

describe('HighTake — drag end handle', () => {
  it('dragging end inward reports the new end via onTrim (start unchanged)', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = endHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(8), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: secondsToClientX(6), pointerId: 1 })

    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeCloseTo(6)
    expect(start).toBe(2)
  })

  it('end clamps to durationSeconds when dragged past the right edge', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = endHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(8), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 99999, pointerId: 1 })

    const [, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeLessThanOrEqual(DURATION)
  })

  it('end never crosses start (stops at start + min keep)', () => {
    const onTrim = vi.fn()
    const { container } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    mockTrack(container)
    const h = endHandle(container)

    fireEvent.pointerDown(h, { clientX: secondsToClientX(8), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: -9999, pointerId: 1 })  // way past the start handle

    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeGreaterThan(start)
    expect(end).toBeGreaterThanOrEqual(2)
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('HighTake — keyboard', () => {
  it('ArrowRight nudges start forward by the fine step', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'ArrowRight' })
    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeCloseTo(2.1)
    expect(end).toBe(8)
  })

  it('ArrowLeft nudges start back by the fine step', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'ArrowLeft' })
    const [start] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeCloseTo(1.9)
  })

  it('Shift+ArrowRight nudges by the coarse step', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'ArrowRight', shiftKey: true })
    const [start] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeCloseTo(3)
  })

  it('ArrowRight on end nudges end forward (start unchanged)', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim end' }), { key: 'ArrowRight' })
    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeCloseTo(8.1)
    expect(start).toBe(2)
  })

  it('start ArrowRight cannot cross end', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 7.98, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'ArrowRight' })
    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBeLessThan(end)
  })

  it('end ArrowLeft cannot cross start', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 2.02, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim end' }), { key: 'ArrowLeft' })
    const [start, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeGreaterThan(start)
  })

  it('Home sends start to 0', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'Home' })
    const [start] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(start).toBe(0)
  })

  it('End sends end to durationSeconds', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: 8, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim end' }), { key: 'End' })
    const [, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBe(DURATION)
  })

  it('End on end clamps to duration even past the edge value', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ trimStart: 2, trimEnd: DURATION - 0.05, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim end' }), { key: 'ArrowRight' })
    const [, end] = onTrim.mock.calls[onTrim.mock.calls.length - 1]
    expect(end).toBeLessThanOrEqual(DURATION)
  })
})

// ─── Save ─────────────────────────────────────────────────────────────────────

describe('HighTake — save', () => {
  it('clicking + save fires onSave', () => {
    const onSave = vi.fn()
    const { getByRole } = setup({ onSave })
    fireEvent.click(getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('save button is disabled when disabled', () => {
    const { getByRole } = setup({ disabled: true })
    expect(getByRole('button', { name: /save/i })).toBeDisabled()
  })
})

// ─── Disabled ─────────────────────────────────────────────────────────────────

describe('HighTake — disabled', () => {
  it('does not report onTrim on drag when disabled', () => {
    const onTrim = vi.fn()
    const { container } = setup({ disabled: true, onTrim })
    mockTrack(container)
    const h = startHandle(container)
    fireEvent.pointerDown(h, { clientX: secondsToClientX(2), pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: secondsToClientX(3), pointerId: 1 })
    expect(onTrim).not.toHaveBeenCalled()
  })

  it('does not report onTrim on keyboard when disabled', () => {
    const onTrim = vi.fn()
    const { getByRole } = setup({ disabled: true, onTrim })
    fireEvent.keyDown(getByRole('slider', { name: 'Trim start' }), { key: 'ArrowRight' })
    expect(onTrim).not.toHaveBeenCalled()
  })
})

// ─── Empty ──────────────────────────────────────────────────────────────────

describe('HighTake — empty (no peaks)', () => {
  it('renders without crashing and still shows the waveform + handles', () => {
    const { container } = setup({ peaks: [] })
    expect(container.querySelector('[data-testid="high-take-waveform"]')).not.toBeNull()
    expect(startHandle(container)).not.toBeNull()
    expect(endHandle(container)).not.toBeNull()
  })

  it('marks the root data-empty when there are no peaks', () => {
    const { container } = setup({ peaks: [] })
    expect(container.querySelector('[data-testid="high-take-root"]'))
      .toHaveAttribute('data-empty')
  })
})

// ─── Playback (optional play affordance) ──────────────────────────────────────

describe('HighTake — playback', () => {
  it('shows no play control or playhead without onTogglePlay (additive)', () => {
    const { container, queryByRole } = setup()
    expect(queryByRole('button', { name: /play|pause/i })).toBeNull()
    expect(container.querySelector('[data-testid="high-take-playhead"]')).toBeNull()
  })

  it('renders a play control when onTogglePlay is provided', () => {
    const { getByRole } = setup({ onTogglePlay: vi.fn(), label: 'Take 1' })
    expect(getByRole('button', { name: /play take 1/i })).toBeInTheDocument()
  })

  it('relabels the control to Pause while playing', () => {
    const { getByRole } = setup({ onTogglePlay: vi.fn(), playing: true, label: 'Take 1' })
    expect(getByRole('button', { name: /pause take 1/i })).toBeInTheDocument()
  })

  it('fires onTogglePlay when the play control is clicked', () => {
    const onTogglePlay = vi.fn()
    const { getByRole } = setup({ onTogglePlay, label: 'Take 1' })
    fireEvent.click(getByRole('button', { name: /play take 1/i }))
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('shows the playhead while playing and marks it data-playing', () => {
    const { container } = setup({ onTogglePlay: vi.fn(), playing: true })
    const ph = container.querySelector('[data-testid="high-take-playhead"]')
    expect(ph).not.toBeNull()
    expect(ph).toHaveAttribute('data-playing')
  })

  it('parks the playhead at playheadSeconds when provided and stopped', () => {
    const { container } = setup({ playheadSeconds: 5, durationSeconds: DURATION })
    const ph = container.querySelector('[data-testid="high-take-playhead"]') as HTMLElement
    // 5 / 10 = 50%
    expect(ph.style.left).toBe('50%')
    expect(ph).not.toHaveAttribute('data-playing')
  })
})
