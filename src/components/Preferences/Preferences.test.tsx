// src/components/Preferences/Preferences.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',      label: 'Input',       icon: null },
  { id: 'look-feel',  label: 'Look & feel', icon: null },
  { id: 'shortcuts',  label: 'Shortcuts',   icon: null },
]

const BASE = {
  open: true as const,
  onClose: vi.fn(),
  sections: SECTIONS,
  active: 'input',
  onSelect: vi.fn(),
  children: <p>Panel content</p>,
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Preferences — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<Preferences {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has aria-modal="true"', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-labelledby pointing to "PREFERENCES" title', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = document.getElementById(labelledBy!)
    expect(titleEl?.textContent).toBe('PREFERENCES')
  })

  it('renders children as panel content', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('button', { name: 'Close preferences' })).toBeInTheDocument()
  })
})

// ── Sidebar / tablist ─────────────────────────────────────────────────────────

describe('Preferences — sidebar', () => {
  it('renders a tablist', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders a tab for each section', () => {
    render(<Preferences {...BASE} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('marks the active section as aria-selected=true', () => {
    render(<Preferences {...BASE} active="look-feel" />)
    const tabs = screen.getAllByRole('tab')
    const lookFeel = tabs.find(t => t.textContent?.includes('Look & feel'))!
    expect(lookFeel).toHaveAttribute('aria-selected', 'true')
  })

  it('marks inactive sections as aria-selected=false', () => {
    render(<Preferences {...BASE} active="input" />)
    const tabs = screen.getAllByRole('tab')
    const shortcuts = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(shortcuts).toHaveAttribute('aria-selected', 'false')
  })

  it('applies data-active only to the active tab', () => {
    render(<Preferences {...BASE} active="input" />)
    const tabs = screen.getAllByRole('tab')
    const inputTab = tabs.find(t => t.textContent?.includes('Input'))!
    expect(inputTab).toHaveAttribute('data-active')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(shortcutsTab).not.toHaveAttribute('data-active')
  })

  it('clicking a tab calls onSelect with the section id', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    fireEvent.click(shortcutsTab)
    expect(onSelect).toHaveBeenCalledWith('shortcuts')
  })
})

// ── Content / tabpanel ────────────────────────────────────────────────────────

describe('Preferences — content area', () => {
  it('renders a tabpanel', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('tabpanel aria-labelledby matches the active tab id', () => {
    render(<Preferences {...BASE} active="shortcuts" />)
    const panel = screen.getByRole('tabpanel')
    const tabs = screen.getAllByRole('tab')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(panel.getAttribute('aria-labelledby')).toBe(shortcutsTab.id)
  })
})

// ── Keyboard ──────────────────────────────────────────────────────────────────

describe('Preferences — keyboard', () => {
  it('Escape calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape does NOT call onClose when closed', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close preferences' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the scrim calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the dialog does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ArrowDown in tablist advances to next section', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="input" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('look-feel')
  })

  it('ArrowUp in tablist goes to previous section', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="look-feel" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('ArrowDown wraps from last section to first', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="shortcuts" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('Tab wraps from last focusable to first', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    )
    const last = focusable[focusable.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(focusable[0])
  })
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('Preferences — focus management', () => {
  it('focuses the first focusable element on open', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled])')
    expect(document.activeElement).toBe(focusable[0])
  })

  it('returns focus to the previously focused element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(<Preferences {...BASE} />)
    rerender(<Preferences {...BASE} open={false} />)

    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })
})

// ── Scroll lock ───────────────────────────────────────────────────────────────

describe('Preferences — scroll lock', () => {
  it('locks body scroll while open', () => {
    render(<Preferences {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll on close', () => {
    const { rerender } = render(<Preferences {...BASE} />)
    rerender(<Preferences {...BASE} open={false} />)
    expect(document.body.style.overflow).toBe('')
  })
})
