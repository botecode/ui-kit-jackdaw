// src/components/WorkspaceSwitcher/WorkspaceSwitcher.test.tsx
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import type { WorkspaceSummary } from './WorkspaceSwitcher'

const CSS = readFileSync('src/components/WorkspaceSwitcher/WorkspaceSwitcher.module.css', 'utf8')

const WORKSPACES: WorkspaceSummary[] = [
  { id: 'w1', name: 'Debut EP', type: 'Band', colour: '#EE5E2A' },
  { id: 'w2', name: 'B-sides',  type: 'Solo' },
  { id: 'w3', name: 'Live takes' },
]

function setup(over: Partial<React.ComponentProps<typeof WorkspaceSwitcher>> = {}) {
  const props = {
    workspaces:     WORKSPACES,
    activeId:       'w1',
    userName:       'Fernando',
    onSwitch:       vi.fn(),
    onNewWorkspace: vi.fn(),
    onOpenSettings: vi.fn(),
    ...over,
  }
  const utils = render(<WorkspaceSwitcher {...props} />)
  return { ...utils, props }
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /switch workspace/i }))
  return screen.getByRole('menu', { name: 'Switch workspace' })
}

beforeEach(() => vi.clearAllMocks())

// ── Trigger (the resting identity plate) ────────────────────────────────────────

describe('WorkspaceSwitcher — trigger', () => {
  it('shows the active workspace name and the user name', () => {
    setup()
    const trigger = screen.getByRole('button', { name: /switch workspace/i })
    expect(trigger).toHaveTextContent('Debut EP')
    expect(trigger).toHaveTextContent('Fernando')
  })

  it('falls back to a placeholder name when the active id is unknown', () => {
    setup({ activeId: 'nope' })
    // Accessible name still composes without throwing.
    expect(screen.getByRole('button', { name: /switch workspace/i })).toBeInTheDocument()
  })

  it('advertises a menu popup that is collapsed at rest', () => {
    setup()
    const trigger = screen.getByRole('button', { name: /switch workspace/i })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('honours a custom aria-label', () => {
    setup({ 'aria-label': 'Choose studio' })
    expect(screen.getByRole('button', { name: 'Choose studio' })).toBeInTheDocument()
  })
})

// ── Opening the menu ────────────────────────────────────────────────────────────

describe('WorkspaceSwitcher — menu', () => {
  it('is closed until the trigger is clicked', () => {
    setup()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens on click and flips aria-expanded', () => {
    setup()
    const trigger = screen.getByRole('button', { name: /switch workspace/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('menu', { name: 'Switch workspace' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens on ArrowDown from the trigger', () => {
    setup()
    const trigger = screen.getByRole('button', { name: /switch workspace/i })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('lists every workspace as a radio item', () => {
    setup()
    openMenu()
    for (const w of WORKSPACES) {
      expect(screen.getByRole('menuitemradio', { name: new RegExp(w.name) })).toBeInTheDocument()
    }
  })

  it('marks the active workspace with aria-checked and no other', () => {
    setup()
    openMenu()
    expect(screen.getByRole('menuitemradio', { name: /Debut EP/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: /B-sides/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('renders New workspace and Settings as menu commands', () => {
    setup()
    openMenu()
    expect(screen.getByRole('menuitem', { name: 'New workspace' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows the workspace type as secondary text in the row', () => {
    setup()
    const menu = openMenu()
    expect(within(menu).getByText('Band')).toBeInTheDocument()
  })

  it('shows an empty state when there are no workspaces', () => {
    setup({ workspaces: [], activeId: '' })
    openMenu()
    expect(screen.getByText(/no workspaces yet/i)).toBeInTheDocument()
  })
})

// ── Intents ─────────────────────────────────────────────────────────────────────

describe('WorkspaceSwitcher — intents', () => {
  it('fires onSwitch with the id when a workspace is chosen', () => {
    const { props } = setup()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /B-sides/ }))
    expect(props.onSwitch).toHaveBeenCalledWith('w2')
  })

  it('closes the menu after switching', () => {
    setup()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Live takes/ }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('fires onNewWorkspace', () => {
    const { props } = setup()
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'New workspace' }))
    expect(props.onNewWorkspace).toHaveBeenCalledTimes(1)
  })

  it('fires onOpenSettings', () => {
    const { props } = setup()
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Settings' }))
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1)
  })
})

// ── Keyboard roving ─────────────────────────────────────────────────────────────

describe('WorkspaceSwitcher — keyboard', () => {
  it('focuses the active workspace when the menu opens', () => {
    setup()
    openMenu()
    expect(screen.getByRole('menuitemradio', { name: /Debut EP/ })).toHaveFocus()
  })

  it('ArrowDown moves focus to the next entry', () => {
    setup()
    const menu = openMenu()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitemradio', { name: /B-sides/ })).toHaveFocus()
  })

  it('End jumps to the last command (Settings)', () => {
    setup()
    const menu = openMenu()
    fireEvent.keyDown(menu, { key: 'End' })
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveFocus()
  })

  it('ArrowUp from the first entry wraps to the last', () => {
    setup()
    const menu = openMenu()
    fireEvent.keyDown(menu, { key: 'Home' })
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveFocus()
  })

  it('Tab closes the menu and returns focus to the trigger', () => {
    setup()
    const menu = openMenu()
    fireEvent.keyDown(menu, { key: 'Tab' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /switch workspace/i })).toHaveFocus()
  })
})

// ── Calm-paper styling guarantees (authored CSS) ─────────────────────────────────

describe('WorkspaceSwitcher — calm-paper guarantees', () => {
  it('paints the dropdown on the themed menu surface, not the dark stage well', () => {
    expect(CSS).toMatch(/\.menu\s*{[^}]*background:\s*var\(--menu-bg\)/)
    expect(CSS).not.toMatch(/var\(--stage\b/)
  })

  it('uses the accent for the active workspace spine', () => {
    expect(CSS).toMatch(/\.item\[data-active\]::before[\s\S]*var\(--accent\)/)
  })

  it('hardcodes no hex colours (tokens only)', () => {
    const hexes = CSS.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    expect(hexes).toEqual([])
  })
})
