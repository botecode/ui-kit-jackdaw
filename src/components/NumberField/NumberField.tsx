// src/components/NumberField/NumberField.tsx
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from '@phosphor-icons/react'
import styles from './NumberField.module.css'

export interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  precision?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  autoFocus?: boolean
  'aria-label': string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampNum(v: number, min?: number, max?: number): number {
  let r = v
  if (min !== undefined) r = Math.max(min, r)
  if (max !== undefined) r = Math.min(max, r)
  return r
}

// Snap to the nearest multiple of snapStep to avoid floating-point drift.
// The caller decides the snapping granularity — normal step for discrete jumps,
// step/10 for fine mode so the value can land between normal step boundaries.
function snapToStep(v: number, snapStep: number): number {
  const factor = 1 / snapStep
  return Math.round(v * factor) / factor
}

function derivePrecision(step: number): number {
  if (step >= 1) return 0
  return Math.max(0, Math.ceil(-Math.log10(step)))
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }

// ─── Component ────────────────────────────────────────────────────────────────

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  precision,
  size = 'md',
  disabled,
  autoFocus,
  'aria-label': ariaLabel,
}: NumberFieldProps) {
  const effectivePrecision = precision ?? derivePrecision(step)
  const formattedValue = value.toFixed(effectivePrecision)
  const ariaValueText = unit ? `${formattedValue} ${unit}` : formattedValue

  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const valueRef    = useRef(value)
  const onChangeRef = useRef(onChange)
  // null = not dragging; non-null = drag in progress, fine = shift held at drag start
  const dragRef = useRef<{ y: number; value: number; moved: boolean; fine: boolean } | null>(null)

  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })

  // ── Core value application ────────────────────────────────────────────────
  // snapStep defaults to the component's step; fine mode passes step/10 so
  // the value can land between normal step boundaries (e.g. 101 with step=10).
  function applyValue(raw: number, snapStep = step) {
    const snapped = snapToStep(raw, snapStep)
    const clamped = clampNum(snapped, min, max)
    const dp = Math.max(effectivePrecision, derivePrecision(snapStep))
    const precise = parseFloat(clamped.toFixed(dp))
    onChangeRef.current(precise)
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  function startEdit() {
    if (disabled) return
    setDraft(formattedValue)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function commitEdit() {
    const n = parseFloat(draft)
    if (!isNaN(n)) applyValue(n)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  // ── Stepper helpers (always use the full step) ────────────────────────────
  function increment() {
    if (disabled || editing) return
    applyValue(valueRef.current + step)
  }

  function decrement() {
    if (disabled || editing) return
    applyValue(valueRef.current - step)
  }

  // ── Keyboard — display mode ───────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const delta = e.shiftKey ? step / 10 : step
        applyValue(valueRef.current + delta, delta)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const delta = e.shiftKey ? step / 10 : step
        applyValue(valueRef.current - delta, delta)
        break
      }
      case 'Enter':
      case ' ':
        e.preventDefault()
        startEdit()
        break
      default:
        // Typing a digit/sign/dot immediately seeds the draft and opens edit mode
        if (/^[-\d.]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          setDraft(e.key)
          setEditing(true)
          requestAnimationFrame(() => {
            const input = inputRef.current
            if (input) { input.focus(); input.setSelectionRange(1, 1) }
          })
        }
    }
  }

  // ── Keyboard — edit mode ──────────────────────────────────────────────────
  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        commitEdit()
        break
      case 'Escape':
        e.preventDefault()
        cancelEdit()
        break
      case 'ArrowUp': {
        e.preventDefault()
        const delta = e.shiftKey ? step / 10 : step
        applyValue(valueRef.current + delta, delta)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const delta = e.shiftKey ? step / 10 : step
        applyValue(valueRef.current - delta, delta)
        break
      }
    }
  }

  // ── Pointer drag on the readout ───────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || editing) return
    e.preventDefault()  // prevent text selection during drag
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { y: e.clientY, value: valueRef.current, moved: false, fine: e.shiftKey }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const dy = dragRef.current.y - e.clientY  // up = positive = increase
    if (Math.abs(dy) >= 3) {
      dragRef.current.moved = true
      const sensitivity = dragRef.current.fine ? 0.1 : 1.0
      const moveStep = dragRef.current.fine ? step * 0.1 : step
      applyValue(dragRef.current.value + dy * step * sensitivity, moveStep)
    }
  }

  function handlePointerUp() {
    if (!dragRef.current) return
    const { moved } = dragRef.current
    dragRef.current = null
    setIsDragging(false)
    // A non-drag "click" on the readout → open edit mode
    if (!moved) startEdit()
  }

  const iconSize = ICON_SIZE[size]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={styles.root}
      data-size={size}
      data-disabled={disabled || undefined}
      data-dragging={isDragging || undefined}
      data-editing={editing || undefined}
    >
      {/* Decrement */}
      <button
        type="button"
        className={styles.stepper}
        aria-label={`Decrease ${ariaLabel}`}
        disabled={disabled || atMin}
        tabIndex={-1}
        onPointerDown={e => { e.preventDefault(); decrement() }}
      >
        <Minus aria-hidden size={iconSize} />
      </button>

      <div className={styles.divider} aria-hidden="true" />

      {/* Value area — toggles between spinbutton readout and text input */}
      <div className={styles.valueArea}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.editInput}
            type="text"
            inputMode="decimal"
            aria-label={ariaLabel}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <div
            className={styles.readout}
            role="spinbutton"
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={ariaValueText}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            autoFocus={autoFocus}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            <span className={styles.valueText} aria-hidden="true">{formattedValue}</span>
          </div>
        )}
        {unit && <span className={styles.unit} aria-hidden="true">{unit}</span>}
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Increment */}
      <button
        type="button"
        className={styles.stepper}
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled || atMax}
        tabIndex={-1}
        onPointerDown={e => { e.preventDefault(); increment() }}
      >
        <Plus aria-hidden size={iconSize} />
      </button>
    </div>
  )
}
