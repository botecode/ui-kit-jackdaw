// src/components/Share/Share.tsx
import { useState, useRef } from 'react'
import { Copy, Check, ArrowsClockwise } from '@phosphor-icons/react'
import { Dialog } from '../Dialog'
import { TextField } from '../TextField'
import styles from './Share.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransferRole = 'sender' | 'receiver'

export type TransferPhase =
  | 'idle'
  | 'manifest'
  | 'code'
  | 'connecting'
  | 'transferring'
  | 'success'
  | 'error'
  | 'confirm'
  | 'applied'

export type ErrorKind =
  | 'expired'
  | 'no-peer'
  | 'dropped'
  | 'failed'
  | 'version-mismatch'

export interface TakeManifest {
  songName: string
  takeLabel: string
  takeNumber: number
  durationSeconds: number
  trackCount: number
  sizeBytes: number
  hasLyrics: boolean
  hasChords: boolean
}

export interface TransferState {
  role: TransferRole
  phase: TransferPhase
  progress?: number
  error?: { kind: ErrorKind; message: string }
}

export interface ShareProps {
  open: boolean
  transfer: TransferState
  manifest?: TakeManifest
  code?: string
  peerName?: string
  onGenerateCode: () => void
  /** Called by the parent when the transfer begins (peer connected — engine-driven, not a button). */
  onSend: () => void
  onEnterCode: (code: string) => void
  onAccept: () => void
  onCancel: () => void
  onRetry: () => void
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

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  'expired':          'Pairing code expired — generate a new one.',
  'no-peer':          'No peer connected. Share the code and try again.',
  'dropped':          'Connection dropped. Check your network.',
  'failed':           'Transfer failed. Try again.',
  'version-mismatch': 'Incompatible version — the other device needs to update Jackdaw.',
}

// ── ShareCodeReadout ──────────────────────────────────────────────────────────
// Hero code display: recessed stage well + large mono text + copy button.
// data-active when the code is live (connecting/transferring).

interface ShareCodeReadoutProps {
  code: string
  active?: boolean
}

function ShareCodeReadout({ code, active }: ShareCodeReadoutProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy() {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.codeReadout}>
      <div
        className={styles.codeWell}
        data-active={active || undefined}
        aria-label="Pairing code"
        aria-live="polite"
      >
        <span className={styles.codeHero}>{code}</span>
      </div>
      <div className={styles.copyRow}>
        <button
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label="Copy pairing code"
        >
          {copied
            ? <Check size={14} weight="bold" aria-hidden="true" />
            : <Copy size={14} weight="regular" aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy code'}</span>
        </button>
        {copied && (
          <span role="status" aria-live="polite" className={styles.copiedToast}>
            Copied!
          </span>
        )}
      </div>
    </div>
  )
}

// ── TakeManifestCard ──────────────────────────────────────────────────────────
// Shows the take manifest — song, take label/number, stats, optional badges.

interface TakeManifestCardProps {
  manifest: TakeManifest
}

function TakeManifestCard({ manifest }: TakeManifestCardProps) {
  const { songName, takeLabel, takeNumber, durationSeconds, trackCount, sizeBytes, hasLyrics, hasChords } = manifest

  return (
    <div className={styles.manifestCard}>
      <div className={styles.manifestHeader}>
        <span className={styles.manifestSong}>{songName}</span>
        <span className={styles.manifestTakeLabel}>
          {takeLabel || `Take ${takeNumber}`}
          <span className={styles.manifestTakeNumber}>#{takeNumber}</span>
        </span>
      </div>
      <dl className={styles.manifestStats}>
        <div className={styles.manifestStat}>
          <dt>Duration</dt>
          <dd>{formatDuration(durationSeconds)}</dd>
        </div>
        <div className={styles.manifestStat}>
          <dt>Tracks</dt>
          <dd>{trackCount}</dd>
        </div>
        <div className={styles.manifestStat}>
          <dt>Size</dt>
          <dd>{formatSize(sizeBytes)}</dd>
        </div>
      </dl>
      {(hasLyrics || hasChords) && (
        <div className={styles.manifestBadges}>
          {hasLyrics && <span className={styles.manifestBadge} data-kind="lyrics">Lyrics</span>}
          {hasChords && <span className={styles.manifestBadge} data-kind="chords">Chords</span>}
        </div>
      )}
    </div>
  )
}

