// src/components/Share/Share.tsx
import { useState, useRef } from 'react'
import { Dialog } from '../Dialog'
import styles from './Share.module.css'

export type ShareScope = 'project' | 'track'
export type ShareStatus =
  | 'idle' | 'generating' | 'waiting'
  | 'transferring' | 'done' | 'error'

export interface ShareProps {
  open: boolean
  scope: ShareScope
  target?: string
  code?: string
  status: ShareStatus
  progress?: number
  errorMessage?: string
  trackName?: string
  onScopeChange: (scope: ShareScope) => void
  onGenerate: () => void
  onCopy: () => void
  onCancel: () => void
}

// ── Private: segmented scope selector ────────────────────────────────────────

interface ScopeControlProps {
  scope: ShareScope
  onChange: (s: ShareScope) => void
  disabled?: boolean
}

function ScopeControl({ scope, onChange, disabled }: ScopeControlProps) {
  return (
    <div
      role="group"
      aria-label="What to send"
      className={styles.scopeControl}
      data-disabled={disabled || undefined}
    >
      {(['project', 'track'] as const).map((opt) => (
        <button
          key={opt}
          role="radio"
          aria-checked={scope === opt}
          className={styles.scopeOption}
          data-selected={scope === opt || undefined}
          disabled={disabled}
          onClick={() => onChange(opt)}
        >
          {opt === 'project' ? 'Project' : 'Track'}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Share({
  open,
  scope,
  target: _target,
  code,
  status,
  progress = 0,
  errorMessage,
  trackName,
  onScopeChange,
  onGenerate,
  onCopy,
  onCancel,
}: ShareProps) {
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dialogTitle =
    scope === 'track' && trackName
      ? `Send "${trackName}"`
      : scope === 'track'
      ? 'Send track'
      : 'Send project'

  const dismissible = status === 'idle' || status === 'done' || status === 'error'
  const isInProgress = status === 'generating' || status === 'transferring' || status === 'waiting'
  const showScopeControl = status === 'idle' || status === 'generating'
  const showCode = code != null && (
    status === 'waiting' || status === 'transferring' || status === 'done' || status === 'error'
  )
  const showCopyBtn = status === 'waiting' || status === 'transferring' || status === 'done'
  const showProgress = status === 'transferring'
  const progressPct = Math.round(Math.max(0, Math.min(1, progress)) * 100)

  function handleCopy() {
    onCopy()
    setCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={dialogTitle}
      dismissible={dismissible}
      size="sm"
      actions={
        <button className={styles.cancelBtn} onClick={onCancel}>
          {isInProgress ? 'Cancel' : 'Close'}
        </button>
      }
    >
      <div className={styles.body} data-status={status}>

        {/* ── Scope selector (idle / generating) ───────────────────────── */}
        {showScopeControl && (
          <div className={styles.scopeRow}>
            <span className={styles.fieldLabel}>Send</span>
            <ScopeControl
              scope={scope}
              onChange={onScopeChange}
              disabled={status === 'generating'}
            />
          </div>
        )}

        {/* ── Generating indicator ──────────────────────────────────────── */}
        {status === 'generating' && (
          <div className={styles.generating} role="status" aria-live="polite">
            <span className={styles.spinnerDot} aria-hidden="true" />
            <span className={styles.statusLabel}>Generating code…</span>
          </div>
        )}

        {/* ── Code hero ─────────────────────────────────────────────────── */}
        {showCode && (
          <div className={styles.codeWell} aria-label="Share code" aria-live="polite">
            <span className={styles.codeHero}>{code}</span>
          </div>
        )}

        {/* ── Copy button (waiting / transferring / done) ────────────────── */}
        {showCopyBtn && (
          <div className={styles.copyRow}>
            <button className={styles.copyBtn} onClick={handleCopy}>
              Copy code
            </button>
            {copied && (
              <span role="status" aria-live="polite" className={styles.copiedToast} data-visible>
                Copied!
              </span>
            )}
          </div>
        )}

        {/* ── Waiting status ─────────────────────────────────────────────── */}
        {status === 'waiting' && (
          <p role="status" aria-live="polite" className={styles.statusLabel}>
            Waiting for peer…
          </p>
        )}

        {/* ── Transfer progress ─────────────────────────────────────────── */}
        {showProgress && (
          <div className={styles.progressSection}>
            <div
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Transfer progress"
              className={styles.progressTrack}
            >
              <div
                className={styles.progressFill}
                style={{ '--_progress': String(Math.max(0, Math.min(1, progress))) } as React.CSSProperties}
              />
            </div>
            <span className={styles.progressLabel}>{progressPct}%</span>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────── */}
        {status === 'done' && (
          <p role="status" aria-live="polite" className={styles.doneLabel}>
            Transfer complete
          </p>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {status === 'error' && (
          <p role="alert" className={styles.errorLabel}>
            {errorMessage ?? 'Something went wrong. Try again.'}
          </p>
        )}

        {/* ── Generate button (idle only) ────────────────────────────────── */}
        {status === 'idle' && (
          <button className={styles.generateBtn} onClick={onGenerate}>
            Generate code
          </button>
        )}
      </div>
    </Dialog>
  )
}
