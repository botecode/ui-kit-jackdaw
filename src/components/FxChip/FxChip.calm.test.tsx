import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { FxChipCalm } from './FxChip.calm'
import type { FxPlugin } from './FxChip'

const PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb', enabled: true },
  { id: 'p2', name: 'Compressor', enabled: true },
]

const handlers = {
  onToggleChain: vi.fn(),
  onTogglePlugin: vi.fn(),
  onReorder: vi.fn(),
  onRemove: vi.fn(),
  onAdd: vi.fn(),
  onOpenPlugin: vi.fn(),
}

describe('FxChipCalm', () => {
  it('labels the chip by plugin count and exposes a dialog trigger', () => {
    const { container } = render(
      <FxChipCalm plugins={PLUGINS} chainEnabled {...handlers} />,
    )
    const button = screen.getByRole('button', { name: 'FX chain' })
    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByText('FX 2')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-state', 'active')
  })

  it('reflects a partially-bypassed chain on the state dot', () => {
    const { container } = render(
      <FxChipCalm
        plugins={[{ id: 'p1', name: 'Reverb', enabled: false }, PLUGINS[1]]}
        chainEnabled
        {...handlers}
      />,
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'partial')
  })

  it('opens the shared ChainEditor with the plugin slots', () => {
    render(<FxChipCalm plugins={PLUGINS} chainEnabled {...handlers} />)
    fireEvent.click(screen.getByRole('button', { name: 'FX chain' }))
    expect(screen.getByRole('dialog', { name: 'FX chain' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Reverb' })).toBeInTheDocument()
  })
})
