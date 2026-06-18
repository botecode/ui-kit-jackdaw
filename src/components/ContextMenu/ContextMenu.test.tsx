// src/components/ContextMenu/ContextMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'
import type { MenuEntry } from './ContextMenu'

const ITEMS: MenuEntry[] = [
  { id: 'cut',    label: 'Cut'   },
  { id: 'copy',   label: 'Copy'  },
  { id: 'paste',  label: 'Paste' },
]

const BASE = { items: ITEMS, open: true, x: 100, y: 100, onClose: vi.fn() }

beforeEach(() => vi.clearAllMocks())

describe('ContextMenu — rendering', () => {
  it('renders role="menu" when open=true', () => {
    render(<ContextMenu {...BASE} />)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<ContextMenu {...BASE} open={false} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('regular items render as role="menuitem"', () => {
    render(<ContextMenu {...BASE} />)
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeInTheDocument()
  })

  it('separator renders as role="separator"', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 's', separator: true },
      { id: 'b', label: 'B' },
    ]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('disabled item has aria-disabled="true"', () => {
    const items: MenuEntry[] = [{ id: 'd', label: 'Delete', disabled: true }]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('menuitem', { name: 'Delete' }))
      .toHaveAttribute('aria-disabled', 'true')
  })

  it('checked item has role="menuitemcheckbox" and aria-checked="true"', () => {
    const items: MenuEntry[] = [{ id: 'c', label: 'Show Grid', checked: true }]
    render(<ContextMenu {...BASE} items={items} />)
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show Grid' })
    expect(item).toHaveAttribute('aria-checked', 'true')
  })

  it('danger item has data-danger attribute', () => {
    const items: MenuEntry[] = [{ id: 'del', label: 'Delete Track', danger: true }]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('menuitem', { name: 'Delete Track' }))
      .toHaveAttribute('data-danger')
  })

  it('clicking an item calls onSelect then onClose', () => {
    const onSelect = vi.fn()
    const onClose  = vi.fn()
    const items: MenuEntry[] = [{ id: 'a', label: 'Cut', onSelect }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking a disabled item calls neither onSelect nor onClose', () => {
    const onSelect = vi.fn()
    const onClose  = vi.fn()
    const items: MenuEntry[] = [{ id: 'a', label: 'Cut', onSelect, disabled: true }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
