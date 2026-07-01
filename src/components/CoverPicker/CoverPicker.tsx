// src/components/CoverPicker/CoverPicker.tsx
//
// Why this isn't a webpage: a Notion cover picker is a modal file-upload dialog — a
// web form. This is the instrument's version: a recessed tabbed console for dressing a
// record sleeve. The gallery is a wall of warm sample tiles you thumb through (colors,
// gradients, woven textures), each sinking on press and lighting a hairline ring when
// it's the one on the sleeve — the kit's recessed-off / lit-on signature applied to a
// swatch. Upload is a recessed well you drop a file into; Link is a single field; and
// Unsplash (only when the host wires a search) is a contact sheet of photos, each
// stamped with its photographer like a real print. No fake screws, no drop-shadowed
// modal card — a quiet panel of tokens that reskins through every theme.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - PRESENTATIONAL + CONTROLLED: the picker holds NO cover. It emits a typed
//   `CoverChoice` via onPick; the host stores it and hands it back as `value` to light
//   the matching preset. Ephemeral interaction state (active tab, link draft, search
//   query/results) is internal — it isn't the cover, so the host shouldn't own it.
// - The overlay is the HOST's: this is the tabbed PANEL you drop into a Dialog or
//   Popover (the demo dogfoods Dialog). Keeping the chrome out makes it reusable as a
//   popover on a "Change cover" stud OR a full dialog, with zero rework.
// - NO network, NO keys: Unsplash search is the host prop `onSearchUnsplash`. Absent →
//   the Unsplash tab is hidden entirely (never a dead tab).
// - Gallery tiles are a MANUAL-activation radiogroup (role="radio" + aria-checked, like
//   ColorSwatch): arrows rove focus, Space/Enter/click commit. Arrowing does NOT emit —
//   emitting a stored cover on every keystroke would be surprising; the pick is a
//   deliberate act. Stable labels ("Peach", "Sunset"), one ARIA model.
// - Textures are tokenless CSS pattern gradients emitted as kind:'gradient' — no binary
//   assets, renders through the same background-image path as any gradient (see
//   src/lib/covers.ts). This is what lets a gradient/texture preset actually show.
import { useId, useRef, useState } from 'react'
import { GridFour, UploadSimple, LinkSimple, MagnifyingGlass, Image as ImageIcon } from '@phosphor-icons/react'
import { Tabs } from '../Tabs'
import { TextField } from '../TextField'
import type { CoverChoice, CoverUnsplashResult } from '../../lib/covers'
import { coverStyle } from '../../lib/covers'
import {
  DEFAULT_COLOR_PRESETS,
  DEFAULT_GRADIENT_PRESETS,
  DEFAULT_TEXTURE_PRESETS,
  type CoverPreset,
} from './presets'
import styles from './CoverPicker.module.css'

export type CoverTabId = 'gallery' | 'upload' | 'link' | 'unsplash'

