import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clamp, linearScale, dbScale, quantizeValue } from './faderScales'

// ─── clamp ───────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(0.5, 0, 1)).toBe(0.5))
  it('clamps below min',           () => expect(clamp(-0.1, 0, 1)).toBe(0))
  it('clamps above max',           () => expect(clamp(1.1, 0, 1)).toBe(1))
  it('returns min exactly',        () => expect(clamp(0, 0, 1)).toBe(0))
  it('returns max exactly',        () => expect(clamp(1, 0, 1)).toBe(1))
})

// ─── linearScale ─────────────────────────────────────────────────────────────

describe('linearScale.toPosition', () => {
  const s = linearScale()
  it('min → 0',            () => expect(s.toPosition(0, 0, 1)).toBeCloseTo(0))
  it('max → 1',            () => expect(s.toPosition(1, 0, 1)).toBeCloseTo(1))
  it('midpoint → 0.5',     () => expect(s.toPosition(0.5, 0, 1)).toBeCloseTo(0.5))
  it('works for dB range', () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.4545, 3))
})

describe('linearScale.toValue', () => {
  const s = linearScale()
  it('position 0 → min',   () => expect(s.toValue(0, 0, 1)).toBeCloseTo(0))
  it('position 1 → max',   () => expect(s.toValue(1, 0, 1)).toBeCloseTo(1))
  it('position 0.5 → mid', () => expect(s.toValue(0.5, 0, 1)).toBeCloseTo(0.5))
  it('round-trips',        () => {
    const v = 0.312
    expect(s.toValue(s.toPosition(v, 0, 1), 0, 1)).toBeCloseTo(v, 10)
  })
})

describe('linearScale.defaultFormat', () => {
  const s = linearScale()
  it('formats 0.5 → "0.50"', () => expect(s.defaultFormat(0.5)).toBe('0.50'))
  it('formats 1   → "1.00"', () => expect(s.defaultFormat(1)).toBe('1.00'))
})

// ─── dbScale ─────────────────────────────────────────────────────────────────

describe('dbScale with defaults { min:-60, max:6, unityAt:0.75 }', () => {
  const s = dbScale()
  it('0 dB (unity) → position ≈ 0.75', () => expect(s.toPosition(0, -60, 6)).toBeCloseTo(0.75, 5))
  it('-60 dB → position 0',            () => expect(s.toPosition(-60, -60, 6)).toBeCloseTo(0))
  it('6 dB → position 1',             () => expect(s.toPosition(6, -60, 6)).toBeCloseTo(1))
  it('-30 dB → position ≈ 0.375',     () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.375, 5))
  it('position 0 → -60 dB',           () => expect(s.toValue(0, -60, 6)).toBeCloseTo(-60))
  it('position 1 → 6 dB',            () => expect(s.toValue(1, -60, 6)).toBeCloseTo(6))
  it('position 0.75 → 0 dB',         () => expect(s.toValue(0.75, -60, 6)).toBeCloseTo(0))
  it('round-trips unity',             () => {
    expect(s.toValue(s.toPosition(0, -60, 6), -60, 6)).toBeCloseTo(0, 5)
  })
  it('round-trips -30 dB', () => {
    expect(s.toValue(s.toPosition(-30, -60, 6), -60, 6)).toBeCloseTo(-30, 5)
  })
  it('round-trips 3 dB', () => {
    expect(s.toValue(s.toPosition(3, -60, 6), -60, 6)).toBeCloseTo(3, 5)
  })
})

describe('dbScale.defaultFormat', () => {
  const s = dbScale()
  it('-60 dB → "-∞ dB"',  () => expect(s.defaultFormat(-60)).toBe('-∞ dB'))
  it('-6 dB  → "-6.0 dB"', () => expect(s.defaultFormat(-6)).toBe('-6.0 dB'))
  it('0 dB   → "+0.0 dB"', () => expect(s.defaultFormat(0)).toBe('+0.0 dB'))
  it('+3 dB  → "+3.0 dB"', () => expect(s.defaultFormat(3)).toBe('+3.0 dB'))
  it('+6 dB  → "+6.0 dB"', () => expect(s.defaultFormat(6)).toBe('+6.0 dB'))
})

