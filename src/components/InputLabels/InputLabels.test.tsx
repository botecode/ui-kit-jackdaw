import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

const INPUTS: InputEntry[] = [
  { id: 'in-1', name: 'Input 1' },
  { id: 'in-2', name: 'Input 2' },
  { id: 'in-3', name: 'Input 3' },
]

const LABELLED_INPUTS: InputEntry[] = [
  { id: 'in-1', name: 'Input 1', label: 'Guitar - ez1073' },
  { id: 'in-2', name: 'Input 2', label: 'Bass DI' },
]

// ── Rendering ────────────────────────────────────────────────────────────────

describe('InputLabels rendering', () => {
  it('renders a list container', () => {
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

  it('renders input names as dim labels', () => {
    const { getByText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByText('Input 1')).toBeInTheDocument()
    expect(getByText('Input 2')).toBeInTheDocument()
    expect(getByText('Input 3')).toBeInTheDocument()
  })

  it('renders a text field for each input', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByRole('textbox')).toHaveLength(3)
  })

  it('fields are aria-labelled with the input name', () => {
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByRole('textbox', { name: 'Label for Input 1' })).toBeInTheDocument()
    expect(getByRole('textbox', { name: 'Label for Input 2' })).toBeInTheDocument()
  })

  it('shows placeholder "add a label…" on empty fields', () => {
    const { getAllByPlaceholderText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByPlaceholderText('add a label…')).toHaveLength(3)
  })

  it('shows existing label values', () => {
    const { getByRole } = render(
      <InputLabels inputs={LABELLED_INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByRole('textbox', { name: 'Label for Input 1' })).toHaveValue('Guitar - ez1073')
    expect(getByRole('textbox', { name: 'Label for Input 2' })).toHaveValue('Bass DI')
  })

  it('renders empty-state message when inputs is empty', () => {
    const { getByText } = render(
      <InputLabels inputs={[]} onLabel={vi.fn()} />,
    )
    expect(getByText('No inputs available')).toBeInTheDocument()
  })

  it('empty list has no listitems', () => {
    const { queryAllByRole } = render(
      <InputLabels inputs={[]} onLabel={vi.fn()} />,
    )
    expect(queryAllByRole('listitem')).toHaveLength(0)
  })
})

// ── Interaction ──────────────────────────────────────────────────────────────

describe('InputLabels interaction', () => {
  it('fires onLabel with (id, label) when a field changes', () => {
    const onLabel = vi.fn()
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={onLabel} />,
    )
    const field = getByRole('textbox', { name: 'Label for Input 1' })
    fireEvent.change(field, { target: { value: 'Kick' } })
    expect(onLabel).toHaveBeenCalledOnce()
    expect(onLabel).toHaveBeenCalledWith('in-1', 'Kick')
  })

  it('fires onLabel with the correct id for each field', () => {
    const onLabel = vi.fn()
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={onLabel} />,
    )
    fireEvent.change(
      getByRole('textbox', { name: 'Label for Input 2' }),
      { target: { value: 'Snare' } },
    )
    expect(onLabel).toHaveBeenCalledWith('in-2', 'Snare')
  })

  it('fires onLabel with empty string when field is cleared', () => {
    const onLabel = vi.fn()
    const { getByRole } = render(
      <InputLabels inputs={LABELLED_INPUTS} onLabel={onLabel} />,
    )
    const field = getByRole('textbox', { name: 'Label for Input 1' })
    fireEvent.change(field, { target: { value: '' } })
    expect(onLabel).toHaveBeenCalledWith('in-1', '')
  })

  it('each field change fires independently', () => {
    const onLabel = vi.fn()
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={onLabel} />,
    )
    fireEvent.change(
      getByRole('textbox', { name: 'Label for Input 1' }),
      { target: { value: 'A' } },
    )
    fireEvent.change(
      getByRole('textbox', { name: 'Label for Input 3' }),
      { target: { value: 'B' } },
    )
    expect(onLabel).toHaveBeenCalledTimes(2)
    expect(onLabel).toHaveBeenNthCalledWith(1, 'in-1', 'A')
    expect(onLabel).toHaveBeenNthCalledWith(2, 'in-3', 'B')
  })
})
