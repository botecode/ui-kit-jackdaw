import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MasterPlayer } from './MasterPlayer'

type Props = React.ComponentProps<typeof MasterPlayer>

function renderPlayer(props: Partial<Props> = {}) {
  const onPlayPause = vi.fn()
  const utils = render(
    <MasterPlayer
      title="Golden Hour"
      subtitle="Master"
      isPlaying={false}
      positionSeconds={42}
      durationSeconds={180}
      onPlayPause={onPlayPause}
      {...props}
    />,
  )
  const root = utils.getByTestId('masterplayer-root')
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

describe('MasterPlayer rendering', () => {
  it('renders title, subtitle, the play button and the seek track', () => {
    const { getByTestId } = renderPlayer()
    expect(getByTestId('masterplayer-title')).toHaveTextContent('Golden Hour')
    expect(getByTestId('masterplayer-subtitle')).toHaveTextContent('Master')
    expect(getByTestId('masterplayer-play')).toBeInTheDocument()
    expect(getByTestId('masterplayer-track')).toHaveAttribute('role', 'slider')
  })

  it('shows a placeholder cover (role=img) when no onCoverClick and no src', () => {
    const { getByTestId } = renderPlayer()
    const cover = getByTestId('masterplayer-cover')
    expect(cover.tagName).toBe('DIV')
    expect(cover).toHaveAttribute('role', 'img')
  })

  it('renders elapsed and remaining times from position/duration', () => {
    const { getByTestId } = renderPlayer({ positionSeconds: 65, durationSeconds: 185 })
    expect(getByTestId('masterplayer-elapsed')).toHaveTextContent('1:05')
    expect(getByTestId('masterplayer-remaining')).toHaveTextContent('-2:00')
  })
})

// ─── Mode switch (single vs playlist) ────────────────────────────────────────────

describe('MasterPlayer mode', () => {
  it('single mode: hides prev/next when neither callback is provided', () => {
    const { queryByTestId, getByTestId } = renderPlayer()
    expect(queryByTestId('masterplayer-prev')).toBeNull()
    expect(queryByTestId('masterplayer-next')).toBeNull()
    expect(getByTestId('masterplayer-mode')).toHaveTextContent('single')
  })

  it('playlist mode: shows prev/next when callbacks are provided', () => {
    const { getByTestId } = renderPlayer({ onPrev: vi.fn(), onNext: vi.fn() })
    expect(getByTestId('masterplayer-prev')).toBeInTheDocument()
    expect(getByTestId('masterplayer-next')).toBeInTheDocument()
    expect(getByTestId('masterplayer-mode')).toHaveTextContent('playlist')
  })

  it('shows only the controls whose callbacks exist (prev only)', () => {
    const { getByTestId, queryByTestId } = renderPlayer({ onPrev: vi.fn() })
    expect(getByTestId('masterplayer-prev')).toBeInTheDocument()
    expect(queryByTestId('masterplayer-next')).toBeNull()
  })
})

// ─── Play / pause ────────────────────────────────────────────────────────────────

describe('MasterPlayer play/pause', () => {
  it('fires onPlayPause on click', () => {
    const { getByTestId, onPlayPause } = renderPlayer()
    fireEvent.click(getByTestId('masterplayer-play'))
    expect(onPlayPause).toHaveBeenCalledTimes(1)
  })

  it('relabels Play → Pause when playing (action-button ARIA, no aria-pressed)', () => {
    const { getByTestId, rerender } = renderPlayer({ isPlaying: false })
    const play = getByTestId('masterplayer-play')
    expect(play).toHaveAttribute('aria-label', 'Play')
    expect(play).not.toHaveAttribute('aria-pressed')
    rerender(
      <MasterPlayer title="Golden Hour" isPlaying positionSeconds={42} durationSeconds={180} onPlayPause={vi.fn()} />,
    )
    expect(getByTestId('masterplayer-play')).toHaveAttribute('aria-label', 'Pause')
  })

  it('reflects rolling state via data-playing', () => {
    const { root } = renderPlayer({ isPlaying: true })
    expect(root).toHaveAttribute('data-playing')
  })
})

// ─── Seek ────────────────────────────────────────────────────────────────────────

describe('MasterPlayer seek', () => {
  it('fires onSeek with the time under the pointer', () => {
    const onSeek = vi.fn()
    const { getByTestId } = renderPlayer({ onSeek })
    const track = getByTestId('masterplayer-track')
    equipTrack(track, 200)
    // 50% across a 180s master → 90s
    fireEvent.pointerDown(track, { clientX: 100, button: 0, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledTimes(1)
    expect(onSeek.mock.calls[0][0]).toBeCloseTo(90, 1)
  })

  it('seeks via keyboard arrows (±5s)', () => {
    const onSeek = vi.fn()
    const { getByTestId } = renderPlayer({ onSeek, positionSeconds: 50 })
    const track = getByTestId('masterplayer-track')
    fireEvent.keyDown(track, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(55)
    fireEvent.keyDown(track, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenLastCalledWith(45)
  })

  it('does not seek when there is no onSeek handler', () => {
    const { getByTestId } = renderPlayer({ onSeek: undefined })
    const track = getByTestId('masterplayer-track')
    expect(track).toHaveAttribute('aria-disabled')
    expect(track).toHaveAttribute('tabindex', '-1')
  })
})

// ─── Cover click ─────────────────────────────────────────────────────────────────

describe('MasterPlayer cover', () => {
  it('renders the cover as a button and fires onCoverClick', () => {
    const onCoverClick = vi.fn()
    const { getByTestId } = renderPlayer({ onCoverClick })
    const cover = getByTestId('masterplayer-cover')
    expect(cover.tagName).toBe('BUTTON')
    fireEvent.click(cover)
    expect(onCoverClick).toHaveBeenCalledTimes(1)
  })

  it('does not render a cover button when the player is disabled', () => {
    const { getByTestId } = renderPlayer({ onCoverClick: vi.fn(), disabled: true })
    expect(getByTestId('masterplayer-cover').tagName).toBe('DIV')
  })
})

// ─── Ends of a playlist ──────────────────────────────────────────────────────────

describe('MasterPlayer playlist ends', () => {
  it('disables prev at the head (canPrev=false) but keeps it visible', () => {
    const { getByTestId } = renderPlayer({ onPrev: vi.fn(), onNext: vi.fn(), canPrev: false })
    expect(getByTestId('masterplayer-prev')).toBeDisabled()
    expect(getByTestId('masterplayer-next')).not.toBeDisabled()
  })

  it('disables next at the tail (canNext=false)', () => {
    const { getByTestId } = renderPlayer({ onPrev: vi.fn(), onNext: vi.fn(), canNext: false })
    expect(getByTestId('masterplayer-next')).toBeDisabled()
  })

  it('does not fire onPrev when disabled at the head', () => {
    const onPrev = vi.fn()
    const { getByTestId } = renderPlayer({ onPrev, onNext: vi.fn(), canPrev: false })
    fireEvent.click(getByTestId('masterplayer-prev'))
    expect(onPrev).not.toHaveBeenCalled()
  })
})

// ─── Not-ready / rendering ───────────────────────────────────────────────────────

describe('MasterPlayer not-ready', () => {
  it('disables play and shows "Rendering…" when duration is absent', () => {
    const { getByTestId, root } = renderPlayer({ durationSeconds: undefined })
    expect(root).toHaveAttribute('data-rendering')
    expect(getByTestId('masterplayer-play')).toBeDisabled()
    expect(getByTestId('masterplayer-subtitle')).toHaveTextContent('Rendering…')
  })

  it('shows em-dash times and a disabled track when not ready', () => {
    const { getByTestId } = renderPlayer({ durationSeconds: undefined })
    expect(getByTestId('masterplayer-elapsed')).toHaveTextContent('–:––')
    expect(getByTestId('masterplayer-remaining')).toHaveTextContent('–:––')
    expect(getByTestId('masterplayer-track')).toHaveAttribute('aria-disabled')
  })

  it('keeps play enabled while playing even if duration is momentarily absent', () => {
    const { getByTestId } = renderPlayer({ durationSeconds: undefined, isPlaying: true })
    expect(getByTestId('masterplayer-play')).not.toBeDisabled()
  })

  it('surfaces an error message and disables transport', () => {
    const { getByTestId, root } = renderPlayer({ errorText: 'Master unavailable' })
    expect(root).toHaveAttribute('data-error')
    expect(getByTestId('masterplayer-subtitle')).toHaveTextContent('Master unavailable')
    expect(getByTestId('masterplayer-play')).toBeDisabled()
  })
})

// ─── Empty + disabled ────────────────────────────────────────────────────────────

describe('MasterPlayer empty + disabled', () => {
  it('reads as empty with a placeholder title when title is blank', () => {
    const { getByTestId, root } = renderPlayer({ title: '' })
    expect(root).toHaveAttribute('data-empty')
    expect(getByTestId('masterplayer-title')).toHaveTextContent('Nothing queued')
    expect(getByTestId('masterplayer-play')).toBeDisabled()
  })

  it('disables the whole player when disabled', () => {
    const { getByTestId, root, onPlayPause } = renderPlayer({ disabled: true })
    expect(root).toHaveAttribute('data-disabled')
    const play = getByTestId('masterplayer-play')
    expect(play).toBeDisabled()
    fireEvent.click(play)
    expect(onPlayPause).not.toHaveBeenCalled()
  })

  it('renders an image cover when coverSrc is set', () => {
    const { getByTestId } = renderPlayer({ coverSrc: '/cover.jpg', onCoverClick: vi.fn() })
    const cover = getByTestId('masterplayer-cover')
    const img = cover.querySelector('img') as HTMLImageElement
    expect(img).toHaveAttribute('src', '/cover.jpg')
  })
})
