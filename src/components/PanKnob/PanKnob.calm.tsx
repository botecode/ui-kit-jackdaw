// src/components/PanKnob/PanKnob.calm.tsx
// Calm-theme variant of PanKnob. No knurled grip, no LED ring, no machined cap —
// a soft disc with a quiet value arc (eucalyptus) and a single pointer notch.
// Reuses the base pure helpers (angle/format/arc) so behaviour matches.
import { useEffect, useRef, useState } from 'react'
import {
  clamp, panToAngle, formatReadout, formatAriaValueText, arcPath,
} from './PanKnob'
import type { PanKnobProps } from './PanKnob'
import styles from './PanKnob.calm.module.css'

const ARC_R = 17
const ARC_C = 20

export function PanKnobCalm({
  pan,
  onChange,
  size = 'md',
  color,
  resetValue = 0,
  disabled = false,
  'aria-label': ariaLabel = 'Pan',
}: PanKnobProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const panRef = useRef(pan)
  const onChangeRef = useRef(onChange)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, pan: 0, shift: false })

  useEffect(() => { panRef.current = pan })
  useEffect(() => { onChangeRef.current = onChange })

  // Non-passive wheel listener (preventDefault needs passive:false).
  useEffect(() => {
    const el = svgRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const delta = clamp(-e.deltaY * 0.0015, -0.08, 0.08)
      onChangeRef.current(clamp(panRef.current + delta, -1, 1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled])

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, pan, shift: e.shiftKey }
    setDragging(true)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dy = e.clientY - dragStart.current.y
    const sensitivity = dragStart.current.shift ? 0.0014 : 0.007
    onChange(clamp(dragStart.current.pan + dy * -sensitivity, -1, 1))
  }
  function handlePointerUp() { setDragging(false) }
  function handleDoubleClick() { if (!disabled) onChange(resetValue) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const step = e.shiftKey ? 0.25 : 0.05
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   next = clamp(pan + step, -1, 1); break
      case 'ArrowLeft':
      case 'ArrowDown': next = clamp(pan - step, -1, 1); break
      case 'PageUp':    next = clamp(pan + 0.25, -1, 1); break
      case 'PageDown':  next = clamp(pan - 0.25, -1, 1); break
      case 'Home':      next = -1; break
      case 'End':       next = 1;  break
      case 'Backspace':
      case 'Delete':
      case '0':         e.preventDefault(); onChange(resetValue); return
      default: return
    }
    e.preventDefault()
    if (next !== null) onChange(next)
  }

  const angle = panToAngle(pan)

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
      style={color ? { '--pan-accent': color } as React.CSSProperties : undefined}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 40 40"
        className={styles.knob}
        data-size={size}
        role="slider"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={pan}
        aria-valuetext={formatAriaValueText(pan)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Range groove + value arc + center tick */}
        <path
          data-testid="range-arc"
          aria-hidden="true"
          d={arcPath(ARC_C, ARC_C, ARC_R, -135, 135)}
          className={styles.rangeArc}
          strokeWidth="2"
        />
        <line
          data-testid="center-tick"
          aria-hidden="true"
          x1={ARC_C} y1={ARC_C - ARC_R - 1.5}
          x2={ARC_C} y2={ARC_C - ARC_R + 1.5}
          className={styles.centerTick}
          strokeWidth="2"
        />
        {Math.abs(pan) > 0.005 && (
          <path
            data-testid="value-arc"
            aria-hidden="true"
            d={arcPath(ARC_C, ARC_C, ARC_R, 0, angle)}
            className={styles.valueArc}
            strokeWidth="2"
          />
        )}

        {/* Soft disc + pointer notch (rotating) */}
        <g
          data-testid="knob-body"
          className={styles.knobBody}
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: '20px 20px' }}
        >
          <circle cx="20" cy="20" r="9" className={styles.cap} />
          <line
            x1="20" y1="13" x2="20" y2="17"
            className={styles.pointer}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <span className={styles.readout} data-testid="readout" aria-hidden="true">
        {formatReadout(pan)}
      </span>
    </div>
  )
}
