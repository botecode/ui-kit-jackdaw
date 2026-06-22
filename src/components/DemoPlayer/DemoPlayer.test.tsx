import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { DemoPlayer } from './DemoPlayer'

const PEAKS = Array.from({ length: 64 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i)))

// jsdom doesn't implement media playback; spy play/pause so they're inert no-ops.
let playSpy: ReturnType<typeof vi.spyOn>
let pauseSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => undefined as unknown as Promise<void>)
  pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => {
  playSpy.mockRestore()
  pauseSpy.mockRestore()
  vi.restoreAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Install settable currentTime / duration / paused on the audio element. */
function equipAudio(
  audio: HTMLAudioElement,
  { duration = 100, paused = true }: { duration?: number; paused?: boolean } = {},
) {
  let ct = 0
  let isPaused = paused
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => ct,
    set: v => { ct = v },
  })
  Object.defineProperty(audio, 'duration', { configurable: true, get: () => duration })
  Object.defineProperty(audio, 'paused', {
    configurable: true,
    get: () => isPaused,
    set: v => { isPaused = v },
  })
  return {
    setPaused: (v: boolean) => { (audio as unknown as { paused: boolean }).paused = v },
  }
}

function renderPlayer(props: Partial<React.ComponentProps<typeof DemoPlayer>> = {}) {
  const utils = render(
    <DemoPlayer src="/demo.mp3" peaks={PEAKS} label="Midnight Take" {...props} />,
  )
  const root = utils.getByTestId('demoplayer-root')
  const audio = utils.getByTestId('demoplayer-audio') as HTMLAudioElement
  const well = utils.getByTestId('demoplayer-well')
  const button = within(root).getByRole('button')
  return { ...utils, root, audio, well, button }
}

