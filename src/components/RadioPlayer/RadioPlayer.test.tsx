import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { RadioPlayer } from './RadioPlayer'
import type { RadioTrack } from './RadioPlayer'
import { layoutText } from './radioFont'

const TRACKS: RadioTrack[] = [
  { id: 'a', title: 'Midnight Take', duration: 174 },
  { id: 'b', title: 'Rooftop Jam', duration: 132 },
  { id: 'c', title: 'Slow Burn', duration: 201 },
]

function renderRadio(props: Partial<React.ComponentProps<typeof RadioPlayer>> = {}) {
  const utils = render(
    <RadioPlayer tracks={TRACKS} index={0} playing={false} {...props} />,
  )
  const root = utils.getByTestId('radioplayer-root')
  const readout = utils.getByTestId('radioplayer-readout')
  const next = utils.getByTestId('radioplayer-next')
  const play = within(root).getByRole('button', { name: /play|pause/i })
  return { ...utils, root, readout, next, play }
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('RadioPlayer rendering', () => {
  it('renders the root, readout, play and next controls', () => {
    const { root, readout, play, next } = renderRadio()
    expect(root).toBeInTheDocument()
    expect(readout).toBeInTheDocument()
    expect(play).toBeInTheDocument()
    expect(next).toBeInTheDocument()
  })

  it('default size is md', () => {
    const { root } = renderRadio()
    expect(root).toHaveAttribute('data-size', 'md')
  })

  it('reflects the size prop', () => {
    const { root, next } = renderRadio({ size: 'sm' })
    expect(root).toHaveAttribute('data-size', 'sm')
    expect(next).toHaveAttribute('data-size', 'sm')
  })

  it('exposes the current idea + time on the readout label', () => {
    const { readout } = renderRadio({ index: 0, playing: false, elapsed: 83 })
    expect(readout).toHaveAttribute('aria-label', 'Paused: Midnight Take, 1:23')
  })

  it('reads "On air" when playing', () => {
    const { root, readout } = renderRadio({ playing: true, elapsed: 5 })
    expect(root).toHaveAttribute('data-playing')
    expect(readout).toHaveAttribute('aria-label', 'On air: Midnight Take, 0:05')
  })

  it('formats elapsed time as m:ss with zero-padded seconds', () => {
    const { readout } = renderRadio({ index: 1, elapsed: 5 })
    expect(readout).toHaveAttribute('aria-label', 'Paused: Rooftop Jam, 0:05')
  })

  it('wraps an out-of-range index instead of crashing', () => {
    const { readout } = renderRadio({ index: 4 }) // 4 % 3 → 1
    expect(readout).toHaveAttribute('aria-label', expect.stringContaining('Rooftop Jam'))
  })
})

// ─── Play / pause (intent) ───────────────────────────────────────────────────────

describe('RadioPlayer play/pause', () => {
  it('clicking play when paused requests playing=true', () => {
    const onPlayPause = vi.fn()
    const { play } = renderRadio({ playing: false, onPlayPause })
    fireEvent.click(play)
    expect(onPlayPause).toHaveBeenCalledWith(true)
  })

  it('clicking the control when playing requests playing=false', () => {
    const onPlayPause = vi.fn()
    const { play } = renderRadio({ playing: true, onPlayPause })
    fireEvent.click(play)
    expect(onPlayPause).toHaveBeenCalledWith(false)
  })

  it('play control relabels Play → Pause (no aria-pressed)', () => {
    const { play, rerender } = renderRadio({ playing: false })
    expect(play).toHaveAttribute('aria-label', 'Play')
    expect(play).not.toHaveAttribute('aria-pressed')
    rerender(<RadioPlayer tracks={TRACKS} index={0} playing={true} />)
    expect(play).toHaveAttribute('aria-label', 'Pause')
  })
})

// ─── Next (intent) ───────────────────────────────────────────────────────────────

describe('RadioPlayer next', () => {
  it('clicking next fires onNext', () => {
    const onNext = vi.fn()
    const { next } = renderRadio({ onNext })
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('next carries a stable action label', () => {
    const { next } = renderRadio()
    expect(next).toHaveAttribute('aria-label', 'Next idea')
  })
})

// ─── Disabled ────────────────────────────────────────────────────────────────────

describe('RadioPlayer disabled', () => {
  it('disables both controls and marks the root', () => {
    const { root, play, next } = renderRadio({ disabled: true })
    expect(root).toHaveAttribute('data-disabled')
    expect(play).toBeDisabled()
    expect(next).toBeDisabled()
  })

  it('does not fire intents when disabled', () => {
    const onPlayPause = vi.fn()
    const onNext = vi.fn()
    const { play, next } = renderRadio({ disabled: true, onPlayPause, onNext })
    fireEvent.click(play)
    fireEvent.click(next)
    expect(onPlayPause).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('reads off air when disabled', () => {
    const { readout } = renderRadio({ disabled: true })
    expect(readout).toHaveAttribute('aria-label', 'Radio — off air')
  })

  it('drops the playing bloom when disabled even if playing', () => {
    const { root } = renderRadio({ disabled: true, playing: true })
    expect(root).not.toHaveAttribute('data-playing')
  })
})

// ─── Empty ───────────────────────────────────────────────────────────────────────

describe('RadioPlayer empty', () => {
  it('no tracks → data-empty, off air, controls disabled', () => {
    const { root, readout, play, next } = renderRadio({ tracks: [] })
    expect(root).toHaveAttribute('data-empty')
    expect(readout).toHaveAttribute('aria-label', 'Radio — off air')
    expect(play).toBeDisabled()
    expect(next).toBeDisabled()
  })
})

// ─── Transition (idea change) ────────────────────────────────────────────────────

describe('RadioPlayer transition', () => {
  it('marks data-transition when the idea changes (not on mount)', () => {
    const { root, rerender } = renderRadio({ index: 0 })
    expect(root).not.toHaveAttribute('data-transition') // quiet on first render
    rerender(<RadioPlayer tracks={TRACKS} index={1} playing={false} />)
    expect(root).toHaveAttribute('data-transition')
  })
})

// ─── Font (the readout's craft) ──────────────────────────────────────────────────

describe('radioFont layout', () => {
  it('empty string lays out to zero columns', () => {
    expect(layoutText('')).toEqual({ cells: [], cols: 0, rows: 7 })
  })

  it('upper-cases input and lights cells', () => {
    const a = layoutText('a')
    expect(a.cols).toBe(5)
    expect(a.cells.length).toBeGreaterThan(0)
  })

  it('advances width by glyph + gap per character', () => {
    // two 5-wide glyphs + one 1-col gap = 11
    expect(layoutText('AB').cols).toBe(11)
  })
})
