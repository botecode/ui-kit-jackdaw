// src/components/ExportDialog/ExportDialog.tsx
import { useId } from 'react'
import { Dialog } from '../Dialog'
import { Progress } from '../Progress'
import { TextField } from '../TextField'
import { InputSelect } from '../InputSelect'
import type { InputSelectOption } from '../InputSelect'
import styles from './ExportDialog.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportMode = 'master' | 'stems'
export type ExportBitDepth = 16 | 24
export type ExportSampleRate = 44100 | 48000
export type ExportStatus = 'idle' | 'rendering' | 'done' | 'error'

export interface ExportFormat {
  bitDepth: ExportBitDepth
  sampleRate: ExportSampleRate
}

export interface ExportDialogProps {
  open: boolean
  mode: ExportMode
  format: ExportFormat
  filename: string
  status: ExportStatus
  /** 0–1. Omit for indeterminate progress during rendering. */
  progress?: number
  errorMessage?: string
  onModeChange: (mode: ExportMode) => void
  onFormatChange: (format: ExportFormat) => void
  onFilenameChange: (name: string) => void
  onRender: () => void
  onReveal: () => void
  onCancel: () => void
}

// ── Static option sets ────────────────────────────────────────────────────────

const BIT_DEPTH_OPTIONS: InputSelectOption[] = [
  { id: '16', label: '16-bit' },
  { id: '24', label: '24-bit' },
]

const SAMPLE_RATE_OPTIONS: InputSelectOption[] = [
  { id: '44100', label: '44.1 kHz' },
  { id: '48000', label: '48 kHz' },
]

const MODE_OPTIONS: { value: ExportMode; label: string; hint: string }[] = [
  { value: 'master', label: 'Master', hint: 'Single WAV mix' },
  { value: 'stems',  label: 'Stems',  hint: 'Per-track WAVs' },
]

// ── Inline segmented control (single consumer — YAGNI) ────────────────────────
//
// ARIA model: role="radiogroup" + role="radio" with roving tabindex.
// Arrow keys navigate; Enter/Space select. This is the correct model for a
// set of mutually exclusive options (not a tablist — no panel switching).

interface SegControlProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  'aria-label'?: string
}

function SegControl({ value, onChange, options, 'aria-label': ariaLabel }: SegControlProps) {
  const groupId = useId()

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (idx + 1) % options.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (idx - 1 + options.length) % options.length
    }
    if (next >= 0) {
      e.preventDefault()
      onChange(options[next].value)
      document.getElementById(`${groupId}-${options[next].value}`)?.focus()
    }
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={styles.segControl}>
      {options.map((opt, idx) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            id={`${groupId}-${opt.value}`}
            role="radio"
            aria-checked={selected}
            data-selected={selected || undefined}
            className={styles.segOption}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={e => handleKeyDown(e, idx)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── ExportDialog ──────────────────────────────────────────────────────────────

export function ExportDialog({
  open,
  mode,
  format,
  filename,
  status,
  progress,
  errorMessage,
  onModeChange,
  onFormatChange,
  onFilenameChange,
  onRender,
  onReveal,
  onCancel,
}: ExportDialogProps) {
  const modeHint = MODE_OPTIONS.find(o => o.value === mode)?.hint ?? ''

  const title =
    status === 'rendering' ? 'Rendering…' :
    status === 'done'      ? 'Export complete' :
    status === 'error'     ? 'Export failed' :
                             'Export'

  // Dialog is non-dismissible during rendering so you can't lose the export
  // by clicking the scrim; Esc still fires onCancel via onClose.
  const dismissible = status !== 'rendering'

  const actions = (
    <>
      {/* Cancel / Close always left */}
      <button
        className={styles.btnSecondary}
        onClick={onCancel}
      >
        {status === 'rendering' ? 'Cancel' : 'Close'}
      </button>

      {/* Primary action changes with status */}
      {status === 'idle' && (
        <button className={styles.btnPrimary} onClick={onRender}>
          Render
        </button>
      )}
      {status === 'done' && (
        <button className={styles.btnPrimary} onClick={onReveal}>
          Reveal in Finder
        </button>
      )}
      {status === 'error' && (
        <button className={styles.btnPrimary} onClick={onRender}>
          Retry
        </button>
      )}
    </>
  )

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissible={dismissible}
      actions={actions}
    >
      {/* ── Idle: form ── */}
      {status === 'idle' && (
        <div className={styles.form}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Mode</span>
            <SegControl
              value={mode}
              onChange={v => onModeChange(v as ExportMode)}
              options={MODE_OPTIONS}
              aria-label="Export mode"
            />
          </div>
          <p className={styles.modeHint}>{modeHint}</p>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Format</span>
            <div className={styles.formatRow}>
              <InputSelect
                value={String(format.bitDepth)}
                onChange={id => onFormatChange({ ...format, bitDepth: Number(id) as ExportBitDepth })}
                options={BIT_DEPTH_OPTIONS}
                aria-label="Bit depth"
                size="sm"
              />
              <InputSelect
                value={String(format.sampleRate)}
                onChange={id => onFormatChange({ ...format, sampleRate: Number(id) as ExportSampleRate })}
                options={SAMPLE_RATE_OPTIONS}
                aria-label="Sample rate"
                size="sm"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Name</span>
            <TextField
              value={filename}
              onChange={onFilenameChange}
              placeholder="Untitled"
              size="sm"
              aria-label="Export filename"
            />
          </div>
        </div>
      )}

      {/* ── Rendering: progress ── */}
      {status === 'rendering' && (
        <div className={styles.progressSection}>
          <Progress
            value={progress}
            label={progress != null ? `${Math.round(progress * 100)}%` : undefined}
            aria-label="Rendering progress"
          />
        </div>
      )}

      {/* ── Done ── */}
      {status === 'done' && (
        <div className={styles.doneSection} role="status">
          <span className={styles.doneCheck} aria-hidden="true">✓</span>
          <p className={styles.doneText}>Exported successfully.</p>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className={styles.errorSection} role="alert">
          <p className={styles.errorText}>
            {errorMessage ?? 'The export failed. Check disk space and try again.'}
          </p>
        </div>
      )}
    </Dialog>
  )
}
