import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlOption } from './SegmentedControl'

const TWO_OPTS: SegmentedControlOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

const THREE_OPTS: SegmentedControlOption[] = [
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
  { value: 'z', label: 'Z' },
]

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('SegmentedControl rendering', () => {
  it('renders a radiogroup', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders one radio per option', () => {
    const { getAllByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getAllByRole('radio')).toHaveLength(3)
  })

  it('selected segment has aria-checked="true"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="b" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Beta' }).getAttribute('aria-checked')).toBe('true')
  })

  it('unselected segments have aria-checked="false"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="b" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Alpha' }).getAttribute('aria-checked')).toBe('false')
  })

  it('selected segment has data-selected attribute', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Alpha' })).toHaveAttribute('data-selected')
  })

  it('unselected segments lack data-selected', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Beta' })).not.toHaveAttribute('data-selected')
  })

  it('selected segment has tabIndex=0', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Alpha' })).toHaveAttribute('tabindex', '0')
  })

  it('unselected segments have tabIndex=-1', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radio', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
  })

  it('radiogroup has aria-label', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Fruit picker" />,
    )
    expect(getByRole('radiogroup').getAttribute('aria-label')).toBe('Fruit picker')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" size="sm" />,
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('sm')
  })

  it('data-disabled present when disabled', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" disabled />,
    )
    expect(getByRole('radiogroup')).toHaveAttribute('data-disabled')
  })

  it('no data-disabled when not disabled', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByRole('radiogroup')).not.toHaveAttribute('data-disabled')
  })

  it('renders label text for each option', () => {
    const { getByText } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />,
    )
    expect(getByText('Alpha')).toBeInTheDocument()
    expect(getByText('Beta')).toBeInTheDocument()
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('SegmentedControl interaction', () => {
  it('click on unselected segment calls onChange with its value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.click(getByRole('radio', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('click on already-selected segment still calls onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.click(getByRole('radio', { name: 'Alpha' }))
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('disabled: click does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" disabled />,
    )
    fireEvent.click(getByRole('radio', { name: 'Beta' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('SegmentedControl keyboard navigation', () => {
  it('ArrowRight from first moves to second', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('y')
  })

  it('ArrowLeft from last moves to second-to-last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="z" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Z' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('y')
  })

  it('ArrowRight from last wraps to first', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="z" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Z' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('ArrowLeft from first wraps to last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('z')
  })

  it('Home moves to first option', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="y" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Y' }), { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('End moves to last option', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="y" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Y' }), { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('z')
  })

  it('other keys do not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
