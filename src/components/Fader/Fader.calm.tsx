// src/components/Fader/Fader.calm.tsx
// Calm-theme variant of Fader. Same contract and scale math (reuses faderScales),
// but the look is a thin paper track with a soft round handle and a gentle fill —
// no machined cap, no recessed channel. Drag is absolute (the handle follows the
// pointer), which suits a calm, deliberate control.
import { useRef, useState } from 'react'
import { clamp, linearScale, quantizeValue } from './faderScales'
import type { FaderProps } from './Fader'
import styles from './Fader.calm.module.css'

export function FaderCalm({
  value,
  onChange,
  min = 0,
  max = 1,
  step,
  orientation = 'vertical',
  scale,
  resetValue,
  size = 'md',
  disabled = false,
  color,
  format,
  'aria-label': ariaLabel = 'Fader',
}: FaderProps) {
  const effScale = scale ?? linearScale()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const pos = clamp(effScale.toPosition(value, min, max), 0, 1)
  const readoutText = format ? format(value) : effScale.defaultFormat(value)

  function commit(next: number) {
    onChange(quantizeValue(clamp(next, min, max), step, min, max))
  }

  function setFromPointer(e: { clientX: number; clientY: number }) {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = orientation === 'vertical'
      ? 1 - (e.clientY - rect.top) / rect.height
      : (e.clientX - rect.left) / rect.width
    commit(effScale.toValue(clamp(p, 0, 1), min, max))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
    setFromPointer(e)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setFromPointer(e)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const range = max - min
    const stepSize = e.shiftKey ? (step ? step / 5 : range * 0.004) : (step ?? range * 0.02)
    let next: number | null = null
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': next = value + stepSize; break
      case 'ArrowDown':
      case 'ArrowLeft':  next = value - stepSize; break
      case 'PageUp':     next = value + range * 0.1; break
      case 'PageDown':   next = value - range * 0.1; break
      case 'Home':       next = min; break
      case 'End':        next = max; break
      case 'Backspace':
      case 'Delete':     e.preventDefault(); commit(resetValue ?? min); return
      default: return
    }
    e.preventDefault()
    if (next !== null) commit(next)
  }

  function handleDoubleClick() {
    if (disabled) return
    commit(resetValue ?? min)
  }

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={size}
      data-dragging={dragging || undefined}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={readoutText}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={trackRef}
        className={styles.track}
        data-testid="fader-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={styles.fill} style={{ '--pos': pos } as React.CSSProperties} />
        <div
          className={styles.cap}
          data-testid="fader-cap"
          style={{ '--pos': pos, '--fader-accent': color ?? 'var(--accent)' } as React.CSSProperties}
        />
      </div>
      <span className={styles.readout} data-testid="fader-readout" aria-hidden="true">
        {readoutText}
      </span>
    </div>
  )
}
