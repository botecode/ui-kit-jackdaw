import { useMemo, useRef, useState } from 'react'
import { MagnifyingGlass, ArrowClockwise, X } from '@phosphor-icons/react'
import styles from './FxPicker.module.css'
import { TextField } from '../TextField'
import { SegmentedControl } from '../SegmentedControl'
import { ScrollArea } from '../ScrollArea'

// ── Contract ────────────────────────────────────────────────────────────────
// Shapes mirror the host's plugin scanner: each PluginInfo is one installed
// plug-in the engine can instantiate. `kind` drives the All/FX/Instrument
// filter; `category` is the human sub-label shown as a chip (Dynamics, Synth…).

export type PluginKind = 'fx' | 'instrument'

export interface PluginInfo {
  id:            string
  name:          string
  company:       string
  kind:          PluginKind
  category:      string
  format:        string        // 'VST3' | 'AU' | 'VST' | 'AAX' | …
  favorite:      boolean
  available:     boolean        // false → engine can't load it (greyed Add)
  recentlyUsed?: boolean        // surfaces under the "Recently used" sidebar item
}

/** Top-of-grid kind filter — independent of the sidebar source selection. */
export type FxFilter = 'all' | 'fx' | 'instrument'

/**
 * Sidebar source selection. The fixed entries plus one-per-vendor. Encoded as a
 * tagged string so it round-trips through `onSourceChange` without a union of
 * objects.
 */
export type FxSource = 'all' | 'favorite' | 'recent' | `company:${string}`

export interface FxPickerProps {
  plugins:           PluginInfo[]
  /** Vendor list for the sidebar. Derived (sorted, unique) from `plugins` when omitted. */
  companies?:        string[]
  onAdd:             (id: string) => void
  onToggleFavorite:  (id: string, next: boolean) => void
  onRescan:          () => void
  onClose?:          () => void
  /** Observe UI state for hosts that persist it; the component owns it otherwise. */
  onSearchChange?:   (query: string) => void
  onFilterChange?:   (filter: FxFilter) => void
  onSourceChange?:   (source: FxSource) => void
  /** Scan in progress — grid shows skeletons, Rescan spins. */
  loading?:          boolean
  /** "N plugins installed" — defaults to `plugins.length`. */
  installedCount?:   number
  size?:             'sm' | 'md'
  className?:        string
  style?:            React.CSSProperties
  'aria-label'?:     string
}

// ── Initial-badge colour ──────────────────────────────────────────────────────
// Deterministic per company so a vendor's plug-ins share one chip colour
// (Chroma spine cycle — never a hardcoded hex).

const BADGE_CYCLE = [
  '--chroma-red', '--chroma-orange', '--chroma-yellow', '--chroma-green',
  '--chroma-teal', '--chroma-blue', '--chroma-purple',
] as const

function badgeColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return `var(${BADGE_CYCLE[h % BADGE_CYCLE.length]})`
}

// ── Star glyph ────────────────────────────────────────────────────────────────
// Bespoke inline SVG so fill/outline is one CSS-driven element — avoids mixing
// Phosphor weights (the kit runs a single IconContext weight).

function StarGlyph() {
  return (
    <svg className={styles.starGlyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.6l2.85 5.9 6.5.92-4.72 4.55 1.13 6.47L12 17.9 6.24 20.94l1.13-6.47L2.65 9.42l6.5-.92z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sourceLabel(source: FxSource): string {
  if (source === 'all') return 'All'
  if (source === 'favorite') return 'Favorites'
  if (source === 'recent') return 'Recently used'
  return source.slice('company:'.length)
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  companies:  string[]
  favorites:  number
  source:     FxSource
  onSelect:   (source: FxSource) => void
}

function Sidebar({ companies, favorites, source, onSelect }: SidebarProps) {
  const options = useMemo<FxSource[]>(
    () => ['all', 'favorite', 'recent', ...companies.map(c => `company:${c}` as FxSource)],
    [companies],
  )
  const refs = useRef<(HTMLLIElement | null)[]>([])
  const activeIdx = Math.max(0, options.indexOf(source))

  function handleKeyDown(e: React.KeyboardEvent<HTMLLIElement>, index: number) {
    const last = options.length - 1
    let next = index
    if (e.key === 'ArrowDown') next = index < last ? index + 1 : 0
    else if (e.key === 'ArrowUp') next = index > 0 ? index - 1 : last
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(options[index])
      return
    } else return
    e.preventDefault()
    onSelect(options[next])
    refs.current[next]?.focus()
  }

  function renderOption(opt: FxSource, i: number, badge?: React.ReactNode) {
    const selected = opt === source
    return (
      <li
        key={opt}
        ref={el => { refs.current[i] = el }}
        role="option"
        aria-selected={selected}
        tabIndex={i === activeIdx ? 0 : -1}
        data-selected={selected || undefined}
        className={styles.sourceItem}
        onClick={() => onSelect(opt)}
        onKeyDown={e => handleKeyDown(e, i)}
      >
        <span className={styles.sourceLabel}>{sourceLabel(opt)}</span>
        {badge}
      </li>
    )
  }

  return (
    <ul className={styles.sidebar} role="listbox" aria-label="Plugin source" aria-orientation="vertical">
      {renderOption('all', 0)}
      {renderOption(
        'favorite',
        1,
        favorites > 0 ? <span className={styles.sourceCount}>{favorites}</span> : undefined,
      )}
      {renderOption('recent', 2)}
      {companies.length > 0 && (
        <li className={styles.sidebarHeading} role="presentation">Vendors</li>
      )}
      {companies.map((c, ci) => renderOption(`company:${c}` as FxSource, 3 + ci))}
    </ul>
  )
}

// ── Plugin card ───────────────────────────────────────────────────────────────

interface CardProps {
  plugin:    PluginInfo
  onAdd:     (id: string) => void
  onToggle:  (id: string, next: boolean) => void
}

function PluginCard({ plugin, onAdd, onToggle }: CardProps) {
  const initial = plugin.name.trim().charAt(0).toUpperCase() || '•'

  return (
    <article className={styles.card} data-unavailable={!plugin.available || undefined}>
      <div
        className={styles.badge}
        style={{ '--badge-color': badgeColor(plugin.company) } as React.CSSProperties}
        aria-hidden="true"
      >
        {initial}
      </div>

      <div className={styles.cardInfo}>
        <div className={styles.cardNameRow}>
          <span className={styles.cardName} title={plugin.name}>{plugin.name}</span>
        </div>
        <span className={styles.cardCompany}>{plugin.company}</span>
        <div className={styles.chips}>
          <span className={styles.chip} data-kind={plugin.kind}>
            {plugin.kind === 'fx' ? 'FX' : 'Instrument'}
          </span>
          <span className={styles.chip}>{plugin.category}</span>
          <span className={styles.chip} data-format>{plugin.format}</span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.star}
          data-favorite={plugin.favorite || undefined}
          aria-pressed={plugin.favorite}
          aria-label={`Favorite ${plugin.name}`}
          onClick={() => onToggle(plugin.id, !plugin.favorite)}
        >
          <StarGlyph />
        </button>
        <button
          type="button"
          className={styles.addBtn}
          disabled={!plugin.available}
          aria-label={plugin.available ? `Add ${plugin.name}` : `${plugin.name} unavailable`}
          onClick={() => onAdd(plugin.id)}
        >
          {plugin.available ? 'Add' : 'Unavailable'}
        </button>
      </div>
    </article>
  )
}

// ── FxPicker ──────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'fx', label: 'FX' },
  { value: 'instrument', label: 'Instrument' },
]

