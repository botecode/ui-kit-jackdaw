# Share: Send & Receive a Take — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing simple Share component with a full peer-to-peer Take share flow covering both sender and receiver roles, all states, and every error kind.

**Architecture:** A single composite `Share` component backed by a `TransferState` prop object (role + phase state machine). Four private sub-components live in the same file: `ShareCodeReadout` (hero code display), `TakeManifestCard` (take metadata), `TransferStatus` (LED indicators), and `ConfirmApply` (receiver apply step). All wrapped in the existing `Dialog` shell.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@phosphor-icons/react`, Vitest + @testing-library/react, the kit `Dialog` + `TextField` primitives.

## Global Constraints

- Tokens only — no hardcoded colors, all `var(--*)` 
- CSS Modules, `data-*` attributes for state (never class toggling)
- Tests use `fireEvent` NOT `userEvent`
- `npx tsc --noEmit` + `npx vitest run` must be green on each commit
- `sm`/`md` sizes only (default `md`)
- `:focus-visible` only (never `:focus`)
- All states in the demo, verified in 3+ themes including a light one
- Semantic LED colors: amber/orange = connecting, accent = transferring, green = success, red = error
- No hardcoded colors, no animation library, CSS only for state transitions
- Incandescent LED timing: fast attack `--dur-led-on` ~40ms / slow decay `--dur-led-off` ~220ms
- Portal into THEMED mount via `usePortalTarget()` (Dialog already handles this)
- Icons from `@phosphor-icons/react` only; no other icon sets

---

### Task 1: Types, sub-components, and main Share component (Share.tsx + Share.module.css)

**Files:**
- Overwrite: `src/components/Share/Share.tsx`
- Overwrite: `src/components/Share/Share.module.css`
- Overwrite: `src/components/Share/index.ts`

**Interfaces:**
- Produces:
  - `TransferRole = 'sender' | 'receiver'`
  - `TransferPhase = 'idle' | 'manifest' | 'code' | 'connecting' | 'transferring' | 'success' | 'error' | 'confirm' | 'applied'`
  - `ErrorKind = 'expired' | 'no-peer' | 'dropped' | 'failed' | 'version-mismatch'`
  - `TakeManifest { songName, takeLabel, takeNumber, durationSeconds, trackCount, sizeBytes, hasLyrics, hasChords }`
  - `TransferState { role, phase, progress?, error? }`
  - `ShareProps { open, transfer, manifest?, code?, peerName?, onGenerateCode, onSend, onEnterCode, onAccept, onCancel, onRetry }`
  - `Share` component (default named export)

- [ ] **Step 1: Write Share.tsx**

```tsx
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
  /** Called by the parent when the transfer actually begins (peer connected). */
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
// data-active when code is live (code/connecting/transferring phases).

interface ShareCodeReadoutProps {
  code: string
  active?: boolean
  onCopy?: () => void
}