// ─── quantizeValue ────────────────────────────────────────────────────────────

describe('quantizeValue', () => {
  it('undefined step → passthrough',   () => expect(quantizeValue(0.312, undefined, 0, 1)).toBe(0.312))
  it('step=0.1 snaps 0.35 → 0.4',     () => expect(quantizeValue(0.35, 0.1, 0, 1)).toBeCloseTo(0.4))
  it('step=0.1 snaps 0.31 → 0.3',     () => expect(quantizeValue(0.31, 0.1, 0, 1)).toBeCloseTo(0.3))
  it('clamps to max',                  () => expect(quantizeValue(0.99, 0.1, 0, 1)).toBeCloseTo(1.0))
  it('clamps to min',                  () => expect(quantizeValue(0.001, 0.1, 0, 1)).toBeCloseTo(0.0))
  it('step=1 snaps 2.6 → 3 in dB range', () => expect(quantizeValue(2.6, 1, -60, 6)).toBeCloseTo(3))
})

// ─── Rendering + ARIA ──────────────────────────────────────────────────────

import { render } from '@testing-library/react'
import { Fader } from './Fader'

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('Fader rendering', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('renders a track and cap', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-track"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="fader-cap"]')).not.toBeNull()
  })

  it('renders a readout element', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-readout"]')).not.toBeNull()
  })

  it('data-orientation="vertical" by default', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('data-orientation="horizontal" when prop set', () => {
    const { container } = render(
      <Fader value={0.5} onChange={noop} orientation="horizontal" />,
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('data-size="custom" for explicit CSS length', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} size="200px" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'custom')
  })

  it('renders detent tick when detent prop provided', () => {
    const { container } = render(
      <Fader value={0} onChange={noop} min={-1} max={1} detent={{ value: 0 }} />,
    )
    expect(container.querySelector('[data-testid="fader-detent"]')).not.toBeNull()
  })

  it('no detent tick without detent prop', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-detent"]')).toBeNull()
  })

  it('format prop overrides readout text', () => {
    const { container } = render(
      <Fader value={0.5} onChange={noop} format={(v) => `${Math.round(v * 100)}%`} />,
    )
    expect(container.querySelector('[data-testid="fader-readout"]')?.textContent).toBe('50%')
  })

  it('linearScale defaultFormat shows 2dp', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-readout"]')?.textContent).toBe('0.50')
  })
})