export function FxPicker({
  plugins,
  companies,
  onAdd,
  onToggleFavorite,
  onRescan,
  onClose,
  onSearchChange,
  onFilterChange,
  onSourceChange,
  loading = false,
  installedCount,
  size = 'md',
  className,
  style,
  'aria-label': ariaLabel = 'Add plugin',
}: FxPickerProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FxFilter>('all')
  const [source, setSource] = useState<FxSource>('all')

  const vendorList = useMemo(
    () => companies ?? [...new Set(plugins.map(p => p.company))].sort((a, b) => a.localeCompare(b)),
    [companies, plugins],
  )

  const favoriteCount = useMemo(() => plugins.filter(p => p.favorite).length, [plugins])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return plugins.filter(p => {
      if (source === 'favorite' && !p.favorite) return false
      if (source === 'recent' && !p.recentlyUsed) return false
      if (source.startsWith('company:') && p.company !== source.slice('company:'.length)) return false
      if (filter !== 'all' && p.kind !== filter) return false
      if (q && !(`${p.name} ${p.company}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [plugins, query, filter, source])

  function handleSearch(next: string) {
    setQuery(next)
    onSearchChange?.(next)
  }
  function handleFilter(next: string) {
    setFilter(next as FxFilter)
    onFilterChange?.(next as FxFilter)
  }
  function handleSource(next: FxSource) {
    setSource(next)
    onSourceChange?.(next)
  }

  const count = installedCount ?? plugins.length
  const isEmpty = plugins.length === 0
  const isNoResults = !isEmpty && !loading && visible.length === 0

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-size={size}
      data-loading={loading || undefined}
      role="region"
      aria-label={ariaLabel}
    >
      {/* ── Header ── */}
      <header className={styles.header}>
        <h2 className={styles.title}>Add Plugin</h2>
        <div className={styles.search}>
          <TextField
            value={query}
            onChange={handleSearch}
            type="search"
            size="sm"
            placeholder="Search plugins…"
            aria-label="Search plugins"
            leading={<MagnifyingGlass size={14} />}
          />
        </div>
        <button
          type="button"
          className={styles.rescanBtn}
          data-spinning={loading || undefined}
          onClick={onRescan}
        >
          <ArrowClockwise size={14} className={styles.rescanIcon} />
          Rescan
        </button>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close"
          onClick={() => onClose?.()}
        >
          <X size={16} />
        </button>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        <Sidebar
          companies={vendorList}
          favorites={favoriteCount}
          source={source}
          onSelect={handleSource}
        />

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <span className={styles.count}>
              {count} {count === 1 ? 'plugin' : 'plugins'} installed
            </span>
            <SegmentedControl
              options={FILTER_OPTIONS}
              value={filter}
              onChange={handleFilter}
              size="sm"
              aria-label="Filter by type"
            />
          </div>

          <ScrollArea className={styles.gridScroll} autoHide>
            {loading ? (
              <div className={styles.grid} aria-busy="true" aria-label="Scanning plugins">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} aria-hidden="true" />
                ))}
              </div>
            ) : isEmpty ? (
              <div className={styles.placeholder} role="status">
                <p className={styles.placeholderTitle}>No plugins installed</p>
                <p className={styles.placeholderHint}>Rescan to find plugins on this machine.</p>
              </div>
            ) : isNoResults ? (
              <div className={styles.placeholder} role="status">
                <p className={styles.placeholderTitle}>No plugins match</p>
                <p className={styles.placeholderHint}>
                  Nothing in {sourceLabel(source)}
                  {query.trim() ? ` for “${query.trim()}”` : ''}. Try a different search or source.
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {visible.map(p => (
                  <PluginCard
                    key={p.id}
                    plugin={p}
                    onAdd={onAdd}
                    onToggle={onToggleFavorite}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </section>
  )
}
