// src/components/HighMode/CaptureDemo.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { CaptureDemo } from './CaptureDemo'

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

describe('CaptureDemo', () => {
  it('renders a decorative (aria-hidden) canvas', () => {
    const { container } = render(<CaptureDemo />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })

  it('emits an opening caption immediately', () => {
    const onCaption = vi.fn()
    render(<CaptureDemo onCaption={onCaption} />)
    expect(onCaption).toHaveBeenCalled()
    expect(typeof onCaption.mock.calls[0][0]).toBe('string')
    expect(onCaption.mock.calls[0][0].length).toBeGreaterThan(0)
  })

  it('mounts and unmounts cleanly', () => {
    const { unmount } = render(<CaptureDemo />)
    expect(() => unmount()).not.toThrow()
  })
})
