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
//
// The search field follows the same rule: it wears the shared TextField's
// `tone="surface"` calm-paper face (warm light field, hairline keyline, ink text)
// rather than the default dark `--stage` well — that recessed trench is hardware-
// control vocabulary, and would read as a dark bar dropped onto the paper rail.
//
// "+ Create collection" is the way INTO a collection, so it lives in the
// Collections section (never the footer, by design): when the section is empty it
// IS the empty state — offering the way in instead of merely printing "No
// collections" — and when collections exist it rides the list bottom. It borrows
// the footer's quiet action vocabulary (a flat row, a + that warms to the accent
// on hover — not a loud primary button), and like the footer actions it's a
// COMMAND not a destination: no accent spine, no aria-current, out of the roving
// arrow nav, reached by Tab. That keeps the ARIA model honest (rows navigate,
// actions act) and the paper calm.
//
// The sidebar is a compact "recent" surface, not the full library: each content
// section (Songs, Collections) caps to the first `cap` entries (~5) and, when the
// real list runs longer, ends in a quiet "See all" row that routes the host to the
// full-list page (`onSeeAllSongs` / `onSeeAllCollections`). The cap is for the
// UNFILTERED list — while searching we show every match and drop the cap (and the
// See all row): a search is itself a narrowing intent, so truncating its results
// would hide the very rows the viewer is hunting. The See all row is NAVIGATION
// (it goes to a page), so — unlike the "Create collection" command — it joins the
// roving arrow nav as a quiet destination, but carries no aria-current (it routes
// away; it is never the current page). It wears a link-row face, not a button: the
// quietest thing on the paper that still reads as "more this way".
//
// Pinned library entries (e.g. "Lyrics") are top-level destinations, not content:
// they ride in the Home group, share Home's row vocabulary (same accent spine when
// active, same roving nav via [data-nav-row]), and — unlike songs/collections — are
// NEVER hidden by the search filter. The consumer supplies the data (id, label, and
// which Phosphor icon); the rail renders the glyph at its own size/weight so the
// column stays uniform. That keeps the sidebar a calm, content-first index page:
// the host adds a section by passing data, never by reaching into the kit.

