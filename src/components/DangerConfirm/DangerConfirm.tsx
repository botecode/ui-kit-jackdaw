// src/components/DangerConfirm/DangerConfirm.tsx
//
// The kit's destructive confirmation — the last gate before something can't be
// undone (delete a song, wipe a take, clear a library). It composes the kit
// Dialog + TextField + Button rather than re-implementing an overlay, so it
// inherits the focus trap, Esc/backdrop dismissal, themed portal and return-focus
// for free, and only owns the one thing that makes a destructive confirm its own
// control: the friction.
//
// Two modes:
//   • plain      — the destructive button is live immediately (a normal confirm).
//   • type-to-confirm (`confirmPhrase`) — GitHub's pattern: the button stays dead
//     until you type the exact phrase, so muscle-memory can't blow away work.
//
// Why this isn't a webpage confirm(): the destructive action is a *lit red LED*
// (Button `danger` — the same semantic red as arm/record), not a flat red box; a
// warning glyph carries the tone on tokens alone so it reskins through every
// theme; and the whole thing is presentational + controlled — it has no side
// effects of its own, it only reports intent (onConfirm / onCancel) so it drops
// into the app with zero rework.
import { useEffect, useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import { Dialog } from '../Dialog'
import { TextField } from '../TextField'
import { Button } from '../Button'
import styles from './DangerConfirm.module.css'

export interface DangerConfirmProps {
  /** Controlled visibility. */
  open: boolean
  /** The question — e.g. "Delete song?". Labels the dialog for AT. */
  title: string
  /** The consequence — e.g. "This can't be undone — everything will be lost." */
  message: React.ReactNode
  /** The verb on the destructive button — e.g. "Delete song". */
  destructiveLabel: string
  /** Fired when the (enabled) destructive action is confirmed. Presentational — the caller does the deed. */
  onConfirm: () => void
  /** Fired on Cancel, Esc, or backdrop click. */
  onCancel: () => void
  /**
   * When set, gates the destructive button behind an EXACT match of this phrase
   * typed into a text field (e.g. "delete My Song"). Absent → plain confirm.
   */
  confirmPhrase?: string
}

export function DangerConfirm({
  open,
  title,
  message,
  destructiveLabel,
  onConfirm,
  onCancel,
  confirmPhrase,
}: DangerConfirmProps) {
  const [typed, setTyped] = useState('')

  // Clear the field every time the dialog opens — a stale match from a prior
  // open must never leave the destructive button hot on the next.
  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  const gated = confirmPhrase != null
  // EXACT match — case- and whitespace-sensitive, per the type-to-confirm contract.
  const matched = !gated || typed === confirmPhrase
  const canConfirm = !gated || matched

  function confirm() {
    if (canConfirm) onConfirm()
  }

  // Enter in the field confirms once the phrase matches — the field is the
  // focus target, so typing → Enter is the whole gesture (GitHub-style).
  function handleFieldKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && matched) {
      e.preventDefault()
      confirm()
    }
  }

  const actions = (
    <>
      <Button variant="default" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="danger" disabled={!canConfirm} onClick={confirm}>
        {destructiveLabel}
      </Button>
    </>
  )

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      actions={actions}
    >
      <div className={styles.body}>
        <span className={styles.warnIcon} aria-hidden="true">
          <Warning weight="fill" size={22} />
        </span>
        <div className={styles.copy}>
          <p className={styles.message}>{message}</p>

          {gated && (
            <div className={styles.confirmBlock}>
              {/* Visible rich instruction (aria-hidden — the field's aria-label
                  carries the same words as a flat string for AT). */}
              <p className={styles.instruction} aria-hidden="true">
                Type <b className={styles.phrase}>{confirmPhrase}</b> to confirm
              </p>
              <TextField
                value={typed}
                onChange={setTyped}
                aria-label={`Type ${confirmPhrase} to confirm`}
                autoFocus
                size="sm"
                onKeyDown={handleFieldKeyDown}
              />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