function ShareCodeReadout({ code, active, onCopy }: ShareCodeReadoutProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy() {
    navigator.clipboard?.writeText(code).catch(() => {})
    onCopy?.()
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
// LED dot + label for connecting/transferring/success/error phases.

type StatusVariant = 'connecting' | 'transferring' | 'success' | 'error'

interface TransferStatusProps {
  variant: StatusVariant
  progress?: number
  label?: string
}

function TransferStatus({ variant, progress, label }: TransferStatusProps) {
  const progressPct = Math.round(Math.max(0, Math.min(1, progress ?? 0)) * 100)

  const defaultLabel: Record<StatusVariant, string> = {
    connecting:   'Connecting…',
    transferring: `${progressPct}%`,
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
// Receiver's deliberate apply step — shows what will happen + Apply/Cancel.

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
        Takes are immutable snapshots. This will add Take {takeNumber} to the project history.
        You can always revert to any previous take.
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
    phase === 'idle' || phase === 'success' || phase === 'error' ||
    phase === 'applied'

  const isActive =
    phase === 'code' || phase === 'connecting' || phase === 'transferring'

  const title: Record<TransferPhase, string> = {
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

  const actionLabel = dismissible ? 'Close' : 'Cancel'

  function handleConnect() {
    if (codeInput.trim()) {
      onEnterCode(codeInput.trim())
    }
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
      title={title[phase]}
      dismissible={dismissible}
      size="sm"
      actions={
        <button className={styles.footerBtn} onClick={onCancel}>
          {actionLabel}
        </button>
      }
    >
      <div className={styles.body} data-role={role} data-phase={phase}>

        {/* ── Receiver: idle — enter code ───────────────────────────────── */}
        {isReceiver && phase === 'idle' && (
          <div className={styles.codeEntry}>
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

        {/* ── Sender: idle — loading state (manifest not yet ready) ─────── */}
        {isSender && phase === 'idle' && (
          <div className={styles.preparing} role="status" aria-live="polite">
            <span className={styles.spinnerDot} aria-hidden="true" />
            <span className={styles.preparingLabel}>Preparing take…</span>
          </div>
        )}

        {/* ── Manifest card (both roles: manifest phase) ────────────────── */}
        {manifest && (phase === 'manifest' || phase === 'code') && (
          <TakeManifestCard manifest={manifest} />
        )}

        {/* ── Sender: manifest — generate code ─────────────────────────── */}
        {isSender && phase === 'manifest' && (
          <button className={styles.primaryBtn} onClick={onGenerateCode}>
            Generate code
          </button>
        )}

        {/* ── Receiver: manifest — show manifest then accept/decline ───── */}
        {isReceiver && phase === 'manifest' && manifest && (
          <div className={styles.manifestActions}>
            <button className={styles.primaryBtn} onClick={onAccept}>
              Accept
            </button>
          </div>
        )}

        {/* ── Code readout (sender: code phase + connecting/transferring) ── */}
        {isSender && code && (phase === 'code' || phase === 'connecting' || phase === 'transferring') && (
          <ShareCodeReadout code={code} active={isActive} />
        )}

        {/* ── Sender: code phase — waiting hint ─────────────────────────── */}
        {isSender && phase === 'code' && (
          <p className={styles.waitingHint} role="status" aria-live="polite">
            Waiting for peer to enter this code…
          </p>
        )}

        {/* ── Connecting (both roles) ──────────────────────────────────── */}
        {phase === 'connecting' && (
          <TransferStatus variant="connecting" />
        )}

        {/* ── Transferring (both roles) ────────────────────────────────── */}
        {phase === 'transferring' && (
          <>
            <ProgressBar
              progress={progress}
              label={isSender ? 'Send progress' : 'Receive progress'}
            />
            <TransferStatus
              variant="transferring"
              progress={progress}
              label={isSender ? `Sending… ${Math.round(progress * 100)}%` : `Receiving… ${Math.round(progress * 100)}%`}
            />
          </>
        )}

        {/* ── Success (sender) ─────────────────────────────────────────── */}
        {phase === 'success' && (
          <TransferStatus variant="success" label="Take sent successfully" />
        )}

        {/* ── Receiver: confirm — apply the take ───────────────────────── */}
        {isReceiver && phase === 'confirm' && manifest && (
          <ConfirmApply
            manifest={manifest}
            peerName={peerName}
            onAccept={onAccept}
            onCancel={onCancel}
          />
        )}

        {/* ── Receiver: applied ─────────────────────────────────────────── */}
        {isReceiver && phase === 'applied' && (
          <TransferStatus variant="success" label="Take applied to project" />
        )}

        {/* ── Error (both roles) ──────────────────────────────────────── */}
        {phase === 'error' && (
          <div className={styles.errorSection}>
            <p role="alert" className={styles.errorMessage}>
              {error?.message ?? (error?.kind ? ERROR_MESSAGES[error.kind] : 'Something went wrong.')}
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
```

- [ ] **Step 2: Write Share.module.css**

```css
/* src/components/Share/Share.module.css */

/* ── Body ─────────────────────────────────────────────────────────────────── */

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── Preparing (sender idle) ──────────────────────────────────────────────── */

.preparing {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.spinnerDot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  animation: dot-pulse 1.4s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50%       { opacity: 1;   transform: scale(1.1);  }
}

@media (prefers-reduced-motion: reduce) {
  .spinnerDot { animation: none; opacity: 0.8; }
}

.preparingLabel {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-base);
}

/* ── Code entry (receiver idle) ───────────────────────────────────────────── */

.codeEntry {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Manifest card ────────────────────────────────────────────────────────── */

/*
  Recessed card showing what's being sent/received.
  Sits on --stage for the hardware panel feel, hairline highlight on top.
*/

.manifestCard {
  background: var(--stage);
  background-image: var(--texture-stage);
  background-blend-mode: multiply;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--border);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.manifestHeader {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.manifestSong {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  color: var(--stage-text);
  line-height: var(--leading-sm);
  letter-spacing: -0.01em;
}

.manifestTakeLabel {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: color-mix(in srgb, var(--stage-text) 60%, transparent);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.manifestTakeNumber {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
}

/* Stats row — definition list as an inline grid */

.manifestStats {
  display: flex;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
}

.manifestStat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.manifestStat dt {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.manifestStat dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: var(--stage-text);
}

/* Optional badges (Lyrics / Chords) */

.manifestBadges {
  display: flex;
  gap: var(--space-2);
}

.manifestBadge {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--led-cyan);
  background: color-mix(in srgb, var(--led-cyan) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--led-cyan) 30%, transparent);
  border-radius: calc(var(--radius) - 1px);
  padding: 2px var(--space-2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Code readout ─────────────────────────────────────────────────────────── */

/*
  Hero code well — big mono on a recessed dark stage.
  data-active: the code is live (LED glow on the text + border).
*/

.codeReadout {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.codeWell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--stage);
  background-image: var(--texture-stage);
  background-blend-mode: multiply;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--border);
  padding: var(--space-5) var(--space-6);
  min-height: 72px;
  transition: box-shadow var(--dur-led-off) var(--ease-out);
}

/* Active: accent LED bloom on the well border */
.codeWell[data-active] {
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--accent),
    0 0 12px 2px color-mix(in srgb, var(--accent) 20%, transparent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

.codeHero {
  font-family: var(--font-mono);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--stage-text);
  letter-spacing: 0.08em;
  line-height: 1;
  user-select: all;
  -webkit-user-select: all;
}

/* ── Copy row ─────────────────────────────────────────────────────────────── */

.copyRow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  position: relative;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */

/* Primary: accent fill */
.primaryBtn {
  appearance: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-5);
  background: var(--accent);
  color: var(--accent-contrast);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  align-self: flex-start;
  outline: none;
  transition: filter var(--dur-base) var(--ease-out);
}

.primaryBtn:hover:not(:disabled) { filter: brightness(1.1); }

.primaryBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

.primaryBtn:active:not(:disabled) { filter: brightness(0.92); }

.primaryBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Copy button: icon + label pair, ghost style */
.copyBtn {
  appearance: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-4);
  background: var(--surface);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  outline: none;
  transition:
    color      var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.copyBtn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.copyBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

.copyBtn:active { filter: brightness(0.92); }

/* Retry button: ghost with icon */
.retryBtn {
  appearance: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-4);
  background: var(--surface);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  outline: none;
  transition: filter var(--dur-base) var(--ease-out);
}

.retryBtn:hover { filter: brightness(1.08); }

.retryBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

/* Dialog footer cancel/close button */
.footerBtn {
  appearance: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-4);
  background: var(--stage);
  color: var(--stage-text);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
  outline: none;
  transition: filter var(--dur-base) var(--ease-out);
}

.footerBtn:hover { filter: brightness(1.1); }

.footerBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

/* ── Copied toast ─────────────────────────────────────────────────────────── */

.copiedToast {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--led-green);
  white-space: nowrap;
  pointer-events: none;
  animation: toast-in var(--dur-fast) var(--ease-out) both;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0);    }
}

@media (prefers-reduced-motion: reduce) {
  .copiedToast { animation: none; }
}

/* ── Waiting hint ─────────────────────────────────────────────────────────── */

.waitingHint {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-base);
  text-align: center;
}

/* ── Transfer status ──────────────────────────────────────────────────────── */

/*
  LED dot + label row. Variant controls dot color + glow.
  connecting: amber pulsing (attention/waiting)
  transferring: accent (in-progress)
  success: green
  error: red
*/

.transferStatus {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.statusDot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Connecting: amber/orange pulsing LED */
.transferStatus[data-variant="connecting"] .statusDot {
  background: var(--led-orange);
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--led-orange) 40%, transparent);
  animation: dot-pulse 1.4s ease-in-out infinite;
}

/* Transferring: accent (steady) */
.transferStatus[data-variant="transferring"] .statusDot {
  background: var(--accent);
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--accent) 35%, transparent);
}

