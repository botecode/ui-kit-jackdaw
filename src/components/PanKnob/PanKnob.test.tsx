import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PanKnob, panToAngle, formatReadout, formatAriaValueText, clamp, arcPath } from './PanKnob'

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

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(0.5, -1, 1)).toBe(0.5))
  it('clamps below min',         () => expect(clamp(-2, -1, 1)).toBe(-1))
  it('clamps above max',         () => expect(clamp(2, -1, 1)).toBe(1))
  it('returns min exactly',      () => expect(clamp(-1, -1, 1)).toBe(-1))
  it('returns max exactly',      () => expect(clamp(1, -1, 1)).toBe(1))
})

describe('panToAngle', () => {
  it('maps 0 to 0°',     () => expect(panToAngle(0)).toBe(0))
  it('maps 1 to 135°',   () => expect(panToAngle(1)).toBe(135))
  it('maps -1 to -135°', () => expect(panToAngle(-1)).toBe(-135))
  it('clamps > 1',       () => expect(panToAngle(1.5)).toBe(135))
  it('clamps < -1',      () => expect(panToAngle(-1.5)).toBe(-135))
  it('maps 0.5 to 67.5°', () => expect(panToAngle(0.5)).toBe(67.5))
})

describe('formatReadout', () => {
  it('0 → "C"',        () => expect(formatReadout(0)).toBe('C'))
  it('-0.2 → "L20"',   () => expect(formatReadout(-0.2)).toBe('L20'))
  it('0.35 → "R35"',   () => expect(formatReadout(0.35)).toBe('R35'))
  it('0.204 → "R20"',  () => expect(formatReadout(0.204)).toBe('R20'))
  it('1 → "R100"',     () => expect(formatReadout(1)).toBe('R100'))
  it('-1 → "L100"',    () => expect(formatReadout(-1)).toBe('L100'))
  it('near-zero negative → "C"', () => expect(formatReadout(-0.001)).toBe('C'))
})

describe('formatAriaValueText', () => {
  it('0 → "Center"',       () => expect(formatAriaValueText(0)).toBe('Center'))
  it('-0.2 → "Left 20"',   () => expect(formatAriaValueText(-0.2)).toBe('Left 20'))
  it('0.35 → "Right 35"',  () => expect(formatAriaValueText(0.35)).toBe('Right 35'))
})

describe('arcPath', () => {
  it('starts at top for fromDeg=0 (M 20 2)', () => {
    const d = arcPath(20, 20, 18, 0, 90)
    expect(d).toMatch(/^M 20 2 /)
  })

  it('clockwise sweep=1 when toDeg > fromDeg', () => {
    const d = arcPath(20, 20, 18, 0, 90)
    // "A 18 18 0 <large> 1 ..."
    expect(d).toContain('A 18 18 0 0 1 ')
  })

  it('counter-clockwise sweep=0 when toDeg < fromDeg', () => {
    const d = arcPath(20, 20, 18, 0, -90)
    expect(d).toContain('A 18 18 0 0 0 ')
  })

  it('large-arc=1 when |toDeg - fromDeg| > 180', () => {
    // range arc: -135 to 135 = 270°
    const d = arcPath(20, 20, 18, -135, 135)
    expect(d).toContain('A 18 18 0 1 1 ')
  })

  it('large-arc=0 when |toDeg - fromDeg| <= 180', () => {
    // value arc at full right: 0 to 135 = 135°
    const d = arcPath(20, 20, 18, 0, 135)
    expect(d).toContain('A 18 18 0 0 1 ')
  })

  it('range arc starts at bottom-left (−135°)', () => {
    // sin(-135°) = -0.7071, cos(-135°) = -0.7071
    // sx = 20 + 18*(-0.7071) = 7.2721, sy = 20 - 18*(-0.7071) = 32.7279
    const d = arcPath(20, 20, 18, -135, 135)
    expect(d).toMatch(/^M 7\.272\d* 32\.727\d* /)
  })

  it('value arc at pan=1 ends at bottom-right (+135°)', () => {
    // sin(135°) = 0.7071, cos(135°) = -0.7071
    // ex = 20 + 18*(0.7071) = 32.7279, ey = 20 - 18*(-0.7071) = 32.7279
    const d = arcPath(20, 20, 18, 0, 135)
    expect(d).toMatch(/32\.727\d* 32\.727\d*$/)
  })
})

describe('PanKnob rendering', () => {
  const noop = vi.fn()

  it('renders an SVG element', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rotating group has correct transform at pan=0', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(0deg)')
  })

  it('rotating group has correct transform at pan=1', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(135deg)')
  })

  it('rotating group has correct transform at pan=-0.5', () => {
    const { container } = render(<PanKnob pan={-0.5} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(-67.5deg)')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('svg')?.getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size prop is sm', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} size="sm" />)
    expect(container.querySelector('svg')?.getAttribute('data-size')).toBe('sm')
  })

  it('renders 13 tick mark lines', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const ticks = container.querySelectorAll('[data-testid="tick"]')
    expect(ticks.length).toBe(13)
  })

  it('readout span is in the DOM', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="readout"]')).not.toBeNull()
  })
})

describe('PanKnob branding', () => {
  const noop = vi.fn()

  it('renders LED ring element', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="led-ring"]')).not.toBeNull()
  })

  it('sets --pan-accent CSS variable on root when color prop provided', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} color="#ff0000" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--pan-accent')).toBe('#ff0000')
  })

  it('renders L and R silkscreen labels', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const labels = container.querySelectorAll('[data-testid="silkscreen-label"]')
    expect(labels.length).toBe(2)
  })
})

