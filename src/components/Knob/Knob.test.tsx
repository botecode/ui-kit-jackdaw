import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Knob, valueToAngle, clamp } from './Knob'

describe('valueToAngle', () => {
  it('maps the range across the 270° sweep', () => {
    expect(valueToAngle(0, 0, 100)).toBe(-135) // min → far left
    expect(valueToAngle(100, 0, 100)).toBe(135) // max → far right
    expect(valueToAngle(50, 0, 100)).toBe(0) // midpoint → top
  })
  it('clamps out-of-range values', () => {
    expect(valueToAngle(-10, 0, 100)).toBe(-135)
    expect(valueToAngle(200, 0, 100)).toBe(135)
  })
  it('handles a zero-width range', () => {
    expect(valueToAngle(5, 5, 5)).toBe(-135)
  })
})

describe('clamp', () => {
  it('bounds to [min,max]', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('Knob', () => {
  it('exposes the value as an accessible slider', () => {
    render(<Knob value={250} min={0} max={1000} onChange={() => {}} aria-label="Time" />)
    const slider = screen.getByRole('slider', { name: 'Time' })
    expect(slider).toHaveAttribute('aria-valuenow', '250')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '1000')
  })

  it('steps the value with the arrow keys', () => {
    let v = 50
    const onChange = (next: number) => { v = next }
    render(<Knob value={50} min={0} max={100} step={1} onChange={onChange} aria-label="Mix" />)
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Mix' }), { key: 'ArrowUp' })
    expect(v).toBe(51)
  })

  it('resets to resetValue on Delete', () => {
    let v = 80
    render(<Knob value={80} min={0} max={100} resetValue={50} onChange={(n) => { v = n }} aria-label="Fb" />)
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Fb' }), { key: 'Delete' })
    expect(v).toBe(50)
  })
})
