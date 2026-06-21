// src/components/ImportFirst/ImportFirst.tsx
import { DownloadSimple } from '@phosphor-icons/react'
import styles from './ImportFirst.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImportFirstProps {
  /** The song the incoming take belongs to, absent from this project. */
  songName: string
  /** What the take is, in object form — "this vocal", "this take" (default). */
  itemLabel?: string
  /** Import in progress — disables the actions and shows an importing label. */
  busy?: boolean
  onImport: () => void
  onCancel: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
// A calm, on-brand prompt shown when the target song isn't in the project yet.
// Not an error — a gentle "import this first" with a clear primary action.
//
// Why this isn't a webpage: not a modal error with a red icon and "OK". The badge
// is a warm amber attention well (recessed, tinted), the copy is plain and human,
// and the import is a lit accent action — a calm next step on the instrument, not
// a dialog scolding you for a missing file.

export function ImportFirst({ songName, itemLabel = 'this take', busy, onImport, onCancel }: ImportFirstProps) {
  return (
    <div className={styles.root} data-busy={busy || undefined}>
      <div className={styles.icon} aria-hidden="true">
        <DownloadSimple size={22} weight="regular" />
      </div>

      <h3 className={styles.heading}>Import {songName} first</h3>

      <p className={styles.body}>
        You don't have {songName}. Import it to add {itemLabel}.
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.importBtn}
          onClick={onImport}
          disabled={busy}
        >
          {busy && <span className={styles.spinnerDot} aria-hidden="true" />}
          {busy ? 'Importing…' : `Import ${songName}`}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
