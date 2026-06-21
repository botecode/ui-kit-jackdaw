// src/components/PreferencesModal/PreferencesModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreferencesModal } from './PreferencesModal'
import type { PreferencesSection } from './PreferencesModal'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',      label: 'Input',         icon: <span data-testid="icon-input" /> },
  { id: 'look-feel',  label: 'Look and feel',  icon: <span data-testid="icon-look" />  },
  { id: 'shortcuts',  label: 'Shortcuts',      icon: <span data-testid="icon-shortcuts" /> },
]

const BASE = {
  open: true as const,
  onClose: vi.fn(),
  sections: SECTIONS,
  active: 'input',
  onSelect: vi.fn(),
  children: <div data-testid="panel-content">Panel content</div>,
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('PreferencesModal — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<PreferencesModal {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has aria-modal="true"', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-label="Preferences"', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Preferences')
  })

  it('renders a visible PREFERENCES heading', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByText('PREFERENCES')).toBeInTheDocument()
  })

  it('renders children (panel content)', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByTestId('panel-content')).toBeInTheDocument()
  })

  it('renders all section labels', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Look and feel')).toBeInTheDocument()
    expect(screen.getByText('Shortcuts')).toBeInTheDocument()
  })
})

// ── ARIA / tablist ────────────────────────────────────────────────────────────

describe('PreferencesModal — ARIA tablist', () => {
  it('sidebar has role="tablist"', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('each section renders as a tab', () => {
    render(<PreferencesModal {...BASE} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('the active tab has aria-selected="true"', () => {
    render(<PreferencesModal {...BASE} />)
    const activeTab = screen.getByRole('tab', { name: /input/i })
    expect(activeTab).toHaveAttribute('aria-selected', 'true')
  })

  it('inactive tabs have aria-selected="false"', () => {
    render(<PreferencesModal {...BASE} />)
    const tab = screen.getByRole('tab', { name: /look and feel/i })
    expect(tab).toHaveAttribute('aria-selected', 'false')
  })

  it('content area has role="tabpanel"', () => {
    render(<PreferencesModal {...BASE} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('active tab aria-controls matches the tabpanel id', () => {
    render(<PreferencesModal {...BASE} />)
    const activeTab = screen.getByRole('tab', { name: /input/i })
    const panelId = activeTab.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = document.getElementById(panelId!)
    expect(panel?.getAttribute('role')).toBe('tabpanel')
  })

  it('tabpanel aria-labelledby points to the active tab', () => {
    render(<PreferencesModal {...BASE} />)
    const activeTab = screen.getByRole('tab', { name: /input/i })
    const tabId = activeTab.id
    expect(tabId).toBeTruthy()
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', tabId)
  })
})

// ── Interaction ───────────────────────────────────────────────────────────────

describe('PreferencesModal — interaction', () => {
  it('clicking a section tab calls onSelect with the section id', () => {
    const onSelect = vi.fn()
    render(<PreferencesModal {...BASE} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('tab', { name: /look and feel/i }))
    expect(onSelect).toHaveBeenCalledWith('look-feel')
  })

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn()
    render(<PreferencesModal {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close preferences/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the scrim (outside the dialog) calls onClose', () => {
    const onClose = vi.fn()
    render(<PreferencesModal {...BASE} onClose={onClose} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the dialog does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<PreferencesModal {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── Keyboard ──────────────────────────────────────────────────────────────────

describe('PreferencesModal — keyboard', () => {
  it('Escape calls onClose', () => {
    const onClose = vi.fn()
    render(<PreferencesModal {...BASE} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape does NOT call onClose when closed', () => {
    const onClose = vi.fn()
    render(<PreferencesModal {...BASE} open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ArrowDown on an active tab calls onSelect with the next section id', () => {
    const onSelect = vi.fn()
    render(<PreferencesModal {...BASE} onSelect={onSelect} />)
    const activeTab = screen.getByRole('tab', { name: /input/i })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('look-feel')
  })

  it('ArrowUp on an active tab calls onSelect with the previous section id', () => {
    const onSelect = vi.fn()
    render(<PreferencesModal {...BASE} active="look-feel" onSelect={onSelect} />)
    const activeTab = screen.getByRole('tab', { name: /look and feel/i })
    activeTab.focus()
    fireEvent.keyDown(activeTab, { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('ArrowDown at the last tab wraps to the first', () => {
    const onSelect = vi.fn()
    render(<PreferencesModal {...BASE} active="shortcuts" onSelect={onSelect} />)
    const lastTab = screen.getByRole('tab', { name: /shortcuts/i })
    lastTab.focus()
    fireEvent.keyDown(lastTab, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('ArrowUp at the first tab wraps to the last', () => {
    const onSelect = vi.fn()
    render(<PreferencesModal {...BASE} active="input" onSelect={onSelect} />)
    const firstTab = screen.getByRole('tab', { name: /input/i })
    firstTab.focus()
    fireEvent.keyDown(firstTab, { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('shortcuts')
  })

  it('Tab wraps from last focusable to first', () => {
    render(<PreferencesModal {...BASE} />)
    const focusable = Array.from(
      screen.getByRole('dialog').querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
    focusable[focusable.length - 1].focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(focusable[0])
  })

  it('Shift+Tab wraps from first focusable to last', () => {
    render(<PreferencesModal {...BASE} />)
    const focusable = Array.from(
      screen.getByRole('dialog').querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
    focusable[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(focusable[focusable.length - 1])
  })
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('PreferencesModal — focus management', () => {
  it('focuses the close button on open', () => {
    render(<PreferencesModal {...BASE} />)
    const closeBtn = screen.getByRole('button', { name: /close preferences/i })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('returns focus to the previously focused element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { rerender } = render(<PreferencesModal {...BASE} />)
    rerender(<PreferencesModal {...BASE} open={false} />)
    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })
})

// ── Scroll lock ───────────────────────────────────────────────────────────────

describe('PreferencesModal — body scroll lock', () => {
  it('sets body overflow:hidden while open', () => {
    render(<PreferencesModal {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow on close', () => {
    const { rerender } = render(<PreferencesModal {...BASE} />)
    rerender(<PreferencesModal {...BASE} open={false} />)
    expect(document.body.style.overflow).toBe('')
  })
})
