// src/components/WorkspaceSidebar/WorkspaceSidebar.tsx
//
// WorkspaceSidebar — the Home/Library switcher. CALM PAPER expression: warm
// Chroma tokens (paper, ink, ONE accent, type), content-first, NO device chrome.
// This is deliberately NOT NavRail (the Studio's recessed-LED icon rail) — it is
// the quiet left column of the Home/Library, the way Notion's sidebar is quiet:
// flat rows on paper, a colour dot per song, one warm accent for the active row.
//
// Why this isn't a webpage: the warmth is in the paper, not in chrome. Rows are
// flat ink on a hair-warmer surface (`--rail-bg`), labelled groups carry the
// printed-ledger letter-spacing, and the only "light" is the single accent spine
// on the active row — the per-track colour spine, borrowed for the library. No
// bevels, no inset wells, no LCD. The colour dot is the song's own data colour
// (like a track's colour), so the list reads like a hand-tabbed notebook.

import { useId, useMemo, useRef } from 'react'
import {
  House,
  Stack,
  MagnifyingGlass,
  Plus,
  DownloadSimple,
} from '@phosphor-icons/react'
import { TextField } from '../TextField'
import styles from './WorkspaceSidebar.module.css'

export interface WorkspaceSong {
  id:      string
  title:   string
  /** The song's own colour (a CSS colour string — data, like a track colour).
   *  Absent → a neutral token dot. */
  colour?: string
}

export interface WorkspaceCollection {
  id:    string
  title: string
}

export interface WorkspaceSidebarProps {
  /** Search query (controlled). When set, the visible songs + collections are
   *  filtered by it locally AND `onSearch` echoes each keystroke to the host. */
  query?:        string
  onSearch?:     (query: string) => void
  /** The id of the active destination: `'home'`, a song id, or a collection id. */
  active:        string
  onSelect:      (id: string) => void
  songs:         WorkspaceSong[]
  collections:   WorkspaceCollection[]
  onNewSong:     () => void
  onImportSong:  () => void
  /** Icon-only narrow rail. Hides the search field + group labels; rows keep
   *  their accessible names. */
  collapsed?:    boolean
  'aria-label'?: string
}

/** The pinned Home row always carries this id; songs/collections use their own. */
export const HOME_ID = 'home'

// Case-insensitive substring match on the title. Empty query → everything.
function matches(title: string, q: string): boolean {
  return title.toLowerCase().includes(q.toLowerCase())
}

// ── Colour dot (per-song data colour, like a track spine) ───────────────────────

function ColourDot({ colour }: { colour?: string }) {
  return (
    <span
      className={styles.dot}
      data-empty={colour ? undefined : ''}
      style={colour ? { background: colour } : undefined}
      aria-hidden="true"
    />
  )
}

// ── A single navigable row ──────────────────────────────────────────────────────

