import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MobileSegmented } from './MobileSegmented'
import type { MobileSegment } from './MobileSegmented'

const TWO: MobileSegment[] = [
  { value: 'write', label: 'Write' },
  { value: 'edit', label: 'Edit' },
]

const THREE: MobileSegment[] = [
  { value: 'all', label: 'All' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'masters', label: 'Masters' },
]

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('MobileSegmented rendering', () => {
  it('renders a radiogroup', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders one radio per segment', () => {
    const { getAllByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={vi.fn()} aria-label="Filter" />,
    )
    expect(getAllByRole('radio')).toHaveLength(3)
  })

  it('selected segment has aria-checked="true"', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="edit" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Edit' }).getAttribute('aria-checked')).toBe('true')
  })

  it('unselected segments have aria-checked="false"', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="edit" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Write' }).getAttribute('aria-checked')).toBe('false')
  })

  it('selected segment carries data-selected', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Write' })).toHaveAttribute('data-selected')
  })

  it('unselected segments lack data-selected', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Edit' })).not.toHaveAttribute('data-selected')
  })

  it('radiogroup exposes the active index via --_active for the sliding indicator', () => {
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="masters" onChange={vi.fn()} aria-label="Filter" />,
    )
    expect(getByRole('radiogroup').style.getPropertyValue('--_active')).toBe('2')
  })

  it('radiogroup exposes the segment count via --_n', () => {
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={vi.fn()} aria-label="Filter" />,
    )
    expect(getByRole('radiogroup').style.getPropertyValue('--_n')).toBe('3')
  })

  it('renders the sliding lit indicator', () => {
    const { getByTestId } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByTestId('mobseg-slider')).toBeInTheDocument()
  })

  it('renders label text for each segment', () => {
    const { getByText } = render(
      <MobileSegmented segments={THREE} value="all" onChange={vi.fn()} aria-label="Filter" />,
    )
    expect(getByText('All')).toBeInTheDocument()
    expect(getByText('Ideas')).toBeInTheDocument()
    expect(getByText('Masters')).toBeInTheDocument()
  })

  it('falls back to index 0 when value matches no segment', () => {
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="nope" onChange={vi.fn()} aria-label="Filter" />,
    )
    expect(getByRole('radiogroup').style.getPropertyValue('--_active')).toBe('0')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" size="sm" />,
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('sm')
  })

  it('data-disabled present when disabled', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" disabled />,
    )
    expect(getByRole('radiogroup')).toHaveAttribute('data-disabled')
  })

  it('disables each radio button when disabled', () => {
    const { getAllByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" disabled />,
    )
    getAllByRole('radio').forEach(r => expect(r).toBeDisabled())
  })

  it('icon-only segment uses value as accessible name', () => {
    const opts: MobileSegment[] = [
      { value: 'list', icon: <span>L</span> },
      { value: 'grid', icon: <span>G</span> },
    ]
    const { getByRole } = render(
      <MobileSegmented segments={opts} value="list" onChange={vi.fn()} aria-label="View" />,
    )
    expect(getByRole('radio', { name: 'list' })).toBeInTheDocument()
    expect(getByRole('radio', { name: 'grid' })).toBeInTheDocument()
  })
})

// ─── Roving tabindex ─────────────────────────────────────────────────────────

describe('MobileSegmented roving tabindex', () => {
  it('selected segment has tabIndex=0', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Write' })).toHaveAttribute('tabindex', '0')
  })

  it('unselected segments have tabIndex=-1', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    expect(getByRole('radio', { name: 'Edit' })).toHaveAttribute('tabindex', '-1')
  })
})

// ─── Interaction (select) ────────────────────────────────────────────────────

describe('MobileSegmented interaction', () => {
  it('click on an unselected segment calls onChange with its value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={onChange} aria-label="Mode" />,
    )
    fireEvent.click(getByRole('radio', { name: 'Edit' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('edit')
  })

  it('click on the already-selected segment still reports the value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={onChange} aria-label="Mode" />,
    )
    fireEvent.click(getByRole('radio', { name: 'Write' }))
    expect(onChange).toHaveBeenCalledWith('write')
  })

  it('disabled: click does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={onChange} aria-label="Mode" disabled />,
    )
    fireEvent.click(getByRole('radio', { name: 'Edit' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marks a segment data-pressed on pointer down and clears on pointer up', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    const edit = getByRole('radio', { name: 'Edit' })
    fireEvent.pointerDown(edit)
    expect(edit).toHaveAttribute('data-pressed')
    fireEvent.pointerUp(edit)
    expect(edit).not.toHaveAttribute('data-pressed')
  })

  it('clears data-pressed when the pointer leaves before release', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" />,
    )
    const edit = getByRole('radio', { name: 'Edit' })
    fireEvent.pointerDown(edit)
    expect(edit).toHaveAttribute('data-pressed')
    fireEvent.pointerLeave(edit)
    expect(edit).not.toHaveAttribute('data-pressed')
  })

  it('disabled: pointer down does not mark data-pressed', () => {
    const { getByRole } = render(
      <MobileSegmented segments={TWO} value="write" onChange={vi.fn()} aria-label="Mode" disabled />,
    )
    const edit = getByRole('radio', { name: 'Edit' })
    fireEvent.pointerDown(edit)
    expect(edit).not.toHaveAttribute('data-pressed')
  })
})

// ─── Keyboard navigation ─────────────────────────────────────────────────────

describe('MobileSegmented keyboard navigation', () => {
  it('ArrowRight from first moves to second', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'All' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('ideas')
  })

  it('ArrowLeft from last moves to second-to-last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="masters" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Masters' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('ideas')
  })

  it('ArrowRight from last wraps to first', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="masters" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Masters' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('all')
  })

  it('ArrowLeft from first wraps to last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'All' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('masters')
  })

  it('Home moves to first segment', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="ideas" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Ideas' }), { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('all')
  })

  it('End moves to last segment', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="ideas" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Ideas' }), { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('masters')
  })

  it('unrelated keys do not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={onChange} aria-label="Filter" />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'All' }), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('disabled: keyboard does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <MobileSegmented segments={THREE} value="all" onChange={onChange} aria-label="Filter" disabled />,
    )
    fireEvent.keyDown(getByRole('radio', { name: 'All' }), { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