/* Success: green LED */
.transferStatus[data-variant="success"] .statusDot {
  background: var(--led-green);
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--led-green) 40%, transparent);
}

/* Error: red LED */
.transferStatus[data-variant="error"] .statusDot {
  background: var(--led-red);
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--led-red) 35%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .transferStatus[data-variant="connecting"] .statusDot {
    animation: none;
    opacity: 0.9;
  }
}

.statusLabel {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-base);
}

.transferStatus[data-variant="success"] .statusLabel { color: var(--led-green); }
.transferStatus[data-variant="error"]   .statusLabel { color: var(--led-red);   }

/* ── Progress bar ─────────────────────────────────────────────────────────── */

.progressSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progressTrack {
  height: 4px;
  border-radius: 2px;
  background: var(--stage);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--border);
  overflow: hidden;
  position: relative;
}

.progressFill {
  position: absolute;
  inset: 0;
  width: 100%;
  background: var(--accent);
  box-shadow: 0 0 6px 1px color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 2px;
  transform-origin: left center;
  transform: scaleX(var(--_progress, 0));
  transition: transform var(--dur-slow) linear;
}

.progressLabel {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-dim);
  align-self: flex-end;
}

/* ── Error section ────────────────────────────────────────────────────────── */

.errorSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.errorMessage {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--led-red);
  line-height: var(--leading-base);
}