import { useId, useMemo, useRef } from 'react'
import {
  House,
  Stack,
  MagnifyingGlass,
  Plus,
  DownloadSimple,
  BookmarkSimple,
  CaretRight,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
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

/** A pinned library destination — a top-level nav row like Home (e.g. "Lyrics").
 *  `icon` is the song-row's lead glyph: data (which Phosphor icon), not styling —
 *  the kit renders it at the rail's own size/weight so the column stays uniform.
 *  Selecting one fires `onSelect(id)`; the host routes to its library page. */
export interface LibraryEntry {
  id:    string
  label: string
  /** A Phosphor icon component. Absent → a neutral pinned-bookmark glyph. */
  icon?: Icon
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
  /** How many entries each content section shows before it caps to a "See all"
   *  row. Applies to the UNFILTERED list only (search shows every match). The
   *  sidebar is a compact recent surface, not the full library. Default 5. */
  cap?:          number
  /** Route to the full songs list. When given AND the unfiltered list exceeds the
   *  cap, a quiet "See all" row rides the bottom of the Songs section and fires
   *  this. Omitted → the section simply caps with no way out (the host has no
   *  full-list page). */
  onSeeAllSongs?:       () => void
  /** Route to the full collections list — the Collections-section twin of
   *  `onSeeAllSongs`. */
  onSeeAllCollections?: () => void
  /** Pinned library destinations rendered with Home, near the top — top-level
   *  pages beyond songs (e.g. "Lyrics"). The host adds sections here without a
   *  kit change; selecting one routes via `onSelect(id)`. */
  libraryEntries?: LibraryEntry[]
  onNewSong:     () => void
  onImportSong:  () => void
  /** Make a new collection — the way INTO a collection. When given, a quiet
   *  "+ Create collection" affordance sits in the Collections section (under the
   *  header): it replaces the "No collections" empty text when there are none,
   *  and rides at the bottom of the list when collections exist. Always present
   *  so the section is never a dead end. Omitted → the section is read-only and
   *  falls back to the plain "No collections" empty line (no behaviour change). */
  onCreateCollection?: () => void
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

// ── See all (the capped section's quiet way to the full list) ────────────────────

interface SeeAllRowProps {
  /** Accessible name, e.g. "See all songs" — the visible text is just "See all". */
  label:     string
  collapsed: boolean
  onActivate: () => void
  onKeyDown:  (e: React.KeyboardEvent<HTMLButtonElement>) => void
}

// A link-row, not a button: the quietest affordance on the paper that still reads
// as "more this way". It joins the roving nav ([data-nav-row]) because it is
// NAVIGATION — but it routes to a page, so it carries no aria-current.
function SeeAllRow({ label, collapsed, onActivate, onKeyDown }: SeeAllRowProps) {
  return (
    <li className={styles.listItem}>
      <button
        type="button"
        className={styles.seeAll}
        data-nav-row=""
        // The visible "See all" is ambiguous to AT on its own, so the full
        // "See all songs/collections" rides as the accessible name everywhere;
        // collapsed it is the only name (no visible text) + a hover tooltip.
        aria-label={label}
        title={collapsed ? label : undefined}
        onClick={onActivate}
        onKeyDown={onKeyDown}
      >
        <span className={styles.seeAllLead} aria-hidden="true">
          <CaretRight size={14} weight="bold" />
        </span>
        {!collapsed && <span className={styles.seeAllLabel}>See all</span>}
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
  cap = 5,
  onSeeAllSongs,
  onSeeAllCollections,
  libraryEntries = [],
  onNewSong,
  onImportSong,
  onCreateCollection,
  collapsed = false,
  'aria-label': ariaLabel = 'Library',
}: WorkspaceSidebarProps) {
  const navRef       = useRef<HTMLDivElement>(null)
  const songsLabelId = useId()
  const collsLabelId = useId()

  const filtering = query.length > 0

  // While filtering, show every match (no cap, no See all): the search is itself
  // the narrowing. Unfiltered, cap to the recent surface and offer See all when
  // the real list runs longer AND the host gave us somewhere to route.
  const filteredSongs = useMemo(
    () => (query ? songs.filter(s => matches(s.title, query)) : songs),
    [songs, query],
  )
  const filteredCollections = useMemo(
    () => (query ? collections.filter(c => matches(c.title, query)) : collections),
    [collections, query],
  )

  const visibleSongs       = filtering ? filteredSongs : songs.slice(0, cap)
  const visibleCollections = filtering ? filteredCollections : collections.slice(0, cap)
  const showSeeAllSongs       = !filtering && !!onSeeAllSongs && songs.length > cap
  const showSeeAllCollections = !filtering && !!onSeeAllCollections && collections.length > cap

  // Roving Arrow/Home/End across every nav row (Home + library entries + songs
  // + collections) — driven by the shared [data-nav-row] set, so new pinned rows
  // join automatically. The footer actions are reached by Tab — not in the list.
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
            tone="surface"
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
        {/* Pinned — Home + any library destinations (e.g. Lyrics), ungrouped.
            These are fixed pages, not content, so search never filters them out. */}
        <ul className={styles.group} role="list" aria-label="Pinned">
          <Row
            id={HOME_ID}
            label="Home"
            isActive={active === HOME_ID}
            collapsed={collapsed}
            onSelect={onSelect}
            onKeyDown={handleRowKeyDown}
            lead={<House size={18} weight="regular" aria-hidden />}
          />
          {libraryEntries.map(entry => {
            const EntryIcon = entry.icon ?? BookmarkSimple
            return (
              <Row
                key={entry.id}
                id={entry.id}
                label={entry.label}
                isActive={active === entry.id}
                collapsed={collapsed}
                onSelect={onSelect}
                onKeyDown={handleRowKeyDown}
                lead={<EntryIcon size={18} weight="regular" aria-hidden />}
              />
            )
          })}
        </ul>

        {/* Songs. */}
        <div className={styles.section}>
          {!collapsed && (
            <h2 id={songsLabelId} className={styles.groupLabel}>Songs</h2>
          )}
          {visibleSongs.length > 0 ? (
            <ul
              className={styles.group}
              role="list"
              aria-labelledby={collapsed ? undefined : songsLabelId}
              aria-label={collapsed ? 'Songs' : undefined}
            >
              {visibleSongs.map(song => (
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
              {showSeeAllSongs && (
                <SeeAllRow
                  label="See all songs"
                  collapsed={collapsed}
                  onActivate={onSeeAllSongs!}
                  onKeyDown={handleRowKeyDown}
                />
              )}
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
          {visibleCollections.length > 0 ? (
            <ul
              className={styles.group}
              role="list"
              aria-labelledby={collapsed ? undefined : collsLabelId}
              aria-label={collapsed ? 'Collections' : undefined}
            >
              {visibleCollections.map(coll => (
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
              {showSeeAllCollections && (
                <SeeAllRow
                  label="See all collections"
                  collapsed={collapsed}
                  onActivate={onSeeAllCollections!}
                  onKeyDown={handleRowKeyDown}
                />
              )}
            </ul>
          ) : !collapsed && !filtering && !onCreateCollection ? (
            // No way in: a plain read-only empty line (legacy behaviour).
            <p className={styles.empty}>No collections</p>
          ) : null}

          {/* The way INTO a collection. A quiet action affordance (not a nav
              destination): it commands rather than navigates, so — like the
              footer's New/Import — it carries no aria-current and stays OUT of
              the roving arrow nav (Tab reaches it). It IS the empty state when
              there are no collections, and rides the list bottom when there
              are. Always rendered when the prop is given, so the section is
              never a dead end. */}
          {onCreateCollection && (
            <button
              type="button"
              className={styles.action}
              onClick={onCreateCollection}
              aria-label={collapsed ? 'Create collection' : undefined}
              title={collapsed ? 'Create collection' : undefined}
            >
              <span className={styles.actionLead} aria-hidden="true">
                <Plus size={18} weight="regular" />
              </span>
              {!collapsed && <span className={styles.actionLabel}>Create collection</span>}
            </button>
          )}
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
