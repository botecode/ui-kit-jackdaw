import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TimeSelection } from './TimeSelection'
import type { SelectionRange, TimeSelectionProps } from './TimeSelection'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const PX_PER_SEC   = 20
const DURATION     = 30
const BASE_RANGE: SelectionRange = { start: 4, end: 12 }   // 80px … 240px

const secondsToX = (s: number) => s * PX_PER_SEC
const xToSeconds = (x: number) => x / PX_PER_SEC

function sel(
  range: SelectionRange | null = BASE_RANGE,
  onChange: (r: SelectionRange) => void = vi.fn(),
  onClear: () => void = vi.fn(),
  overrides: Partial<TimeSelectionProps> = {},
) {
  return render(
    <TimeSelection
      range={range}
      secondsToX={secondsToX}
      xToSeconds={xToSeconds}
      durationSeconds={DURATION}
      onChange={onChange}
      onClear={onClear}
      {...overrides}
    />
  )
}

// Mock root bounding rect so clientXToContainerX(clientX) = clientX - left.
function mockRoot(container: HTMLElement, left = 0) {
  const root = container.querySelector('[data-testid="time-selection-root"]') as HTMLElement
  root.getBoundingClientRect = vi.fn().mockReturnValue({
    left, top: 0, right: left + 600, bottom: 100,
    width: 600, height: 100, toJSON: () => {},
  } as DOMRect)
  return root
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('TimeSelection rendering — active range', () => {
  it('renders root with data-testid="time-selection-root"', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-root"]')).not.toBeNull()
  })

  it('renders shaded band', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-band"]')).not.toBeNull()
  })

  it('renders start handle', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-handle-start"]')).not.toBeNull()
  })

  it('renders end handle', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-handle-end"]')).not.toBeNull()
  })

  it('band left = secondsToX(range.start)', () => {
    const { container } = sel()
    const band = container.querySelector('[data-testid="time-selection-band"]') as HTMLElement
    expect(band.style.left).toBe(`${secondsToX(BASE_RANGE.start)}px`)
  })

  it('band width = secondsToX(end) - secondsToX(start)', () => {
    const { container } = sel()
    const band = container.querySelector('[data-testid="time-selection-band"]') as HTMLElement
    const expectedW = secondsToX(BASE_RANGE.end) - secondsToX(BASE_RANGE.start)
    expect(band.style.width).toBe(`${expectedW}px`)
  })

  it('start handle left = secondsToX(range.start)', () => {
    const { container } = sel()
    const h = container.querySelector('[data-testid="time-selection-handle-start"]') as HTMLElement
    expect(h.style.left).toBe(`${secondsToX(BASE_RANGE.start)}px`)
  })

  it('end handle left = secondsToX(range.end)', () => {
    const { container } = sel()
    const h = container.querySelector('[data-testid="time-selection-handle-end"]') as HTMLElement
    expect(h.style.left).toBe(`${secondsToX(BASE_RANGE.end)}px`)
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('TimeSelection empty state (range=null)', () => {
  it('renders root with data-empty', () => {
    const { container } = sel(null)
    const root = container.querySelector('[data-testid="time-selection-root"]')
    expect(root).toHaveAttribute('data-empty')
  })

  it('root is aria-hidden when empty', () => {
    const { container } = sel(null)
    expect(container.querySelector('[data-testid="time-selection-root"]'))
      .toHaveAttribute('aria-hidden', 'true')
  })

  it('no band rendered when empty', () => {
    const { container } = sel(null)
    expect(container.querySelector('[data-testid="time-selection-band"]')).toBeNull()
  })

  it('no handles rendered when empty', () => {
    const { container } = sel(null)
    expect(container.querySelector('[data-testid="time-selection-handle-start"]')).toBeNull()
    expect(container.querySelector('[data-testid="time-selection-handle-end"]')).toBeNull()
  })
})

// ─── Data attributes ──────────────────────────────────────────────────────────

describe('TimeSelection data attributes', () => {
  it('data-size="md" by default', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-root"]'))
      .toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = sel(BASE_RANGE, vi.fn(), vi.fn(), { size: 'sm' })
    expect(container.querySelector('[data-testid="time-selection-root"]'))
      .toHaveAttribute('data-size', 'sm')
  })

  it('no data-disabled by default', () => {
    const { container } = sel()
    expect(container.querySelector('[data-testid="time-selection-root"]'))
      .not.toHaveAttribute('data-disabled')
  })

  it('data-disabled when disabled=true', () => {
    const { container } = sel(BASE_RANGE, vi.fn(), vi.fn(), { disabled: true })
    expect(container.querySelector('[data-testid="time-selection-root"]'))
      .toHaveAttribute('data-disabled')
  })
})

// ─── ARIA ─────────────────────────────────────────────────────────────────────

describe('TimeSelection ARIA', () => {
  it('handles have role="slider"', () => {
    const { getAllByRole } = sel()
    expect(getAllByRole('slider').length).toBe(2)
  })

  it('start handle aria-label="Loop start"', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop start' })).toBeInTheDocument()
  })

  it('end handle aria-label="Loop end"', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop end' })).toBeInTheDocument()
  })

  it('start handle aria-valuemin=0', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop start' })).toHaveAttribute('aria-valuemin', '0')
  })

  it('start handle aria-valuemax=durationSeconds', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop start' }))
      .toHaveAttribute('aria-valuemax', String(DURATION))
  })

  it('start handle aria-valuenow=range.start', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop start' }))
      .toHaveAttribute('aria-valuenow', String(BASE_RANGE.start))
  })

  it('end handle aria-valuenow=range.end', () => {
    const { getByRole } = sel()
    expect(getByRole('slider', { name: 'Loop end' }))
      .toHaveAttribute('aria-valuenow', String(BASE_RANGE.end))
  })

  it('group aria-label describes the region', () => {
    const { getByRole } = sel()
    const group = getByRole('group')
    expect(group.getAttribute('aria-label')).toMatch(/Loop region/)
  })

  it('band is aria-hidden', () => {
    const { container } = sel()
    const band = container.querySelector('[data-testid="time-selection-band"]')
    expect(band).toHaveAttribute('aria-hidden', 'true')
  })

  it('handles are in tab order by default', () => {
    const { getAllByRole } = sel()
    getAllByRole('slider').forEach(h => expect(h).toHaveAttribute('tabindex', '0'))
  })

  it('handles removed from tab order when disabled', () => {
    const { getAllByRole } = sel(BASE_RANGE, vi.fn(), vi.fn(), { disabled: true })
    getAllByRole('slider').forEach(h => expect(h).toHaveAttribute('tabindex', '-1'))
  })
})