describe('Fader accessibility', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('has role="slider"', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider')).toBeDefined()
  })

  it('aria-valuemin and aria-valuemax reflect min/max props', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} min={0} max={1} />)
    const el = getByRole('slider')
    expect(el.getAttribute('aria-valuemin')).toBe('0')
    expect(el.getAttribute('aria-valuemax')).toBe('1')
  })

  it('aria-valuenow reflects value prop', () => {
    const { getByRole } = render(<Fader value={0.75} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuenow')).toBe('0.75')
  })

  it('aria-label defaults to "Fader"', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Fader')
  })

  it('custom aria-label', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} aria-label="Volume" />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Volume')
  })

  it('aria-disabled when disabled', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('aria-disabled')).toBe('true')
  })

  it('tabIndex=0 by default', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('0')
  })

  it('tabIndex=-1 when disabled', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('-1')
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

import { fireEvent } from '@testing-library/react'

describe('Fader keyboard (min=0 max=1)', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  function slider(value: number) {
    return render(<Fader value={value} onChange={noop} />).getByRole('slider')
  }

  it('ArrowUp increases by 2%',         () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.52, 5))
  })
  it('ArrowDown decreases by 2%',       () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowDown' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.48, 5))
  })
  it('ArrowRight increases',            () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowRight' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.52, 5))
  })
  it('ArrowLeft decreases',             () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowLeft' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.48, 5))
  })
  it('Shift+ArrowUp fine step (0.4%)', () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowUp', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.504, 5))
  })
  it('Shift+ArrowDown fine step',      () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowDown', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.496, 5))
  })
  it('PageUp +10%',  () => {
    fireEvent.keyDown(slider(0.5), { key: 'PageUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.6, 5))
  })
  it('PageDown -10%', () => {
    fireEvent.keyDown(slider(0.5), { key: 'PageDown' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.4, 5))
  })
  it('Home → min',   () => {
    fireEvent.keyDown(slider(0.5), { key: 'Home' })
    expect(noop).toHaveBeenCalledWith(0)
  })
  it('End → max',    () => {
    fireEvent.keyDown(slider(0.5), { key: 'End' })
    expect(noop).toHaveBeenCalledWith(1)
  })
  it('ArrowUp at max does not exceed max', () => {
    fireEvent.keyDown(slider(1), { key: 'ArrowUp' })
    expect(noop.mock.calls[0][0]).toBeLessThanOrEqual(1)
  })
  it('ArrowDown at min does not go below min', () => {
    fireEvent.keyDown(slider(0), { key: 'ArrowDown' })
    expect(noop.mock.calls[0][0]).toBeGreaterThanOrEqual(0)
  })
  it('step prop quantizes keyboard increments', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} step={0.1} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.6, 5))
  })
  it('Backspace calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} resetValue={0.25} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('Delete calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} resetValue={0.25} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('disabled ignores keyboard', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(noop).not.toHaveBeenCalled()
  })
})

// ─── Pointer drag ─────────────────────────────────────────────────────────────

describe('Fader pointer drag', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('sets data-dragging on pointerDown', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    expect(root.dataset.dragging).toBeDefined()
  })

  it('clears data-dragging on pointerUp', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(track)
    expect(root.dataset.dragging).toBeUndefined()
  })

  it('disabled fader ignores pointerDown', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} disabled />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    expect(root.dataset.dragging).toBeUndefined()
  })
})

// ─── Reset gesture ────────────────────────────────────────────────────────────

describe('Fader reset gesture', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('double-click calls onChange(resetValue)', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0.5)
  })

  it('double-click with no resetValue calls onChange(min)', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('Backspace calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0.5)
  })

  it('disabled ignores double-click reset', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} disabled resetValue={0} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).not.toHaveBeenCalled()
  })
})

// ─── Detent tick ──────────────────────────────────────────────────────────────

describe('Fader detent', () => {
  it('renders detent tick with correct data-testid', () => {
    const noop = vi.fn()
    const { container } = render(
      <Fader value={0} onChange={noop} min={-1} max={1} detent={{ value: 0 }} />,
    )
    expect(container.querySelector('[data-testid="fader-detent"]')).not.toBeNull()
  })
})

// ─── Reduced-motion ───────────────────────────────────────────────────────────

describe('Fader reduced-motion', () => {
  it('reset calls onChange(resetValue) immediately', () => {
    mockMatchMedia(true)
    const noop = vi.fn()
    const { container } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0.5)
  })
})

// ─── Scale strip ─────────────────────────────────────────────────────────────

describe('Fader scale strip', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('renders tick marks when ticks prop is provided', () => {
    const { getAllByTestId } = render(
      <Fader value={0} onChange={noop} ticks={[6, 0, -6]} min={-60} max={6} scale={dbScale()} />,
    )
    expect(getAllByTestId('fader-tick')).toHaveLength(3)
  })

  it('renders no tick marks when ticks prop is absent', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-tick"]')).toBeNull()
  })

  it('marks the unity tick with data-unity when its value matches detent.value', () => {
    const { container } = render(
      <Fader
        value={0}
        onChange={noop}
        ticks={[6, 0, -6]}
        min={-60}
        max={6}
        scale={dbScale()}
        detent={{ value: 0 }}
      />,
    )
    const unityTick = container.querySelector('[data-testid="fader-tick"][data-unity="true"]')
    expect(unityTick).not.toBeNull()
  })
})
