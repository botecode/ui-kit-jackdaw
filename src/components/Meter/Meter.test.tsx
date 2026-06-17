// src/components/Meter/Meter.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Meter, buildRamp } from './Meter'

// ─── buildRamp ───────────────────────────────────────────────────────────────

describe('buildRamp — both palettes', () => {
  it('returns correct number of entries (level)', () => {
    expect(buildRamp(16, 'level')).toHaveLength(16)
    expect(buildRamp(8,  'level')).toHaveLength(8)
    expect(buildRamp(32, 'level')).toHaveLength(32)
  })

  it('returns correct number of entries (chroma)', () => {
    expect(buildRamp(16, 'chroma')).toHaveLength(16)
    expect(buildRamp(8,  'chroma')).toHaveLength(8)
    expect(buildRamp(32, 'chroma')).toHaveLength(32)
  })

  it('top 2 segments are always the clip (red) cap', () => {
    expect(buildRamp(16, 'level')[15].body).toBe('var(--meter-clip)')
    expect(buildRamp(16, 'level')[14].body).toBe('var(--meter-clip)')
    expect(buildRamp(16, 'chroma')[15].body).toBe('var(--meter-clip)')
    expect(buildRamp(16, 'chroma')[14].body).toBe('var(--meter-clip)')
  })
})

describe('buildRamp — level palette', () => {
  it('safe zone segments all use --meter-safe (green)', () => {
    const ramp = buildRamp(16, 'level')
    // clipCount=2, hotCount=2 → safeCount=12 (segments 0–11)
    for (let i = 0; i < 12; i++) {
      expect(ramp[i].body).toBe('var(--meter-safe)')
    }
  })

  it('hot zone bottom segment is amber (--meter-hot)', () => {
    const ramp = buildRamp(16, 'level')
    expect(ramp[12].body).toBe('var(--meter-hot)')
  })

  it('hot zone top segment is orange (warmer than amber)', () => {
    const ramp = buildRamp(16, 'level')
    expect(ramp[13].body).toBe('var(--led-orange)')
  })

  it('hot zone is monotonically warming (amber before orange)', () => {
    const ramp = buildRamp(16, 'level')
    // amber at 12, orange at 13 — orange is warmer, no cooler-above-warmer
    expect(ramp[12].body).toBe('var(--meter-hot)')
    expect(ramp[13].body).toBe('var(--led-orange)')
  })
})

describe('buildRamp — chroma palette', () => {
  it('bottom segment is purple (coolest spectrum color)', () => {
    expect(buildRamp(16, 'chroma')[0].body).toBe('var(--led-purple)')
  })

  it('chroma hot zone top segment is orange (just below red clip)', () => {
    const ramp = buildRamp(16, 'chroma')
    // clipCount=2, hotCount=4 → hot ends at segment 13
    expect(ramp[13].body).toBe('var(--led-orange)')
  })

  it('chroma hot zone is monotonically warming (amber before orange)', () => {
    const ramp = buildRamp(16, 'chroma')
    expect(ramp[12].body).toBe('var(--meter-hot)')
    expect(ramp[13].body).toBe('var(--led-orange)')
  })
})

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Meter rendering', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  })

  it('renders correct number of segments', () => {
    render(<Meter value={-60} ballistics={false} />)
    expect(screen.getAllByTestId(/^segment-/)).toHaveLength(16)
  })

  it('renders custom segment count', () => {
    render(<Meter value={-60} segments={8} ballistics={false} />)
    expect(screen.getAllByTestId(/^segment-/)).toHaveLength(8)
  })

  it('has role="meter" with aria attributes', () => {
    render(<Meter value={-12} min={-60} max={6} ballistics={false} aria-label="Master" />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '-12')
    expect(meter).toHaveAttribute('aria-valuemin', '-60')
    expect(meter).toHaveAttribute('aria-valuemax', '6')
    expect(meter).toHaveAttribute('aria-label', 'Master')
  })

  it('stereo renders two meter roles', () => {
    render(<Meter valueL={-12} valueR={-6} ballistics={false} />)
    const meters = screen.getAllByRole('meter')
    expect(meters).toHaveLength(2)
    expect(meters[0]).toHaveAttribute('aria-label', 'Meter L')
    expect(meters[1]).toHaveAttribute('aria-label', 'Meter R')
  })

  it('sets data-orientation on root', () => {
    const { container } = render(<Meter value={-60} orientation="horizontal" ballistics={false} />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('sets data-size on root', () => {
    const { container } = render(<Meter value={-60} size="lg" ballistics={false} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'lg')
  })

  it('sets data-size="custom" for non-preset sizes', () => {
    const { container } = render(<Meter value={-60} size="200px" ballistics={false} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'custom')
  })

  it('sets data-stereo on root when stereo', () => {
    const { container } = render(<Meter valueL={0} valueR={0} ballistics={false} />)
    expect(container.firstChild).toHaveAttribute('data-stereo')
  })

  it('sets data-density="fine" on channel when density="fine"', () => {
    render(<Meter value={-12} density="fine" ballistics={false} />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('data-density', 'fine')
  })

  it('sets data-density="standard" by default', () => {
    render(<Meter value={-12} ballistics={false} />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('data-density', 'standard')
  })
})

// ─── Lit segments ────────────────────────────────────────────────────────────

describe('Meter lit segments', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  })

  it('no segments lit at silence (min)', () => {
    render(<Meter value={-60} ballistics={false} />)
    const lit = screen.getAllByTestId(/^segment-/).filter(s => s.hasAttribute('data-lit'))
    expect(lit).toHaveLength(0)
  })

  it('all 16 segments lit at max (6 dB)', () => {
    render(<Meter value={6} ballistics={false} />)
    const lit = screen.getAllByTestId(/^segment-/).filter(s => s.hasAttribute('data-lit'))
    expect(lit).toHaveLength(16)
  })

  it('12 segments lit at unity (0 dB) with default scale', () => {
    // position = 0.75 → floor(0.75 * 16) = 12
    render(<Meter value={0} ballistics={false} />)
    const lit = screen.getAllByTestId(/^segment-/).filter(s => s.hasAttribute('data-lit'))
    expect(lit).toHaveLength(12)
  })

  it('bottom segments are lit, top are dark at 0 dB', () => {
    render(<Meter value={0} ballistics={false} />)
    const segs = screen.getAllByTestId(/^segment-/)
    expect(segs[0]).toHaveAttribute('data-lit')
    expect(segs[15]).not.toHaveAttribute('data-lit')
  })
})

