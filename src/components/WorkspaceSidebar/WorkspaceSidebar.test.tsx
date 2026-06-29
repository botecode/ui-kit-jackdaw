// src/components/WorkspaceSidebar/WorkspaceSidebar.test.tsx
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { WorkspaceSidebar, HOME_ID } from './WorkspaceSidebar'
import type { WorkspaceSong, WorkspaceCollection } from './WorkspaceSidebar'

// Vitest stubs CSS (css:false), so we read the authored stylesheet directly to
// lock the CALM PAPER decision at its source: the sidebar paints on --rail-bg
// and never reaches for the dark --stage well or an LED bloom (that vocabulary
// belongs to the hardware controls, not this content chrome).
const CARD_CSS = readFileSync('src/components/WorkspaceSidebar/WorkspaceSidebar.module.css', 'utf8')

const SONGS: WorkspaceSong[] = [
  { id: 's1', title: 'Paper Boats',     colour: '#EE5E2A' },
  { id: 's2', title: 'Slow Tide',       colour: '#46A147' },
  { id: 's3', title: 'Northern Lights', colour: '#3C7DD9' },
  { id: 's4', title: 'Untitled sketch' },
]

const COLLECTIONS: WorkspaceCollection[] = [
  { id: 'c1', title: 'B-sides' },
  { id: 'c2', title: 'Live takes' },
]

