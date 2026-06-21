// src/components/Preferences/Preferences.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',         label: 'Input' },
  { id: 'look-and-feel', label: 'Look and feel' },
  { id: 'shortcuts',     label: 'Shortcuts' },
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

  it('renders all section labels in the section select', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Look and feel')).toBeInTheDocument()
    expect(screen.getByText('Shortcuts')).toBeInTheDocument()
  })

  it('renders the children in the content region', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByTestId('panel-content')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('button', { name: 'Close preferences' })).toBeInTheDocument()
  })
})

// ── ARIA section select ───────────────────────────────────────────────────────

describe('Preferences — section select', () => {
  it('renders a combobox for section navigation', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders an option for each section', () => {
    render(<Preferences {...BASE} />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(SECTIONS.length)
  })

  it('active section option is selected in the dropdown', () => {
    render(<Preferences {...BASE} active="look-and-feel" />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('look-and-feel')
  })

  it('changing the section select calls onSelect with the section id', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'shortcuts' } })
    expect(onSelect).toHaveBeenCalledWith('shortcuts')
  })

  it('changing the section select does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'look-and-feel' } })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('content region is labelled by the active section name', () => {
    render(<Preferences {...BASE} active="shortcuts" />)
    expect(screen.getByRole('region', { name: /shortcuts/i })).toBeInTheDocument()
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

  it('Tab wraps from last focusable to first', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('Preferences — focus management', () => {
  it('focuses the section select on open', () => {
    render(<Preferences {...BASE} />)
    expect(document.activeElement).toBe(screen.getByRole('combobox'))
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