/* ── Confirm / apply section ──────────────────────────────────────────────── */

.confirmSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirmSummary {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text);
  line-height: var(--leading-base);
}

.confirmDetail {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-base);
}

.confirmActions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.applyBtn {
  appearance: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-5);
  background: var(--led-green);
  color: #fff;
  box-shadow: 0 0 8px 2px color-mix(in srgb, var(--led-green) 25%, transparent);
  outline: none;
  transition:
    filter     var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.applyBtn:hover { filter: brightness(1.1); }

.applyBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--led-green) 70%, transparent);
  outline-offset: 2px;
}

.applyBtn:active { filter: brightness(0.92); }

.cancelInlineBtn {
  appearance: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--text-muted);
  outline: none;
  transition: color var(--dur-base) var(--ease-out);
}

.cancelInlineBtn:hover { color: var(--text); }

.cancelInlineBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

/* ── Manifest actions (receiver manifest) ─────────────────────────────────── */

.manifestActions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
```

- [ ] **Step 3: Update index.ts**

```ts
// src/components/Share/index.ts
export { Share } from './Share'
export type {
  ShareProps,
  TransferRole,
  TransferPhase,
  ErrorKind,
  TakeManifest,
  TransferState,
} from './Share'
```

- [ ] **Step 4: Run tsc to verify types**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/share-send-receive-a-take && npx tsc --noEmit 2>&1
```

Expected: no output (clean)

- [ ] **Step 5: Commit**

```bash
git add src/components/Share/Share.tsx src/components/Share/Share.module.css src/components/Share/index.ts
git commit -m "feat(Share): complete Take share flow — sender + receiver state machine

Replaces the simple project/track share stub with a full peer-to-peer
Take share composite. Covers both sender and receiver roles with a
TransferState prop (role + phase). Sub-components:
  - ShareCodeReadout: hero mono code in recessed stage well, LED active bloom
  - TakeManifestCard: song/take/stats on dark panel stage
  - TransferStatus: semantic LED dot — amber=connecting, accent=transferring, green=success, red=red
  - ConfirmApply: receiver's deliberate apply step

Phase machine — sender: idle|manifest|code|connecting|transferring|success|error
               receiver: idle|manifest|connecting|transferring|confirm|applied|error

Contract: onGenerateCode, onSend, onEnterCode(code), onAccept, onCancel, onRetry.
Take manifest typed from the real data shape: songName, takeLabel, takeNumber,
durationSeconds, trackCount, sizeBytes, hasLyrics, hasChords.

Decision: onSend is in the interface for app wiring but has no button —
transfer starts automatically once peer connects (engine-driven, like
share.progress). This matches the spec's 'once a peer connects: connecting
→ transferring' sentence.

QR code: noted as future add (spec §2); not built here.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Tests (Share.test.tsx)

**Files:**
- Overwrite: `src/components/Share/Share.test.tsx`

**Interfaces:**
- Consumes: `Share`, `ShareProps`, `TransferState`, `TakeManifest` from `./Share`

- [ ] **Step 1: Write Share.test.tsx**

```tsx
// src/components/Share/Share.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Share } from './Share'
import type { ShareProps, TakeManifest } from './Share'

const MANIFEST: TakeManifest = {
  songName:        'Summer Drift',
  takeLabel:       'Main Mix',
  takeNumber:      3,
  durationSeconds: 183,
  trackCount:      8,
  sizeBytes:       32_400_000,
  hasLyrics:       true,
  hasChords:       false,
}