// ─── Palette ─────────────────────────────────────────────────────────────────

describe('Meter palette', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  })

  it('default palette is level', () => {
    render(<Meter value={0} ballistics={false} />)
    // Segment 0 in level palette is green (--meter-safe)
    const seg0 = screen.getByTestId('segment-0')
    expect(seg0.style.getPropertyValue('--seg-body')).toBe('var(--meter-safe)')
  })

  it('palette="chroma" has purple at segment 0', () => {
    render(<Meter value={0} palette="chroma" ballistics={false} />)
    const seg0 = screen.getByTestId('segment-0')
    expect(seg0.style.getPropertyValue('--seg-body')).toBe('var(--led-purple)')
  })
})

// ─── Clip latch ───────────────────────────────────────────────────────────────

describe('Meter clip latch', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  })

  it('top segment stays lit after value drops when clipLatch is on', () => {
    const { rerender } = render(<Meter value={6} clipLatch ballistics={false} />)
    rerender(<Meter value={-20} clipLatch ballistics={false} />)
    expect(screen.getByTestId('segment-15')).toHaveAttribute('data-lit')
  })

  it('clicking the meter clears the clip latch', () => {
    const onReset = vi.fn()
    const { rerender } = render(
      <Meter value={6} clipLatch onResetClip={onReset} ballistics={false} />
    )
    rerender(<Meter value={-20} clipLatch onResetClip={onReset} ballistics={false} />)
    fireEvent.click(screen.getByRole('meter'))
    expect(onReset).toHaveBeenCalledOnce()
    expect(screen.getByTestId('segment-15')).not.toHaveAttribute('data-lit')
  })

  it('top segment not force-lit when clipLatch is off', () => {
    const { rerender } = render(<Meter value={6} ballistics={false} />)
    rerender(<Meter value={-20} ballistics={false} />)
    expect(screen.getByTestId('segment-15')).not.toHaveAttribute('data-lit')
  })
})

// ─── Readout ─────────────────────────────────────────────────────────────────

describe('Meter readout', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
  })

  it('shows -∞ dB at silence', () => {
    render(<Meter value={-60} ballistics={false} />)
    expect(screen.getByTestId('meter-readout').textContent).toBe('-∞ dB')
  })

  it('shows formatted dB value', () => {
    render(<Meter value={0} ballistics={false} />)
    expect(screen.getByTestId('meter-readout').textContent).toBe('+0.0 dB')
  })

  it('shows +6.0 dB at max', () => {
    render(<Meter value={6} ballistics={false} />)
    expect(screen.getByTestId('meter-readout').textContent).toBe('+6.0 dB')
  })
})