describe('PanKnob accessibility', () => {
  const noop = vi.fn()

  it('has role="slider"', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider')).toBeDefined()
  })

  it('aria-valuemin=-1 aria-valuemax=1', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    const el = getByRole('slider')
    expect(el.getAttribute('aria-valuemin')).toBe('-1')
    expect(el.getAttribute('aria-valuemax')).toBe('1')
  })

  it('aria-valuenow reflects pan prop', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuenow')).toBe('0.5')
  })

  it('aria-valuetext "Center" at pan=0', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuetext')).toBe('Center')
  })

  it('aria-valuetext "Left 20" at pan=-0.2', () => {
    const { getByRole } = render(<PanKnob pan={-0.2} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuetext')).toBe('Left 20')
  })

  it('aria-label defaults to "Pan"', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Pan')
  })

  it('custom aria-label', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} aria-label="Track Pan" />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Track Pan')
  })

  it('aria-disabled when disabled prop set', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('aria-disabled')).toBe('true')
  })

  it('tabIndex=0 by default', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('0')
  })

  it('tabIndex=-1 when disabled', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('-1')
  })
})

describe('PanKnob keyboard', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  function getSlider(pan: number) {
    const { getByRole } = render(<PanKnob pan={pan} onChange={noop} />)
    return getByRole('slider')
  }

  it('ArrowRight → +0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowRight' })
    expect(noop).toHaveBeenCalledWith(0.05)
  })
  it('ArrowLeft → -0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowLeft' })
    expect(noop).toHaveBeenCalledWith(-0.05)
  })
  it('ArrowUp → +0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(0.05)
  })
  it('ArrowDown → -0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowDown' })
    expect(noop).toHaveBeenCalledWith(-0.05)
  })
  it('Shift+ArrowRight → +0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowRight', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('Shift+ArrowLeft → -0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowLeft', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(-0.25)
  })
  it('PageUp → +0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'PageUp' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('PageDown → -0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'PageDown' })
    expect(noop).toHaveBeenCalledWith(-0.25)
  })
  it('Home → -1', () => {
    fireEvent.keyDown(getSlider(0), { key: 'Home' })
    expect(noop).toHaveBeenCalledWith(-1)
  })
  it('End → +1', () => {
    fireEvent.keyDown(getSlider(0), { key: 'End' })
    expect(noop).toHaveBeenCalledWith(1)
  })
  it('ArrowRight at pan=1 does not exceed 1', () => {
    fireEvent.keyDown(getSlider(1), { key: 'ArrowRight' })
    const called = noop.mock.calls[0]?.[0]
    expect(called).toBeLessThanOrEqual(1)
  })
  it('ArrowLeft at pan=-1 does not go below -1', () => {
    fireEvent.keyDown(getSlider(-1), { key: 'ArrowLeft' })
    const called = noop.mock.calls[0]?.[0]
    expect(called).toBeGreaterThanOrEqual(-1)
  })
})

describe('PanKnob reset gesture', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('double-click calls onChange(0) with default resetValue', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('double-click calls onChange(resetValue) with custom resetValue', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={0.2} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0.2)
  })

  it('Delete key calls onChange(0)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('Backspace key calls onChange(0)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('0 key calls onChange(resetValue)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={-0.1} />)
    fireEvent.keyDown(getByRole('slider'), { key: '0' })
    expect(noop).toHaveBeenCalledWith(-0.1)
  })

  it('Delete with non-zero resetValue → onChange(resetValue)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={0.5} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0.5)
  })
})

describe('PanKnob reduced-motion', () => {
  it('reset calls onChange(resetValue) immediately under reduced-motion', () => {
    mockMatchMedia(true)
    const noop = vi.fn()
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0)
  })
})

describe('PanKnob arc elements', () => {
  const noop = vi.fn()

  it('range arc is always present', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="range-arc"]')).not.toBeNull()
  })

  it('center tick is always present', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="center-tick"]')).not.toBeNull()
  })

  it('value arc is absent at pan=0 (center reads as empty)', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).toBeNull()
  })

  it('value arc is present at pan=1 (full right)', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).not.toBeNull()
  })

  it('value arc is present at pan=-1 (full left)', () => {
    const { container } = render(<PanKnob pan={-1} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).not.toBeNull()
  })

  it('value arc at pan=1 sweeps clockwise (sweep=1 in d attribute)', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    // arcPath(20,20,18,0,135) → "... A 18 18 0 0 1 ..."
    expect(arc.getAttribute('d')).toContain('A 18 18 0 0 1 ')
  })

  it('value arc at pan=-1 sweeps counter-clockwise (sweep=0 in d attribute)', () => {
    const { container } = render(<PanKnob pan={-1} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    // arcPath(20,20,18,0,-135) → "... A 18 18 0 0 0 ..."
    expect(arc.getAttribute('d')).toContain('A 18 18 0 0 0 ')
  })

  it('value arc d attribute starts at top-center (M 20 2)', () => {
    const { container } = render(<PanKnob pan={0.5} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    expect(arc.getAttribute('d')).toMatch(/^M 20 2 /)
  })

  it('range arc d attribute uses full sweep A 18 18 0 1 1 (270°)', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const arc = container.querySelector('[data-testid="range-arc"]')!
    expect(arc.getAttribute('d')).toContain('A 18 18 0 1 1 ')
  })

  it('arc elements are aria-hidden', () => {
    const { container } = render(<PanKnob pan={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="range-arc"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('[data-testid="center-tick"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('[data-testid="value-arc"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('value arc is absent at pan near-zero (-0.001)', () => {
    const { container } = render(<PanKnob pan={-0.001} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).toBeNull()
  })
})
