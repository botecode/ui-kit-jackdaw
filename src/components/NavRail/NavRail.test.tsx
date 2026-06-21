// src/components/NavRail/NavRail.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import {
  PenNib, MusicNotes, Lightbulb, PuzzlePiece,
  ClockCounterClockwise, ChatText, GearSix,
} from '@phosphor-icons/react'
import { NavRail } from './NavRail'
import type { NavRailItem } from './NavRail'

const ITEMS: NavRailItem[] = [
  { id: 'write',    icon: PenNib,                  label: 'Write' },
  { id: 'arrange',  icon: MusicNotes,               label: 'Arrangement' },
  { id: 'ideas',    icon: Lightbulb,                label: 'Ideas' },
  { id: 'plugins',  icon: PuzzlePiece,              label: 'Plugins' },
  { id: 'versions', icon: ClockCounterClockwise,    label: 'Versions' },
  { id: 'comments', icon: ChatText,                 label: 'Comments', badge: 3 },
]

const FOOTER_ITEMS: NavRailItem[] = [
  { id: 'settings', icon: GearSix, label: 'Settings' },
]

function renderRail(overrides: Partial<React.ComponentProps<typeof NavRail>> = {}) {
  const onSelect = vi.fn()
  const utils = render(
    <NavRail
      items={ITEMS}
      footerItems={FOOTER_ITEMS}
      active="write"
      onSelect={onSelect}
      {...overrides}
    />,
  )
  return { ...utils, onSelect }
}

// ── Structure ──────────────────────────────────────────────────────────────────

describe('NavRail structure', () => {
  it('renders a nav landmark', () => {
    renderRail()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('uses the default aria-label', () => {
    renderRail()
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Primary navigation')
  })

  it('accepts a custom aria-label', () => {
    renderRail({ 'aria-label': 'App nav' })
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'App nav')
  })

  it('renders a button for each primary item', () => {
    renderRail()
    // badge items get a modified aria-label; match by label prefix via regex
    ITEMS.forEach(item => {
      expect(screen.getByRole('button', { name: new RegExp(`^${item.label}`) })).toBeInTheDocument()
    })
  })

  it('renders a button for each footer item', () => {
    renderRail()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })
})

// ── Active state ───────────────────────────────────────────────────────────────

describe('NavRail active state', () => {
  it('sets aria-current="page" on the active item', () => {
    renderRail({ active: 'arrange' })
    expect(screen.getByRole('button', { name: 'Arrangement' })).toHaveAttribute('aria-current', 'page')
  })

  it('sets data-active on the active button', () => {
    renderRail({ active: 'arrange' })
    expect(screen.getByRole('button', { name: 'Arrangement' })).toHaveAttribute('data-active')
  })

  it('does not set aria-current on inactive items', () => {
    renderRail({ active: 'write' })
    expect(screen.getByRole('button', { name: 'Arrangement' })).not.toHaveAttribute('aria-current')
  })

  it('does not set data-active on inactive buttons', () => {
    renderRail({ active: 'write' })
    expect(screen.getByRole('button', { name: 'Arrangement' })).not.toHaveAttribute('data-active')
  })
})

// ── onSelect ───────────────────────────────────────────────────────────────────

describe('NavRail onSelect', () => {
  it('calls onSelect with the item id when clicked', () => {
    const { onSelect } = renderRail()
    fireEvent.click(screen.getByRole('button', { name: 'Arrangement' }))
    expect(onSelect).toHaveBeenCalledWith('arrange')
  })

  it('calls onSelect when the active item is clicked again', () => {
    const { onSelect } = renderRail({ active: 'write' })
    fireEvent.click(screen.getByRole('button', { name: 'Write' }))
    expect(onSelect).toHaveBeenCalledWith('write')
  })

  it('calls onSelect with footer item id when footer button clicked', () => {
    const { onSelect } = renderRail()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onSelect).toHaveBeenCalledWith('settings')
  })
})

// ── Badge ──────────────────────────────────────────────────────────────────────

describe('NavRail badge', () => {
  it('includes badge count in aria-label when badge is a positive number', () => {
    renderRail()
    expect(screen.getByRole('button', { name: 'Comments, 3 unread' })).toBeInTheDocument()
  })

  it('includes "notification" in aria-label when badge is 0', () => {
    const items = ITEMS.map(i => i.id === 'comments' ? { ...i, badge: 0 } : i)
    renderRail({ items })
    expect(screen.getByRole('button', { name: 'Comments, notification' })).toBeInTheDocument()
  })

  it('uses plain label when no badge is set', () => {
    renderRail()
    expect(screen.getByRole('button', { name: 'Write' })).toBeInTheDocument()
  })

  it('shows 99+ text when badge exceeds 99', () => {
    const items = ITEMS.map(i => i.id === 'comments' ? { ...i, badge: 150 } : i)
    renderRail({ items })
    // The aria-label carries the real number; only the visual span caps at 99+
    expect(screen.getByRole('button', { name: 'Comments, 150 unread' })).toBeInTheDocument()
  })
})

// ── Collapsed ──────────────────────────────────────────────────────────────────

describe('NavRail collapsed', () => {
  it('sets data-collapsed on the nav when collapsed=true', () => {
    renderRail({ collapsed: true })
    expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed')
  })

  it('does not set data-collapsed when collapsed=false (default)', () => {
    renderRail()
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-collapsed')
  })

  it('still renders all buttons when collapsed', () => {
    renderRail({ collapsed: true })
    ITEMS.forEach(item => {
      expect(screen.getByRole('button', { name: new RegExp(`^${item.label}`) })).toBeInTheDocument()
    })
  })
})

// ── Keyboard navigation ────────────────────────────────────────────────────────

describe('NavRail keyboard navigation', () => {
  it('moves focus to next item on ArrowDown', () => {
    renderRail()
    const writeBtn   = screen.getByRole('button', { name: 'Write' })
    const arrangeBtn = screen.getByRole('button', { name: 'Arrangement' })
    writeBtn.focus()
    fireEvent.keyDown(writeBtn, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(arrangeBtn)
  })

  it('moves focus to previous item on ArrowUp', () => {
    renderRail()
    const arrangeBtn = screen.getByRole('button', { name: 'Arrangement' })
    const writeBtn   = screen.getByRole('button', { name: 'Write' })
    arrangeBtn.focus()
    fireEvent.keyDown(arrangeBtn, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(writeBtn)
  })

  it('wraps ArrowDown from last to first item', () => {
    renderRail()
    const commentsBtn = screen.getByRole('button', { name: /^Comments/ })
    const writeBtn    = screen.getByRole('button', { name: 'Write' })
    commentsBtn.focus()
    fireEvent.keyDown(commentsBtn, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(writeBtn)
  })

  it('wraps ArrowUp from first to last item', () => {
    renderRail()
    const writeBtn    = screen.getByRole('button', { name: 'Write' })
    const commentsBtn = screen.getByRole('button', { name: /^Comments/ })
    writeBtn.focus()
    fireEvent.keyDown(writeBtn, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(commentsBtn)
  })

  it('does not change focus on unrelated keys', () => {
    renderRail()
    const writeBtn = screen.getByRole('button', { name: 'Write' })
    writeBtn.focus()
    fireEvent.keyDown(writeBtn, { key: 'Enter' })
    expect(document.activeElement).toBe(writeBtn)
  })
})

// ── Empty state ────────────────────────────────────────────────────────────────

describe('NavRail empty state', () => {
  it('renders without crashing when items is empty', () => {
    renderRail({ items: [] })
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('still renders footer items when primary items is empty', () => {
    renderRail({ items: [] })
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })
})
