import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Knob, clamp, normalize, valueToAngle, snap, arcPath } from './Knob'

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(5, 0, 10)).toBe(5))
  it('clamps below min',           () => expect(clamp(-2, 0, 10)).toBe(0))
  it('clamps above max',           () => expect(clamp(12, 0, 10)).toBe(10))
})

describe('normalize', () => {
  it('min → 0',          () => expect(normalize(0, 0, 100)).toBe(0))
  it('max → 1',          () => expect(normalize(100, 0, 100)).toBe(1))
  it('mid → 0.5',        () => expect(normalize(50, 0, 100)).toBe(0.5))
  it('bipolar mid → 0.5',() => expect(normalize(0, -24, 24)).toBe(0.5))
  it('zero range → 0',   () => expect(normalize(5, 5, 5)).toBe(0))
})

describe('valueToAngle', () => {
  it('min → -135°',  () => expect(valueToAngle(0, 0, 100)).toBe(-135))
  it('max → 135°',   () => expect(valueToAngle(100, 0, 100)).toBe(135))
  it('mid → 0°',     () => expect(valueToAngle(50, 0, 100)).toBe(0))
})

describe('snap', () => {
  it('no step → clamp only', () => expect(snap(3.3, undefined, 0, 10)).toBe(3.3))
  it('snaps to step',        () => expect(snap(3.3, 1, 0, 10)).toBe(3))
  it('snaps with offset min',() => expect(snap(-11, 5, -24, 24)).toBe(-9))
  it('clamps after snap',    () => expect(snap(999, 1, 0, 10)).toBe(10))
})

describe('arcPath', () => {
  it('produces an SVG arc command', () => {
    expect(arcPath(20, 20, 18, -135, 135)).toMatch(/^M .* A 18 18 0 /)
  })
})

describe('Knob (DOM)', () => {
  it('exposes slider ARIA from min/max/value', () => {
    const { getByRole } = render(
      <Knob value={70} onChange={() => {}} min={0} max={100} aria-label="Amount" />,
    )
    const slider = getByRole('slider')
    expect(slider.getAttribute('aria-valuemin')).toBe('0')
    expect(slider.getAttribute('aria-valuemax')).toBe('100')
    expect(slider.getAttribute('aria-valuenow')).toBe('70')
    expect(slider.getAttribute('aria-label')).toBe('Amount')
  })

  it('arrow key nudges value and snaps to step', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Knob value={50} onChange={onChange} min={0} max={100} step={1} aria-label="Amount" />,
    )
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(51)
  })

  it('double-click resets to resetValue', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Knob value={80} onChange={onChange} min={0} max={100} resetValue={0} aria-label="Amount" />,
    )
    fireEvent.doubleClick(getByRole('slider'))
    expect(onChange).toHaveBeenCalledWith(0)
  })
})
