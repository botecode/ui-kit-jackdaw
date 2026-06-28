// src/components/ReferenceList/ReferenceList.tsx
//
// Why this isn't a webpage: references are a SHELF of physical reference cards on calm
// warm paper, not a stack of blue hyperlinks. A pasted link becomes a tactile object —
// a YouTube/Spotify player you press to life (the play disc lights with a green LED
// bloom on incandescent timing, the kit's signature), a web card stamped with its host,
// an image chip, a file slug. The collector slot at the top is a recessed --stage well
// ("paste a link…") — you feed the shelf, you don't fill a form. One accent (--accent),
// flat paper tiles, a physical grip for reordering. Drop a link card on the dark Ink
// theme or the cream Chroma theme and it reskins through tokens — an instrument's
// reference shelf, never a bookmarks list.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - Source of truth is `value` (markdown). Every mutation emits new markdown via
//   onChange; the typed intent callbacks (onAddLink/onReorder/onLabel/onDelete) fire
//   alongside so the app can react without re-diffing. References round-trip as text.
// - No scraping here (out of scope). Link previews are injected by the app via `meta`
//   (keyed by url); absence is the graceful fallback (host + url). loading/error are
//   meta-driven states, not network calls.
// - Play is consumption, not mutation: players stay live even when the list is
//   read-only (`disabled` only hides the editing affordances). Play LED = green
//   (semantic: rolling), the one place color carries meaning here.
import { useEffect, useId, useRef, useState } from 'react'
import {
  LinkSimple,
  Image as ImageIcon,
  File as FileIcon,
  Play,
  Trash,
  PencilSimple,
  Check,
  X,
  DotsSixVertical,
  YoutubeLogo,
  SpotifyLogo,
  Warning,
} from '@phosphor-icons/react'
import { TextField } from '../TextField'
import {
  parseReferences,
  serializeReferences,
  itemFromUrl,
  type RefItem,
} from './referenceMarkdown'
import styles from './ReferenceList.module.css'

// ─── Types ──────────────────────────────────────────────────────────────────

/** App-resolved preview for a link card, keyed by url in `meta`. Absent = graceful fallback. */
export interface RefMeta {
  title?: string
  description?: string
  /** Preview image / favicon url. */
  image?: string
  /** Drives the loading skeleton / error fallback. Defaults to 'ready' when omitted. */
  status?: 'loading' | 'ready' | 'error'
}

export interface ReferenceListProps {
  /** The references, as markdown (one item per line). Source of truth. */
  value: string
  /** Emitted with the full new markdown after any add / reorder / label / delete. */
  onChange?: (markdown: string) => void
  /** App-resolved link previews, keyed by url. Absent = graceful host-only fallback. */
  meta?: Record<string, RefMeta>
  /** Currently selected reference id (`ref-${index}`), or null. */
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Fired when a url is pasted/typed into the collector slot. */
  onAddLink?: (url: string) => void
  onReorder?: (from: number, to: number) => void
  onLabel?: (id: string, label: string) => void
  onDelete?: (id: string) => void
  /** Read-only: hides the collector slot and per-card editing affordances. */
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url
  }
}