const BASE: ShareProps = {
  open:            true,
  transfer:        { role: 'sender', phase: 'idle' },
  onGenerateCode:  vi.fn(),
  onSend:          vi.fn(),
  onEnterCode:     vi.fn(),
  onAccept:        vi.fn(),
  onCancel:        vi.fn(),
  onRetry:         vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Dialog open/close ─────────────────────────────────────────────────────────

describe('Share — dialog', () => {
  it('renders nothing when open=false', () => {
    render(<Share {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a dialog when open=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog has aria-modal=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('Close/Cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /close|cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc calls onCancel when in idle phase (dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Sender: idle ──────────────────────────────────────────────────────────────

describe('Share — sender idle', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'idle' },
  }

  it('shows "Send a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Send a Take')).toBeInTheDocument()
  })

  it('shows a preparing status indicator', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does NOT show manifest card', () => {
    render(<Share {...PROPS} manifest={MANIFEST} />)
    expect(screen.queryByText('Summer Drift')).not.toBeInTheDocument()
  })
})

// ── Sender: manifest ──────────────────────────────────────────────────────────

describe('Share — sender manifest', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'manifest' },
    manifest: MANIFEST,
  }

  it('shows "Send a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Send a Take')).toBeInTheDocument()
  })

  it('shows the manifest card with song name', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows take number in manifest', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('shows track count in manifest', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows Lyrics badge when hasLyrics=true', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
  })

  it('does NOT show Chords badge when hasChords=false', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByText('Chords')).not.toBeInTheDocument()
  })

  it('shows a Generate code button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument()
  })

  it('clicking Generate code calls onGenerateCode', () => {
    const onGenerateCode = vi.fn()
    render(<Share {...PROPS} onGenerateCode={onGenerateCode} />)
    fireEvent.click(screen.getByRole('button', { name: /generate code/i }))
    expect(onGenerateCode).toHaveBeenCalledTimes(1)
  })
})

// ── Sender: code ──────────────────────────────────────────────────────────────

describe('Share — sender code', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'code' },
    manifest: MANIFEST,
    code:     '7-tuna-zebra-piano',
  }

  it('shows the pairing code', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })

  it('shows the manifest card', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows a Copy code button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /copy.*code/i })).toBeInTheDocument()
  })

  it('shows waiting hint', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/waiting/i)
  })

  it('does NOT show Generate code button in code phase', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('button', { name: /generate code/i })).not.toBeInTheDocument()
  })

  it('does NOT show progressbar in code phase', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('Esc does NOT close when in code phase (not dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).not.toHaveBeenCalled()
  })
})

// ── Sender: connecting ────────────────────────────────────────────────────────

