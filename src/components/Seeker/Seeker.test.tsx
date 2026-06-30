import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Seeker, formatClock } from './Seeker'

type Props = React.ComponentProps<typeof Seeker>

function renderSeeker(props: Partial<Props> = {}) {
  const onSeek = vi.fn()
  const utils = render(
    <Seeker
      label="Seek"
      positionSeconds={42}
      durationSeconds={180}
      onSeek={onSeek}
      {...props}
    />,
  )
  const track = utils.getByTestId(`${props.idPrefix ?? 'seeker'}-track`)
  return { ...utils, track, onSeek }
}

/** Give the track a measurable width so clientX → seconds resolves. */
function equipTrack(track: HTMLElement, width = 200) {
  track.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 6, right: width, bottom: 6, x: 0, y: 0, toJSON() {} }) as DOMRect
  ;(track as Element & { setPointerCapture(id: number): void }).setPointerCapture = () => {}
  ;(track as Element & { hasPointerCapture(id: number): boolean }).hasPointerCapture = () => true
}

// ─── Pure helper ──────────────────────────────────────────────────────────────

describe('formatClock', () => {
  it('formats seconds as m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(125)).toBe('2:05')
  })

  it('clamps negatives to zero', () => {
    expect(formatClock(-4)).toBe('0:00')
  })

  it('returns the em-dash placeholder for unknown values', () => {
    expect(formatClock(undefined)).toBe('–:––')
    expect(formatClock(NaN)).toBe('–:––')
    expect(formatClock(Infinity)).toBe('–:––')
  })
})

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('Seeker rendering', () => {
  it('renders a slider with the given label', () => {
    const { track } = renderSeeker()
    expect(track).toHaveAttribute('role', 'slider')
    expect(track).toHaveAttribute('aria-label', 'Seek')
  })

  it('reflects position/duration in the ARIA value attributes', () => {
    const { track } = renderSeeker({ positionSeconds: 42, durationSeconds: 180 })
    expect(track).toHaveAttribute('aria-valuemin', '0')
    expect(track).toHaveAttribute('aria-valuemax', '180')
    expect(track).toHaveAttribute('aria-valuenow', '42')
    expect(track).toHaveAttribute('aria-valuetext', '0:42 of 3:00')
  })

  it('sizes the fill to the elapsed fraction', () => {
    const { getByTestId } = renderSeeker({ positionSeconds: 45, durationSeconds: 180 })
    // 45 / 180 = 25% (the DOM normalizes the "25.00%" we write)
    expect(getByTestId('seeker-fill').style.width).toBe('25%')
  })

  it('renders elapsed + remaining times by default', () => {
    const { getByTestId } = renderSeeker({ positionSeconds: 65, durationSeconds: 185 })
    expect(getByTestId('seeker-elapsed')).toHaveTextContent('1:05')
    expect(getByTestId('seeker-remaining')).toHaveTextContent('-2:00')
  })

  it('renders the total duration when trailingTime="total"', () => {
    const { getByTestId } = renderSeeker({ positionSeconds: 65, durationSeconds: 185, trailingTime: 'total' })
    expect(getByTestId('seeker-remaining')).toHaveTextContent('3:05')
  })

  it('hides the times row when showTimes is false', () => {
    const { queryByTestId } = renderSeeker({ showTimes: false })
    expect(queryByTestId('seeker-elapsed')).toBeNull()
  })

  it('reflects rolling state via data-playing', () => {
    const { track } = renderSeeker({ isPlaying: true })
    expect(track).toHaveAttribute('data-playing')
  })

  it('reflects size via data-size', () => {
    const { track } = renderSeeker({ size: 'sm' })
    expect(track).toHaveAttribute('data-size', 'sm')
  })
})

// ─── Pointer seek ─────────────────────────────────────────────────────────────

