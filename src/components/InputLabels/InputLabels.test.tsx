import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

const INPUTS: InputEntry[] = [
  { id: 'in-1', name: 'Input 1' },
  { id: 'in-2', name: 'Input 2' },
  { id: 'in-3', name: 'Input 3' },
]

const LABELLED: InputEntry[] = [
  { id: 'in-1', name: 'Input 1', label: 'Guitar - ez1073' },
  { id: 'in-2', name: 'Input 2', label: 'Bass DI' },
]

// ── Rendering ────────────────────────────────────────────────────────────────

describe('InputLabels rendering', () => {
  it('renders a labelled list', () => {
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByRole('list', { name: 'Input labels' })).toBeInTheDocument()
  })

  it('renders one listitem per input', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByRole('listitem')).toHaveLength(3)
  })

  it('renders one textbox per input', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByRole('textbox')).toHaveLength(3)
  })

  it('renders input name as visible label text', () => {
    const { getByText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByText('Input 1')).toBeInTheDocument()
    expect(getByText('Input 2')).toBeInTheDocument()
    expect(getByText('Input 3')).toBeInTheDocument()
  })

  it('label htmlFor associates name with its textbox', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByLabelText('Input 1')).toBeInTheDocument()
    expect(getByLabelText('Input 2')).toBeInTheDocument()
  })

  it('shows existing label value in textbox', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={LABELLED} onLabel={vi.fn()} />,
    )
    expect(getByLabelText('Input 1')).toHaveValue('Guitar - ez1073')
    expect(getByLabelText('Input 2')).toHaveValue('Bass DI')
  })

  it('shows placeholder on empty fields', () => {
    const { getAllByPlaceholderText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByPlaceholderText('add a label…')).toHaveLength(3)
  })

  it('data-size is "md" by default', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size is "sm" when size="sm"', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} size="sm" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('renders empty-state text when inputs is empty', () => {
    const { getByText } = render(
      <InputLabels inputs={[]} onLabel={vi.fn()} />,
    )
    expect(getByText(/no inputs/i)).toBeInTheDocument()
  })

  it('renders no listitems when inputs is empty', () => {
    const { queryAllByRole } = render(
      <InputLabels inputs={[]} onLabel={vi.fn()} />,
    )
    expect(queryAllByRole('listitem')).toHaveLength(0)
  })
})

// ── Draft state (local edit buffer) ──────────────────────────────────────────

describe('InputLabels draft state', () => {
  it('typing updates the field immediately without waiting for onLabel', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={() => {}} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Kick' } })
    expect(field).toHaveValue('Kick')
  })

  it('draft changes do not call onLabel until committed', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    fireEvent.change(getByLabelText('Input 1'), { target: { value: 'Kick' } })
    expect(onLabel).not.toHaveBeenCalled()
  })
})

// ── Commit on blur ────────────────────────────────────────────────────────────

describe('InputLabels blur commit', () => {
  it('blur calls onLabel with the draft value', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Bass DI' } })
    fireEvent.blur(field)
    expect(onLabel).toHaveBeenCalledOnce()
    expect(onLabel).toHaveBeenCalledWith('1', 'Bass DI')
  })

  it('blur with correct id for each row', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={INPUTS} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 2')
    fireEvent.change(field, { target: { value: 'Snare' } })
    fireEvent.blur(field)
    expect(onLabel).toHaveBeenCalledWith('in-2', 'Snare')
  })

  it('blur does NOT call onLabel when value is unchanged', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1', label: 'Guitar' }]} onLabel={onLabel} />,
    )
    fireEvent.blur(getByLabelText('Input 1'))
    expect(onLabel).not.toHaveBeenCalled()
  })

  it('blur trims leading/trailing whitespace before saving', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: '  Guitar  ' } })
    fireEvent.blur(field)
    expect(onLabel).toHaveBeenCalledWith('1', 'Guitar')
  })
})

// ── Commit on Enter ───────────────────────────────────────────────────────────

describe('InputLabels Enter commit', () => {
  it('Enter calls onLabel with the draft value', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Synth' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onLabel).toHaveBeenCalledOnce()
    expect(onLabel).toHaveBeenCalledWith('1', 'Synth')
  })

  it('Enter after Enter does NOT call onLabel a second time', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Synth' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onLabel).toHaveBeenCalledOnce()
  })
})

// ── Revert on Escape ──────────────────────────────────────────────────────────

describe('InputLabels Escape revert', () => {
  it('Escape reverts draft to the last saved value', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels
        inputs={[{ id: '1', name: 'Input 1', label: 'Guitar' }]}
        onLabel={onLabel}
      />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Bass' } })
    expect(field).toHaveValue('Bass')
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(field).toHaveValue('Guitar')
    expect(onLabel).not.toHaveBeenCalled()
  })

  it('Escape on a never-edited empty field stays empty', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Drums' } })
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(field).toHaveValue('')
    expect(onLabel).not.toHaveBeenCalled()
  })
})

// ── Disabled state ────────────────────────────────────────────────────────────

describe('InputLabels disabled', () => {
  it('sets data-disabled on the root when disabled=true', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} disabled />,
    )
    expect(container.firstChild).toHaveAttribute('data-disabled')
  })

  it('does not set data-disabled when disabled is not passed', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(container.firstChild).not.toHaveAttribute('data-disabled')
  })

  it('marks all pill inputs as disabled', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} disabled />,
    )
    for (const field of getAllByRole('textbox')) {
      expect(field).toBeDisabled()
    }
  })

})
