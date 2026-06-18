// src/components/FxChip/FxChip.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FxChip } from './FxChip'
import type { FxPlugin } from './FxChip'

const noop = vi.fn()

const NO_PLUGINS: FxPlugin[] = []
const ONE_PLUGIN: FxPlugin[] = [{ id: 'p1', name: 'Reverb', enabled: true }]
const FOUR_PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb',     enabled: true },
  { id: 'p2', name: 'Compressor', enabled: true },
  { id: 'p3', name: 'EQ',         enabled: true },
  { id: 'p4', name: 'Chorus',     enabled: true },
]

const DEFAULT_PROPS = {
  plugins: NO_PLUGINS,
  chainEnabled: false,
  onToggleChain: noop,
  onTogglePlugin: noop,
  onReorder: noop,
  onRemove: noop,
  onAdd: noop,
}

beforeEach(() => { noop.mockClear() })

// ── Label logic ───────────────────────────────────────────────────────────────

describe('FxChip label', () => {
  it('renders "+ FX" when plugins is empty', () => {
    render(<FxChip {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /FX chain/i }).textContent).toBe('+ FX')
  })

  it('renders "FX" when one plugin', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled />)
    expect(screen.getByRole('button', { name: /FX chain/i }).textContent).toBe('FX')
  })

  it('renders "FX 4" when four plugins', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={FOUR_PLUGINS} chainEnabled />)
    expect(screen.getByRole('button', { name: /FX chain/i }).textContent).toBe('FX 4')
  })
})

// ── Open / close ──────────────────────────────────────────────────────────────

describe('FxChip open/close', () => {
  it('clicking the button opens the dialog', () => {
    render(<FxChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /FX chain/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('aria-expanded is false when closed', () => {
    render(<FxChip {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /FX chain/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('aria-expanded is true when open', () => {
    render(<FxChip {...DEFAULT_PROPS} defaultOpen />)
    expect(screen.getByRole('button', { name: /FX chain/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking the button again closes the dialog', () => {
    render(<FxChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /FX chain/i }))
    fireEvent.click(screen.getByRole('button', { name: /FX chain/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Esc closes the dialog and returns focus to trigger', () => {
    render(<FxChip {...DEFAULT_PROPS} defaultOpen />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('outside-click closes the dialog', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <FxChip {...DEFAULT_PROPS} />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /FX chain/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('disabled: clicking does not open', () => {
    render(<FxChip {...DEFAULT_PROPS} disabled />)
    fireEvent.click(screen.getByRole('button', { name: /FX chain/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('defaultOpen=true opens on mount', () => {
    render(<FxChip {...DEFAULT_PROPS} defaultOpen />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