function fileNameOf(url: string): string {
  const clean = url.split(/[?#]/)[0]
  const segs = clean.split(/[/\\]/).filter(Boolean)
  return decodeURIComponent(segs[segs.length - 1] ?? url)
}

function looksLikeUrl(text: string): boolean {
  const t = text.trim()
  if (!t || /\s/.test(t)) return false
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+/.test(t)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ReferenceList({
  value,
  onChange,
  meta,
  selectedId,
  onSelect,
  onAddLink,
  onReorder,
  onLabel,
  onDelete,
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel = 'References',
}: ReferenceListProps) {
  const items = parseReferences(value)

  const [draft, setDraft] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null) // expanded player
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const listRef = useRef<HTMLOListElement>(null)
  const pendingGripFocus = useRef<number | null>(null)
  const labelId = useId()

  // After a keyboard reorder the item moves to a new index (new id) — return focus
  // to its grip so arrow-key reordering can continue without losing the handle.
  useEffect(() => {
    if (pendingGripFocus.current == null) return
    const i = pendingGripFocus.current
    pendingGripFocus.current = null
    const grip = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-grip][data-index="${i}"]`,
    )
    grip?.focus()
  })

  function commit(next: Array<Pick<RefItem, 'kind' | 'url' | 'label'>>) {
    onChange?.(serializeReferences(next))
  }

  function addUrl(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    commit([...items, itemFromUrl(trimmed)])
    onAddLink?.(trimmed)
    setDraft('')
  }

  function addFiles(files: FileList | File[]) {
    const added = Array.from(files).map(f => itemFromUrl(f.name, f.name))
    if (!added.length) return
    commit([...items, ...added])
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = items.map(i => ({ kind: i.kind, url: i.url, label: i.label }))
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
    onReorder?.(from, to)
  }

  function remove(index: number) {
    const id = items[index]?.id
    commit(items.filter((_, i) => i !== index).map(i => ({ kind: i.kind, url: i.url, label: i.label })))
    if (id) onDelete?.(id)
    if (activeId === id) setActiveId(null)
  }

  function startEdit(item: RefItem) {
    setEditingId(item.id)
    setEditValue(item.label)
  }

  function commitEdit(index: number) {
    const item = items[index]
    if (!item) return
    const label = editValue.trim()
    const next = items.map((i, idx) =>
      idx === index ? { kind: i.kind, url: i.url, label } : { kind: i.kind, url: i.url, label: i.label },
    )
    commit(next)
    onLabel?.(item.id, label)
    setEditingId(null)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section
      className={styles.root}
      data-size={size}
      data-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onDragOver={disabled ? undefined : e => e.preventDefault()}
      onDrop={
        disabled
          ? undefined
          : e => {
              if (e.dataTransfer?.files?.length) {
                e.preventDefault()
                addFiles(e.dataTransfer.files)
              }
            }
      }
    >
      {!disabled && (
        <div
          className={styles.collector}
          onPaste={e => {
            const text = e.clipboardData.getData('text')
            if (looksLikeUrl(text)) {
              e.preventDefault()
              addUrl(text)
            }
          }}
        >
          <TextField
            value={draft}
            onChange={v => setDraft(v)}
            placeholder="Paste a link…"
            aria-label="Add a reference by link"
            size={size}
            leading={<LinkSimple aria-hidden="true" />}
          />
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => addUrl(draft)}
            disabled={!draft.trim()}
            aria-label="Add reference"
          >
            Add
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className={styles.empty} id={labelId}>
          {disabled ? 'No references.' : 'Paste a link or drop a file to start a reference shelf.'}
        </p>
      ) : (
        <ol className={styles.list} ref={listRef}>
          {items.map((item, index) => {
            const m = meta?.[item.url]
            const selected = selectedId === item.id
            const isEditing = editingId === item.id

            return (
              <li
                key={`${item.url}::${index}`}
                className={styles.row}
                data-kind={item.kind}
                data-selected={selected || undefined}
                data-dragging={dragIndex === index || undefined}
                data-over={overIndex === index && dragIndex !== index || undefined}
                draggable={!disabled && !isEditing}
                onDragStart={
                  disabled
                    ? undefined
                    : e => {
                        setDragIndex(index)
                        e.dataTransfer.effectAllowed = 'move'
                      }
                }
                onDragEnter={() => dragIndex != null && setOverIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDrop={
                  disabled
                    ? undefined
                    : e => {
                        // File drops are handled at the root; ignore them here.
                        if (e.dataTransfer?.files?.length) return
                        if (dragIndex != null && dragIndex !== index) {
                          e.stopPropagation()
                          move(dragIndex, index)
                        }
                        setDragIndex(null)
                        setOverIndex(null)
                      }
                }
              >
                {!disabled && (
                  <button
                    type="button"
                    className={styles.grip}
                    data-grip
                    data-index={index}
                    aria-label={`Reorder ${item.label || hostOf(item.url)} (use arrow keys)`}
                    onKeyDown={e => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        pendingGripFocus.current = index - 1
                        move(index, index - 1)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        pendingGripFocus.current = index + 1
                        move(index, index + 1)
                      }
                    }}
                  >
                    <DotsSixVertical aria-hidden="true" />
                  </button>
                )}

                <Card
                  item={item}
                  meta={m}
                  active={activeId === item.id}
                  selected={selected}
                  onActivate={() => setActiveId(item.id)}
                  onSelect={onSelect && !disabled ? () => onSelect(item.id) : undefined}
                />

                {!disabled && (
                  <div className={styles.controls}>
                    {isEditing ? (
                      <form
                        className={styles.editForm}
                        onSubmit={e => {
                          e.preventDefault()
                          commitEdit(index)
                        }}
                      >
                        <TextField
                          value={editValue}
                          onChange={v => setEditValue(v)}
                          placeholder="Label…"
                          aria-label={`Label for ${hostOf(item.url)}`}
                          size="sm"
                          autoFocus
                        />
                        <button type="submit" className={styles.iconBtn} aria-label="Save label">
                          <Check aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label="Cancel"
                          onClick={() => setEditingId(null)}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`Label ${item.label || hostOf(item.url)}`}
                          onClick={() => startEdit(item)}
                        >
                          <PencilSimple aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          data-danger
                          aria-label={`Delete ${item.label || hostOf(item.url)}`}
                          onClick={() => remove(index)}
                        >
                          <Trash aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// ─── Card (per-kind rendering) ────────────────────────────────────────────────

interface CardProps {
  item: RefItem
  meta?: RefMeta
  active: boolean
  selected: boolean
  onActivate: () => void
  onSelect?: () => void
}

function Card({ item, meta, active, selected, onActivate, onSelect }: CardProps) {
  const status = meta?.status ?? 'ready'
  const title = meta?.title || item.label
  const host = hostOf(item.url)

  // Players: a pressable facade that becomes a live embed iframe on activate.
  if ((item.kind === 'youtube' || item.kind === 'spotify') && item.embedUrl) {
    if (active) {
      return (
        <div className={styles.card} data-kind={item.kind}>
          <iframe
            className={styles.player}
            src={item.embedUrl}
            title={title || `${item.kind} player`}
            allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
            allowFullScreen
          />
          {(title || item.label) && <span className={styles.playerLabel}>{title}</span>}
        </div>
      )
    }
    const Logo = item.kind === 'youtube' ? YoutubeLogo : SpotifyLogo
    return (
      <button
        type="button"
        className={styles.card}
        data-kind={item.kind}
        data-facade
        data-selected={selected || undefined}
        onClick={() => {
          onActivate()
          onSelect?.()
        }}
        aria-label={`Play ${title || host}`}
      >
        {item.thumbnail ? (
          <span
            className={styles.thumb}
            style={{ backgroundImage: `url("${item.thumbnail}")` }}
            aria-hidden="true"
          />
        ) : (
          <span className={styles.thumb} data-glyph aria-hidden="true">
            <Logo />
          </span>
        )}
        <span className={styles.playDisc} aria-hidden="true">
          <Play weight="fill" />
        </span>
        <span className={styles.meta}>
          <span className={styles.kindTag}>
            <Logo aria-hidden="true" />
            {item.kind === 'youtube' ? 'YouTube' : 'Spotify'}
          </span>
          <span className={styles.cardTitle}>{title || host}</span>
          <span className={styles.cardSub}>{host}</span>
        </span>
      </button>
    )
  }

  // Image: a thumbnail chip with a caption.
  if (item.kind === 'image') {
    return (
      <CardShell selected={selected} onSelect={onSelect} label={item.label || fileNameOf(item.url)}>
        {status === 'error' ? (
          <span className={styles.thumb} data-glyph data-error aria-hidden="true">
            <Warning />
          </span>
        ) : (
          <span
            className={styles.thumb}
            style={{ backgroundImage: `url("${item.url}")` }}
            aria-hidden="true"
          />
        )}
        <span className={styles.meta}>
          <span className={styles.kindTag}>
            <ImageIcon aria-hidden="true" />
            Image
          </span>
          <span className={styles.cardTitle}>{item.label || fileNameOf(item.url)}</span>
          <span className={styles.cardSub}>{host}</span>
        </span>
      </CardShell>
    )
  }

  // File: a slug chip (local/asset reference — no cloud storage).
  if (item.kind === 'file') {
    const name = item.label || fileNameOf(item.url)
    const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toUpperCase()
    return (
      <CardShell selected={selected} onSelect={onSelect} label={name}>
        <span className={styles.thumb} data-glyph aria-hidden="true">
          <FileIcon />
        </span>
        <span className={styles.meta}>
          <span className={styles.kindTag}>
            <FileIcon aria-hidden="true" />
            File
          </span>
          <span className={styles.cardTitle}>{name}</span>
          {ext && <span className={styles.cardSub}>{ext}</span>}
        </span>
      </CardShell>
    )
  }

  // Web link card — rich when the app resolved `meta`, graceful host-only otherwise.
  return (
    <CardShell selected={selected} onSelect={onSelect} label={title || host}>
      {status === 'loading' ? (
        <span className={styles.thumb} data-skeleton aria-hidden="true" />
      ) : meta?.image && status !== 'error' ? (
        <span
          className={styles.thumb}
          style={{ backgroundImage: `url("${meta.image}")` }}
          aria-hidden="true"
        />
      ) : (
        <span className={styles.thumb} data-glyph data-error={status === 'error' || undefined} aria-hidden="true">
          {status === 'error' ? <Warning /> : <LinkSimple />}
        </span>
      )}
      <span className={styles.meta}>
        <span className={styles.kindTag}>
          <LinkSimple aria-hidden="true" />
          {host}
        </span>
        {status === 'loading' ? (
          <>
            <span className={styles.skelLine} data-w="long" aria-hidden="true" />
            <span className={styles.skelLine} data-w="short" aria-hidden="true" />
            <span className={styles.srOnly}>Loading preview…</span>
          </>
        ) : (
          <>
            <span className={styles.cardTitle}>{title || host}</span>
            <span className={styles.cardSub}>
              {status === 'error' ? "Couldn't load a preview — opens in browser" : meta?.description || item.url}
            </span>
          </>
        )}
      </span>
    </CardShell>
  )
}

// A clickable card shell for non-player kinds. Selecting is a button; the whole
// surface is the hit target so cards feel like objects, not link text.
function CardShell({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean
  onSelect?: () => void
  label: string
  children: React.ReactNode
}) {
  if (onSelect) {
    return (
      <button
        type="button"
        className={styles.card}
        data-selected={selected || undefined}
        onClick={onSelect}
        aria-label={label}
        aria-pressed={selected}
      >
        {children}
      </button>
    )
  }
  return (
    <div className={styles.card} data-selected={selected || undefined}>
      {children}
    </div>
  )
}
