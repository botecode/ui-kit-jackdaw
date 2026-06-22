// src/components/IncomingShare/IncomingShare.tsx
import { useId } from 'react'
import {
  DeviceMobile,
  SlidersHorizontal,
  Waveform,
  NotePencil,
  LinkBreak,
} from '@phosphor-icons/react'
import styles from './IncomingShare.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────
// The receiver side of a share, reached by opening the Nioh deeplink
// (`jackdaw://share/<code>`). The bundle carries the phone companion's content
// types — voice ideas (which have a clip duration) and lyrics (which don't) — so
// `ShareItem` is one union keyed by `kind`. This is the canonical share-manifest
// shape: the (not-yet-built) MobileShareSheet — the sender sheet — types against
// the SAME shape, building a manifest straight from the VoiceIdea / LyricIdea
// library rows. Defined + exported here so both sides share one source of truth.

export type ShareItemKind = 'voice-idea' | 'lyric'

export interface ShareItem {
  id: string
  kind: ShareItemKind
  name: string
  /** Voice ideas carry a clip length (seconds). Omitted for lyrics. */
  durationSec?: number
  /** Transfer size in bytes — both kinds. */
  sizeBytes: number
}

export type ShareOrigin = 'phone' | 'daw'

export interface ShareManifest {
  /** Who is sharing — drives the "<Name> wants to share with you" header. */
  senderName: string
  /** Where it's coming from — another phone, or their Jackdaw desktop. */
  origin: ShareOrigin
  items: ShareItem[]
}

export type IncomingShareStatus =
  | 'preview' // default — manifest + Accept / Decline
  | 'accepting' // Accept pressed — transfer starting (→ TransferProgress)
  | 'declined' // dismissed, nothing saved (calm terminal)
  | 'expired' // the deeplink expired (clear error message)
  | 'invalid' // the deeplink is malformed / unknown (clear error message)

export interface IncomingShareProps {
  /** The incoming bundle. Optional: expired/invalid links may carry no manifest. */
  manifest?: ShareManifest
  status?: IncomingShareStatus
  size?: 'sm' | 'md'
  /** Start the transfer (the parent swaps in TransferProgress). */
  onAccept: () => void
  /** Dismiss, nothing saved. */
  onDecline: () => void
  /** Dismiss a terminal state (declined/expired/invalid). Defaults to onDecline. */
  onDismiss?: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  return `${Math.round(bytes / 1000)} KB`
}

const KIND_NOUN: Record<ShareItemKind, [singular: string, plural: string]> = {
  'voice-idea': ['voice idea', 'voice ideas'],
  lyric: ['lyric', 'lyrics'],
}

// "3 voice ideas · 1 lyric" — count each kind, drop zeros, keep the union order.
function summarize(items: ShareItem[]): string {
  const order: ShareItemKind[] = ['voice-idea', 'lyric']
  return order
    .map(kind => {
      const n = items.filter(it => it.kind === kind).length
      if (n === 0) return null
      const [one, many] = KIND_NOUN[kind]
      return `${n} ${n === 1 ? one : many}`
    })
    .filter(Boolean)
    .join(' · ')
}

const ORIGIN_LABEL: Record<ShareOrigin, string> = {
  phone: 'from their phone',
  daw: 'from their Jackdaw desktop',
}

const ERROR_COPY: Record<'expired' | 'invalid', { title: string; detail: string }> = {
  expired: {
    title: 'This share link has expired',
    detail: 'Ask them to share again — links stay open for a short while for safety.',
  },
  invalid: {
    title: "This share link can't be opened",
    detail: 'It looks broken or has already been used. Ask them to send a fresh one.',
  },
}

// ── Item row ──────────────────────────────────────────────────────────────────
// A raised chip on the recessed well: bespoke audio glyph · name · mono readout.

