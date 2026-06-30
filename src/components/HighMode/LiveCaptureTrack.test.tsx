// src/components/HighMode/LiveCaptureTrack.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveCaptureTrack } from './LiveCaptureTrack'

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

describe('LiveCaptureTrack', () => {
  it('renders an aria-hidden canvas and a status region', () => {
    const { container } = render(<LiveCaptureTrack active />)
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText(/listening for your idea/i)).toBeInTheDocument()
  })

  it('mounts/unmounts cleanly with a spectrum source', () => {
    const getSpectrum = () => [0.1, 0.2, 0.3]
    const { unmount } = render(<LiveCaptureTrack active getSpectrum={getSpectrum} />)
    expect(() => unmount()).not.toThrow()
  })
})
