import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { InputSelectCalm } from './InputSelect.calm'

const OPTIONS = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
]

describe('InputSelectCalm', () => {
  it('renders a listbox trigger and shows the selected label', () => {
    render(<InputSelectCalm value="in-2" onChange={() => {}} options={OPTIONS} />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-haspopup')).toBe('listbox')
    expect(screen.getByText('Input 2')).toBeInTheDocument()
  })

  it('opens the listbox and selects an option', () => {
    const onChange = vi.fn()
    render(<InputSelectCalm value={null} onChange={onChange} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 1/ }))
    expect(onChange).toHaveBeenCalledWith('in-1')
  })

  it('does not open when disabled', () => {
    render(<InputSelectCalm value={null} onChange={() => {}} options={OPTIONS} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