interface RowProps {
  id:        string
  label:     string
  isActive:  boolean
  collapsed: boolean
  onSelect:  (id: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  /** Leading visual — an icon element or a colour dot. */
  lead:      React.ReactNode
}

function Row({ id, label, isActive, collapsed, onSelect, onKeyDown, lead }: RowProps) {
  return (
    <li className={styles.listItem}>
      <button
        type="button"
        className={styles.row}
        data-active={isActive || undefined}
        data-nav-row=""
        aria-current={isActive ? 'page' : undefined}
        // In collapsed mode the text is hidden, so the title carries the name to
        // both AT and a native hover tooltip.
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
        onClick={() => onSelect(id)}
        onKeyDown={onKeyDown}
      >
        <span className={styles.rowLead} aria-hidden="true">
          {lead}
        </span>
        {!collapsed && <span className={styles.rowLabel}>{label}</span>}
      </button>
    </li>
  )
}

// ── WorkspaceSidebar ────────────────────────────────────────────────────────────

export function WorkspaceSidebar({
  query = '',
  onSearch,
  active,
  onSelect,
  songs,
  collections,
  onNewSong,
  onImportSong,
  collapsed = false,
  'aria-label': ariaLabel = 'Library',
}: WorkspaceSidebarProps) {
  const navRef       = useRef<HTMLDivElement>(null)
  const songsLabelId = useId()
  const collsLabelId = useId()

  const filteredSongs = useMemo(
    () => (query ? songs.filter(s => matches(s.title, query)) : songs),
    [songs, query],
  )
  const filteredCollections = useMemo(
    () => (query ? collections.filter(c => matches(c.title, query)) : collections),
    [collections, query],
  )

  // Roving Arrow/Home/End across every nav row (Home + songs + collections).
  // The footer actions are reached by Tab — they aren't part of the list.
  function handleRowKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const root = navRef.current
    if (!root) return
    const rows = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-nav-row]'))
    if (rows.length === 0) return
    const idx = rows.findIndex(b => b === e.currentTarget)
    let next: HTMLButtonElement | undefined
    if (e.key === 'Home')      next = rows[0]
    else if (e.key === 'End')  next = rows[rows.length - 1]
    else if (e.key === 'ArrowDown') next = rows[(idx + 1) % rows.length]
    else                            next = rows[(idx - 1 + rows.length) % rows.length]
    next?.focus()
  }

  const filtering = query.length > 0
  const noMatches = filtering && filteredSongs.length === 0 && filteredCollections.length === 0

  return (
    <nav
      className={styles.sidebar}
      data-collapsed={collapsed || undefined}
      aria-label={ariaLabel}
    >
      {/* Search — hidden when collapsed (no room for a field on the rail). */}
      {!collapsed && (
        <div className={styles.search}>
          <TextField
            type="search"
            value={query}
            onChange={onSearch ?? (() => {})}
            placeholder="Search songs…"
            aria-label="Search library"
            disabled={!onSearch}
            leading={<MagnifyingGlass size={16} aria-hidden />}
          />
        </div>
      )}

      <div ref={navRef} className={styles.scroll}>
        {/* Home — pinned, ungrouped. */}
        <ul className={styles.group} role="list" aria-label="Home">
          <Row
            id={HOME_ID}
            label="Home"
            isActive={active === HOME_ID}
            collapsed={collapsed}
            onSelect={onSelect}
            onKeyDown={handleRowKeyDown}
            lead={<House size={18} weight="regular" aria-hidden />}
          />
        </ul>

        {/* Songs. */}
        <div className={styles.section}>
          {!collapsed && (
            <h2 id={songsLabelId} className={styles.groupLabel}>Songs</h2>
          )}
          {filteredSongs.length > 0 ? (
            <ul
              className={styles.group}
              role="list"
              aria-labelledby={collapsed ? undefined : songsLabelId}
              aria-label={collapsed ? 'Songs' : undefined}
            >
              {filteredSongs.map(song => (
                <Row
                  key={song.id}
                  id={song.id}
                  label={song.title}
                  isActive={active === song.id}
                  collapsed={collapsed}
                  onSelect={onSelect}
                  onKeyDown={handleRowKeyDown}
                  lead={<ColourDot colour={song.colour} />}
                />
              ))}
            </ul>
          ) : !collapsed && !filtering ? (
            <p className={styles.empty}>No songs yet</p>
          ) : null}
        </div>

        {/* Collections. */}
        <div className={styles.section}>
          {!collapsed && (
            <h2 id={collsLabelId} className={styles.groupLabel}>Collections</h2>
          )}
          {filteredCollections.length > 0 ? (
            <ul
              className={styles.group}
              role="list"
              aria-labelledby={collapsed ? undefined : collsLabelId}
              aria-label={collapsed ? 'Collections' : undefined}
            >
              {filteredCollections.map(coll => (
                <Row
                  key={coll.id}
                  id={coll.id}
                  label={coll.title}
                  isActive={active === coll.id}
                  collapsed={collapsed}
                  onSelect={onSelect}
                  onKeyDown={handleRowKeyDown}
                  lead={<Stack size={18} weight="regular" aria-hidden />}
                />
              ))}
            </ul>
          ) : !collapsed && !filtering ? (
            <p className={styles.empty}>No collections</p>
          ) : null}
        </div>

        {noMatches && !collapsed && (
          <p className={styles.empty} role="status">No matches for “{query}”</p>
        )}
      </div>

      {/* Footer actions. */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.action}
          onClick={onNewSong}
          aria-label={collapsed ? 'New song' : undefined}
          title={collapsed ? 'New song' : undefined}
        >
          <span className={styles.actionLead} aria-hidden="true">
            <Plus size={16} weight="bold" />
          </span>
          {!collapsed && <span className={styles.actionLabel}>New song</span>}
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={onImportSong}
          aria-label={collapsed ? 'Import song' : undefined}
          title={collapsed ? 'Import song' : undefined}
        >
          <span className={styles.actionLead} aria-hidden="true">
            <DownloadSimple size={16} weight="regular" />
          </span>
          {!collapsed && <span className={styles.actionLabel}>Import song</span>}
        </button>
      </div>
    </nav>
  )
}
