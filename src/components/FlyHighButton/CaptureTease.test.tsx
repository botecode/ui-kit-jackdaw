// src/components/FlyHighButton/CaptureTease.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { CaptureTease } from './CaptureTease'

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  })
})

describe('CaptureTease', () => {
  it('renders a decorative (aria-hidden) canvas', () => {
    const { container } = render(<CaptureTease />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })

  it('mounts and unmounts cleanly when paused', () => {
    const { unmount } = render(<CaptureTease paused />)
    expect(() => unmount()).not.toThrow()
  })
})