/** Make the player seekable: duration known + currentTime settable. */
function makeSeekable(audio: HTMLAudioElement, duration = 100) {
  equipAudio(audio, { duration })
  fireEvent.durationChange(audio)
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('DemoPlayer rendering', () => {
  it('renders the root, audio node, play button and scrubber', () => {
    const { root, audio, well, button } = renderPlayer()
    expect(root).toBeInTheDocument()
    expect(audio).toBeInTheDocument()
    expect(well).toHaveAttribute('role', 'slider')
    expect(button).toBeInTheDocument()
  })

  it('points the audio element at src', () => {
    const { audio } = renderPlayer({ src: '/song.mp3' })
    expect(audio).toHaveAttribute('src', '/song.mp3')
  })

  it('renders the label', () => {
    const { getByTestId } = renderPlayer({ label: 'Rooftop Jam' })
    expect(getByTestId('demoplayer-label')).toHaveTextContent('Rooftop Jam')
  })

  it('default size is md', () => {
    const { root } = renderPlayer()
    expect(root).toHaveAttribute('data-size', 'md')
  })

  it('reflects the size prop', () => {
    const { root } = renderPlayer({ size: 'sm' })
    expect(root).toHaveAttribute('data-size', 'sm')
  })

  it('starts in idle status', () => {
    const { root } = renderPlayer()
    expect(root).toHaveAttribute('data-status', 'idle')
  })

  it('applies the color prop as the --demo-fill token', () => {
    const { root } = renderPlayer({ color: 'rgb(1, 2, 3)' })
    expect(root.getAttribute('style')).toContain('--demo-fill: rgb(1, 2, 3)')
  })

  it('defaults --demo-fill to the accent token', () => {
    const { root } = renderPlayer()
    expect(root.getAttribute('style')).toContain('--demo-fill: var(--accent)')
  })
})

// ─── Play / pause (driven by audio events — the source of truth) ────────────────

describe('DemoPlayer play/pause', () => {
  it('clicking the button invokes audio.play() when paused', () => {
    const { audio, button } = renderPlayer()
    equipAudio(audio, { paused: true })
    fireEvent.click(button)
    expect(playSpy).toHaveBeenCalledOnce()
  })

  it('clicking the button invokes audio.pause() when playing', () => {
    const { audio, button } = renderPlayer()
    equipAudio(audio, { paused: false })
    fireEvent.play(audio)
    fireEvent.click(button)
    expect(pauseSpy).toHaveBeenCalledOnce()
  })

  it('play event → playing status, onPlay, button relabels to Pause', () => {
    const onPlay = vi.fn()
    const { root, audio, button } = renderPlayer({ onPlay })
    fireEvent.play(audio)
    expect(onPlay).toHaveBeenCalledOnce()
    expect(root).toHaveAttribute('data-status', 'playing')
    expect(button).toHaveAttribute('aria-label', 'Pause')
    expect(button).toHaveAttribute('data-playing')
  })

  it('pause event mid-track → paused status, onPause', () => {
    const onPause = vi.fn()
    const { root, audio, button } = renderPlayer({ onPause })
    equipAudio(audio, { duration: 100 })
    fireEvent.play(audio)
    audio.currentTime = 12
    fireEvent.pause(audio)
    expect(onPause).toHaveBeenCalledOnce()
    expect(root).toHaveAttribute('data-status', 'paused')
    expect(button).toHaveAttribute('aria-label', 'Play')
    expect(button).not.toHaveAttribute('data-playing')
  })

  it('pause event at position 0 → returns to idle', () => {
    const { root, audio } = renderPlayer()
    equipAudio(audio, { duration: 100 })
    fireEvent.play(audio)
    audio.currentTime = 0
    fireEvent.pause(audio)
    expect(root).toHaveAttribute('data-status', 'idle')
  })

  it('ended event → onEnded, back to idle, no duplicate onPause', () => {
    const onEnded = vi.fn()
    const onPause = vi.fn()
    const { root, audio } = renderPlayer({ onEnded, onPause })
    equipAudio(audio, { duration: 100 })
    fireEvent.play(audio)
    fireEvent.ended(audio)
    fireEvent.pause(audio) // browsers also pause on end — must not re-report
    expect(onEnded).toHaveBeenCalledOnce()
    expect(onPause).not.toHaveBeenCalled()
    expect(root).toHaveAttribute('data-status', 'idle')
  })
})

// ─── Seeking ────────────────────────────────────────────────────────────────────

describe('DemoPlayer keyboard seek', () => {
  it('ArrowRight seeks forward by 5s and fires onSeek', () => {
    const onSeek = vi.fn()
    const { audio, well } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    fireEvent.keyDown(well, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(5)
    expect(audio.currentTime).toBe(5)
    expect(well).toHaveAttribute('aria-valuenow', '5')
  })

  it('ArrowLeft clamps at 0', () => {
    const onSeek = vi.fn()
    const { audio, well } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    fireEvent.keyDown(well, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
    expect(audio.currentTime).toBe(0)
  })

  it('End jumps to the duration', () => {
    const onSeek = vi.fn()
    const { audio, well } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    fireEvent.keyDown(well, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(100)
  })

  it('Home jumps to 0', () => {
    const onSeek = vi.fn()
    const { audio, well } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    audio.currentTime = 40
    fireEvent.timeUpdate(audio)
    fireEvent.keyDown(well, { key: 'Home' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('PageUp seeks forward by 15s', () => {
    const onSeek = vi.fn()
    const { audio, well } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    fireEvent.keyDown(well, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(15)
  })

  it('does not seek when duration is unknown (not seekable)', () => {
    const onSeek = vi.fn()
    const { well } = renderPlayer({ onSeek })
    fireEvent.keyDown(well, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
    expect(well).toHaveAttribute('tabindex', '-1')
  })
})

describe('DemoPlayer pointer seek', () => {
  it('click-drag on the well seeks to the pointer position on release', () => {
    const onSeek = vi.fn()
    const { audio, well, root } = renderPlayer({ onSeek })
    makeSeekable(audio, 100)
    well.getBoundingClientRect = () =>
      ({ left: 0, width: 1000, top: 0, height: 56, right: 1000, bottom: 56, x: 0, y: 0, toJSON: () => {} }) as DOMRect

    fireEvent.pointerDown(well, { clientX: 500, button: 0, pointerId: 1 })
    expect(root).toHaveAttribute('data-scrubbing')  // root gets data-scrubbing via state
    fireEvent.pointerUp(well, { clientX: 500, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(50)
    expect(audio.currentTime).toBe(50)
  })
})

// ─── Disabled / empty / error ───────────────────────────────────────────────────

describe('DemoPlayer disabled', () => {
  it('disables the play button and makes the scrubber non-focusable', () => {
    const { root, button, well } = renderPlayer({ disabled: true })
    expect(root).toHaveAttribute('data-disabled')
    expect(button).toBeDisabled()
    expect(well).toHaveAttribute('tabindex', '-1')
  })

  it('clicking a disabled player does not call play', () => {
    const { audio, button } = renderPlayer({ disabled: true })
    equipAudio(audio, { paused: true })
    fireEvent.click(button)
    expect(playSpy).not.toHaveBeenCalled()
  })
})

describe('DemoPlayer empty', () => {
  it('no peaks → data-empty, disabled transport, dashed time', () => {
    const { root, button, getByTestId } = renderPlayer({ peaks: [] })
    expect(root).toHaveAttribute('data-empty')
    expect(button).toBeDisabled()
    expect(getByTestId('demoplayer-time')).toHaveTextContent('–:––')
  })

  it('no src → data-empty', () => {
    const { root } = renderPlayer({ src: '' })
    expect(root).toHaveAttribute('data-empty')
  })
})

describe('DemoPlayer error', () => {
  it('error event → error status, message, disabled transport', () => {
    const { root, button, getByTestId } = renderPlayer()
    fireEvent.error(getByTestId('demoplayer-audio'))
    expect(root).toHaveAttribute('data-status', 'error')
    expect(getByTestId('demoplayer-error')).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})

// ─── Loading ────────────────────────────────────────────────────────────────────

describe('DemoPlayer loading', () => {
  it('loadstart → loading status; canplay → idle', () => {
    const { root, audio } = renderPlayer()
    fireEvent.loadStart(audio)
    expect(root).toHaveAttribute('data-status', 'loading')
    fireEvent.canPlay(audio)
    expect(root).toHaveAttribute('data-status', 'idle')
  })
})

// ─── ARIA ───────────────────────────────────────────────────────────────────────

describe('DemoPlayer a11y', () => {
  it('scrubber exposes slider semantics', () => {
    const { audio, well } = renderPlayer({ label: 'Take 3' })
    makeSeekable(audio, 100)
    expect(well).toHaveAttribute('role', 'slider')
    expect(well).toHaveAttribute('aria-label', 'Seek — Take 3')
    expect(well).toHaveAttribute('aria-valuemin', '0')
    expect(well).toHaveAttribute('aria-valuemax', '100')
    expect(well).toHaveAttribute('tabindex', '0')
  })

  it('aria-valuetext reads as "elapsed of total"', () => {
    const { audio, well } = renderPlayer()
    makeSeekable(audio, 125)
    fireEvent.keyDown(well, { key: 'ArrowRight' })
    expect(well).toHaveAttribute('aria-valuetext', '0:05 of 2:05')
  })

  it('play button carries no aria-pressed (relabel model)', () => {
    const { button } = renderPlayer()
    expect(button).not.toHaveAttribute('aria-pressed')
  })
})