function setup(overrides: Partial<React.ComponentProps<typeof WorkspaceSidebar>> = {}) {
  const props = {
    active:       HOME_ID,
    songs:        SONGS,
    collections:  COLLECTIONS,
    onSelect:     vi.fn(),
    onSearch:     vi.fn(),
    onNewSong:    vi.fn(),
    onImportSong: vi.fn(),
    ...overrides,
  }
  render(<WorkspaceSidebar {...props} />)
  return props
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('WorkspaceSidebar — rendering', () => {
  it('renders a nav landmark with the default aria-label', () => {
    setup()
    expect(screen.getByRole('navigation', { name: 'Library' })).toBeInTheDocument()
  })

  it('honours a custom aria-label', () => {
    setup({ 'aria-label': 'My songs' })
    expect(screen.getByRole('navigation', { name: 'My songs' })).toBeInTheDocument()
  })

  it('renders Home, every song, and every collection', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    for (const s of SONGS) expect(screen.getByRole('button', { name: s.title })).toBeInTheDocument()
    for (const c of COLLECTIONS) expect(screen.getByRole('button', { name: c.title })).toBeInTheDocument()
  })

  it('renders the SONGS and COLLECTIONS group labels', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Songs' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Collections' })).toBeInTheDocument()
  })

  it('renders the search field', () => {
    setup()
    expect(screen.getByRole('searchbox', { name: 'Search library' })).toBeInTheDocument()
  })

  it('renders the search field on the calm paper surface (not the dark stage well)', () => {
    setup()
    // The shared TextField carries its surface vocabulary on the root wrapper via
    // data-tone. On the paper sidebar the field must wear the light "surface" face,
    // never the default dark "stage" well (hardware-control vocabulary).
    const search = screen.getByRole('searchbox', { name: 'Search library' })
    const tfRoot = search.closest('[data-tone]')
    expect(tfRoot).toHaveAttribute('data-tone', 'surface')
  })

  it('renders New song + Import song footer actions', () => {
    setup()
    expect(screen.getByRole('button', { name: 'New song' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import song' })).toBeInTheDocument()
  })
})

// ── Selection ─────────────────────────────────────────────────────────────────

describe('WorkspaceSidebar — selection', () => {
  it('fires onSelect with HOME_ID when Home is clicked', () => {
    const { onSelect } = setup({ active: 's1' })
    fireEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(onSelect).toHaveBeenCalledWith(HOME_ID)
  })

  it('fires onSelect with the song id when a song is clicked', () => {
    const { onSelect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Slow Tide' }))
    expect(onSelect).toHaveBeenCalledWith('s2')
  })

  it('fires onSelect with the collection id when a collection is clicked', () => {
    const { onSelect } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Live takes' }))
    expect(onSelect).toHaveBeenCalledWith('c2')
  })

  it('marks the active row with aria-current="page" and no other', () => {
    setup({ active: 's3' })
    const active = screen.getByRole('button', { name: 'Northern Lights' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('does not use a contradictory aria-selected/option model (nav, not listbox)', () => {
    setup({ active: 's1' })
    const active = screen.getByRole('button', { name: 'Paper Boats' })
    expect(active).not.toHaveAttribute('aria-selected')
    expect(active).not.toHaveAttribute('role', 'option')
  })
})

// ── Footer actions ────────────────────────────────────────────────────────────

describe('WorkspaceSidebar — footer actions', () => {
  it('fires onNewSong', () => {
    const { onNewSong } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'New song' }))
    expect(onNewSong).toHaveBeenCalledTimes(1)
  })

  it('fires onImportSong', () => {
    const { onImportSong } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Import song' }))
    expect(onImportSong).toHaveBeenCalledTimes(1)
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

describe('WorkspaceSidebar — search', () => {
  it('echoes each keystroke to onSearch', () => {
    const { onSearch } = setup()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search library' }), {
      target: { value: 'tide' },
    })
    // TextField forwards (value, event); the sidebar passes them straight through.
    expect(onSearch).toHaveBeenCalledWith('tide', expect.anything())
  })

  it('filters the visible songs by the query prop (case-insensitive)', () => {
    setup({ query: 'paper' })
    expect(screen.getByRole('button', { name: 'Paper Boats' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Slow Tide' })).not.toBeInTheDocument()
  })

  it('filters collections by the query prop too', () => {
    setup({ query: 'live' })
    expect(screen.getByRole('button', { name: 'Live takes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'B-sides' })).not.toBeInTheDocument()
  })

  it('shows a no-match status when the query matches nothing', () => {
    setup({ query: 'zzzzz' })
    expect(screen.getByRole('status')).toHaveTextContent(/no matches/i)
  })

  it('disables the search field when no onSearch handler is given', () => {
    setup({ onSearch: undefined })
    expect(screen.getByRole('searchbox', { name: 'Search library' })).toBeDisabled()
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('WorkspaceSidebar — keyboard', () => {
  it('ArrowDown moves focus from Home to the first song', () => {
    setup()
    const home = screen.getByRole('button', { name: 'Home' })
    home.focus()
    fireEvent.keyDown(home, { key: 'ArrowDown' })
    expect(screen.getByRole('button', { name: 'Paper Boats' })).toHaveFocus()
  })

  it('ArrowUp from Home wraps to the last collection', () => {
    setup()
    const home = screen.getByRole('button', { name: 'Home' })
    home.focus()
    fireEvent.keyDown(home, { key: 'ArrowUp' })
    expect(screen.getByRole('button', { name: 'Live takes' })).toHaveFocus()
  })

  it('End jumps to the last nav row', () => {
    setup()
    const home = screen.getByRole('button', { name: 'Home' })
    home.focus()
    fireEvent.keyDown(home, { key: 'End' })
    expect(screen.getByRole('button', { name: 'Live takes' })).toHaveFocus()
  })

  it('Home key jumps back to the first nav row', () => {
    setup()
    const last = screen.getByRole('button', { name: 'Live takes' })
    last.focus()
    fireEvent.keyDown(last, { key: 'Home' })
    expect(screen.getByRole('button', { name: 'Home' })).toHaveFocus()
  })
})

// ── Empty / collapsed ─────────────────────────────────────────────────────────

describe('WorkspaceSidebar — empty + collapsed', () => {
  it('shows empty-state copy when there are no songs or collections', () => {
    setup({ songs: [], collections: [] })
    expect(screen.getByText(/no songs yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no collections/i)).toBeInTheDocument()
  })

  it('collapsed hides the search field but keeps row accessible names', () => {
    setup({ collapsed: true })
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paper Boats' })).toBeInTheDocument()
  })

  it('collapsed keeps the group labels out of the accessibility tree', () => {
    setup({ collapsed: true })
    expect(screen.queryByRole('heading', { name: 'Songs' })).not.toBeInTheDocument()
  })
})

// ── List semantics ────────────────────────────────────────────────────────────

describe('WorkspaceSidebar — semantics', () => {
  it('groups rows in lists', () => {
    setup()
    const nav = screen.getByRole('navigation')
    const lists = within(nav).getAllByRole('list')
    expect(lists.length).toBeGreaterThanOrEqual(3) // Home + Songs + Collections
  })
})

// ── Calm-paper styling guarantees (authored CSS) ──────────────────────────────

describe('WorkspaceSidebar — calm-paper guarantees', () => {
  it('paints the panel on the warm paper rail token', () => {
    expect(CARD_CSS).toMatch(/\.sidebar\s*{[^}]*background:\s*var\(--rail-bg\)/)
  })

  it('never reaches for the dark --stage well (that is hardware-control vocabulary)', () => {
    expect(CARD_CSS).not.toMatch(/var\(--stage\b/)
  })

  it('uses the single accent for the active row spine', () => {
    expect(CARD_CSS).toMatch(/\.row\[data-active\][\s\S]*var\(--accent\)/)
  })

  it('hardcodes no hex colours (tokens only; song colours are data, not CSS)', () => {
    // Allow only the low-alpha black/white hairlines used for inset rings.
    const hexes = CARD_CSS.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    expect(hexes).toEqual([])
  })
})
