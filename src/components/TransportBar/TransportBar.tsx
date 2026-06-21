// src/components/TransportBar/TransportBar.tsx
import { useState, useRef } from 'react'
import { SkipBack, SkipForward } from '@phosphor-icons/react'
import styles from './TransportBar.module.css'
import { TransportButton } from '../TransportButton'
import { RecordMode } from '../RecordMode'
import type { RecordModeState, RecordModeValue } from '../RecordMode'
import { RepeatToggle } from '../RepeatToggle'
import { Clock } from '../Clock'

// ── Go-to-start / go-to-end ───────────────────────────────────────────────────

interface SkipButtonProps {
  direction: 'start' | 'end'
  onClick: () => void
  size: 'sm' | 'md'
  disabled?: boolean
}

const SKIP_ICON_SIZE: Record<'sm' | 'md', number> = { sm: 14, md: 16 }

function SkipButton({ direction, onClick, size, disabled }: SkipButtonProps) {
  const Icon = direction === 'start' ? SkipBack : SkipForward
  const label = direction === 'start' ? 'Go to start' : 'Go to end'
  return (
    <button
      type="button"
      className={styles.skipBtn}
      data-size={size}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon aria-hidden size={SKIP_ICON_SIZE[size]} />
    </button>
  )
}

// ── BPM readout (drag to scrub, click/enter to type) ─────────────────────────

interface BpmReadoutProps {
  bpm: number
  onChange: (bpm: number) => void
  size: 'sm' | 'md'
  disabled?: boolean
}

function BpmReadout({ bpm, onChange, size, disabled }: BpmReadoutProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const display = Number.isInteger(bpm) ? String(bpm) : bpm.toFixed(1)

  function startEdit() {
    if (disabled) return
    setDraft(display)
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  function commitEdit() {
    const n = parseFloat(draft)
    if (!isNaN(n) && n >= 20 && n <= 999) {
      onChange(Math.round(n * 10) / 10)
    }
    setEditing(false)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') setEditing(false)
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(999, Math.round((bpm + 1) * 10) / 10)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(20, Math.round((bpm - 1) * 10) / 10)) }
  }

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit() }
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(999, Math.round((bpm + 1) * 10) / 10)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(20, Math.round((bpm - 1) * 10) / 10)) }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (editing || disabled) return
    e.preventDefault()
    const startY = e.clientY
    const startValue = bpm
    let didDrag = false

    function onMove(me: MouseEvent) {
      const delta = startY - me.clientY
      if (Math.abs(delta) >= 3) didDrag = true
      onChange(Math.min(999, Math.max(20, Math.round((startValue + delta) * 10) / 10)))
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!didDrag) startEdit()
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className={styles.bpmReadout}
      data-size={size}
      data-editing={editing || undefined}
    >
      <span className={styles.bpmLabel} aria-hidden>♩=</span>
      {editing ? (
        <input
          ref={inputRef}
          className={styles.bpmInput}
          data-size={size}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleInputKeyDown}
          aria-label="Tempo in BPM"
          type="text"
          inputMode="decimal"
        />
      ) : (
        <button
          type="button"
          className={styles.bpmValue}
          data-size={size}
          aria-label={`Tempo ${display} BPM, drag or press enter to edit`}
          onMouseDown={disabled ? undefined : handleMouseDown}
          onKeyDown={handleButtonKeyDown}
          disabled={disabled}
        >
          {display}
        </button>
      )}
    </div>
  )
}

// ── Time signature readout (click numerator or denominator to edit) ───────────

interface TimeSigReadoutProps {
  numerator: number
  denominator: number
  onChange: (numerator: number, denominator: number) => void
  size: 'sm' | 'md'
  disabled?: boolean
}

const VALID_DENOMINATORS = [2, 4, 8, 16]

