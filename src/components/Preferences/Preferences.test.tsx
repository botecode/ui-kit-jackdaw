// src/components/Preferences/Preferences.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlidersHorizontal, PaintBrush, Command } from '@phosphor-icons/react'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',         label: 'Input',         icon: <SlidersHorizontal size={14} /> },
  { id: 'look-and-feel', label: 'Look and feel', icon: <PaintBrush size={14} /> },
  { id: 'shortcuts',     label: 'Shortcuts',      icon: <Command size={14} /> },
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

  it('has aria-labelledby pointing to the PREFERENCES title', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = document.getElementById(labelledBy!)
    expect(titleEl?.textContent).toBe('PREFERENCES')
  })

  it('renders all section labels in the sidebar', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Look and feel')).toBeInTheDocument()
    expect(screen.getByText('Shortcuts')).toBeInTheDocument()
  })

  it('renders the children in the tabpanel', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByTestId('panel-content')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('button', { name: 'Close preferences' })).toBeInTheDocument()
  })
})

// ── ARIA / tablist ────────────────────────────────────────────────────────────

describe('Preferences — ARIA tablist', () => {
  it('renders a tablist', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders a tab for each section', () => {
    render(<Preferences {...BASE} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(SECTIONS.length)
  })

  it('active section tab has aria-selected=true', () => {
    render(<Preferences {...BASE} />)
    const inputTab = screen.getByRole('tab', { name: /Input/i })
    expect(inputTab).toHaveAttribute('aria-selected', 'true')
  })

  it('inactive section tabs have aria-selected=false', () => {
    render(<Preferences {...BASE} />)
    const lafTab = screen.getByRole('tab', { name: /Look and feel/i })
    const scTab  = screen.getByRole('tab', { name: /Shortcuts/i })
    expect(lafTab).toHaveAttribute('aria-selected', 'false')
    expect(scTab).toHaveAttribute('aria-selected', 'false')
  })

  it('active tab has tabIndex=0, others tabIndex=-1 (roving focus)', () => {
    render(<Preferences {...BASE} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')
    expect(tabs[2]).toHaveAttribute('tabindex', '-1')
  })

  it('renders a tabpanel', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('tabpanel is labelled by the active tab', () => {
    render(<Preferences {...BASE} />)
    const panel = screen.getByRole('tabpanel')
    const labelledBy = panel.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const labelEl = document.getElementById(labelledBy!)
    expect(labelEl?.getAttribute('role')).toBe('tab')
  })

  it('tablist has aria-orientation="vertical"', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
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

  it('ArrowDown on first tab moves focus to second tab and calls onSelect', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(tabs[1])
    expect(onSelect).toHaveBeenCalledWith(SECTIONS[1]!.id)
  })

  it('ArrowUp on first tab wraps to last tab', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(tabs[tabs.length - 1])
    expect(onSelect).toHaveBeenCalledWith(SECTIONS[SECTIONS.length - 1]!.id)
  })

  it('Home moves to first tab', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="shortcuts" onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    tabs[2]!.focus()
    fireEvent.keyDown(tabs[2]!, { key: 'Home' })
    expect(document.activeElement).toBe(tabs[0])
    expect(onSelect).toHaveBeenCalledWith(SECTIONS[0]!.id)
  })

  it('End moves to last tab', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'End' })
    expect(document.activeElement).toBe(tabs[tabs.length - 1])
    expect(onSelect).toHaveBeenCalledWith(SECTIONS[SECTIONS.length - 1]!.id)
  })

  it('Tab wraps from last focusable to first', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    focusable[focusable.length - 1]!.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(focusable[0])
  })

  it('Shift+Tab wraps from first focusable to last', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    focusable[0]!.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(focusable[focusable.length - 1])
  })
})

// ── Interaction ───────────────────────────────────────────────────────────────

describe('Preferences — interaction', () => {
  it('clicking close button calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close preferences' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking scrim calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the modal does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking a section tab calls onSelect with its id', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('tab', { name: /Look and feel/i }))
    expect(onSelect).toHaveBeenCalledWith('look-and-feel')
  })

  it('clicking a section tab does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('tab', { name: /Shortcuts/i }))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('Preferences — focus management', () => {
  it('focuses the first focusable element on open', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    expect(document.activeElement).toBe(firstFocusable)
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
  it('sets body overflow:hidden while open', () => {
    render(<Preferences {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow on close', () => {
    const { rerender } = render(<Preferences {...BASE} />)
    rerender(<Preferences {...BASE} open={false} />)
    expect(document.body.style.overflow).toBe('')
  })
})
