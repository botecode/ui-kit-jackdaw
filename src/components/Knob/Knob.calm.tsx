// src/components/Knob/Knob.calm.tsx
// Calm-theme variant of the generic rotary control. A soft disc with a quiet
// value arc and one pointer notch — no knurl, no LED ring. Reuses the base pure
// helpers so the value/angle math matches exactly.
import { useEffect, useRef, useState } from 'react'
import { clamp, valueToAngle, arcPath } from './Knob'
import type { KnobProps } from './Knob'
import styles from './Knob.calm.module.css'

const ARC_R = 17
const ARC_C = 20

export function KnobCalm({
  value, min, max, onChange,
  centered = false,
  step,
  resetValue,
  format,
  size = 'md',
  color,
  disabled = false,
  'aria-label': ariaLabel = 'Knob',
}: KnobProps) {
  const reset = resetValue ?? (centered ? (min + max) / 2 : min)
  const range = max - min
  const quantize = (v: number) => (step ? Math.round(v / step) * step : v)
  const fmt = format ?? ((v: number) => `${Math.round(v * 100) / 100}`)

  const svgRef = useRef<SVGSVGElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, value: 0, shift: false })

  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    const el = svgRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const delta = clamp(-e.deltaY * 0.0015, -0.08, 0.08) * range
      const stepped = step ? Math.round((valueRef.current + delta) / step) * step : valueRef.current + delta
      onChangeRef.current(clamp(stepped, min, max))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled, range, min, max, step])

  function commit(v: number) { onChange(quantize(clamp(v, min, max))) }
  function handleReset() { if (!disabled) commit(reset) }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, value, shift: e.shiftKey }
    setDragging(true)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dy = e.clientY - dragStart.current.y
    const sensitivity = (dragStart.current.shift ? 0.0014 : 0.007) * range
    commit(dragStart.current.value + dy * -sensitivity)
  }
  function handlePointerUp() { setDragging(false) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const s = step ?? range / 100
    const big = step ? step * 5 : range / 10
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':   next = value + (e.shiftKey ? big : s); break
      case 'ArrowLeft':  case 'ArrowDown': next = value - (e.shiftKey ? big : s); break
      case 'PageUp':   next = value + big; break
      case 'PageDown': next = value - big; break
      case 'Home':     next = min; break
      case 'End':      next = max; break
      case 'Backspace': case 'Delete': case '0': e.preventDefault(); handleReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) commit(next)
  }

  const valueAngle = valueToAngle(value, min, max)
  const startAngle = centered ? valueToAngle(reset, min, max) : -135
  const showValueArc = Math.abs(valueAngle - startAngle) > 0.5

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
      style={color ? { '--knob-accent': color } as React.CSSProperties : undefined}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 40 40"
        className={styles.knob}
        data-size={size}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={fmt(value)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleReset}
        onKeyDown={handleKeyDown}
      >
        <path
          data-testid="range-arc" aria-hidden="true"
          d={arcPath(ARC_C, ARC_C, ARC_R, -135, 135)}
          className={styles.rangeArc} strokeWidth="2"
        />
        {showValueArc && (
          <path
            data-testid="value-arc" aria-hidden="true"
            d={arcPath(ARC_C, ARC_C, ARC_R, startAngle, valueAngle)}
            className={styles.valueArc} strokeWidth="2"
          />
        )}
        <g
          data-testid="knob-body"
          className={styles.knobBody}
          style={{ transform: `rotate(${valueAngle}deg)`, transformOrigin: '20px 20px' }}
        >
          <circle cx="20" cy="20" r="9" className={styles.cap} />
          <line x1="20" y1="13" x2="20" y2="17" className={styles.pointer} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </svg>
      <span className={styles.readout} data-testid="readout" aria-hidden="true">{fmt(value)}</span>
    </div>
  )
}