describe('Share — sender connecting', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'connecting' },
    code:     '7-tuna-zebra-piano',
  }

  it('shows "Connecting…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Connecting…')).toBeInTheDocument()
  })

  it('shows the code readout', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })

  it('shows a status region for connecting state', () => {
    render(<Share {...PROPS} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveTextContent(/connect/i)
  })

  it('does NOT show progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

// ── Sender: transferring ──────────────────────────────────────────────────────

describe('Share — sender transferring', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'transferring', progress: 0.65 },
    code:     '7-tuna-zebra-piano',
  }

  it('shows "Sending…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Sending…')).toBeInTheDocument()
  })

  it('shows a progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar aria-valuenow reflects progress (65)', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65')
  })

  it('progressbar has aria-valuemin=0 and aria-valuemax=100', () => {
    render(<Share {...PROPS} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps progress above 1 to 100', () => {
    render(<Share {...PROPS} transfer={{ role: 'sender', phase: 'transferring', progress: 1.5 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps progress below 0 to 0', () => {
    render(<Share {...PROPS} transfer={{ role: 'sender', phase: 'transferring', progress: -0.2 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows the code readout', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })
})

// ── Sender: success ───────────────────────────────────────────────────────────

describe('Share — sender success', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'success' },
  }

  it('shows "Take Sent" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Take Sent')).toBeInTheDocument()
  })

  it('shows success status', () => {
    render(<Share {...PROPS} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/sent/i)
  })

  it('Esc closes (dismissible in success)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does NOT show progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

// ── Sender: error states ──────────────────────────────────────────────────────

describe('Share — sender error', () => {
  const makeError = (kind: ShareProps['transfer']['error']) => ({
    ...BASE,
    transfer: { role: 'sender' as const, phase: 'error' as const, error: kind },
  })

  it('shows error message in an alert region', () => {
    render(<Share {...makeError({ kind: 'failed', message: 'Transfer failed.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Transfer failed.')
  })

  it('shows "expired" error message for expired kind', () => {
    render(<Share {...makeError({ kind: 'expired', message: 'Pairing code expired — generate a new one.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/expired/i)
  })

  it('shows "no-peer" error message', () => {
    render(<Share {...makeError({ kind: 'no-peer', message: 'No peer connected.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/no peer/i)
  })

  it('shows "dropped" error message', () => {
    render(<Share {...makeError({ kind: 'dropped', message: 'Connection dropped.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/dropped/i)
  })

  it('shows "version-mismatch" error message', () => {
    render(<Share {...makeError({ kind: 'version-mismatch', message: 'Incompatible version.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/version/i)
  })

  it('shows a Retry button', () => {
    render(<Share {...makeError({ kind: 'failed', message: 'Failed.' })} />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('clicking Retry calls onRetry', () => {
    const onRetry = vi.fn()
    render(<Share {...makeError({ kind: 'failed', message: 'Failed.' })} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('Esc closes in error state (dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...makeError({ kind: 'failed', message: '' })} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows "Send Failed" title', () => {
    render(<Share {...makeError({ kind: 'failed', message: '' })} />)
    expect(screen.getByText('Send Failed')).toBeInTheDocument()
  })
})

// ── Receiver: idle ────────────────────────────────────────────────────────────

describe('Share — receiver idle', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'idle' },
  }

  it('shows "Receive a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive a Take')).toBeInTheDocument()
  })

  it('renders a code input field', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('textbox', { name: /pairing code/i })).toBeInTheDocument()
  })

  it('renders a Connect button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument()
  })

  it('Connect button is disabled when code is empty', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /connect/i })).toBeDisabled()
  })

  it('typing in the code field enables Connect', () => {
    render(<Share {...PROPS} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: '7-tuna-zebra-piano' } })
    expect(screen.getByRole('button', { name: /connect/i })).not.toBeDisabled()
  })

  it('clicking Connect calls onEnterCode with the code value', () => {
    const onEnterCode = vi.fn()
    render(<Share {...PROPS} onEnterCode={onEnterCode} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: '7-tuna-zebra-piano' } })
    fireEvent.click(screen.getByRole('button', { name: /connect/i }))
    expect(onEnterCode).toHaveBeenCalledWith('7-tuna-zebra-piano')
  })

  it('pressing Enter in the code field calls onEnterCode', () => {
    const onEnterCode = vi.fn()
    render(<Share {...PROPS} onEnterCode={onEnterCode} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: 'cedar-wolf-3' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onEnterCode).toHaveBeenCalledWith('cedar-wolf-3')
  })

  it('Esc closes (dismissible in idle)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Receiver: manifest ────────────────────────────────────────────────────────

describe('Share — receiver manifest', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:  { role: 'receiver', phase: 'manifest' },
    manifest:  MANIFEST,
    peerName: 'Alice',
  }

  it('shows "Receive a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive a Take')).toBeInTheDocument()
  })

  it('shows the manifest card', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows Accept button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('clicking Accept calls onAccept', () => {
    const onAccept = vi.fn()
    render(<Share {...PROPS} onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows Lyrics badge', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
  })
})

// ── Receiver: connecting ──────────────────────────────────────────────────────

describe('Share — receiver connecting', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'connecting' },
  }

  it('shows "Connecting…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Connecting…')).toBeInTheDocument()
  })

  it('shows a status indicator for connecting', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toHaveTextContent(/connect/i)
  })
})

// ── Receiver: transferring ────────────────────────────────────────────────────

describe('Share — receiver transferring', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'transferring', progress: 0.4 },
  }

  it('shows "Receiving…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receiving…')).toBeInTheDocument()
  })

  it('shows a progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar aria-valuenow reflects progress (40)', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('progressbar aria-label is "Receive progress"', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Receive progress')
  })
})

// ── Receiver: confirm ─────────────────────────────────────────────────────────

