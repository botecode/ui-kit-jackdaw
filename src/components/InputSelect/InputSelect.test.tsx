import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { InputSelect } from './InputSelect'

const OPTIONS = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
  { id: 'in-3', label: 'Input 3' },
]
const noop = vi.fn()

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('InputSelect rendering', () => {
  it('renders a button with aria-haspopup="listbox"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.getByRole('button').getAttribute('aria-haspopup')).toBe('listbox')
  })

  it('aria-expanded="false" when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  })

  it('shows placeholder when value is null', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} placeholder="—" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows selected option label when value is set', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} />)
    expect(screen.getByText('Input 2')).toBeInTheDocument()
  })

  it('data-variant="field" by default', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'field')
  })

  it('data-variant="chip" when variant="chip"', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} variant="chip" />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'chip')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('button is disabled when disabled=true', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders "IN" tag when showInTag=true and variant="field"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} showInTag />)
    expect(screen.getByText('IN')).toBeInTheDocument()
  })

  it('does not render "IN" tag when showInTag=false', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.queryByText('IN')).not.toBeInTheDocument()
  })

  it('listbox not rendered when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Open/close ──────────────────────────────────────────────────────────────

describe('InputSelect open/close', () => {
  it('clicking the button opens the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('aria-expanded="true" when open', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('clicking the button again closes the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clicking outside closes the listbox', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <InputSelect value={null} onChange={noop} options={OPTIONS} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('disabled: clicking does not open the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('defaultOpen=true opens on mount', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

// ─── Listbox content ─────────────────────────────────────────────────────────

describe('InputSelect listbox content', () => {
  it('renders all options as role="option"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('selected option has aria-selected="true"', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} defaultOpen />)
    const selected = screen.getByRole('option', { name: /Input 2/ })
    expect(selected.getAttribute('aria-selected')).toBe('true')
  })

  it('unselected options have aria-selected="false"', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} defaultOpen />)
    const unselected = screen.getByRole('option', { name: /Input 1/ })
    expect(unselected.getAttribute('aria-selected')).toBe('false')
  })
})

// ─── Selection ───────────────────────────────────────────────────────────────

describe('InputSelect selection', () => {
  it('clicking an option calls onChange with its id', () => {
    const onChange = vi.fn()
    render(<InputSelect value={null} onChange={onChange} options={OPTIONS} defaultOpen />)
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 3/ }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('in-3')
  })

  it('selecting an option closes the listbox', () => {
    render(<InputSelect value={null} onChange={vi.fn()} options={OPTIONS} defaultOpen />)
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 1/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Keyboard ────────────────────────────────────────────────────────────────

describe('InputSelect keyboard', () => {
  it('Enter opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Space opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('ArrowDown opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Escape closes the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowDown moves active option down', () => {
    render(<InputSelect value="in-1" onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    const opts = screen.getAllByRole('option')
    expect(opts[1]).toHaveAttribute('data-active')
  })

  it('Enter selects the active option and closes', () => {
    const onChange = vi.fn()
    render(<InputSelect value="in-1" onChange={onChange} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('in-2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowUp moves active option up', () => {
    render(<InputSelect value="in-3" onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' })
    const opts = screen.getAllByRole('option')
    expect(opts[2]).toHaveAttribute('data-active')
  })
})
