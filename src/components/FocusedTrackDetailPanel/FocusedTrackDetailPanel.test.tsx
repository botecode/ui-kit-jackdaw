// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
import type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
import type { ClipInfo } from '../TrackLane'
import type { FxPlugin } from '../FxChip'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  // ResizeObserver is not available in jsdom (used by Clip for LOD switching)
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class ResizeObserver {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  }

  // setPointerCapture / releasePointerCapture not in jsdom
  HTMLDivElement.prototype.setPointerCapture   = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()

  // matchMedia stub (used by Meter ballistics and Clip recording animation)
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
})

const TRACK = {
  id: 't1', name: 'Vocals', color: 'var(--track-color-1)', kind: 'audio' as const,
  armed: false, muted: false, soloed: false, volumeDb: -6, pan: 0,
}

const CLIPS: ClipInfo[] = [
  { clipId: 'c1', start: 0, length: 2, peaks: [0.5, 0.6, 0.4], label: 'Take 1' },
]

const PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb', enabled: true },
]

function makeProps(overrides: Partial<FocusedTrackDetailPanelProps> = {}): FocusedTrackDetailPanelProps {
  return {
    track: TRACK,
    clips: CLIPS,
    plugins: PLUGINS,
    chainEnabled: true,
    pxPerBeat: 80,
    bpm: 120,
    numerator: 4,
    denominator: 4,
    division: '1/4',
    height: 300,
    onResize: vi.fn(),
    open: true,
    onClose: vi.fn(),
    onToggleChain: vi.fn(),
    onTogglePlugin: vi.fn(),
    onReorderPlugin: vi.fn(),
    onRemovePlugin: vi.fn(),
    onAddPlugin: vi.fn(),
    onOpenPlugin: vi.fn(),
    ...overrides,
  }
}

describe('FocusedTrackDetailPanel — structure', () => {
  it('renders panel region with track name heading when open', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByRole('region', { name: /vocals inspector/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /vocals/i })).toBeInTheDocument()
  })

  it('renders close button that calls onClose', () => {
    const onClose = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: /close inspector/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sets data-open when open=true and omits it when open=false', () => {
    const { rerender } = render(<FocusedTrackDetailPanel {...makeProps({ open: true })} />)
    const root = screen.getByRole('region', { name: /vocals inspector/i })
    expect(root).toHaveAttribute('data-open')
    rerender(<FocusedTrackDetailPanel {...makeProps({ open: false })} />)
    expect(root).not.toHaveAttribute('data-open')
  })

  it('renders "No clips" empty state when clips=[]', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ clips: [] })} />)
    expect(screen.getByText(/no clips/i)).toBeInTheDocument()
  })

  it('renders FxChip for the FX chain section', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('always renders Meter regardless of arm/selected state', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ meterValueL: -12, meterValueR: -18 })} />)
    expect(screen.getAllByRole('meter').length).toBeGreaterThan(0)
  })

  it('renders the resize divider', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByRole('separator', { name: /resize panel/i })).toBeInTheDocument()
  })

  it('calls onResize during divider pointer drag', () => {
    const onResize = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onResize, height: 300 })} />)
    const divider = screen.getByRole('separator', { name: /resize panel/i })

    fireEvent.pointerDown(divider, { clientY: 500, pointerId: 1 })
    fireEvent.pointerMove(divider, { clientY: 450, pointerId: 1 })
    fireEvent.pointerUp(divider, { clientY: 450, pointerId: 1 })

    expect(onResize).toHaveBeenCalled()
    const calls = onResize.mock.calls
    const [newHeight] = calls[calls.length - 1]
    expect(newHeight).toBeGreaterThan(300)
  })

  it('renders all four advanced slot placeholders', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    // Use exact label text to avoid matching the longer description strings
    expect(screen.getByText('Sidechain')).toBeInTheDocument()
    expect(screen.getByText('Phase / Polarity')).toBeInTheDocument()
    expect(screen.getByText('Automation')).toBeInTheDocument()
    expect(screen.getByText('Routing')).toBeInTheDocument()
  })

  it('sets data-disabled when disabled=true', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ disabled: true })} />)
    const root = screen.getByRole('region', { name: /vocals inspector/i })
    expect(root).toHaveAttribute('data-disabled')
  })

  it('keyboard ArrowUp on divider calls onResize with increased height', () => {
    const onResize = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onResize, height: 300 })} />)
    const divider = screen.getByRole('separator', { name: /resize panel/i })
    fireEvent.keyDown(divider, { key: 'ArrowUp' })
    expect(onResize).toHaveBeenCalledWith(320)
  })

  it('keyboard ArrowDown on divider calls onResize with decreased height', () => {
    const onResize = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onResize, height: 300 })} />)
    const divider = screen.getByRole('separator', { name: /resize panel/i })
    fireEvent.keyDown(divider, { key: 'ArrowDown' })
    expect(onResize).toHaveBeenCalledWith(280)
  })

  it('clamps ArrowDown at HEIGHT_MIN (120)', () => {
    const onResize = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onResize, height: 125 })} />)
    const divider = screen.getByRole('separator', { name: /resize panel/i })
    fireEvent.keyDown(divider, { key: 'ArrowDown' })
    expect(onResize).toHaveBeenCalledWith(120)
  })
})
