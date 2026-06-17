// src/gallery/useHashRoute.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHashRoute } from './useHashRoute'

describe('useHashRoute', () => {
  beforeEach(() => { window.location.hash = '' })

  it('returns /tokens when hash is empty', () => {
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('/tokens')
  })

  it('returns the path after #', () => {
    window.location.hash = '#/fader'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('/fader')
  })

  it('updates on hashchange', () => {
    const { result } = renderHook(() => useHashRoute())
    act(() => {
      window.location.hash = '#/pan-knob'
      window.dispatchEvent(new Event('hashchange'))
    })
    expect(result.current).toBe('/pan-knob')
  })
})