export interface CoverPickerProps {
  /**
   * The cover currently on the host's sleeve, if any — lights the matching preset
   * (the 'selected' state). The picker never mutates it; it only reflects it.
   */
  value?: CoverChoice | null
  /** Emitted when the user commits a cover. The host stores it. Never called on mere focus. */
  onPick: (choice: CoverChoice) => void
  /**
   * Host-provided Unsplash search. The kit NEVER calls the network or holds keys.
   * Absent → the Unsplash tab is hidden. Rejecting the promise shows the error state.
   */
  onSearchUnsplash?: (query: string) => Promise<CoverUnsplashResult[]>
  /** Gallery color tiles. Defaults to the Chroma palette + two warm neutrals. */
  colorPresets?: CoverPreset[]
  /** Gallery gradient tiles. */
  gradientPresets?: CoverPreset[]
  /** Gallery texture tiles (CSS pattern gradients). */
  texturePresets?: CoverPreset[]
  /** Which tab opens first. Defaults to 'gallery'. */
  defaultTab?: CoverTabId
  /** Disables every control (dims the panel). */
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

type SearchStatus = 'idle' | 'loading' | 'ok' | 'empty' | 'error'

/** True when `value` is exactly this preset's choice — drives the lit/selected ring. */
function isPresetSelected(preset: CoverPreset, value?: CoverChoice | null): boolean {
  if (!value) return false
  return value.kind === preset.choice.kind && value.value === preset.choice.value
}

/** A pasted link is a usable image ref only if it's an http(s) or data URL. */
export function isValidImageLink(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  return /^https?:\/\/\S+/i.test(s) || /^data:image\/\S+/i.test(s)
}

export function CoverPicker({
  value = null,
  onPick,
  onSearchUnsplash,
  colorPresets = DEFAULT_COLOR_PRESETS,
  gradientPresets = DEFAULT_GRADIENT_PRESETS,
  texturePresets = DEFAULT_TEXTURE_PRESETS,
  defaultTab = 'gallery',
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Choose a cover',
}: CoverPickerProps) {
  const hasUnsplash = Boolean(onSearchUnsplash)
  const [tab, setTab] = useState<CoverTabId>(
    defaultTab === 'unsplash' && !hasUnsplash ? 'gallery' : defaultTab,
  )

  const tabs = [
    { id: 'gallery', label: 'Gallery', icon: <GridFour aria-hidden="true" /> },
    { id: 'upload', label: 'Upload', icon: <UploadSimple aria-hidden="true" /> },
    { id: 'link', label: 'Link', icon: <LinkSimple aria-hidden="true" /> },
    ...(hasUnsplash
      ? [{ id: 'unsplash', label: 'Unsplash', icon: <MagnifyingGlass aria-hidden="true" /> }]
      : []),
  ]

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-size={size}
      data-disabled={disabled || undefined}
      role="group"
      aria-label={ariaLabel}
    >
      <Tabs tabs={tabs} active={tab} onChange={id => setTab(id as CoverTabId)} size={size}>
        {tab === 'gallery' && (
          <GalleryPanel
            colorPresets={colorPresets}
            gradientPresets={gradientPresets}
            texturePresets={texturePresets}
            value={value}
            disabled={disabled}
            onPick={onPick}
          />
        )}
        {tab === 'upload' && <UploadPanel disabled={disabled} onPick={onPick} />}
        {tab === 'link' && <LinkPanel disabled={disabled} onPick={onPick} />}
        {tab === 'unsplash' && hasUnsplash && (
          <UnsplashPanel disabled={disabled} onSearch={onSearchUnsplash!} onPick={onPick} />
        )}
      </Tabs>
    </div>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

interface GalleryPanelProps {
  colorPresets: CoverPreset[]
  gradientPresets: CoverPreset[]
  texturePresets: CoverPreset[]
  value?: CoverChoice | null
  disabled: boolean
  onPick: (choice: CoverChoice) => void
}

function GalleryPanel({ colorPresets, gradientPresets, texturePresets, value, disabled, onPick }: GalleryPanelProps) {
  // One flat list drives roving keyboard order; sections render slices of it in DOM order.
  const all = [...colorPresets, ...gradientPresets, ...texturePresets]
  const selectedIdx = all.findIndex(p => isPresetSelected(p, value))
  // Roving tabstop: the selected tile, else the first — one tab-stop for the whole grid.
  const tabStop = selectedIdx >= 0 ? selectedIdx : 0
  const rovingRef = useRef<HTMLDivElement>(null)

  function focusTile(idx: number) {
    const clamped = (idx + all.length) % all.length
    rovingRef.current
      ?.querySelectorAll<HTMLButtonElement>('[data-tile]')
      ?.[clamped]?.focus()
  }

  function onTileKeyDown(idx: number, e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        focusTile(idx + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        focusTile(idx - 1)
        break
      case 'Home':
        e.preventDefault()
        focusTile(0)
        break
      case 'End':
        e.preventDefault()
        focusTile(all.length - 1)
        break
    }
  }

  function section(title: string, presets: CoverPreset[]) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.tiles}>
          {presets.map(preset => {
            const idx = all.indexOf(preset)
            const selected = isPresetSelected(preset, value)
            return (
              <button
                key={preset.id}
                type="button"
                data-tile
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                className={styles.tile}
                data-selected={selected || undefined}
                disabled={disabled}
                tabIndex={idx === tabStop ? 0 : -1}
                style={coverStyle(preset.choice)}
                onClick={() => onPick(preset.choice)}
                onKeyDown={e => onTileKeyDown(idx, e)}
              >
                {selected && <SelectedRing />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.gallery} role="radiogroup" aria-label="Cover presets" ref={rovingRef}>
      {section('Colors', colorPresets)}
      {section('Gradients', gradientPresets)}
      {section('Textures', texturePresets)}
    </div>
  )
}

// ─── Upload ───────────────────────────────────────────────────────────────────

function UploadPanel({ disabled, onPick }: { disabled: boolean; onPick: (c: CoverChoice) => void }) {
  const inputId = useId()
  const [fileName, setFileName] = useState<string | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPick({ kind: 'image', value: reader.result })
      }
    }
    reader.readAsDataURL(file)
    // Reset so re-picking the same file fires change again.
    e.target.value = ''
  }

  return (
    <div className={styles.panel}>
      <label htmlFor={inputId} className={styles.dropzone} data-disabled={disabled || undefined}>
        <UploadSimple className={styles.dropIcon} aria-hidden="true" />
        <span className={styles.dropTitle}>Upload an image</span>
        <span className={styles.dropHint}>
          {fileName ? `Selected: ${fileName}` : 'PNG, JPG, or GIF — becomes the cover'}
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          disabled={disabled}
          onChange={onFile}
        />
      </label>
    </div>
  )
}

// ─── Link ─────────────────────────────────────────────────────────────────────

function LinkPanel({ disabled, onPick }: { disabled: boolean; onPick: (c: CoverChoice) => void }) {
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | undefined>()

  function submit() {
    const s = link.trim()
    if (!isValidImageLink(s)) {
      setError('Enter an image link starting with http:// or https://')
      return
    }
    setError(undefined)
    onPick({ kind: 'image', value: s })
  }

  return (
    <div className={styles.panel}>
      <form
        className={styles.linkForm}
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField
          value={link}
          onChange={v => {
            setLink(v)
            if (error) setError(undefined)
          }}
          placeholder="Paste an image link…"
          aria-label="Image link"
          type="text"
          disabled={disabled}
          error={error}
          leading={<LinkSimple aria-hidden="true" />}
        />
        <button type="submit" className={styles.submit} disabled={disabled}>
          Add
        </button>
      </form>
    </div>
  )
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

interface UnsplashPanelProps {
  disabled: boolean
  onSearch: (query: string) => Promise<CoverUnsplashResult[]>
  onPick: (c: CoverChoice) => void
}

function UnsplashPanel({ disabled, onSearch, onPick }: UnsplashPanelProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [results, setResults] = useState<CoverUnsplashResult[]>([])
  const [lastQuery, setLastQuery] = useState('')
  // Race guard: only the newest search may write results.
  const reqId = useRef(0)

  function runSearch() {
    const q = query.trim()
    if (!q) return
    const id = ++reqId.current
    setStatus('loading')
    setLastQuery(q)
    onSearch(q).then(
      res => {
        if (id !== reqId.current) return
        setResults(res)
        setStatus(res.length === 0 ? 'empty' : 'ok')
      },
      () => {
        if (id !== reqId.current) return
        setResults([])
        setStatus('error')
      },
    )
  }

  return (
    <div className={styles.panel}>
      <form
        className={styles.linkForm}
        onSubmit={e => {
          e.preventDefault()
          runSearch()
        }}
      >
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="Search Unsplash…"
          aria-label="Search Unsplash"
          type="search"
          disabled={disabled}
          leading={<MagnifyingGlass aria-hidden="true" />}
        />
        <button type="submit" className={styles.submit} disabled={disabled || !query.trim()}>
          Search
        </button>
      </form>

      {status === 'idle' && (
        <p className={styles.hint} data-state="idle">
          <ImageIcon aria-hidden="true" /> Search Unsplash for a cover photo.
        </p>
      )}

      {status === 'loading' && (
        <div className={styles.results} aria-busy="true" aria-label="Searching">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      )}

      {status === 'empty' && (
        <p className={styles.hint} data-state="empty">
          No photos for “{lastQuery}”. Try another search.
        </p>
      )}

      {status === 'error' && (
        <p className={styles.hint} data-state="error" role="alert">
          Couldn’t reach Unsplash. Try again.
        </p>
      )}

      {status === 'ok' && (
        <ul className={styles.results} aria-label={`Unsplash results for ${lastQuery}`}>
          {results.map(r => (
            <li key={r.id} className={styles.resultItem}>
              <button
                type="button"
                className={styles.result}
                disabled={disabled}
                style={coverStyle({ kind: 'image', value: r.thumbUrl ?? r.url })}
                aria-label={`Use photo${r.alt ? ` — ${r.alt}` : ''} by ${r.attribution.authorName}`}
                onClick={() =>
                  onPick({ kind: 'image', value: r.url, attribution: r.attribution })
                }
              >
                <span className={styles.credit}>by {r.attribution.authorName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Bespoke glyphs ─────────────────────────────────────────────────────────────

/** The lit selection ring stamped on the chosen tile — a hairline check on a bloom. */
function SelectedRing() {
  return (
    <span className={styles.selectedMark} aria-hidden="true">
      <svg viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2l2.3 2.3L9.5 3.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
