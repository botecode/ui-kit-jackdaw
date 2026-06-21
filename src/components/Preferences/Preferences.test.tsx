// src/components/Preferences/Preferences.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',         label: 'Input',         panel: <div data-testid="panel-input">Input panel</div> },
  { id: 'look-and-feel', label: 'Look and feel', panel: <div data-testid="panel-look">Look panel</div> },
  { id: 'shortcuts',     label: 'Shortcuts',      panel: <div data-testid="panel-shortcuts">Shortcuts panel</div> },
]

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Trigger ───────────────────────────────────────────────────────────────────

describe('Preferences — trigger', () => {
  it('renders a settings trigger button', () => {
    render(<Preferences sections={SECTIONS} />)
    expect(screen.getByRole('button', { name: 'Preferences' })).toBeInTheDocument()
  })

  it('menu is not shown initially', () => {
    render(<Preferences sections={SECTIONS} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('no dialog is shown initially', () => {
    render(<Preferences sections={SECTIONS} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('trigger has aria-haspopup="menu"', () => {
    render(<Preferences sections={SECTIONS} />)
    expect(screen.getByRole('button', { name: 'Preferences' })).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('trigger aria-expanded is false when menu is closed', () => {
    render(<Preferences sections={SECTIONS} />)
    expect(screen.getByRole('button', { name: 'Preferences' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger aria-expanded is true when menu is open', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    expect(screen.getByRole('button', { name: 'Preferences' })).toHaveAttribute('aria-expanded', 'true')
  })
})

// ── Menu ──────────────────────────────────────────────────────────────────────

describe('Preferences — menu', () => {
  it('clicking the trigger opens the menu', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('menu contains all section labels', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    expect(screen.getByRole('menuitem', { name: 'Input' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Look and feel' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Shortcuts' })).toBeInTheDocument()
  })

  it('Esc closes the menu', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('ArrowDown moves focus to the next item', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    const menu = screen.getByRole('menu')
    const items = screen.getAllByRole('menuitem')
    // First item is auto-focused on open
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
  })

  it('ArrowUp moves focus to the previous item', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    const menu = screen.getByRole('menu')
    const items = screen.getAllByRole('menuitem')
    // Navigate to items[1] first, then ArrowUp returns to items[0]
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[0])
  })
})

// ── Section modals ────────────────────────────────────────────────────────────

describe('Preferences — section modals', () => {
  it('selecting "Input" opens a dialog with title "Preferences / Input"', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Preferences / Input')).toBeInTheDocument()
  })

  it('selecting "Look and feel" opens a dialog titled "Preferences / Look and feel"', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Look and feel' }))
    expect(screen.getByText('Preferences / Look and feel')).toBeInTheDocument()
  })

  it('selecting "Shortcuts" opens a dialog titled "Preferences / Shortcuts"', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Shortcuts' }))
    expect(screen.getByText('Preferences / Shortcuts')).toBeInTheDocument()
  })

  it('the section panel is rendered inside the dialog', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    expect(screen.getByTestId('panel-input')).toBeInTheDocument()
  })

  it('the menu closes when a section is selected', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('dialog has aria-modal="true"', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('Esc closes the section dialog', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Shortcuts' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking the X button closes the dialog', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking the scrim closes the dialog', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking inside the dialog does NOT close it', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('focus returns to the trigger after closing the dialog with Esc', () => {
    render(<Preferences sections={SECTIONS} />)
    const trigger = screen.getByRole('button', { name: 'Preferences' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger)
  })
})

// ── Scroll lock ───────────────────────────────────────────────────────────────

describe('Preferences — scroll lock', () => {
  it('sets body overflow:hidden while a section dialog is open', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when the dialog closes', () => {
    render(<Preferences sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Input' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })
})