// ── TransferStatus ────────────────────────────────────────────────────────────
// LED dot + label for connecting/transferring/success/error.

type StatusVariant = 'connecting' | 'transferring' | 'success' | 'error'

interface TransferStatusProps {
  variant: StatusVariant
  label?: string
}

function TransferStatus({ variant, label }: TransferStatusProps) {
  const defaultLabel: Record<StatusVariant, string> = {
    connecting:   'Connecting…',
    transferring: 'Transferring…',
    success:      'Complete',
    error:        'Failed',
  }

  return (
    <div className={styles.transferStatus} data-variant={variant} role="status" aria-live="polite">
      <span className={styles.statusDot} aria-hidden="true" />
      <span className={styles.statusLabel}>{label ?? defaultLabel[variant]}</span>
    </div>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number
  label?: string
}

function ProgressBar({ progress, label }: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100)
  return (
    <div className={styles.progressSection}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Transfer progress'}
        className={styles.progressTrack}
      >
        <div
          className={styles.progressFill}
          style={{ '--_progress': String(Math.max(0, Math.min(1, progress))) } as React.CSSProperties}
        />
      </div>
      <span className={styles.progressLabel} aria-hidden="true">{pct}%</span>
    </div>
  )
}

// ── ConfirmApply ──────────────────────────────────────────────────────────────
// Receiver's deliberate apply step — immutable Takes, so this is explicit.

interface ConfirmApplyProps {
  manifest: TakeManifest
  peerName?: string
  onAccept: () => void
  onCancel: () => void
}

