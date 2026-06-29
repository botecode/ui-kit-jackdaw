// src/components/Dialog/Dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from './Dialog'
import { ThemeProvider } from '../../theme/ThemeProvider'

const BASE = {
  open: true as const,
  onClose: vi.fn(),
  title: 'Confirm',
  children: <p>Are you sure?</p>,
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Dialog — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<Dialog {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<Dialog {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has aria-modal="true"', () => {
    render(<Dialog {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('sets aria-labelledby pointing to the title element', () => {
    render(<Dialog {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = document.getElementById(labelledBy!)
    expect(titleEl?.textContent).toBe('Confirm')
  })

  // The dialog escapes its themed subtree (portal), so the tokens must be
  // re-declared at the portal root or var(--accent) & co. resolve to nothing.
  it('re-declares the opening theme tokens at the portal root', () => {
    render(
      <ThemeProvider theme="bowie">
        <Dialog {...BASE} />
      </ThemeProvider>,
    )
    const wrapper = screen.getByRole('dialog').closest('[data-theme]') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.getAttribute('data-theme')).toBe('bowie')
    expect(wrapper.style.getPropertyValue('--accent')).toBe('#ef2b3d')
  })

  it('falls back to the default theme when opened with no ThemeProvider ancestor', () => {
    render(<Dialog {...BASE} />)
    const wrapper = screen.getByRole('dialog').closest('[data-theme]') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.getAttribute('data-theme')).toBe('chroma')
    expect(wrapper.style.getPropertyValue('--accent')).not.toBe('')
  })

  it('uses aria-label when no title is provided', () => {
    render(
      <Dialog open onClose={vi.fn()} aria-label="Unnamed dialog">
        {null}
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Unnamed dialog')
  })

  it('renders children in the body', () => {
    render(<Dialog {...BASE} />)
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders actions in the footer when provided', () => {
    render(<Dialog {...BASE} actions={<button>Cancel</button>} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('applies data-size="sm" for sm size', () => {
    render(<Dialog {...BASE} size="sm" />)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'sm')
  })

  it('applies data-size="md" for md size (default)', () => {
    render(<Dialog {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'md')
  })

  it('forwards style to the dialog element', () => {
    render(<Dialog {...BASE} style={{ width: '720px' }} />)
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '720px' })
  })
})

// ── Keyboard ──────────────────────────────────────────────────────────────────

describe('Dialog — keyboard', () => {
  it('Escape calls onClose', () => {
    const onClose = vi.fn()
    render(<Dialog {...BASE} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape does NOT call onClose when dialog is closed', () => {
    const onClose = vi.fn()
    render(<Dialog {...BASE} open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Tab wraps from last focusable to first', () => {
    render(
      <Dialog
        {...BASE}
        actions={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      />,
    )
    const buttons = screen.getAllByRole('button')
    buttons[buttons.length - 1].focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(buttons[0])
  })

  it('Shift+Tab wraps from first focusable to last', () => {
    render(
      <Dialog
        {...BASE}
        actions={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      />,
    )
    const buttons = screen.getAllByRole('button')
    buttons[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(buttons[buttons.length - 1])
  })
})

// ── Scrim behavior ────────────────────────────────────────────────────────────

describe('Dialog — scrim behavior', () => {
  it('clicking the scrim calls onClose when dismissible (default)', () => {
    const onClose = vi.fn()
    render(<Dialog {...BASE} onClose={onClose} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the scrim does NOT call onClose when dismissible=false', () => {
    const onClose = vi.fn()
    render(<Dialog {...BASE} onClose={onClose} dismissible={false} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking inside the dialog does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Dialog {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('Dialog — focus management', () => {
  it('focuses the first focusable element on open', () => {
    render(
      <Dialog
        {...BASE}
        actions={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      />,
    )
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
  })

  it('returns focus to the previously focused element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(<Dialog {...BASE} />)
    rerender(<Dialog {...BASE} open={false} />)

    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })
})

// ── Scroll lock ───────────────────────────────────────────────────────────────

describe('Dialog — body scroll lock', () => {
  it('sets body overflow:hidden while open', () => {
    render(<Dialog {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow to empty string on close', () => {
    const { rerender } = render(<Dialog {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Dialog {...BASE} open={false} />)
    expect(document.body.style.overflow).toBe('')
  })
})
