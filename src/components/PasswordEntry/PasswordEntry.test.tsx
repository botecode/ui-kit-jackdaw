// src/components/PasswordEntry/PasswordEntry.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordEntry } from './PasswordEntry'
import type { PasswordEntryProps } from './PasswordEntry'

const BASE: PasswordEntryProps = {
  value:    '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PasswordEntry — field', () => {
  it('renders a masked password input', () => {
    render(<PasswordEntry {...BASE} mode="enter" />)
    const input = screen.getByLabelText(/content password/i)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('typing calls onChange with the new value', () => {
    const onChange = vi.fn()
    render(<PasswordEntry {...BASE} onChange={onChange} mode="enter" />)
    fireEvent.change(screen.getByLabelText(/content password/i), { target: { value: 'hunter2' } })
    expect(onChange).toHaveBeenCalledWith('hunter2')
  })
})

describe('PasswordEntry — submit', () => {
  it('clicking the submit button calls onSubmit with the current value', () => {
    const onSubmit = vi.fn()
    render(<PasswordEntry {...BASE} value="hunter2" onSubmit={onSubmit} mode="enter" />)
    fireEvent.click(screen.getByRole('button', { name: /unlock/i }))
    expect(onSubmit).toHaveBeenCalledWith('hunter2')
  })

  it('pressing Enter in the field calls onSubmit', () => {
    const onSubmit = vi.fn()
    render(<PasswordEntry {...BASE} value="hunter2" onSubmit={onSubmit} mode="enter" />)
    fireEvent.keyDown(screen.getByLabelText(/content password/i), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('hunter2')
  })

  it('submit button is disabled when value is empty', () => {
    render(<PasswordEntry {...BASE} value="" mode="enter" />)
    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled()
  })

  it('does NOT submit on Enter when value is empty', () => {
    const onSubmit = vi.fn()
    render(<PasswordEntry {...BASE} value="" onSubmit={onSubmit} mode="enter" />)
    fireEvent.keyDown(screen.getByLabelText(/content password/i), { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('PasswordEntry — modes', () => {
  it('enter mode shows an "Unlock" submit label', () => {
    render(<PasswordEntry {...BASE} value="x" mode="enter" />)
    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument()
  })

  it('set mode shows a "Set password" submit label', () => {
    render(<PasswordEntry {...BASE} value="x" mode="set" />)
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument()
  })

  it('defaults to enter mode', () => {
    render(<PasswordEntry {...BASE} value="x" />)
    expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument()
  })

  it('set mode exposes data-mode=set on the root', () => {
    const { container } = render(<PasswordEntry {...BASE} mode="set" />)
    expect(container.querySelector('[data-mode="set"]')).toBeInTheDocument()
  })
})

describe('PasswordEntry — error / retry', () => {
  it('shows the wrong-password error message in an alert', () => {
    render(<PasswordEntry {...BASE} value="bad" mode="enter" error="Wrong password — try again." />)
    expect(screen.getByRole('alert')).toHaveTextContent(/wrong password/i)
  })

  it('marks the input invalid when error is present', () => {
    render(<PasswordEntry {...BASE} value="bad" mode="enter" error="Wrong password — try again." />)
    expect(screen.getByLabelText(/content password/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('still allows retry — submit stays enabled with a value after an error', () => {
    const onSubmit = vi.fn()
    render(<PasswordEntry {...BASE} value="retry" onSubmit={onSubmit} mode="enter" error="Wrong password — try again." />)
    const btn = screen.getByRole('button', { name: /unlock/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalledWith('retry')
  })
})

describe('PasswordEntry — disabled', () => {
  it('disables the input and submit when disabled', () => {
    render(<PasswordEntry {...BASE} value="x" mode="enter" disabled />)
    expect(screen.getByLabelText(/content password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled()
  })

  it('does not submit on Enter when disabled', () => {
    const onSubmit = vi.fn()
    render(<PasswordEntry {...BASE} value="x" onSubmit={onSubmit} mode="enter" disabled />)
    fireEvent.keyDown(screen.getByLabelText(/content password/i), { key: 'Enter' })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
