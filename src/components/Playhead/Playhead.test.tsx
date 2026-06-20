// src/components/Playhead/Playhead.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
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
