import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { ClipPlayer } from './ClipPlayer'

const PEAKS = Array.from({ length: 200 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i)))

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderPlayer(props: Partial<React.ComponentProps<typeof ClipPlayer>> = {}) {
  const utils = render(
    <ClipPlayer
      peaks={PEAKS}
      durationSeconds={100}
      positionSeconds={0}
      label="Morning Hook"
      onPlayPause={() => {}}
      onSeek={() => {}}
      {...props}
    />,
  )
  const root = utils.getByTestId('clipplayer-root')
  const wave = utils.getByTestId('clipplayer-wave')
  const button = within(root).getByRole('button')
  return { ...utils, root, wave, button }
}

/** Give the waveform a real box so clientX → fraction math works. */
function sizeWave(wave: HTMLElement, width = 1000) {
  wave.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 56, right: width, bottom: 56, x: 0, y: 0, toJSON: () => {} }) as DOMRect
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('ClipPlayer rendering', () => {
  it('renders the root, waveform scrubber and play button', () => {
    const { root, wave, button } = renderPlayer()
    expect(root).toBeInTheDocument()
    expect(wave).toHaveAttribute('role', 'slider')
    expect(button).toBeInTheDocument()
  })

  it('default size is md', () => {
    const { root } = renderPlayer()
    expect(root).toHaveAttribute('data-size', 'md')
  })

  it('reflects the size prop', () => {
    const { root } = renderPlayer({ size: 'sm' })
    expect(root).toHaveAttribute('data-size', 'sm')
  })

  it('shows the position vs duration readout', () => {
    const { getByTestId } = renderPlayer({ positionSeconds: 12, durationSeconds: 100 })
    expect(getByTestId('clipplayer-elapsed')).toHaveTextContent('0:12')
    expect(getByTestId('clipplayer-duration')).toHaveTextContent('1:40')
  })
})

// ─── Play / pause (intent only) ─────────────────────────────────────────────────

describe('ClipPlayer play/pause', () => {
  it('clicking the button fires onPlayPause', () => {
    const onPlayPause = vi.fn()
    const { button } = renderPlayer({ onPlayPause })
    fireEvent.click(button)
    expect(onPlayPause).toHaveBeenCalledOnce()
  })

  it('button reads Play when paused and Pause when playing', () => {
    const { button, rerender } = renderPlayer({ isPlaying: false })
    expect(button).toHaveAttribute('aria-label', 'Play')
    rerender(
      <ClipPlayer peaks={PEAKS} durationSeconds={100} positionSeconds={0} label="Morning Hook" isPlaying onPlayPause={() => {}} onSeek={() => {}} />,
    )
    expect(button).toHaveAttribute('aria-label', 'Pause')
  })

  it('lights the root while playing', () => {
    const { root } = renderPlayer({ isPlaying: true })
    expect(root).toHaveAttribute('data-playing')
  })

  it('play button carries no aria-pressed (relabel model)', () => {
    const { button } = renderPlayer()
    expect(button).not.toHaveAttribute('aria-pressed')
  })

  it('no onPlayPause → play button disabled (no dead intent)', () => {
    const { button } = renderPlayer({ onPlayPause: undefined })
    expect(button).toBeDisabled()
  })
})

// ─── Pointer scrub ───────────────────────────────────────────────────────────────

describe('ClipPlayer pointer scrub', () => {
  it('click on the waveform seeks to that fraction', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 500, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(50)
  })

  it('dragging emits onSeek continuously and marks the root scrubbing', () => {
    const onSeek = vi.fn()
    const { wave, root } = renderPlayer({ onSeek })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 200, button: 0, pointerId: 1 })
    expect(root).toHaveAttribute('data-scrubbing')
    fireEvent.pointerMove(wave, { clientX: 800, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenLastCalledWith(80)
    fireEvent.pointerUp(wave, { clientX: 800, button: 0, pointerId: 1 })
    expect(root).not.toHaveAttribute('data-scrubbing')
  })

  it('clamps a click past the right edge to the duration', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 1500, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(100)
  })

  it('the playhead follows the pointer mid-scrub (optimistic), not the stale prop', () => {
    const { wave } = renderPlayer({ positionSeconds: 0 })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 250, button: 0, pointerId: 1 })
    expect(wave).toHaveAttribute('aria-valuenow', '25')
  })

  it('ignores non-primary buttons', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 500, button: 2, pointerId: 1 })
    expect(onSeek).not.toHaveBeenCalled()
  })
})

