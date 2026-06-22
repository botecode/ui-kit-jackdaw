// src/components/LyricCRUD/LyricCRUD.tsx
//
// The Write/Edit lyric experience for the app surface — a column of tactile
// lyric cards (LyricList) over the same recessed-well the rest of the kit is
// built from, each card (LyricCard) carrying the full CRUD affordance set: open
// in the editor, share, and delete-with-confirm.
//
// ── Why this isn't a webpage ──────────────────────────────────────────────────
// A webpage renders a notes list as flat <div>s with a hover dropdown and a
// window.confirm() for delete. This is the kit's hardware language instead: each
// lyric sits as a raised card on a recessed stage well, with a left-edge accent
// spine that lights with an LED bloom when the lyric is the one open in the
// editor (selected) — the same recessed-off / lit-on signature as every control
// on the shelf. The ⋮ opens the shared ContextMenu on the dark stage; destructive
// delete routes through the Dialog primitive (never a native confirm) so the
// warning stays inside the instrument and inside the theme. Depth, color and
// motion all come from tokens, so one card re-skins through every theme.
//
// ── Decisions (headless; resolved against KIT-LEAD.md) ────────────────────────
// • The lyric shape's `comments` field is typed as a single string — the card
//   renders it as the accent margin-note (the spec asks for "a comment in accent
//   color"). If the app later threads comments this becomes the latest-comment
//   summary; the contract field name is preserved either way.
// • `createdAt` is epoch-ms (number) and rendered in a <time> element with a
//   machine ISO dateTime + a short human label in the mono readout face.
// • The editor is NOT duplicated here. Edit/rename is a single intent — the title
//   button and the ⋮ "Edit" both fire onEdit(id), which opens the app's Write
//   screen (a LyricEditor). The card is the list/CRUD surface only.
// • LyricCard owns its own menu + delete-confirm state so it drops in
//   self-contained; the parent only receives the resolved intents.
// • Compose-mappable: LyricList → a Column of cards; the ⋮ menu → a menu sheet
//   (DropdownMenu / ModalBottomSheet on mobile); delete-confirm → an AlertDialog.

import { useRef, useState } from 'react'
import {
  DotsThreeVertical, PencilSimple, ShareNetwork, Trash, NotePencil, Plus, WarningCircle,
} from '@phosphor-icons/react'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import { Dialog } from '../Dialog'
import styles from './LyricCRUD.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

/** The lyric idea shape — the real data contract for the Write surface. */
export interface LyricIdea {
  id: string
  title: string
  text: string
  /** A pinned margin-note shown in the accent color. Empty string = none. */
  comments: string
  /** Creation time, epoch milliseconds. */
  createdAt: number
}

type Size = 'sm' | 'md'

export interface LyricCardProps {
  lyric: LyricIdea
  /** Open the lyric in the editor (the app's Write screen). Also the rename entry. */
  onEdit: (id: string) => void
  onShare: (id: string) => void
  onDelete: (id: string) => void
  /** This lyric is the one currently open in the editor — lights the accent spine. */
  selected?: boolean
  /** Locked (e.g. syncing) — inert + dimmed. */
  disabled?: boolean
  size?: Size
}

export interface LyricListProps {
  lyrics: LyricIdea[]
  onEdit: (id: string) => void
  onShare: (id: string) => void
  onDelete: (id: string) => void
  /** Create entry point — renders a "New" affordance in the header and empty state. */
  onNew?: () => void
  /** The lyric currently open in the editor. */
  selectedId?: string | null
  /** Async load in flight — shows skeleton rows. */
  loading?: boolean
  /** Load failed — shows the error face instead of the list. */
  error?: string | null
  size?: Size
  'aria-label'?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** First two non-empty lines of the lyric body, for the card excerpt. */
function excerpt(text: string): string {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join('\n')
}

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString()
}

// ── LyricCard ─────────────────────────────────────────────────────────────────

