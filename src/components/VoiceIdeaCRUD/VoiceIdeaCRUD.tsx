// src/components/VoiceIdeaCRUD/VoiceIdeaCRUD.tsx
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, ShareNetwork, DotsThreeVertical, PencilSimple, Trash, Cloud } from '@phosphor-icons/react'
import { SegmentedControl } from '../SegmentedControl'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import { Dialog } from '../Dialog'
import styles from './VoiceIdeaCRUD.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceIdeaKind = 'idea' | 'master'

export interface VoiceIdea {
  id: string
  title: string
  durationSec: number
  /** App-owned audio source; the kit carries it but never plays it. */
  audioUri: string
  /** Mirrored to the cloud / phone. */
  synced: boolean
  kind: VoiceIdeaKind
}

export type VoiceIdeaFilter = 'all' | 'idea' | 'master'

// ─── Helpers ────────────────────────────────────────────────────────────────────

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── VoiceIdeaRow ─────────────────────────────────────────────────────────────

export interface VoiceIdeaRowProps {
  idea: VoiceIdea
  /** Controlled: the row is the one currently rolling (lights green). */
  playing?: boolean
  /** Controlled: the title is being edited inline. */
  renaming?: boolean
  size?: 'sm' | 'md'
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onShare: (id: string) => void
  /** Commit a new title (Enter / blur while renaming). */
  onRename: (id: string, title: string) => void
  /** Abandon an inline rename (Escape). */
  onRenameCancel?: () => void
  /** Open the ⋮ menu — the list anchors a ContextMenu at the button's rect. */
  onOpenMenu?: (id: string, rect: DOMRect) => void
}

