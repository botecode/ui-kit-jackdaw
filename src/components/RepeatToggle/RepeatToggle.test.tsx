import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { RepeatToggle } from './RepeatToggle'

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('RepeatToggle rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when repeating=false', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when repeating=true', () => {
    const { getByRole } = render(<RepeatToggle repeating onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('no data-repeating when repeating=false', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-repeating')
  })

  it('data-repeating present when repeating=true', () => {
    const { getByRole } = render(<RepeatToggle repeating onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-repeating')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} size="sm" />)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('default aria-label is "Loop"', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Loop')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <RepeatToggle repeating={false} onToggle={noop} aria-label="Toggle loop" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Toggle loop')
  })

  it('disabled attribute present when disabled=true', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} disabled />)
    expect(getByRole('button')).toBeDisabled()
  })
})

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('RepeatToggle interaction', () => {
  it('click calls onToggle(true) when repeating=false', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('click calls onToggle(false) when repeating=true', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disabled: click does not call onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={onToggle} disabled />)
    expect(getByRole('button')).toBeDisabled()
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