// ─── Drag — start handle ──────────────────────────────────────────────────────

describe('TimeSelection drag — start handle', () => {
  it('pointerDown + pointerMove on start handle calls onChange with new start', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange)
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!

    // drag from 80px (4s) → 60px (3s)
    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 60, pointerId: 1 })

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeCloseTo(3)
    expect(last.end).toBe(BASE_RANGE.end)  // end unchanged
  })

  it('start handle drag clamps to 0', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange)
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!

    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: -999, pointerId: 1 })  // way past left

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeGreaterThanOrEqual(0)
  })

  it('data-dragging on start handle during drag', () => {
    const { container } = sel()
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!

    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    expect(h).toHaveAttribute('data-dragging')
  })

  it('data-dragging removed after pointerUp', () => {
    const { container } = sel()
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!

    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    fireEvent.pointerUp(h, { pointerId: 1 })
    expect(h).not.toHaveAttribute('data-dragging')
  })
})

// ─── Drag — end handle ────────────────────────────────────────────────────────

describe('TimeSelection drag — end handle', () => {
  it('pointerDown + pointerMove on end handle calls onChange with new end', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange)
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-end"]')!

    // drag from 240px (12s) → 280px (14s)
    fireEvent.pointerDown(h, { clientX: 240, pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 280, pointerId: 1 })

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeCloseTo(14)
    expect(last.start).toBe(BASE_RANGE.start)  // start unchanged
  })

  it('end handle drag clamps to durationSeconds', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange)
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-end"]')!

    fireEvent.pointerDown(h, { clientX: 240, pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 99999, pointerId: 1 })  // way past end

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeLessThanOrEqual(DURATION)
  })
})

// ─── Drag — band (move whole range) ──────────────────────────────────────────

describe('TimeSelection drag — band', () => {
  it('pointerDown + pointerMove on band calls onChange with shifted range', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange)
    mockRoot(container)
    const band = container.querySelector('[data-testid="time-selection-band"]')!

    // drag from 160px (8s = midpoint) → 180px (+1s)
    fireEvent.pointerDown(band, { clientX: 160, pointerId: 1 })
    fireEvent.pointerMove(band, { clientX: 180, pointerId: 1 })

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeCloseTo(5)
    expect(last.end).toBeCloseTo(13)
    // width preserved
    expect(last.end - last.start).toBeCloseTo(BASE_RANGE.end - BASE_RANGE.start)
  })

  it('band drag clamps start to 0', () => {
    const onChange = vi.fn()
    const { container } = sel({ start: 1, end: 5 }, onChange)
    mockRoot(container)
    const band = container.querySelector('[data-testid="time-selection-band"]')!

    fireEvent.pointerDown(band, { clientX: secondsToX(3), pointerId: 1 })
    fireEvent.pointerMove(band, { clientX: -999, pointerId: 1 })

    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeGreaterThanOrEqual(0)
  })

  it('data-dragging on band during drag', () => {
    const { container } = sel()
    mockRoot(container)
    const band = container.querySelector('[data-testid="time-selection-band"]')!

    fireEvent.pointerDown(band, { clientX: 160, pointerId: 1 })
    expect(band).toHaveAttribute('data-dragging')
  })
})

