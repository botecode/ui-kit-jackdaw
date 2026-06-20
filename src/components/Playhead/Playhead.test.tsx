// src/components/Playhead/Playhead.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { Playhead } from './Playhead'

const noop = () => {}
const getSecondsStub = () => 0
const getSecondsNoop = () => 0
const identity = (s: number) => s * 10

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Playhead rendering', () => {
  it('renders root with data-testid="playhead-root"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-root"]')).not.toBeNull()
  })

  it('renders line with data-testid="playhead-line"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-line"]')).not.toBeNull()
  })

  it('renders handle with data-testid="playhead-handle"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-handle"]')).not.toBeNull()
  })

  it('root has aria-hidden="true"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-root"]'))
      .toHaveAttribute('aria-hidden', 'true')
  })
})

// ─── State attributes ─────────────────────────────────────────────────────────

describe('Playhead state attributes', () => {
  it('data-playing absent when playing=false (default)', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.playing).toBeUndefined()
  })

  it('data-playing present when playing=true', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} playing />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.playing).toBeDefined()
  })

  it('data-recording absent by default', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.recording).toBeUndefined()
  })

  it('data-recording present when recording=true', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} recording />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.recording).toBeDefined()
  })

  it('data-interactive absent when onScrub not provided', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.interactive).toBeUndefined()
  })

  it('data-interactive present when onScrub provided', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} onScrub={noop} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.interactive).toBeDefined()
  })
})

// ─── Park channel ─────────────────────────────────────────────────────────────
// DPR is 1 in jsdom, so Math.round(x * 1) / 1 = x. No rounding complication.

describe('Playhead park channel', () => {
  beforeEach(() => {
    // Suppress rAF during park-only tests — park path must not start a loop
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes translateX on mount from seconds + secondsToX', () => {
    const { container } = render(
      <Playhead seconds={5} getSeconds={getSecondsNoop} secondsToX={s => s * 10} />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')
  })

  it('re-parks when seconds prop changes while stopped', () => {
    const { container, rerender } = render(
      <Playhead seconds={5} getSeconds={getSecondsNoop} secondsToX={s => s * 10} />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    rerender(<Playhead seconds={12} getSeconds={getSecondsNoop} secondsToX={s => s * 10} />)
    expect(el.style.transform).toBe('translateX(120px)')
  })

  it('re-parks when secondsToX reference changes while stopped (zoom)', () => {
    const { container, rerender } = render(
      <Playhead seconds={5} getSeconds={getSecondsNoop} secondsToX={s => s * 10} />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    // New secondsToX reference (caller used useCallback, zoom changed)
    rerender(<Playhead seconds={5} getSeconds={getSecondsNoop} secondsToX={s => s * 20} />)
    expect(el.style.transform).toBe('translateX(100px)')
  })
})

// ─── Channel separation ───────────────────────────────────────────────────────

describe('Playhead channel separation', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getSeconds is NOT called while playing=false', () => {
    const getSeconds = vi.fn(() => 99)
    render(<Playhead seconds={5} getSeconds={getSeconds} secondsToX={s => s * 10} />)
    expect(getSeconds).not.toHaveBeenCalled()
  })

  it('park does not start a rAF loop', () => {
    const rafSpy = vi.fn()
    vi.stubGlobal('requestAnimationFrame', rafSpy)
    render(<Playhead seconds={5} getSeconds={getSecondsNoop} secondsToX={s => s * 10} />)
    expect(rafSpy).not.toHaveBeenCalled()
  })
})

// ─── rAF test helpers ─────────────────────────────────────────────────────────
//
// Controlled rAF: the mock captures the tick callback but does NOT execute it.
// Call advanceTick() to manually fire one frame. This lets tests assert state
// between frames without an infinite loop.

function makeRafControl() {
  let pendingCb: FrameRequestCallback | null = null
  const rafSpy = vi.fn((cb: FrameRequestCallback) => {
    pendingCb = cb
    return 1
  })
  const cancelSpy = vi.fn()
  vi.stubGlobal('requestAnimationFrame', rafSpy)
  vi.stubGlobal('cancelAnimationFrame', cancelSpy)

  function advanceTick(t = performance.now()) {
    const cb = pendingCb
    pendingCb = null
    if (cb) act(() => { cb(t) })
  }

  return { rafSpy, cancelSpy, advanceTick }
}

