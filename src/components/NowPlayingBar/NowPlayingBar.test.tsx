import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NowPlayingBar } from './NowPlayingBar'

type Props = React.ComponentProps<typeof NowPlayingBar>

function renderBar(props: Partial<Props> = {}) {
  const onPlayPause = vi.fn()
  const utils = render(
    <NowPlayingBar
      title="Golden Hour"
      subtitle="Lawer"
      isPlaying={false}
      positionSeconds={42}
      durationSeconds={194}
      onPlayPause={onPlayPause}
      {...props}
    />,
  )
  const root = utils.getByTestId('nowplayingbar-root')
  return { ...utils, root, onPlayPause }
}

/** Give the seek track a measurable width so clientX → seconds resolves. */
function equipTrack(track: HTMLElement, width = 200) {
  track.getBoundingClientRect = () =>
    ({ left: 0, width, top: 0, height: 6, right: width, bottom: 6, x: 0, y: 0, toJSON() {} }) as DOMRect
  ;(track as Element & { setPointerCapture(id: number): void }).setPointerCapture = () => {}
  ;(track as Element & { hasPointerCapture(id: number): boolean }).hasPointerCapture = () => true
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('NowPlayingBar rendering', () => {
  it('renders title, subtitle, the play button and the seek track', () => {
    const { getByTestId, getByLabelText } = renderBar()
    expect(getByTestId('nowplayingbar-title')).toHaveTextContent('Golden Hour')
    expect(getByTestId('nowplayingbar-subtitle')).toHaveTextContent('Lawer')
    expect(getByLabelText('Play')).toBeInTheDocument()
    expect(getByTestId('nowplayingbar-track')).toHaveAttribute('role', 'slider')
  })

  it('exposes a "Now playing" group landmark', () => {
    const { root } = renderBar()
    expect(root).toHaveAttribute('role', 'group')
    expect(root).toHaveAttribute('aria-label', 'Now playing')
  })

  it('renders a placeholder cover (no image, no color) as role=img', () => {
    const { getByTestId } = renderBar()
    const cover = getByTestId('nowplayingbar-cover')
    expect(cover).toHaveAttribute('role', 'img')
    expect(cover.querySelector('img')).toBeNull()
  })

  it('renders an image cover when coverUrl is set', () => {
    const { getByTestId } = renderBar({ coverUrl: '/cover.jpg' })
    const img = getByTestId('nowplayingbar-cover').querySelector('img') as HTMLImageElement
    expect(img).toHaveAttribute('src', '/cover.jpg')
  })

  it('renders a solid color-block cover when only coverColor is set', () => {
    const { getByTestId } = renderBar({ coverColor: 'rgb(238, 94, 42)' })
    const cover = getByTestId('nowplayingbar-cover')
    expect(cover.querySelector('img')).toBeNull()
    const block = cover.querySelector('span') as HTMLElement
    expect(block).toHaveStyle({ backgroundColor: 'rgb(238, 94, 42)' })
  })

  it('renders elapsed and total times from position/duration (trailing = total)', () => {
    const { getByTestId } = renderBar({ positionSeconds: 65, durationSeconds: 194 })
    expect(getByTestId('nowplayingbar-elapsed')).toHaveTextContent('1:05')
    expect(getByTestId('nowplayingbar-remaining')).toHaveTextContent('3:14')
  })
})

// ─── Guards ───────────────────────────────────────────────────────────────────

describe('NowPlayingBar guards', () => {
  it('falls back to "Untitled" when title is blank', () => {
    const { getByTestId } = renderBar({ title: '   ' })
    const title = getByTestId('nowplayingbar-title')
    expect(title).toHaveTextContent('Untitled')
    expect(title).toHaveAttribute('data-untitled')
  })

  it('omits the subtitle line when no subtitle is given', () => {
    const { queryByTestId } = renderBar({ subtitle: undefined })
    expect(queryByTestId('nowplayingbar-subtitle')).toBeNull()
  })

  it('goes to the Seeker unknown-length sweep when duration is absent', () => {
    const { getByTestId } = renderBar({ durationSeconds: undefined })
    const track = getByTestId('nowplayingbar-track')
    expect(track).toHaveAttribute('data-state', 'no-duration')
    expect(getByTestId('nowplayingbar-elapsed')).toHaveTextContent('–:––')
  })
})

// ─── Play / pause ────────────────────────────────────────────────────────────────

describe('NowPlayingBar play/pause', () => {
  it('fires onPlayPause on click', () => {
    const { getByLabelText, onPlayPause } = renderBar()
    fireEvent.click(getByLabelText('Play'))
    expect(onPlayPause).toHaveBeenCalledTimes(1)
  })

  it('relabels Play → Pause when playing (action-button ARIA, no aria-pressed)', () => {
    const { getByLabelText, rerender } = renderBar({ isPlaying: false })
    const play = getByLabelText('Play')
    expect(play).not.toHaveAttribute('aria-pressed')
    rerender(
      <NowPlayingBar title="Golden Hour" isPlaying positionSeconds={42} durationSeconds={194} onPlayPause={vi.fn()} />,
    )
    expect(getByLabelText('Pause')).toBeInTheDocument()
  })

  it('reflects rolling state via data-playing', () => {
    const { root } = renderBar({ isPlaying: true })
    expect(root).toHaveAttribute('data-playing')
  })
})

// ─── Contract-driven chrome (prev / next / shuffle / repeat) ─────────────────────

describe('NowPlayingBar chrome', () => {
  it('hides prev/next/shuffle/repeat when their callbacks are absent', () => {
    const { queryByTestId, queryByLabelText } = renderBar()
    expect(queryByTestId('nowplayingbar-prev')).toBeNull()
    expect(queryByTestId('nowplayingbar-next')).toBeNull()
    expect(queryByTestId('nowplayingbar-shuffle')).toBeNull()
    expect(queryByLabelText('Repeat')).toBeNull()
  })

  it('shows prev/next when their callbacks are provided and fires them', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const { getByTestId } = renderBar({ onPrev, onNext })
    fireEvent.click(getByTestId('nowplayingbar-prev'))
    fireEvent.click(getByTestId('nowplayingbar-next'))
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('shuffle is a toggle: aria-pressed reflects state and click emits the next value', () => {
    const onShuffle = vi.fn()
    const { getByTestId } = renderBar({ onShuffle, isShuffling: false })
    const shuffle = getByTestId('nowplayingbar-shuffle')
    expect(shuffle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(shuffle)
    expect(onShuffle).toHaveBeenCalledWith(true)
  })

  it('lights shuffle when engaged (data-active + aria-pressed)', () => {
    const { getByTestId } = renderBar({ onShuffle: vi.fn(), isShuffling: true })
    const shuffle = getByTestId('nowplayingbar-shuffle')
    expect(shuffle).toHaveAttribute('data-active')
    expect(shuffle).toHaveAttribute('aria-pressed', 'true')
  })

  it('repeat reuses RepeatToggle: aria-pressed reflects state and click emits next', () => {
    const onRepeat = vi.fn()
    const { getByLabelText } = renderBar({ onRepeat, isRepeating: true })
    const repeat = getByLabelText('Repeat')
    expect(repeat).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(repeat)
    expect(onRepeat).toHaveBeenCalledWith(false)
  })
})

// ─── Seek ────────────────────────────────────────────────────────────────────────

describe('NowPlayingBar seek', () => {
  it('fires onSeek with the time under the pointer', () => {
    const onSeek = vi.fn()
    const { getByTestId } = renderBar({ onSeek })
    const track = getByTestId('nowplayingbar-track')
    equipTrack(track, 200)
    // 50% across a 194s track → 97s
    fireEvent.pointerDown(track, { clientX: 100, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledTimes(1)
    expect(onSeek.mock.calls[0][0]).toBeCloseTo(97, 1)
  })

  it('is display-only (not scrubbable) when no onSeek is provided', () => {
    const { getByTestId } = renderBar({ onSeek: undefined })
    const track = getByTestId('nowplayingbar-track')
    expect(track).toHaveAttribute('aria-disabled')
    expect(track).toHaveAttribute('tabindex', '-1')
  })
})

// ─── Sizes ───────────────────────────────────────────────────────────────────────

describe('NowPlayingBar sizes', () => {
  it('reflects the size on the root', () => {
    const { root } = renderBar({ size: 'sm' })
    expect(root).toHaveAttribute('data-size', 'sm')
  })
})