export function LyricCard({
  lyric,
  onEdit,
  onShare,
  onDelete,
  selected = false,
  disabled = false,
  size = 'md',
}: LyricCardProps) {
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [confirmOpen, setConfirmOpen] = useState(false)

  const ex = excerpt(lyric.text)

  function openMenu() {
    const el = menuBtnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuPos({ x: r.left, y: r.bottom + 4 })
    setMenuOpen(true)
  }

  const menuItems: MenuEntry[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <PencilSimple size={14} aria-hidden="true" />,
      onSelect: () => onEdit(lyric.id),
    },
    {
      id: 'share',
      label: 'Share',
      icon: <ShareNetwork size={14} aria-hidden="true" />,
      onSelect: () => onShare(lyric.id),
    },
    { id: 'sep', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash size={14} aria-hidden="true" />,
      danger: true,
      onSelect: () => setConfirmOpen(true),
    },
  ]

  return (
    <article
      className={styles.card}
      data-size={size}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      aria-current={selected || undefined}
    >
      {/* ── Accent spine — lights when this lyric is open in the editor ──────── */}
      <span className={styles.spine} aria-hidden="true" />

      <div className={styles.body}>
        {/* ── Title row ───────────────────────────────────────────────────── */}
        <div className={styles.titleRow}>
          <button
            className={styles.titleBtn}
            onClick={() => !disabled && onEdit(lyric.id)}
            disabled={disabled}
            aria-label={`Edit ${lyric.title}`}
            data-testid="lyric-title"
          >
            <span className={styles.title}>{lyric.title}</span>
          </button>

          <button
            ref={menuBtnRef}
            className={styles.menuBtn}
            onClick={openMenu}
            disabled={disabled}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Actions for ${lyric.title}`}
            data-testid="lyric-menu-btn"
          >
            <DotsThreeVertical size={size === 'sm' ? 16 : 18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* ── Excerpt — first two lines of the lyric ──────────────────────── */}
        {ex
          ? <p className={styles.excerpt} data-testid="lyric-excerpt">{ex}</p>
          : <p className={styles.excerptEmpty}>No words yet</p>}

        {/* ── Accent comment + timestamp ──────────────────────────────────── */}
        <div className={styles.footer}>
          {lyric.comments
            ? (
              <span className={styles.comment} data-testid="lyric-comment">
                <span className={styles.commentMark} aria-hidden="true">“</span>
                {lyric.comments}
              </span>
            )
            : <span />}
          <time className={styles.date} dateTime={isoDate(lyric.createdAt)}>
            {shortDate(lyric.createdAt)}
          </time>
        </div>
      </div>

      {/* ── ⋮ menu ──────────────────────────────────────────────────────────── */}
      {menuOpen && (
        <ContextMenu
          items={menuItems}
          open={menuOpen}
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setMenuOpen(false)}
          aria-label={`Actions for ${lyric.title}`}
        />
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete lyric?"
        size="sm"
        actions={
          <>
            <button
              className={styles.dialogBtn}
              onClick={() => setConfirmOpen(false)}
              data-testid="delete-cancel"
            >
              Cancel
            </button>
            <button
              className={styles.dialogBtnDanger}
              onClick={() => {
                onDelete(lyric.id)
                setConfirmOpen(false)
              }}
              data-testid="delete-confirm"
            >
              Delete
            </button>
          </>
        }
      >
        <p className={styles.confirmText}>
          “<strong>{lyric.title}</strong>” will be permanently deleted. This can’t be undone.
        </p>
      </Dialog>
    </article>
  )
}

// ── Skeleton card (loading) ─────────────────────────────────────────────────────

function SkeletonCard({ size }: { size: Size }) {
  return (
    <article className={styles.card} data-size={size} data-skeleton aria-hidden="true">
      <span className={styles.spine} />
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={`${styles.skel} ${styles.skelTitle}`} />
        </div>
        <span className={`${styles.skel} ${styles.skelLine}`} />
        <span className={`${styles.skel} ${styles.skelLineShort}`} />
      </div>
    </article>
  )
}

// ── LyricList ───────────────────────────────────────────────────────────────────

export function LyricList({
  lyrics,
  onEdit,
  onShare,
  onDelete,
  onNew,
  selectedId = null,
  loading = false,
  error = null,
  size = 'md',
  'aria-label': ariaLabel = 'Lyrics',
}: LyricListProps) {
  return (
    <section className={styles.root} data-size={size} aria-label={ariaLabel}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h2 className={styles.heading}>Lyrics</h2>
        {onNew && (
          <button className={styles.newBtn} onClick={onNew} data-testid="new-btn">
            <Plus size={14} weight="bold" aria-hidden="true" />
            New
          </button>
        )}
      </div>

      {/* ── List body ───────────────────────────────────────────────────────── */}
      <div className={styles.list} role="list" data-testid="lyric-list">
        {loading && (
          <div data-testid="lyric-loading">
            <SkeletonCard size={size} />
            <SkeletonCard size={size} />
            <SkeletonCard size={size} />
          </div>
        )}

        {!loading && error && (
          <div className={styles.face} data-testid="lyric-error" role="alert">
            <WarningCircle className={styles.faceIcon} size={28} weight="thin" aria-hidden="true" />
            <span className={styles.faceTitle}>Couldn’t load lyrics</span>
            <span className={styles.faceHint}>{error}</span>
          </div>
        )}

        {!loading && !error && lyrics.length === 0 && (
          <div className={styles.face} data-testid="lyric-empty">
            <NotePencil className={styles.faceIcon} size={28} weight="thin" aria-hidden="true" />
            <span className={styles.faceTitle}>Nothing written yet</span>
            <span className={styles.faceHint}>Start a lyric and it’ll live here.</span>
            {onNew && (
              <button className={styles.faceBtn} onClick={onNew} data-testid="empty-new-btn">
                <Plus size={14} weight="bold" aria-hidden="true" />
                Write a lyric
              </button>
            )}
          </div>
        )}

        {!loading && !error && lyrics.map(lyric => (
          <div key={lyric.id} role="listitem">
            <LyricCard
              lyric={lyric}
              onEdit={onEdit}
              onShare={onShare}
              onDelete={onDelete}
              selected={selectedId === lyric.id}
              size={size}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