// ─── rAF — playing ────────────────────────────────────────────────────────────

describe('Playhead rAF — playing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts rAF when playing becomes true', () => {
    const { rafSpy } = makeRafControl()
    render(<Playhead seconds={0} getSeconds={() => 0} secondsToX={s => s * 10} playing />)
    expect(rafSpy).toHaveBeenCalledTimes(1)
  })

  it('cancels rAF when playing becomes false', () => {
    const { cancelSpy, advanceTick } = makeRafControl()
    const { rerender } = render(
      <Playhead seconds={0} getSeconds={() => 0} secondsToX={s => s * 10} playing />
    )
    advanceTick() // one frame — rAF loop reschedules itself
    rerender(<Playhead seconds={0} getSeconds={() => 0} secondsToX={s => s * 10} playing={false} />)
    expect(cancelSpy).toHaveBeenCalledTimes(1)
  })

  it('cancels rAF on unmount while playing (leak guard)', () => {
    const { cancelSpy } = makeRafControl()
    const { unmount } = render(
      <Playhead seconds={0} getSeconds={() => 0} secondsToX={s => s * 10} playing />
    )
    unmount()
    expect(cancelSpy).toHaveBeenCalledTimes(1)
  })

  it('calls getSeconds on each rAF tick and writes translateX', () => {
    const { advanceTick } = makeRafControl()
    const getSeconds = vi.fn(() => 7)
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSeconds} secondsToX={s => s * 10} playing />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement

    advanceTick()
    expect(getSeconds).toHaveBeenCalled()
    expect(el.style.transform).toBe('translateX(70px)')
  })
})

// ─── Source-of-truth invariant ────────────────────────────────────────────────
//
// These two tests are the architecture regression guard for the B-over-A decision.
// They assert that the transform follows getSeconds() on EVERY tick — including
// non-monotonic (loop wrap) and large-jump (seek-while-playing) values.
//
// If someone replaces getSeconds() with a free-running internal clock, these
// tests will fail. They must never be removed.

describe('Playhead source-of-truth invariant', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loop wrap: transform follows getSeconds() when it decreases (29 → 1)', () => {
    const { advanceTick } = makeRafControl()
    let returnValue = 29
    const getSeconds = vi.fn(() => returnValue)
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSeconds} secondsToX={s => s * 10} playing />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement

    advanceTick()
    expect(el.style.transform).toBe('translateX(290px)')  // 29 × 10

    returnValue = 1  // loop wraps back to start
    advanceTick()
    expect(el.style.transform).toBe('translateX(10px)')   // 1 × 10 — follows truth, not last position
  })

  it('seek-while-playing: transform follows getSeconds() on large forward jump (4 → 20)', () => {
    const { advanceTick } = makeRafControl()
    let returnValue = 4
    const getSeconds = vi.fn(() => returnValue)
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSeconds} secondsToX={s => s * 10} playing />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement

    advanceTick()
    expect(el.style.transform).toBe('translateX(40px)')   // 4 × 10

    returnValue = 20  // user seeks while playing
    advanceTick()
    expect(el.style.transform).toBe('translateX(200px)')  // 20 × 10 — follows truth
  })
})

// ─── Zoom during playback ─────────────────────────────────────────────────────

describe('Playhead zoom during playback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('secondsToX change is reflected on next tick without restarting the rAF loop', () => {
    const { advanceTick, cancelSpy } = makeRafControl()
    const getSeconds = vi.fn(() => 5)
    const secondsToX1 = (s: number) => s * 10  // 5s → 50px

    const { container, rerender } = render(
      <Playhead seconds={0} getSeconds={getSeconds} secondsToX={secondsToX1} playing />
    )
    const el = container.querySelector('[data-testid="playhead-root"]') as HTMLElement

    advanceTick()
    expect(el.style.transform).toBe('translateX(50px)')

    // Change zoom — secondsToX is NOT in the rAF effect deps, so the loop must NOT restart
    const cancelsBefore = cancelSpy.mock.calls.length
    const secondsToX2 = (s: number) => s * 20  // 5s → 100px
    rerender(<Playhead seconds={0} getSeconds={getSeconds} secondsToX={secondsToX2} playing />)

    expect(cancelSpy.mock.calls.length).toBe(cancelsBefore)  // no teardown

    // Next tick uses the new projection
    advanceTick()
    expect(el.style.transform).toBe('translateX(100px)')
  })
})
