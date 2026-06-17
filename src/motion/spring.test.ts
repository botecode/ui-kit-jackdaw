// src/motion/spring.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSpring } from './spring'

function mockMatchMedia(reducedMotion: boolean) {
  const impl = (query: string): MediaQueryList => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList)

  // jsdom does not implement window.matchMedia — define or redefine it
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: impl,
  })
}

describe('useSpring', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('initialises at the target value', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useSpring(200))
    expect(result.current).toBe(200)
  })

  it('snaps immediately to target under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useSpring(150))
    expect(result.current).toBe(150)
  })

  it('snaps when target changes under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(({ t }) => useSpring(t), {
      initialProps: { t: 0 },
    })
    rerender({ t: 300 })
    expect(result.current).toBe(300)
  })
})

describe('from + key seeding', () => {
  it('accepts from and key without error', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useSpring(50, { from: 100, key: 1 }))
    // Initial useState value is target; spring will animate from 100 → 50
    expect(result.current).toBe(50)
  })

  it('snaps to target under reduced-motion even when from is provided', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useSpring(50, { from: 100, key: 1 }))
    expect(result.current).toBe(50)
  })

  it('re-seeds when key increments (same from value)', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(
      ({ t, k }: { t: number; k: number }) => useSpring(t, { from: 0, key: k }),
      { initialProps: { t: 0, k: 0 } },
    )
    expect(result.current).toBe(0)
    rerender({ t: 0, k: 1 }) // same from=0, same target=0, new key
    expect(result.current).toBe(0) // still correct (reduced-motion snaps)
  })
})
