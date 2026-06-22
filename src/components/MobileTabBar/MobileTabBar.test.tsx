// src/components/MobileTabBar/MobileTabBar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { MobileTabBar, MOBILE_TABS } from './MobileTabBar'

function renderBar(overrides: Partial<React.ComponentProps<typeof MobileTabBar>> = {}) {
  const onSelect = vi.fn()
  const utils = render(
    <MobileTabBar
      tabs={MOBILE_TABS}
      active="record"
      onSelect={onSelect}
      {...overrides}
    />,
  )
  return { ...utils, onSelect }
}

// ── Structure ──────────────────────────────────────────────────────────────────

describe('MobileTabBar structure', () => {
  it('renders a nav landmark', () => {
    renderBar()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('uses the default aria-label', () => {
    renderBar()
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Primary')
  })

  it('accepts a custom aria-label', () => {
    renderBar({ 'aria-label': 'Sections' })
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Sections')
  })

  it('renders a button for each tab with its label as the accessible name', () => {
    renderBar()
    MOBILE_TABS.forEach(tab => {
      expect(screen.getByRole('button', { name: tab.label })).toBeInTheDocument()
    })
  })

  it('renders exactly one button per tab', () => {
    renderBar()
    expect(screen.getAllByRole('button')).toHaveLength(MOBILE_TABS.length)
  })

  it('exposes the canonical four destinations in order', () => {
    expect(MOBILE_TABS.map(t => t.id)).toEqual(['record', 'write', 'nest', 'radio'])
  })

  it('passes the tab count to the row for the grid template', () => {
    const { container } = renderBar()
    const row = container.querySelector('[style*="--tab-count"]') as HTMLElement
    expect(row.style.getPropertyValue('--tab-count')).toBe('4')
  })
})

// ── Active state / current ───────────────────────────────────────────────────────

describe('MobileTabBar active state', () => {
  it('marks the active tab with aria-current="page"', () => {
    renderBar({ active: 'write' })
    expect(screen.getByRole('button', { name: 'Write' })).toHaveAttribute('aria-current', 'page')
  })

  it('sets data-active on the active button', () => {
    renderBar({ active: 'write' })
    expect(screen.getByRole('button', { name: 'Write' })).toHaveAttribute('data-active')
  })

  it('does not set aria-current on inactive tabs', () => {
    renderBar({ active: 'record' })
    expect(screen.getByRole('button', { name: 'Write' })).not.toHaveAttribute('aria-current')
  })

  it('does not set data-active on inactive tabs', () => {
    renderBar({ active: 'record' })
    expect(screen.getByRole('button', { name: 'Write' })).not.toHaveAttribute('data-active')
  })

  it('marks exactly one tab current at a time', () => {
    renderBar({ active: 'nest' })
    const current = screen.getAllByRole('button').filter(b => b.getAttribute('aria-current') === 'page')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAccessibleName('Nest')
  })
})

// ── Moving lit indicator ─────────────────────────────────────────────────────────

describe('MobileTabBar indicator', () => {
  function indicator(container: HTMLElement) {
    return container.querySelector('[style*="--active-index"]') as HTMLElement
  }

  it('positions the indicator at the active tab index', () => {
    const { container } = renderBar({ active: 'nest' }) // index 2
    expect(indicator(container).style.getPropertyValue('--active-index')).toBe('2')
  })

  it('moves the indicator when the active tab changes', () => {
    const { container, rerender } = renderBar({ active: 'record' }) // index 0
    expect(indicator(container).style.getPropertyValue('--active-index')).toBe('0')
    rerender(<MobileTabBar tabs={MOBILE_TABS} active="radio" onSelect={() => {}} />) // index 3
    expect(indicator(container).style.getPropertyValue('--active-index')).toBe('3')
  })

  it('shows the indicator when a tab matches active', () => {
    const { container } = renderBar({ active: 'record' })
    expect(indicator(container)).toHaveAttribute('data-visible')
  })

  it('hides the indicator when active matches no tab', () => {
    const { container } = renderBar({ active: 'nope' })
    expect(indicator(container)).not.toHaveAttribute('data-visible')
  })

  it('clamps the indicator index to 0 when active matches no tab', () => {
    const { container } = renderBar({ active: 'nope' })
    expect(indicator(container).style.getPropertyValue('--active-index')).toBe('0')
  })
})

// ── Tab switching (onSelect) ─────────────────────────────────────────────────────

describe('MobileTabBar tab switching', () => {
  it('calls onSelect with the tapped tab id', () => {
    const { onSelect } = renderBar({ active: 'record' })
    fireEvent.click(screen.getByRole('button', { name: 'Write' }))
    expect(onSelect).toHaveBeenCalledWith('write')
  })

  it('calls onSelect for every tab', () => {
    const { onSelect } = renderBar()
    MOBILE_TABS.forEach(tab => {
      fireEvent.click(screen.getByRole('button', { name: tab.label }))
      expect(onSelect).toHaveBeenLastCalledWith(tab.id)
    })
  })

  it('still fires onSelect when the already-active tab is tapped', () => {
    const { onSelect } = renderBar({ active: 'record' })
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onSelect).toHaveBeenCalledWith('record')
  })
})

// ── Keyboard navigation ──────────────────────────────────────────────────────────

describe('MobileTabBar keyboard navigation', () => {
  it('moves focus to the next tab on ArrowRight', () => {
    renderBar()
    const record = screen.getByRole('button', { name: 'Record' })
    const write  = screen.getByRole('button', { name: 'Write' })
    record.focus()
    fireEvent.keyDown(record, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(write)
  })

  it('moves focus to the previous tab on ArrowLeft', () => {
    renderBar()
    const write  = screen.getByRole('button', { name: 'Write' })
    const record = screen.getByRole('button', { name: 'Record' })
    write.focus()
    fireEvent.keyDown(write, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(record)
  })

  it('wraps ArrowRight from the last tab to the first', () => {
    renderBar()
    const radio  = screen.getByRole('button', { name: 'Radio' })
    const record = screen.getByRole('button', { name: 'Record' })
    radio.focus()
    fireEvent.keyDown(radio, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(record)
  })

  it('wraps ArrowLeft from the first tab to the last', () => {
    renderBar()
    const record = screen.getByRole('button', { name: 'Record' })
    const radio  = screen.getByRole('button', { name: 'Radio' })
    record.focus()
    fireEvent.keyDown(record, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(radio)
  })

  it('jumps focus to the first tab on Home', () => {
    renderBar()
    const radio  = screen.getByRole('button', { name: 'Radio' })
    const record = screen.getByRole('button', { name: 'Record' })
    radio.focus()
    fireEvent.keyDown(radio, { key: 'Home' })
    expect(document.activeElement).toBe(record)
  })

  it('jumps focus to the last tab on End', () => {
    renderBar()
    const record = screen.getByRole('button', { name: 'Record' })
    const radio  = screen.getByRole('button', { name: 'Radio' })
    record.focus()
    fireEvent.keyDown(record, { key: 'End' })
    expect(document.activeElement).toBe(radio)
  })

  it('does not move focus on unrelated keys', () => {
    renderBar()
    const record = screen.getByRole('button', { name: 'Record' })
    record.focus()
    fireEvent.keyDown(record, { key: 'Enter' })
    expect(document.activeElement).toBe(record)
  })

  it('skips a disabled tab when roving with ArrowRight', () => {
    const tabs = MOBILE_TABS.map(t => t.id === 'write' ? { ...t, disabled: true } : t)
    renderBar({ tabs })
    const record = screen.getByRole('button', { name: 'Record' })
    const nest   = screen.getByRole('button', { name: 'Nest' })
    record.focus()
    fireEvent.keyDown(record, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(nest)
  })
})

// ── Disabled tab ──────────────────────────────────────────────────────────────────

describe('MobileTabBar disabled tab', () => {
  function disabledTabs() {
    return MOBILE_TABS.map(t => t.id === 'radio' ? { ...t, disabled: true } : t)
  }

  it('renders a disabled tab as a disabled button', () => {
    renderBar({ tabs: disabledTabs() })
    expect(screen.getByRole('button', { name: 'Radio' })).toBeDisabled()
  })

  it('does not fire onSelect when a disabled tab is clicked', () => {
    const { onSelect } = renderBar({ tabs: disabledTabs() })
    fireEvent.click(screen.getByRole('button', { name: 'Radio' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('leaves enabled tabs interactive', () => {
    const { onSelect } = renderBar({ tabs: disabledTabs() })
    fireEvent.click(screen.getByRole('button', { name: 'Write' }))
    expect(onSelect).toHaveBeenCalledWith('write')
  })
})

// ── Size ─────────────────────────────────────────────────────────────────────────

describe('MobileTabBar size', () => {
  it('defaults to data-size="md"', () => {
    renderBar()
    expect(screen.getByRole('navigation')).toHaveAttribute('data-size', 'md')
  })

  it('applies data-size="sm" when size="sm"', () => {
    renderBar({ size: 'sm' })
    expect(screen.getByRole('navigation')).toHaveAttribute('data-size', 'sm')
  })
})

// ── Empty ────────────────────────────────────────────────────────────────────────

describe('MobileTabBar empty', () => {
  it('renders the landmark with no buttons when tabs is empty', () => {
    renderBar({ tabs: [] })
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
