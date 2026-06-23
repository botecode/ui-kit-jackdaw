// src/components/TransportBar/TransportBar.calm.tsx
// Calm-theme variant of the TransportBar. Same contract and layout zones, but a
// soft paper bar with calm transport primitives and quiet, well-less readouts —
// no recessed grooves, no LED glow. The BPM/time-signature editing behaviour is
// ported faithfully from the base bar; only the surface is calm.
import { useRef, useState } from 'react'
import { SkipBack, SkipForward } from '@phosphor-icons/react'
import { TransportButtonCalm } from '../TransportButton/TransportButton.calm'
import { RecordModeCalm } from '../RecordMode/RecordMode.calm'
import { RepeatToggleCalm } from '../RepeatToggle/RepeatToggle.calm'
import { ClockCalm } from '../Clock/Clock.calm'
import type { TransportBarProps } from './TransportBar'
import styles from './TransportBar.calm.module.css'

const SKIP_ICON_SIZE: Record<'sm' | 'md', number> = { sm: 14, md: 16 }

function SkipButton({ direction, onClick, size, disabled }: {
  direction: 'start' | 'end'; onClick: () => void; size: 'sm' | 'md'; disabled?: boolean
}) {
  const Icon = direction === 'start' ? SkipBack : SkipForward
  return (
    <button
      type="button"
      className={styles.skipBtn}
      data-size={size}
      aria-label={direction === 'start' ? 'Go to start' : 'Go to end'}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon aria-hidden size={SKIP_ICON_SIZE[size]} />
    </button>
  )
}

// ── BPM readout (drag to scrub, click/enter to type) ─────────────────────────

function BpmReadout({ bpm, onChange, size, disabled }: {
  bpm: number; onChange: (bpm: number) => void; size: 'sm' | 'md'; disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const display = Number.isInteger(bpm) ? String(bpm) : bpm.toFixed(1)

  function startEdit() {
    if (disabled) return
    setDraft(display)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }
  function commitEdit() {
    const n = parseFloat(draft)
    if (!isNaN(n) && n >= 20 && n <= 999) onChange(Math.round(n * 10) / 10)
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
    <div className={styles.bpmReadout} data-size={size} data-editing={editing || undefined}>
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

// ── Time signature readout ────────────────────────────────────────────────────

const VALID_DENOMINATORS = [2, 4, 8, 16]

function TimeSigReadout({ numerator, denominator, onChange, size, disabled }: {
  numerator: number; denominator: number
  onChange: (numerator: number, denominator: number) => void
  size: 'sm' | 'md'; disabled?: boolean
}) {
  const [editField, setEditField] = useState<'num' | 'den' | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(field: 'num' | 'den') {
    if (disabled) return
    setDraft(field === 'num' ? String(numerator) : String(denominator))
    setEditField(field)
    setTimeout(() => inputRef.current?.select(), 0)
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
    if (e.key === 'ArrowUp' && editField === 'num') { e.preventDefault(); onChange(Math.min(32, numerator + 1), denominator) }
    if (e.key === 'ArrowDown' && editField === 'num') { e.preventDefault(); onChange(Math.max(1, numerator - 1), denominator) }
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
    <div className={styles.timeSigReadout} data-size={size} aria-label={`Time signature ${numerator}/${denominator}`}>
      <div className={styles.timeSigStack}>
        {editField === 'num' ? (
          <input
            ref={inputRef} className={styles.timeSigInput} data-size={size} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleInputKeyDown}
            aria-label="Time signature numerator" type="text" inputMode="numeric"
          />
        ) : (
          <button
            type="button" className={styles.timeSigPart} data-size={size}
            aria-label={`Beats per bar: ${numerator}, click to edit`}
            onClick={() => startEdit('num')} disabled={disabled}
          >{numerator}</button>
        )}
        <span className={styles.timeSigSlash} aria-hidden="true">/</span>
        {editField === 'den' ? (
          <input
            ref={inputRef} className={styles.timeSigInput} data-size={size} value={draft}
            onChange={e => setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={handleInputKeyDown}
            aria-label="Time signature denominator" type="text" inputMode="numeric"
          />
        ) : (
          <button
            type="button" className={styles.timeSigPart} data-size={size}
            aria-label={`Beat unit: ${denominator}, click to edit`}
            onClick={() => startEdit('den')} disabled={disabled}
          >{denominator}</button>
        )}
      </div>
    </div>
  )
}

function resolveClockState(playing: boolean, recording: boolean): 'stopped' | 'playing' | 'recording' {
  if (recording) return 'recording'
  if (playing) return 'playing'
  return 'stopped'
}

// ── TransportBar (Calm) ───────────────────────────────────────────────────────

export function TransportBarCalm({
  playing,
  recording,
  seconds,
  bpm,
  numerator,
  denominator,
  loopEnabled,
  recordState,
  recordMode,
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
    <div className={styles.root} data-size={size} role="toolbar" aria-label="Transport">
      <div className={styles.leftSpacer} aria-hidden />

      <div className={styles.centerCluster}>
        <div className={styles.transportCluster}>
          <SkipButton direction="start" onClick={onGoToStart} size={size} disabled={disabled} />
          <SkipButton direction="end" onClick={onGoToEnd} size={size} disabled={disabled} />
          <div className={styles.clusterDivider} aria-hidden />
          <TransportButtonCalm variant="play" playing={playing} onClick={() => onPlay()} size={size} disabled={disabled} />
          <TransportButtonCalm variant="stop" onClick={() => onStop()} size={size} disabled={disabled} />
          <div className={styles.clusterDivider} aria-hidden />
          <RecordModeCalm
            state={recordState}
            mode={recordMode}
            onToggleRecord={() => onToggleRecord()}
            onSelectMode={onSelectRecordMode}
            size={size}
            disabled={disabled}
          />
          <RepeatToggleCalm repeating={loopEnabled} onToggle={onToggleLoop} size={size} disabled={disabled} />
        </div>

        <div className={styles.clockZone}>
          <ClockCalm
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

      <div className={styles.rightCluster}>
        <div className={styles.projectReadouts}>
          <BpmReadout bpm={bpm} onChange={onSetTempo} size={size} disabled={disabled} />
          <TimeSigReadout numerator={numerator} denominator={denominator} onChange={onSetTimeSignature} size={size} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}