function ItemRow({ item }: { item: ShareItem }) {
  const Glyph = item.kind === 'voice-idea' ? Waveform : NotePencil
  return (
    <li className={styles.item} data-kind={item.kind}>
      <span className={styles.itemGlyph} aria-hidden="true">
        <Glyph size={16} weight="regular" />
      </span>
      <span className={styles.itemName}>{item.name}</span>
      <span className={styles.itemMeta}>
        {item.durationSec != null && (
          <>
            <span className={styles.itemDur}>{formatDuration(item.durationSec)}</span>
            <span className={styles.itemMetaSep} aria-hidden="true">
              ·
            </span>
          </>
        )}
        <span className={styles.itemSize}>{formatSize(item.sizeBytes)}</span>
      </span>
    </li>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// The receiver's deliberate choice surface. Never auto-writes — Accept is always
// an explicit press that begins the transfer; Decline drops the bundle.
//
// Why this isn't a webpage: not a flat grey file list with a blue Accept and a
// toast. The incoming bundle sits in a recessed tape-well like a tray of reels,
// each idea a raised chip with a hand-drawn glyph and a mono readout; Accept
// lights a green LED (go) while Decline stays a quiet recessed ghost; an expired
// link is a calm dark readout with one amber dot, never a red error banner; and
// where it's from reads through a hardware device glyph, not an emoji. Every
// surface/depth/color is a token, so it re-skins through every theme.

export function IncomingShare({
  manifest,
  status = 'preview',
  size = 'md',
  onAccept,
  onDecline,
  onDismiss,
}: IncomingShareProps) {
  const titleId = useId()

  // No manifest while trying to preview/accept = a link we couldn't resolve.
  const resolved: IncomingShareStatus =
    (status === 'preview' || status === 'accepting') && !manifest ? 'invalid' : status

  const dismiss = onDismiss ?? onDecline
  const isError = resolved === 'expired' || resolved === 'invalid'

  // ── Terminal: expired / invalid link ──────────────────────────────────────
  if (isError) {
    const copy = ERROR_COPY[resolved as 'expired' | 'invalid']
    return (
      <section
        className={styles.surface}
        data-status={resolved}
        data-size={size}
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className={styles.notice} data-tone="error">
          <span className={styles.noticeIcon} aria-hidden="true">
            <LinkBreak size={22} weight="regular" />
          </span>
          <div className={styles.noticeText} role="alert">
            <h2 id={titleId} className={styles.noticeTitle}>
              {copy.title}
            </h2>
            <p className={styles.noticeDetail}>{copy.detail}</p>
          </div>
        </div>
        <div className={styles.actions} data-single>
          <button type="button" className={styles.ghostBtn} onClick={dismiss}>
            Dismiss
          </button>
        </div>
      </section>
    )
  }

  // ── Terminal: declined ─────────────────────────────────────────────────────
  if (resolved === 'declined') {
    return (
      <section
        className={styles.surface}
        data-status="declined"
        data-size={size}
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className={styles.notice} data-tone="calm">
          <span className={styles.noticeIcon} aria-hidden="true">
            <NotePencil size={22} weight="regular" />
          </span>
          <div className={styles.noticeText} role="status">
            <h2 id={titleId} className={styles.noticeTitle}>
              Declined
            </h2>
            <p className={styles.noticeDetail}>Nothing was saved.</p>
          </div>
        </div>
        <div className={styles.actions} data-single>
          <button type="button" className={styles.ghostBtn} onClick={dismiss}>
            Dismiss
          </button>
        </div>
      </section>
    )
  }

  // ── Preview / accepting (manifest present) ─────────────────────────────────
  // (resolved is 'preview' | 'accepting' and manifest is defined here.)
  const { senderName, origin, items } = manifest!
  const accepting = resolved === 'accepting'
  const OriginGlyph = origin === 'phone' ? DeviceMobile : SlidersHorizontal

  return (
    <section
      className={styles.surface}
      data-status={resolved}
      data-size={size}
      role="dialog"
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <span className={styles.originGlyph} aria-hidden="true">
          <OriginGlyph size={size === 'sm' ? 20 : 24} weight="regular" />
        </span>
        <div className={styles.headerText}>
          <h2 id={titleId} className={styles.title}>
            {senderName} wants to share with you
          </h2>
          <p className={styles.origin}>{ORIGIN_LABEL[origin]}</p>
        </div>
      </header>

      <div className={styles.manifest}>
        <p className={styles.summary}>{summarize(items)}</p>
        <ul className={styles.well}>
          {items.map(item => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {accepting && (
        <div className={styles.starting} role="status" aria-live="polite">
          <span className={styles.startingDot} aria-hidden="true" />
          <span>Starting transfer…</span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.acceptBtn}
          onClick={onAccept}
          disabled={accepting}
        >
          Accept
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={onDecline}
          disabled={accepting}
        >
          Decline
        </button>
      </div>
    </section>
  )
}