describe('Seeker pointer seek', () => {
  it('fires onSeek with the time under the pointer', () => {
    const { track, onSeek } = renderSeeker({ durationSeconds: 180 })
    equipTrack(track, 200)
    // 50% across a 180s track → 90s
    fireEvent.pointerDown(track, { clientX: 100, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledTimes(1)
    expect(onSeek.mock.calls[0][0]).toBeCloseTo(90, 1)
  })

  it('continues seeking while dragging with pointer capture', () => {
    const { track, onSeek } = renderSeeker({ durationSeconds: 180 })
    equipTrack(track, 200)
    fireEvent.pointerDown(track, { clientX: 0, button: 0, pointerId: 1 })
    fireEvent.pointerMove(track, { clientX: 150, pointerId: 1 })
    // 75% of 180 → 135s
    const calls = onSeek.mock.calls
    expect(calls[calls.length - 1][0]).toBeCloseTo(135, 1)
  })

  it('clamps a seek past the end to the duration', () => {
    const { track, onSeek } = renderSeeker({ durationSeconds: 180 })
    equipTrack(track, 200)
    fireEvent.pointerDown(track, { clientX: 400, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenLastCalledWith(180)
  })

  it('ignores non-primary buttons', () => {
    const { track, onSeek } = renderSeeker()
    equipTrack(track, 200)
    fireEvent.pointerDown(track, { clientX: 100, button: 2, pointerId: 1 })
    expect(onSeek).not.toHaveBeenCalled()
  })
})

// ─── Keyboard seek ──────────────────────────────────────────────────────────────

describe('Seeker keyboard seek', () => {
  it('nudges ±5s with the arrow keys', () => {
    const { track, onSeek } = renderSeeker({ positionSeconds: 50, durationSeconds: 180 })
    fireEvent.keyDown(track, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(55)
    fireEvent.keyDown(track, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenLastCalledWith(45)
  })

  it('jumps ±15s with Page keys', () => {
    const { track, onSeek } = renderSeeker({ positionSeconds: 50, durationSeconds: 180 })
    fireEvent.keyDown(track, { key: 'PageUp' })
    expect(onSeek).toHaveBeenLastCalledWith(65)
    fireEvent.keyDown(track, { key: 'PageDown' })
    expect(onSeek).toHaveBeenLastCalledWith(35)
  })

  it('Home seeks to 0 and End seeks to the duration', () => {
    const { track, onSeek } = renderSeeker({ positionSeconds: 50, durationSeconds: 180 })
    fireEvent.keyDown(track, { key: 'Home' })
    expect(onSeek).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(track, { key: 'End' })
    expect(onSeek).toHaveBeenLastCalledWith(180)
  })

  it('respects a custom step', () => {
    const { track, onSeek } = renderSeeker({ positionSeconds: 50, durationSeconds: 180, stepSeconds: 10 })
    fireEvent.keyDown(track, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(60)
  })
})

// ─── Not seekable ───────────────────────────────────────────────────────────────

describe('Seeker not seekable', () => {
  it('is display-only (aria-disabled, not tabbable) without an onSeek handler', () => {
    const { track } = renderSeeker({ onSeek: undefined })
    expect(track).toHaveAttribute('aria-disabled', 'true')
    expect(track).toHaveAttribute('tabindex', '-1')
  })

  it('does not seek when disabled', () => {
    const { track, onSeek } = renderSeeker({ disabled: true })
    equipTrack(track, 200)
    fireEvent.pointerDown(track, { clientX: 100, button: 0, pointerId: 1 })
    fireEvent.keyDown(track, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
    expect(track).toHaveAttribute('aria-disabled', 'true')
  })
})

// ─── No duration (indeterminate) ─────────────────────────────────────────────────

describe('Seeker no-duration', () => {
  it('goes indeterminate and shows em-dash times when duration is absent', () => {
    const { track, getByTestId } = renderSeeker({ durationSeconds: undefined })
    expect(track).toHaveAttribute('data-state', 'no-duration')
    expect(track).toHaveAttribute('aria-disabled', 'true')
    expect(getByTestId('seeker-elapsed')).toHaveTextContent('–:––')
    expect(getByTestId('seeker-remaining')).toHaveTextContent('–:––')
  })

  it('does not seek without a known duration', () => {
    const { track, onSeek } = renderSeeker({ durationSeconds: undefined })
    equipTrack(track, 200)
    fireEvent.pointerDown(track, { clientX: 100, button: 0, pointerId: 1 })
    fireEvent.keyDown(track, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('treats a zero / non-finite duration as no-duration', () => {
    const { track } = renderSeeker({ durationSeconds: 0 })
    expect(track).toHaveAttribute('data-state', 'no-duration')
  })
})

// ─── idPrefix passthrough ────────────────────────────────────────────────────────

describe('Seeker idPrefix', () => {
  it('prefixes the test ids so a host can compose it under its own namespace', () => {
    const { getByTestId } = renderSeeker({ idPrefix: 'masterplayer' })
    expect(getByTestId('masterplayer-track')).toHaveAttribute('role', 'slider')
    expect(getByTestId('masterplayer-elapsed')).toBeInTheDocument()
  })
})