export function VoiceIdeaRow({
  idea,
  playing = false,
  renaming = false,
  size = 'md',
  onPlay,
  onPause,
  onShare,
  onRename,
  onRenameCancel,
  onOpenMenu,
}: VoiceIdeaRowProps) {
  const [draft, setDraft] = useState(idea.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  // Re-seed the draft each time the row enters rename mode, and focus + select.
  useEffect(() => {
    if (renaming) {
      setDraft(idea.title)
      cancelledRef.current = false
      // Explicit focus (WKWebView won't focus on the click that opened rename).
      const input = inputRef.current
      if (input) {
        input.focus()
        input.select()
      }
    }
  }, [renaming, idea.title])

  function commit() {
    if (cancelledRef.current) return
    const next = draft.trim()
    if (next && next !== idea.title) onRename(idea.id, next)
    else onRenameCancel?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = draft.trim()
      if (next) onRename(idea.id, next)
      else onRenameCancel?.()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelledRef.current = true
      onRenameCancel?.()
    }
  }

  return (
    <div
      className={styles.row}
      data-size={size}
      data-playing={playing || undefined}
      data-renaming={renaming || undefined}
    >
      {/* ── Play / pause — recessed off, green LED on ──────────────────────── */}
      <button
        type="button"
        className={styles.play}
        data-playing={playing || undefined}
        aria-label={playing ? `Pause ${idea.title}` : `Play ${idea.title}`}
        onClick={() => (playing ? onPause(idea.id) : onPlay(idea.id))}
      >
        {playing
          ? <Pause size={15} weight="fill" aria-hidden="true" />
          : <Play  size={15} weight="fill" aria-hidden="true" />}
      </button>

      {/* ── Title (or inline rename) ───────────────────────────────────────── */}
      <div className={styles.titleWrap}>
        {renaming ? (
          <input
            ref={inputRef}
            className={styles.renameInput}
            value={draft}
            aria-label={`Rename ${idea.title}`}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
          />
        ) : (
          <span className={styles.title}>{idea.title}</span>
        )}
        {idea.kind === 'master' && (
          <span className={styles.kindTag} data-testid="kind-tag">Master</span>
        )}
        {idea.synced && (
          <Cloud className={styles.sync} size={13} aria-label="Synced" />
        )}
      </div>

      {/* ── Duration — mono digital readout ────────────────────────────────── */}
      <span className={styles.duration}>{formatDuration(idea.durationSec)}</span>

      {/* ── Share ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={`Share ${idea.title}`}
        onClick={() => onShare(idea.id)}
      >
        <ShareNetwork size={16} aria-hidden="true" />
      </button>

      {/* ── ⋮ menu ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={`${idea.title} options`}
        aria-haspopup="menu"
        onClick={e => {
          // Focus the trigger first so ContextMenu can return focus here on close
          // (WKWebView does not focus a <button> on click).
          e.currentTarget.focus()
          onOpenMenu?.(idea.id, e.currentTarget.getBoundingClientRect())
        }}
      >
        <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── VoiceIdeaList ────────────────────────────────────────────────────────────

export interface VoiceIdeaListProps {
  ideas: VoiceIdea[]
  /** Controlled play state — only one row rolls at a time (the app owns audio). */
  playingId?: string | null
  size?: 'sm' | 'md'
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onShare: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  'aria-label'?: string
}

const FILTER_OPTIONS = [
  { value: 'all',    label: 'All' },
  { value: 'idea',   label: 'Ideas' },
  { value: 'master', label: 'Masters' },
]

export function VoiceIdeaList({
  ideas,
  playingId = null,
  size = 'md',
  onPlay,
  onPause,
  onShare,
  onRename,
  onDelete,
  'aria-label': ariaLabel = 'Voice ideas',
}: VoiceIdeaListProps) {
  const [filter, setFilter]   = useState<VoiceIdeaFilter>('all')
  const [menu, setMenu]       = useState<{ id: string; x: number; y: number } | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.kind === filter)
  const confirmIdea = confirmId ? ideas.find(i => i.id === confirmId) ?? null : null
  const menuIdea = menu ? ideas.find(i => i.id === menu.id) ?? null : null

  function openMenu(id: string, rect: DOMRect) {
    // Anchor at the button's bottom-right so the menu drops below-left of the ⋮.
    setMenu({ id, x: rect.right, y: rect.bottom })
  }

  const menuItems: MenuEntry[] = menuIdea
    ? [
        {
          id: 'rename',
          label: 'Rename',
          icon: <PencilSimple size={15} aria-hidden="true" />,
          onSelect: () => setRenameId(menuIdea.id),
        },
        {
          id: 'share',
          label: 'Share',
          icon: <ShareNetwork size={15} aria-hidden="true" />,
          onSelect: () => onShare(menuIdea.id),
        },
        { id: 'sep', separator: true },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash size={15} aria-hidden="true" />,
          danger: true,
          onSelect: () => setConfirmId(menuIdea.id),
        },
      ]
    : []

  return (
    <section className={styles.list} data-size={size} aria-label={ariaLabel}>
      {/* ── Filter bar — composes the kit SegmentedControl ─────────────────── */}
      <div className={styles.filterBar}>
        <SegmentedControl
          options={FILTER_OPTIONS}
          value={filter}
          onChange={v => setFilter(v as VoiceIdeaFilter)}
          size={size}
          aria-label="Filter voice ideas"
        />
      </div>

      {/* ── Rows ───────────────────────────────────────────────────────────── */}
      {ideas.length === 0 ? (
        <div className={styles.empty} data-testid="voice-empty">
          <div className={styles.emptyGlyph} aria-hidden="true">
            <Cloud size={26} weight="thin" />
          </div>
          <span className={styles.emptyTitle}>Nothing in the Nest yet</span>
          <span className={styles.emptyHint}>Hum an idea on your phone — it lands here.</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty} data-testid="voice-empty-filtered">
          <span className={styles.emptyTitle}>No {filter === 'master' ? 'masters' : 'ideas'} here</span>
          <span className={styles.emptyHint}>Switch the filter to see more.</span>
        </div>
      ) : (
        <ul className={styles.rows} role="list">
          {filtered.map(idea => (
            <li key={idea.id} role="listitem">
              <VoiceIdeaRow
                idea={idea}
                size={size}
                playing={playingId === idea.id}
                renaming={renameId === idea.id}
                onPlay={onPlay}
                onPause={onPause}
                onShare={onShare}
                onRename={(id, title) => { setRenameId(null); onRename(id, title) }}
                onRenameCancel={() => setRenameId(null)}
                onOpenMenu={openMenu}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── ⋮ menu ─────────────────────────────────────────────────────────── */}
      {menu && menuIdea && (
        <ContextMenu
          items={menuItems}
          open
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          aria-label={`${menuIdea.title} options`}
        />
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────────── */}
      <Dialog
        open={confirmIdea !== null}
        onClose={() => setConfirmId(null)}
        size="sm"
        title="Delete recording?"
        aria-label="Delete recording"
        actions={
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.confirmCancel}
              onClick={() => setConfirmId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDelete}
              onClick={() => {
                if (confirmIdea) onDelete(confirmIdea.id)
                setConfirmId(null)
              }}
            >
              Delete
            </button>
          </div>
        }
      >
        <p className={styles.confirmBody}>
          “{confirmIdea?.title}” will be removed from the Nest. This can’t be undone.
        </p>
      </Dialog>
    </section>
  )
}