// ─── Keyboard scrub ──────────────────────────────────────────────────────────────

describe('ClipPlayer keyboard scrub', () => {
  it('ArrowRight nudges forward by 5s', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek, positionSeconds: 10 })
    fireEvent.keyDown(wave, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(15)
  })

  it('ArrowLeft clamps at 0', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek, positionSeconds: 2 })
    fireEvent.keyDown(wave, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('PageUp jumps forward by 15s', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek, positionSeconds: 0 })
    fireEvent.keyDown(wave, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(15)
  })

  it('Home seeks to 0 and End seeks to duration', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ onSeek, positionSeconds: 40 })
    fireEvent.keyDown(wave, { key: 'Home' })
    expect(onSeek).toHaveBeenCalledWith(0)
    fireEvent.keyDown(wave, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(100)
  })
})

// ─── ARIA ────────────────────────────────────────────────────────────────────────

describe('ClipPlayer a11y', () => {
  it('the scrubber exposes slider semantics named for the clip', () => {
    const { wave } = renderPlayer({ label: 'Bridge Idea' })
    expect(wave).toHaveAttribute('role', 'slider')
    expect(wave).toHaveAttribute('aria-label', 'Seek — Bridge Idea')
    expect(wave).toHaveAttribute('aria-valuemin', '0')
    expect(wave).toHaveAttribute('aria-valuemax', '100')
    expect(wave).toHaveAttribute('tabindex', '0')
  })

  it('aria-valuetext reads "elapsed of total"', () => {
    const { wave } = renderPlayer({ positionSeconds: 65, durationSeconds: 125 })
    expect(wave).toHaveAttribute('aria-valuetext', '1:05 of 2:05')
  })
})

// ─── No-duration (still rendering) ───────────────────────────────────────────────

describe('ClipPlayer no-duration', () => {
  it('marks the no-duration state and is not scrubbable', () => {
    const onSeek = vi.fn()
    const { wave } = renderPlayer({ durationSeconds: undefined, onSeek })
    expect(wave).toHaveAttribute('data-state', 'no-duration')
    expect(wave).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(wave, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('reads em-dash times with no duration', () => {
    const { getByTestId } = renderPlayer({ durationSeconds: undefined })
    expect(getByTestId('clipplayer-duration')).toHaveTextContent('–:––')
  })
})

// ─── No peaks ────────────────────────────────────────────────────────────────────

describe('ClipPlayer no peaks', () => {
  it('flags no-peaks but stays scrubbable when the duration is known', () => {
    const onSeek = vi.fn()
    const { root, wave } = renderPlayer({ peaks: [], onSeek })
    expect(root).toHaveAttribute('data-no-peaks')
    expect(wave).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(wave, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(5)
  })
})

// ─── Disabled ────────────────────────────────────────────────────────────────────

describe('ClipPlayer disabled', () => {
  it('disables the button and makes the scrubber non-focusable', () => {
    const { root, button, wave } = renderPlayer({ disabled: true })
    expect(root).toHaveAttribute('data-disabled')
    expect(button).toBeDisabled()
    expect(wave).toHaveAttribute('tabindex', '-1')
  })

  it('does not fire intents when disabled', () => {
    const onSeek = vi.fn()
    const onPlayPause = vi.fn()
    const { wave, button } = renderPlayer({ disabled: true, onSeek, onPlayPause })
    sizeWave(wave, 1000)
    fireEvent.pointerDown(wave, { clientX: 500, button: 0, pointerId: 1 })
    fireEvent.keyDown(wave, { key: 'ArrowRight' })
    fireEvent.click(button)
    expect(onSeek).not.toHaveBeenCalled()
    expect(onPlayPause).not.toHaveBeenCalled()
  })
})

// ─── Display-only (no onSeek) ────────────────────────────────────────────────────

describe('ClipPlayer display-only', () => {
  it('no onSeek → not scrubbable but still shows position', () => {
    const { wave } = renderPlayer({ onSeek: undefined, positionSeconds: 30 })
    expect(wave).toHaveAttribute('tabindex', '-1')
    expect(wave).toHaveAttribute('aria-valuenow', '30')
  })
})
