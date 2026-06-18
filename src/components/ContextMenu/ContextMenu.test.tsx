// src/components/ContextMenu/ContextMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu, useContextMenu } from './ContextMenu'
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

describe('ContextMenu — keyboard navigation', () => {
  it('Escape keydown calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Tab keydown calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the first item on open', () => {
    const items: MenuEntry[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'A' }))
  })

  it('ArrowDown moves focus to the next item; wraps at end', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, b, c] = screen.getAllByRole('menuitem')

    expect(document.activeElement).toBe(a)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(b)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(c)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })  // wraps
    expect(document.activeElement).toBe(a)
  })

  it('ArrowUp moves focus to the previous item; wraps at start', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, b] = screen.getAllByRole('menuitem')

    expect(document.activeElement).toBe(a)
    fireEvent.keyDown(menu, { key: 'ArrowUp' })   // wraps to b
    expect(document.activeElement).toBe(b)
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(a)
  })

  it('Home / End jump to first / last item', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, , c] = screen.getAllByRole('menuitem')

    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(c)
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(a)
  })
})

describe('ContextMenu — outside-click and portal containment', () => {
  it('mousedown outside the menu calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    fireEvent.mouseDown(outside)
    expect(onClose).toHaveBeenCalledTimes(1)
    document.body.removeChild(outside)
  })

  it('mousedown inside the portaled menu does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.mouseDown(screen.getByRole('menuitem', { name: 'A' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('flips left near right edge and up near bottom edge', () => {
    const origW = window.innerWidth
    const origH = window.innerHeight
    Object.defineProperty(window, 'innerWidth',  { value: 400, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true, writable: true })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 200, height: 150,
      top: 0, left: 0, right: 200, bottom: 150, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    // Anchor near right+bottom corner; menu should flip left and up
    render(
      <ContextMenu
        items={[{ id: 'a', label: 'A' }]}
        open
        x={390}
        y={280}
        onClose={vi.fn()}
      />
    )

    // Flip left: 390 + 200 + 4 = 594 > 400 → left = 390 - 200 = 190; clamp → 190
    // Flip up:  280 + 150 + 4 = 434 > 300 → top  = 280 - 150 = 130; clamp → 130
    const portalDiv = screen.getByRole('menu').parentElement!
    expect(portalDiv.style.left).toBe('190px')
    expect(portalDiv.style.top).toBe('130px')

    Object.defineProperty(window, 'innerWidth',  { value: origW, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: origH, configurable: true, writable: true })
    vi.restoreAllMocks()
  })

  it('returns focus to the previously focused element on close', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    expect(document.activeElement).toBe(button)

    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(document.activeElement).toBe(button)

    document.body.removeChild(button)
  })
})

describe('ContextMenu — useContextMenu hook', () => {
  it('onContextMenu event opens the menu at cursor coords', () => {
    function Wrapper() {
      const menu = useContextMenu()
      return (
        <>
          <div data-testid="surface" {...menu.triggerProps} />
          {menu.open && (
            <div data-testid="coords">{menu.x},{menu.y}</div>
          )}
        </>
      )
    }
    render(<Wrapper />)
    fireEvent.contextMenu(screen.getByTestId('surface'), { clientX: 42, clientY: 88 })
    expect(screen.getByTestId('coords').textContent).toBe('42,88')
  })
})
