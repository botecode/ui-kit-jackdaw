import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PanKnob, panToAngle, formatReadout, formatAriaValueText, clamp } from './PanKnob'

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