// ─── Drag → onClear (brackets together) ──────────────────────────────────────

describe('TimeSelection drag-to-clear', () => {
  it('onClear called on pointerUp when range is < MIN_DURATION', () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    // render with a near-zero range (as if user dragged brackets together)
    const { container } = sel({ start: 4, end: 4.01 }, onChange, onClear)
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!

    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    fireEvent.pointerUp(h, { pointerId: 1 })

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

// ─── Right-click → clear ──────────────────────────────────────────────────────

describe('TimeSelection right-click', () => {
  it('contextMenu on root calls onClear', () => {
    const onClear = vi.fn()
    const { container } = sel(BASE_RANGE, vi.fn(), onClear)
    const root = container.querySelector('[data-testid="time-selection-root"]')!
    fireEvent.contextMenu(root)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('contextMenu on band calls onClear (bubbles)', () => {
    const onClear = vi.fn()
    const { container } = sel(BASE_RANGE, vi.fn(), onClear)
    const band = container.querySelector('[data-testid="time-selection-band"]')!
    fireEvent.contextMenu(band)
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('TimeSelection keyboard — start handle', () => {
  it('ArrowRight nudges start forward by NUDGE_FINE', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'ArrowRight' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeCloseTo(BASE_RANGE.start + 0.1)
    expect(last.end).toBe(BASE_RANGE.end)
  })

  it('ArrowLeft nudges start back by NUDGE_FINE', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'ArrowLeft' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeCloseTo(BASE_RANGE.start - 0.1)
  })

  it('Shift+ArrowRight nudges start by NUDGE_COARSE', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'ArrowRight', shiftKey: true })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeCloseTo(BASE_RANGE.start + 1.0)
  })

  it('Escape calls onClear', () => {
    const onClear = vi.fn()
    const { getByRole } = sel(BASE_RANGE, vi.fn(), onClear)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'Escape' })
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('start ArrowRight does not cross end', () => {
    const onChange = vi.fn()
    // start very close to end
    const { getByRole } = sel({ start: 11.95, end: 12 }, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'ArrowRight' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.start).toBeLessThan(last.end)
  })
})

describe('TimeSelection keyboard — end handle', () => {
  it('ArrowRight nudges end forward by NUDGE_FINE', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop end' }), { key: 'ArrowRight' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeCloseTo(BASE_RANGE.end + 0.1)
    expect(last.start).toBe(BASE_RANGE.start)
  })

  it('ArrowLeft nudges end back by NUDGE_FINE', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop end' }), { key: 'ArrowLeft' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeCloseTo(BASE_RANGE.end - 0.1)
  })

  it('Escape on end handle calls onClear', () => {
    const onClear = vi.fn()
    const { getByRole } = sel(BASE_RANGE, vi.fn(), onClear)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop end' }), { key: 'Escape' })
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('end ArrowLeft does not cross start', () => {
    const onChange = vi.fn()
    const { getByRole } = sel({ start: 4, end: 4.06 }, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop end' }), { key: 'ArrowLeft' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeGreaterThan(last.start)
  })

  it('end ArrowRight clamps to durationSeconds', () => {
    const onChange = vi.fn()
    const { getByRole } = sel({ start: 4, end: DURATION - 0.05 }, onChange)
    fireEvent.keyDown(getByRole('slider', { name: 'Loop end' }), { key: 'ArrowRight' })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0] as SelectionRange
    expect(last.end).toBeLessThanOrEqual(DURATION)
  })
})

// ─── Disabled ─────────────────────────────────────────────────────────────────

describe('TimeSelection disabled', () => {
  it('onChange not called on drag when disabled', () => {
    const onChange = vi.fn()
    const { container } = sel(BASE_RANGE, onChange, vi.fn(), { disabled: true })
    mockRoot(container)
    const h = container.querySelector('[data-testid="time-selection-handle-start"]')!
    fireEvent.pointerDown(h, { clientX: 80, pointerId: 1 })
    fireEvent.pointerMove(h, { clientX: 60, pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('onChange not called on keyboard when disabled', () => {
    const onChange = vi.fn()
    const { getByRole } = sel(BASE_RANGE, onChange, vi.fn(), { disabled: true })
    fireEvent.keyDown(getByRole('slider', { name: 'Loop start' }), { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
