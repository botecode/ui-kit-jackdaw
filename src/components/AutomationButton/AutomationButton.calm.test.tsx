import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { AutomationButtonCalm } from './AutomationButton.calm'

describe('AutomationButtonCalm', () => {
  it('toggles engagement via aria-pressed', () => {
    const onToggle = vi.fn()
    const { getByRole, rerender } = render(<AutomationButtonCalm engaged={false} onToggle={onToggle} />)
    const btn = getByRole('button', { name: 'Automation' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalledTimes(1)
    rerender(<AutomationButtonCalm engaged onToggle={onToggle} />)
    expect(getByRole('button', { name: 'Automation' })).toHaveAttribute('data-engaged', 'true')
  })

  it('renders a bare toggle (no caret) when onModeChange is omitted', () => {
    render(<AutomationButtonCalm engaged={false} onToggle={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Automation mode' })).not.toBeInTheDocument()
  })

  it('opens the read/write menu (paper surface) and selects a mode', () => {
    const onModeChange = vi.fn()
    render(<AutomationButtonCalm engaged mode="read" onToggle={() => {}} onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.getByRole('menu', { name: 'Automation mode' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Write' }))
    expect(onModeChange).toHaveBeenCalledWith('write')
  })
})