function TimeSigReadout({ numerator, denominator, onChange, size, disabled }: TimeSigReadoutProps) {
  const [editField, setEditField] = useState<'num' | 'den' | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(field: 'num' | 'den') {
    if (disabled) return
    setDraft(field === 'num' ? String(numerator) : String(denominator))
    setEditField(field)
    setTimeout(() => { inputRef.current?.select() }, 0)
  }

  function commitEdit() {
    const n = parseInt(draft, 10)
    if (!isNaN(n)) {
      if (editField === 'num' && n >= 1 && n <= 32) onChange(n, denominator)
      if (editField === 'den' && VALID_DENOMINATORS.includes(n)) onChange(numerator, n)
    }
    setEditField(null)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') setEditField(null)
    if (e.key === 'ArrowUp' && editField === 'num') {
      e.preventDefault()
      onChange(Math.min(32, numerator + 1), denominator)
    }
    if (e.key === 'ArrowDown' && editField === 'num') {
      e.preventDefault()
      onChange(Math.max(1, numerator - 1), denominator)
    }
    if (e.key === 'ArrowUp' && editField === 'den') {
      e.preventDefault()
      const idx = VALID_DENOMINATORS.indexOf(denominator)
      onChange(numerator, VALID_DENOMINATORS[Math.min(idx + 1, VALID_DENOMINATORS.length - 1)])
    }
    if (e.key === 'ArrowDown' && editField === 'den') {
      e.preventDefault()
      const idx = VALID_DENOMINATORS.indexOf(denominator)
      onChange(numerator, VALID_DENOMINATORS[Math.max(idx - 1, 0)])
    }
  }

  return (
    <div
      className={styles.timeSigReadout}
      data-size={size}
      aria-label={`Time signature ${numerator}/${denominator}`}
    >
      <div className={styles.timeSigStack}>
        {editField === 'num' ? (
          <input
            ref={inputRef}
            className={styles.timeSigInput}
            data-size={size}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleInputKeyDown}
            aria-label="Time signature numerator"
            type="text"
            inputMode="numeric"
          />
        ) : (
          <button
            type="button"
            className={styles.timeSigPart}
            data-size={size}
            aria-label={`Beats per bar: ${numerator}, click to edit`}
            onClick={() => startEdit('num')}
            disabled={disabled}
          >
            {numerator}
          </button>
        )}
        <span className={styles.timeSigSlash} aria-hidden="true">/</span>
        {editField === 'den' ? (
          <input
            ref={inputRef}
            className={styles.timeSigInput}
            data-size={size}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleInputKeyDown}
            aria-label="Time signature denominator"
            type="text"
            inputMode="numeric"
          />
        ) : (
          <button
            type="button"
            className={styles.timeSigPart}
            data-size={size}
            aria-label={`Beat unit: ${denominator}, click to edit`}
            onClick={() => startEdit('den')}
            disabled={disabled}
          >
            {denominator}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Secondary readouts (compact, dim, mono) ───────────────────────────────────

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 1000)
  return `${m}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

interface SecondaryReadoutsProps {
  selectionStart: number
  selectionEnd: number
  gridDivision: string
  rate: number
  size: 'sm' | 'md'
}

function SecondaryReadouts({ selectionStart, selectionEnd, gridDivision, rate, size }: SecondaryReadoutsProps) {
  const length = Math.max(0, selectionEnd - selectionStart)
  return (
    <div className={styles.secondaryReadouts} data-size={size}>
      <div className={styles.secGroup}>
        <span className={styles.secLabel}>SEL</span>
        <span className={styles.secValue} aria-label={`Selection start ${formatTime(selectionStart)}`}>
          {formatTime(selectionStart)}
        </span>
        <span className={styles.secSep} aria-hidden>›</span>
        <span className={styles.secValue} aria-label={`Selection end ${formatTime(selectionEnd)}`}>
          {formatTime(selectionEnd)}
        </span>
        <span className={styles.secSep} aria-hidden>↔</span>
        <span className={styles.secValue} aria-label={`Selection length ${formatTime(length)}`}>
          {formatTime(length)}
        </span>
      </div>
      <div className={styles.secGroup}>
        <span className={styles.secLabel}>GRID</span>
        <span className={styles.secValue}>{gridDivision}</span>
      </div>
      <div className={styles.secGroup}>
        <span className={styles.secLabel}>RATE</span>
        <span className={styles.secValue}>{rate.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ── TransportBar ──────────────────────────────────────────────────────────────

export interface TransportBarProps {
  /** Engine frame — caller drives at ~30 Hz when playing */
  playing: boolean
  recording: boolean
  seconds: number

  /** Project state */
  bpm: number
  numerator: number
  denominator: number

  /** Loop / record */
  loopEnabled: boolean
  recordState: RecordModeState
  recordMode: RecordModeValue

  /** Selection range in seconds */
  selectionStart: number
  selectionEnd: number

  /** Compact secondary readouts */
  gridDivision: string
  rate: number

  /** Clock display mode */
  clockMode?: 'bars' | 'time'
  onClockModeChange?: (mode: 'bars' | 'time') => void
  /** How many time units the clock shows. 1=coarse, 3=full. Default 3. */
  clockPrecision?: 1 | 2 | 3

  /** Transport callbacks */
  onPlay: () => void
  onStop: () => void
  onGoToStart: () => void
  onGoToEnd: () => void
  onToggleRecord: () => void
  onSelectRecordMode: (mode: RecordModeValue) => void
  onToggleLoop: (enabled: boolean) => void

  /** Project callbacks */
  onSetTempo: (bpm: number) => void
  onSetTimeSignature: (numerator: number, denominator: number) => void

  size?: 'sm' | 'md'
  disabled?: boolean

}

function resolveClockState(playing: boolean, recording: boolean): 'stopped' | 'playing' | 'recording' {
  if (recording) return 'recording'
  if (playing) return 'playing'
  return 'stopped'
}

export function TransportBar({
  playing,
  recording,
  seconds,
  bpm,
  numerator,
  denominator,
  loopEnabled,
  recordState,
  recordMode,
  selectionStart,
  selectionEnd,
  gridDivision,
  rate,
  clockMode = 'bars',
  onClockModeChange,
  clockPrecision = 3,
  onPlay,
  onStop,
  onGoToStart,
  onGoToEnd,
  onToggleRecord,
  onSelectRecordMode,
  onToggleLoop,
  onSetTempo,
  onSetTimeSignature,
  size = 'md',
  disabled,
}: TransportBarProps) {
  const clockState = resolveClockState(playing, recording)

  return (
    <div
      className={styles.root}
      data-size={size}
      role="toolbar"
      aria-label="Transport"
    >
      {/* Zone 1: left spacer — mirrors right cluster so center stays optically centered */}
      <div className={styles.leftSpacer} aria-hidden />

      {/* Zone 2: center — transport commands + clock read together */}
      <div className={styles.centerCluster}>
        <div className={styles.transportCluster}>
          <SkipButton direction="start" onClick={onGoToStart} size={size} disabled={disabled} />
          <SkipButton direction="end" onClick={onGoToEnd} size={size} disabled={disabled} />
          <div className={styles.clusterDivider} aria-hidden />
          <TransportButton
            variant="play"
            playing={playing}
            onClick={() => onPlay()}
            size={size}
            disabled={disabled}
          />
          <TransportButton
            variant="stop"
            onClick={() => onStop()}
            size={size}
            disabled={disabled}
          />
          <div className={styles.clusterDivider} aria-hidden />
          <RecordMode
            state={recordState}
            mode={recordMode}
            onToggleRecord={() => onToggleRecord()}
            onSelectMode={onSelectRecordMode}
            size={size}
            disabled={disabled}
          />
          <RepeatToggle
            repeating={loopEnabled}
            onToggle={onToggleLoop}
            size={size}
            disabled={disabled}
          />
        </div>

        <div className={styles.clockZone}>
          <Clock
            seconds={seconds}
            bpm={bpm}
            numerator={numerator}
            denominator={denominator}
            state={clockState}
            mode={clockMode}
            onModeChange={onClockModeChange}
            precision={clockPrecision}
            size={size}
          />
        </div>
      </div>

      {/* Zone 3: right — tempo + time-sig + secondary readouts */}
      <div className={styles.rightCluster}>
        <div className={styles.projectReadouts}>
          <BpmReadout bpm={bpm} onChange={onSetTempo} size={size} disabled={disabled} />
          <TimeSigReadout
            numerator={numerator}
            denominator={denominator}
            onChange={onSetTimeSignature}
            size={size}
            disabled={disabled}
          />
        </div>
        <div className={styles.clusterDivider} aria-hidden />
        <SecondaryReadouts
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          gridDivision={gridDivision}
          rate={rate}
          size={size}
        />
      </div>
    </div>
  )
}