describe('Share — receiver confirm', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:  { role: 'receiver', phase: 'confirm' },
    manifest:  MANIFEST,
    peerName: 'Alice',
  }

  it('shows "Apply Take?" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Apply Take?')).toBeInTheDocument()
  })

  it('shows the confirm summary with take label and song', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/Summer Drift/)).toBeInTheDocument()
    expect(screen.getByText(/Main Mix/)).toBeInTheDocument()
  })

  it('shows peer name in confirm summary', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('shows an Apply button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
  })

  it('clicking Apply calls onAccept', () => {
    const onAccept = vi.fn()
    render(<Share {...PROPS} onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows a Cancel button in the confirm body', () => {
    render(<Share {...PROPS} />)
    const buttons = screen.getAllByRole('button', { name: /cancel/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('clicking inline Cancel calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    const buttons = screen.getAllByRole('button', { name: /cancel/i })
    fireEvent.click(buttons[0])
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── Receiver: applied ─────────────────────────────────────────────────────────

describe('Share — receiver applied', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'applied' },
  }

  it('shows "Take Applied" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Take Applied')).toBeInTheDocument()
  })

  it('shows success status', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toHaveTextContent(/applied/i)
  })

  it('Esc closes (dismissible in applied)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Receiver: error ───────────────────────────────────────────────────────────

describe('Share — receiver error', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'error', error: { kind: 'failed', message: 'Receive failed.' } },
  }

  it('shows "Receive Failed" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive Failed')).toBeInTheDocument()
  })

  it('shows error message in alert', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Receive failed.')
  })

  it('shows Retry button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('clicking Retry calls onRetry', () => {
    const onRetry = vi.fn()
    render(<Share {...PROPS} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

// ── Manifest: badges and formatting ──────────────────────────────────────────

describe('Share — manifest formatting', () => {
  const withManifest = (m: Partial<TakeManifest>) => ({
    ...BASE,
    transfer: { role: 'sender' as const, phase: 'manifest' as const },
    manifest: { ...MANIFEST, ...m },
  })

  it('formats duration as mm:ss', () => {
    render(<Share {...withManifest({ durationSeconds: 125 })} />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('formats size in MB', () => {
    render(<Share {...withManifest({ sizeBytes: 5_200_000 })} />)
    expect(screen.getByText('5.2 MB')).toBeInTheDocument()
  })

  it('formats size in KB when < 1MB', () => {
    render(<Share {...withManifest({ sizeBytes: 340_000 })} />)
    expect(screen.getByText('340 KB')).toBeInTheDocument()
  })

  it('shows Chords badge when hasChords=true', () => {
    render(<Share {...withManifest({ hasChords: true })} />)
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('shows both Lyrics and Chords badges', () => {
    render(<Share {...withManifest({ hasLyrics: true, hasChords: true })} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('does NOT show badge area when neither hasLyrics nor hasChords', () => {
    render(<Share {...withManifest({ hasLyrics: false, hasChords: false })} />)
    expect(screen.queryByText('Lyrics')).not.toBeInTheDocument()
    expect(screen.queryByText('Chords')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/share-send-receive-a-take && npx vitest run src/components/Share 2>&1
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/Share/Share.test.tsx
git commit -m "test(Share): comprehensive tests — both roles, all phases, all error kinds, manifest formatting

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Demo (Share.demo.tsx)

**Files:**
- Overwrite: `src/components/Share/Share.demo.tsx`

**Interfaces:**
- Consumes: `Share`, `TakeManifest`, `TransferState` from `./Share`
- Consumes: `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery ui

- [ ] **Step 1: Write Share.demo.tsx (all states for both roles)**

```tsx
// src/components/Share/Share.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Share } from './Share'
import type { TransferRole, TransferPhase, ErrorKind, TakeManifest } from './Share'

export const meta: DemoMeta = {
  name: 'Share (Take)',
  group: 'Composites',
  route: '/share',
  order: 50,
}

// ── Shared data ────────────────────────────────────────────────────────────────

const MANIFEST: TakeManifest = {
  songName:        'Summer Drift',
  takeLabel:       'Main Mix',
  takeNumber:      3,
  durationSeconds: 183,
  trackCount:      8,
  sizeBytes:       32_400_000,
  hasLyrics:       true,
  hasChords:       true,
}

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  outline: 'none',
}

const NOOP = () => {}

// ── Sender state cards ────────────────────────────────────────────────────────

function SenderIdleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · idle">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'idle' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderManifestCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · manifest">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'manifest' }}
        manifest={MANIFEST}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderCodeCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · code (waiting)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'code' }}
        manifest={MANIFEST}
        code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderConnectingCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · connecting">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'connecting' }}
        code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderTransferringCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · transferring 60%">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'transferring', progress: 0.6 }}
        code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderSuccessCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · success">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'success' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderErrorCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (dropped)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'dropped', message: 'Connection dropped. Check your network.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderErrorExpiredCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (expired)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'expired', message: 'Pairing code expired — generate a new one.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function SenderErrorVersionCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (version)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share
        open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'version-mismatch', message: 'Incompatible version — the other device needs to update Jackdaw.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

// ── Receiver state cards ───────────────────────────────────────────────────────

function ReceiverIdleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · idle (enter code)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'idle' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverManifestCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · manifest">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'manifest' }}
        manifest={MANIFEST}
        peerName="Alice"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverConnectingCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · connecting">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'connecting' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverTransferringCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · receiving 40%">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'transferring', progress: 0.4 }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverConfirmCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · confirm (apply?)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'confirm' }}
        manifest={MANIFEST}
        peerName="Alice"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverAppliedCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · applied">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'applied' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

function ReceiverErrorCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · error (failed)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share
        open={open}
        transfer={{ role: 'receiver', phase: 'error', error: { kind: 'failed', message: 'Transfer failed. Try again.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* Sender flow */}
      <SenderIdleCard />
      <SenderManifestCard />
      <SenderCodeCard />
      <SenderConnectingCard />
      <SenderTransferringCard />
      <SenderSuccessCard />
      <SenderErrorCard />
      <SenderErrorExpiredCard />
      <SenderErrorVersionCard />
      {/* Receiver flow */}
      <ReceiverIdleCard />
      <ReceiverManifestCard />
      <ReceiverConnectingCard />
      <ReceiverTransferringCard />
      <ReceiverConfirmCard />
      <ReceiverAppliedCard />
      <ReceiverErrorCard />
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

const SENDER_PHASES: TransferPhase[] = ['idle', 'manifest', 'code', 'connecting', 'transferring', 'success', 'error']
const RECEIVER_PHASES: TransferPhase[] = ['idle', 'manifest', 'connecting', 'transferring', 'confirm', 'applied', 'error']

const ERROR_KINDS: ErrorKind[] = ['expired', 'no-peer', 'dropped', 'failed', 'version-mismatch']

function PlaygroundDemo() {
  const [open,      setOpen]     = useState(false)
  const [role,      setRole]     = useState<TransferRole>('sender')
  const [phase,     setPhase]    = useState<TransferPhase>('manifest')
  const [progress,  setProgress] = useState(0.45)
  const [errorKind, setErrKind]  = useState<ErrorKind>('failed')

  const isSender = role === 'sender'
  const phases   = isSender ? SENDER_PHASES : RECEIVER_PHASES

  const transfer = {
    role,
    phase,
    progress,
    error: phase === 'error'
      ? { kind: errorKind, message: `${errorKind} error (playground)` }
      : undefined,
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={() => setOpen(true)}>Open…</button>

        <Share
          open={open}
          transfer={transfer}
          manifest={MANIFEST}
          code="7-tuna-zebra-piano"
          peerName="Alice"
          onGenerateCode={NOOP}
          onSend={NOOP}
          onEnterCode={NOOP}
          onAccept={NOOP}
          onCancel={() => setOpen(false)}
          onRetry={NOOP}
        />

        {/* Controls — dogfood Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              role
            </span>
            <Toggle
              checked={role === 'receiver'}
              onChange={(v) => {
                setRole(v ? 'receiver' : 'sender')
                setPhase(v ? 'idle' : 'manifest')
              }}
              size="sm"
              label="receiver"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              phase
            </span>
            {phases.map(p => (
              <Toggle
                key={p}
                checked={phase === p}
                onChange={() => setPhase(p)}
                size="sm"
                label={p}
              />
            ))}
          </div>

          {phase === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                error kind
              </span>
              {ERROR_KINDS.map(k => (
                <Toggle
                  key={k}
                  checked={errorKind === k}
                  onChange={() => setErrKind(k)}
                  size="sm"
                  label={k}
                />
              ))}
            </div>
          )}

          {(phase === 'transferring') && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <span>progress ({Math.round(progress * 100)}%)</span>
              <input type="range" min={0} max={1} step={0.01} value={progress} onChange={e => setProgress(Number(e.target.value))} />
            </label>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ShareDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run vitest run and tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/share-send-receive-a-take && npx tsc --noEmit 2>&1 && npx vitest run 2>&1 | tail -10
```

Expected: clean tsc, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/Share/Share.demo.tsx
git commit -m "demo(Share): all states for both roles — sender (9 states) + receiver (7 states) + playground

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec coverage:
- [x] Sender flow: idle/manifest/code/connecting/transferring/success — all states
- [x] Error states: expired, no-peer, dropped, failed, version-mismatch — all shown with Retry
- [x] Receiver flow: idle/manifest/connecting/transferring/confirm/applied/error — all states  
- [x] ShareCodeReadout: mono hero readout, recessed well, LED bloom when active, copy button
- [x] TakeManifestCard: song/take/duration/tracks/size/lyrics/chords badges
- [x] TransferStatus: semantic LEDs — amber pulsing=connecting, accent=transferring, green=success, red=error
- [x] ConfirmApply: "Add Take N from <peer> to <song>", summary, Apply/Cancel
- [x] Contract callbacks: onGenerateCode, onSend, onEnterCode, onAccept, onCancel, onRetry
- [x] TransferState: role/phase/progress/error typed
- [x] TakeManifest: all fields typed
- [x] Demo covers every state both roles in StatesGrid
- [x] Playground dogfoods Toggle, has role/phase/error/progress controls
- [x] Tests: fireEvent (not userEvent), all states covered
- [x] QR noted as future (spec: "note it, don't build it")

### Placeholder scan: none found — all steps have complete code

### Type consistency: 
- `TransferPhase`, `TransferRole`, `ErrorKind`, `TakeManifest`, `TransferState`, `ShareProps` are defined in Task 1 and consumed by Tasks 2–3
- All function signatures consistent throughout