function ConfirmApply({ manifest, peerName, onAccept, onCancel }: ConfirmApplyProps) {
  const { songName, takeLabel, takeNumber } = manifest
  const label = takeLabel || `Take ${takeNumber}`
  const from = peerName ? ` from ${peerName}` : ''

  return (
    <div className={styles.confirmSection}>
      <p className={styles.confirmSummary}>
        Add <strong>{label}</strong>{from} to <strong>{songName}</strong>?
      </p>
      <p className={styles.confirmDetail}>
        Takes are immutable snapshots. This adds Take {takeNumber} to the project history
        — you can always revert to any previous take.
      </p>
      <div className={styles.confirmActions}>
        <button className={styles.applyBtn} onClick={onAccept}>
          Apply
        </button>
        <button className={styles.cancelInlineBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Share({
  open,
  transfer,
  manifest,
  code,
  peerName,
  onGenerateCode,
  onSend: _onSend,
  onEnterCode,
  onAccept,
  onCancel,
  onRetry,
}: ShareProps) {
  const { role, phase, progress = 0, error } = transfer
  const [codeInput, setCodeInput] = useState('')

  const isSender   = role === 'sender'
  const isReceiver = role === 'receiver'

  const dismissible =
    phase === 'idle' || phase === 'success' || phase === 'error' || phase === 'applied'

  // LED bloom active when there's a live pairing code (sender side)
  const codeActive = phase === 'connecting' || phase === 'transferring'

  const TITLE: Record<TransferPhase, string> = {
    idle:         isSender ? 'Send a Take' : 'Receive a Take',
    manifest:     isSender ? 'Send a Take' : 'Receive a Take',
    code:         'Send a Take',
    connecting:   'Connecting…',
    transferring: isSender ? 'Sending…' : 'Receiving…',
    success:      'Take Sent',
    error:        isSender ? 'Send Failed' : 'Receive Failed',
    confirm:      'Apply Take?',
    applied:      'Take Applied',
  }

  function handleConnect() {
    const trimmed = codeInput.trim()
    if (trimmed) onEnterCode(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConnect()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={TITLE[phase]}
      dismissible={dismissible}
      size="sm"
      actions={
        <button className={styles.footerBtn} onClick={onCancel}>
          {dismissible ? 'Close' : 'Cancel'}
        </button>
      }
    >
      <div className={styles.body} data-role={role} data-phase={phase}>

        {/* ── Sender: idle — preparing (manifest not yet loaded) ────────── */}
        {isSender && phase === 'idle' && (
          <div className={styles.preparing} role="status" aria-live="polite">
            <span className={styles.spinnerDot} aria-hidden="true" />
            <span className={styles.preparingLabel}>Preparing take…</span>
          </div>
        )}

        {/* ── Receiver: idle — enter code ───────────────────────────────── */}
        {isReceiver && phase === 'idle' && (
          <div className={styles.codeEntry} onKeyDown={handleKeyDown}>
            <TextField
              label="Pairing code"
              value={codeInput}
              onChange={setCodeInput}
              placeholder="7-tuna-zebra-piano"
              autoFocus
            />
            <button
              className={styles.primaryBtn}
              onClick={handleConnect}
              disabled={!codeInput.trim()}
            >
              Connect
            </button>
          </div>
        )}

        {/* ── Manifest card (both roles in manifest phase; sender also in code) ── */}
        {manifest && (phase === 'manifest' || (isSender && phase === 'code')) && (
          <TakeManifestCard manifest={manifest} />
        )}

        {/* ── Sender: manifest — generate code action ───────────────────── */}
        {isSender && phase === 'manifest' && (
          <button className={styles.primaryBtn} onClick={onGenerateCode}>
            Generate code
          </button>
        )}

        {/* ── Receiver: manifest — accept action ────────────────────────── */}
        {isReceiver && phase === 'manifest' && (
          <div className={styles.manifestActions}>
            <button className={styles.primaryBtn} onClick={onAccept}>
              Accept
            </button>
          </div>
        )}

        {/* ── Code readout (sender: code + connecting + transferring) ──────── */}
        {isSender && code && (phase === 'code' || phase === 'connecting' || phase === 'transferring') && (
          <ShareCodeReadout code={code} active={codeActive} />
        )}

        {/* ── Sender: code — waiting hint ────────────────────────────────── */}
        {isSender && phase === 'code' && (
          <p className={styles.waitingHint} role="status" aria-live="polite">
            Waiting for peer to enter this code…
          </p>
        )}

        {/* ── Connecting (both roles) ─────────────────────────────────────── */}
        {phase === 'connecting' && (
          <TransferStatus variant="connecting" />
        )}

        {/* ── Transferring (both roles) ───────────────────────────────────── */}
        {phase === 'transferring' && (
          <>
            <ProgressBar
              progress={progress}
              label={isSender ? 'Send progress' : 'Receive progress'}
            />
            <TransferStatus
              variant="transferring"
              label={isSender
                ? `Sending… ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`
                : `Receiving… ${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`}
            />
          </>
        )}

        {/* ── Sender: success ─────────────────────────────────────────────── */}
        {isSender && phase === 'success' && (
          <TransferStatus variant="success" label="Take sent successfully" />
        )}

        {/* ── Receiver: confirm ───────────────────────────────────────────── */}
        {isReceiver && phase === 'confirm' && manifest && (
          <ConfirmApply
            manifest={manifest}
            peerName={peerName}
            onAccept={onAccept}
            onCancel={onCancel}
          />
        )}

        {/* ── Receiver: applied ───────────────────────────────────────────── */}
        {isReceiver && phase === 'applied' && (
          <TransferStatus variant="success" label="Take applied to project" />
        )}

        {/* ── Error (both roles) ──────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className={styles.errorSection}>
            <p role="alert" className={styles.errorMessage}>
              {error?.message
                ? error.message
                : error?.kind
                ? ERROR_MESSAGES[error.kind]
                : 'Something went wrong. Try again.'}
            </p>
            <button className={styles.retryBtn} onClick={onRetry}>
              <ArrowsClockwise size={14} weight="regular" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
