// src/components/PasswordEntry/PasswordEntry.tsx
import { LockSimple } from '@phosphor-icons/react'
import { TextField } from '../TextField'
import styles from './PasswordEntry.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * `set`   — sender protects the take with an optional content password.
 * `enter` — receiver supplies the password to unlock the incoming take.
 */
export type PasswordEntryMode = 'set' | 'enter'

export interface PasswordEntryProps {
  value: string
  onChange: (value: string) => void
  /** Fired on Enter or the submit button — the real intent (set / unlock). */
  onSubmit: (value: string) => void
  mode?: PasswordEntryMode
  /** Wrong-password (or set-failed) message. String renders an inline alert + retry. */
  error?: string | boolean
  disabled?: boolean
  autoFocus?: boolean
  size?: 'sm' | 'md'
  /** Override the submit button copy (defaults: set → "Set password", enter → "Unlock"). */
  submitLabel?: string
}

// ── Mode copy ─────────────────────────────────────────────────────────────────

const COPY: Record<PasswordEntryMode, { label: string; placeholder: string; submit: string }> = {
  set:   { label: 'Content password', placeholder: 'Optional password',  submit: 'Set password' },
  enter: { label: 'Content password', placeholder: 'Enter password',     submit: 'Unlock'       },
}

// ── Component ─────────────────────────────────────────────────────────────────
// A masked password field built on the kit TextField (type=password). Used both
// sender-side (set the optional content password) and receiver-side (enter it),
// with a wrong-password error state that keeps the field editable for retry.

export function PasswordEntry({
  value,
  onChange,
  onSubmit,
  mode = 'enter',
  error,
  disabled,
  autoFocus,
  size = 'md',
  submitLabel,
}: PasswordEntryProps) {
  const copy = COPY[mode]
  const canSubmit = !disabled && value.trim().length > 0

  function submit() {
    if (canSubmit) onSubmit(value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className={styles.root} data-mode={mode} data-size={size}>
      <div onKeyDown={handleKeyDown}>
        <TextField
          type="password"
          label={copy.label}
          placeholder={copy.placeholder}
          value={value}
          onChange={(v) => onChange(v)}
          error={error}
          disabled={disabled}
          autoFocus={autoFocus}
          size={size}
          leading={<LockSimple size={14} weight="regular" aria-hidden="true" />}
        />
      </div>
      <button
        type="button"
        className={styles.submit}
        onClick={submit}
        disabled={!canSubmit}
      >
        {submitLabel ?? copy.submit}
      </button>
    </div>
  )
}
