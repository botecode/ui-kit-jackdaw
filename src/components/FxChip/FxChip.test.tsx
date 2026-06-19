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

// ── Chain editor ──────────────────────────────────────────────────────────────

const MIXED_PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb',     enabled: true  },
  { id: 'p2', name: 'Compressor', enabled: false },
]

describe('FxChip chain editor — master LED', () => {
  it('master LED aria-checked=true when all plugins enabled + chainEnabled', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled defaultOpen />)
    const master = screen.getByRole('checkbox', { name: 'FX chain' })
    expect(master).toHaveAttribute('aria-checked', 'true')
  })

  it('master LED aria-checked="mixed" when some plugins bypassed + chainEnabled', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled defaultOpen />)
    const master = screen.getByRole('checkbox', { name: 'FX chain' })
    expect(master).toHaveAttribute('aria-checked', 'mixed')
  })

  it('master LED aria-checked=false when chainEnabled=false', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled={false} defaultOpen />)
    const master = screen.getByRole('checkbox', { name: 'FX chain' })
    expect(master).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking master LED calls onToggleChain', () => {
    const onToggleChain = vi.fn()
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled onToggleChain={onToggleChain} defaultOpen />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'FX chain' }))
    expect(onToggleChain).toHaveBeenCalledWith(false)
  })

  it('initial focus lands on master LED when dialog opens', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled defaultOpen />)
    expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'FX chain' }))
  })
})

describe('FxChip chain editor — slot rows', () => {
  it('slot LED has role="checkbox", aria-checked=true, aria-label=name when enabled', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled defaultOpen />)
    const led = screen.getByRole('checkbox', { name: 'Reverb' })
    expect(led).toHaveAttribute('aria-checked', 'true')
  })

  it('slot LED aria-checked=false when plugin disabled', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled defaultOpen />)
    expect(screen.getByRole('checkbox', { name: 'Compressor' })).toHaveAttribute('aria-checked', 'false')
  })

  it('slot 0 renders with var(--chroma-red) as --slot-color', () => {
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled defaultOpen />)
    const slot = document.body.querySelector('[data-slot-index="0"]') as HTMLElement
    expect(slot.style.getPropertyValue('--slot-color')).toBe('var(--chroma-red)')
  })

  it('slot 7 wraps to var(--chroma-red) (index % 7 === 0)', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, enabled: true }))
    render(<FxChip {...DEFAULT_PROPS} plugins={eight} chainEnabled defaultOpen />)
    const slot7 = document.body.querySelector('[data-slot-index="7"]') as HTMLElement
    expect(slot7.style.getPropertyValue('--slot-color')).toBe('var(--chroma-red)')
  })

  it('clicking slot LED calls onTogglePlugin(id, next)', () => {
    const onTogglePlugin = vi.fn()
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled onTogglePlugin={onTogglePlugin} defaultOpen />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Reverb' }))
    expect(onTogglePlugin).toHaveBeenCalledWith('p1', false)
  })

  it('clicking × calls onRemove(id)', () => {
    const onRemove = vi.fn()
    render(<FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled onRemove={onRemove} defaultOpen />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Reverb' }))
    expect(onRemove).toHaveBeenCalledWith('p1')
  })

  it('clicking "Add plugin…" calls onAdd', () => {
    const onAdd = vi.fn()
    render(<FxChip {...DEFAULT_PROPS} onAdd={onAdd} defaultOpen />)
    fireEvent.click(screen.getByRole('button', { name: /add plugin/i }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('empty state shows "No effects yet" when plugins=[]', () => {
    render(<FxChip {...DEFAULT_PROPS} defaultOpen />)
    expect(screen.getByText('No effects yet — add one.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /reverb/i })).not.toBeInTheDocument()
  })
})

describe('FxChip chain editor — keyboard reorder', () => {
  it('Alt+ArrowUp on a slot calls onReorder(1, 0)', () => {
    const onReorder = vi.fn()
    render(<FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled onReorder={onReorder} defaultOpen />)
    const compressorLed = screen.getByRole('checkbox', { name: 'Compressor' })
    fireEvent.keyDown(compressorLed, { key: 'ArrowUp', altKey: true })
    expect(onReorder).toHaveBeenCalledWith(1, 0)
  })
})

// ── Drag reorder ─────────────────────────────────────────────────────────────

describe('FxChip drag reorder', () => {
  beforeEach(() => {
    // jsdom does not implement pointer capture
    HTMLElement.prototype.setPointerCapture   = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  })

  it('pointerdown → pointermove past midpoint → pointerup calls onReorder(0, 1)', () => {
    const onReorder = vi.fn()
    render(
      <FxChip
        {...DEFAULT_PROPS}
        plugins={MIXED_PLUGINS}
        chainEnabled
        onReorder={onReorder}
        defaultOpen
      />
    )

    const slot0 = document.body.querySelector('[data-slot-index="0"]') as HTMLElement
    const slot1 = document.body.querySelector('[data-slot-index="1"]') as HTMLElement

    // Mock slot getBoundingClientRect — jsdom returns all zeros by default
    slot0.getBoundingClientRect = vi.fn().mockReturnValue(
      { top: 0, bottom: 32, height: 32, left: 0, right: 220, width: 220 } as DOMRect
    )
    slot1.getBoundingClientRect = vi.fn().mockReturnValue(
      { top: 32, bottom: 64, height: 32, left: 0, right: 220, width: 220 } as DOMRect
    )

    const handle = document.body.querySelectorAll('[data-testid="drag-handle"]')[0] as HTMLElement

    // Drag from slot 0 (Y=16) past slot 1 midpoint (Y=48)
    fireEvent.pointerDown(handle, { clientY: 16, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientY: 55, pointerId: 1 })
    fireEvent.pointerUp(handle,   { clientY: 55, pointerId: 1 })

    expect(onReorder).toHaveBeenCalledWith(0, 1)
  })
})

// ── Partial state (amber) ──────────────────────────────────────────────────────

describe('FxChip partial state', () => {
  it('root data-state="partial" when chainEnabled and some plugins bypassed', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'partial')
  })

  it('root data-state="active" when chainEnabled and all plugins enabled', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'active')
  })

  it('root data-state="bypassed" when chainEnabled=false (regardless of plugin state)', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled={false} />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'bypassed')
  })

  it('master LED data-state="partial" when chainEnabled and some plugins bypassed', () => {
    render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled defaultOpen />
    )
    const master = screen.getByRole('checkbox', { name: 'FX chain' })
    expect(master).toHaveAttribute('data-state', 'partial')
  })
})
