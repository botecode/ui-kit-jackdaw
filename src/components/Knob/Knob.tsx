// src/components/Knob/Knob.tsx
// A generic rotary control for any [min, max] range — the plugin-UI knob.
// Same recessed-off / LED-lit-on language as PanKnob, but value-range driven:
// unipolar by default, `centered` for bipolar params, optional `step`, custom
// `color`, and a `format` callback for the readout.
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import styles from './Knob.module.css'

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Map a value in [min,max] to the knob's −135°..+135° (270° sweep). */
export function valueToAngle(value: number, min: number, max: number): number {
  if (max === min) return -135
  const t = clamp((value - min) / (max - min), 0, 1)
  return -135 + t * 270
}

export function arcPath(
  cx: number, cy: number, r: number, fromDeg: number, toDeg: number,
): string {
  const r4 = (n: number) => Math.round(n * 10000) / 10000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const sx = r4(cx + r * Math.sin(toRad(fromDeg)))
  const sy = r4(cy - r * Math.cos(toRad(fromDeg)))
  const ex = r4(cx + r * Math.sin(toRad(toDeg)))
  const ey = r4(cy - r * Math.cos(toRad(toDeg)))
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  const sweep = toDeg - fromDeg > 0 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`
}

const ARC_R = 18
const ARC_C = 20

// ─── Component ─────────────────────────────────────────────────────────────

export interface KnobProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** Bipolar: the value arc fills from the range center, not the start. */
  centered?: boolean
  /** Quantize to this increment (e.g. 1 for integers, 0.5 dB, …). */
  step?: number
  /** Double-click / Delete resets here. Defaults to min (or range center if centered). */
  resetValue?: number
  /** Readout text. Defaults to a rounded number. */
  format?: (value: number) => string
  size?: 'sm' | 'md'
  color?: string
  disabled?: boolean
  'aria-label'?: string
}

export function Knob({
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
  const uid = useId()
  const gradId = `jd-knob-${uid.replace(/:/g, '')}`

  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, value: 0, shift: false })

  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => ({
    from: valueToAngle(value, min, max), key: 0, target: valueToAngle(value, min, max),
  }))
  const springAngle = useSpring(resetSeed.target, {
    stiffness: 200, damping: 30, from: resetSeed.from, key: resetSeed.key,
  })
  const displayAngle = resetting ? springAngle : valueToAngle(value, min, max)

  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (resetting && Math.abs(springAngle - resetSeed.target) < 0.5) setResetting(false)
  }, [resetting, springAngle, resetSeed.target])

  // Non-passive wheel listener so preventDefault() works.
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

  function handleReset() {
    if (disabled) return
    onChange(quantize(clamp(reset, min, max)))
    setResetSeed(prev => ({
      from: valueToAngle(value, min, max),
      key: prev.key + 1,
      target: valueToAngle(reset, min, max),
    }))
    setResetting(true)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, value, shift: e.shiftKey }
    setDragging(true)
    setResetting(false)
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

  const knurlCount = size === 'sm' ? 16 : 24
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
        <defs>
          <radialGradient id={gradId} cx="38%" cy="28%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tick marks across the 270° sweep */}
        {Array.from({ length: 11 }, (_, i) => {
          const deg = -135 + i * 27
          const rad = (deg * Math.PI) / 180
          return (
            <line
              key={i}
              data-testid="tick"
              x1={20 + Math.sin(rad) * 15.5} y1={20 - Math.cos(rad) * 15.5}
              x2={20 + Math.sin(rad) * 16.5} y2={20 - Math.cos(rad) * 16.5}
              stroke="var(--text-muted)" strokeWidth="0.8" shapeRendering="crispEdges"
            />
          )
        })}

        {/* Range groove + value arc */}
        <path
          data-testid="range-arc" aria-hidden="true"
          d={arcPath(ARC_C, ARC_C, ARC_R, -135, 135)}
          className={styles.rangeArc} strokeWidth="2.5"
        />
        {showValueArc && (
          <path
            data-testid="value-arc" aria-hidden="true"
            d={arcPath(ARC_C, ARC_C, ARC_R, startAngle, valueAngle)}
            className={styles.valueArc} strokeWidth="2.5"
          />
        )}

        {/* Rotating body: knurled grip + cap + pointer */}
        <g
          data-testid="knob-body"
          className={styles.knobBody}
          style={{ transform: `rotate(${displayAngle}deg)`, transformOrigin: '20px 20px' }}
        >
          {Array.from({ length: knurlCount }, (_, i) => {
            const shadowRad = ((360 / knurlCount) * i * Math.PI) / 180
            const highlightRad = shadowRad + (1.5 * Math.PI) / 180
            return (
              <Fragment key={i}>
                <line
                  x1={20 + Math.sin(shadowRad) * 10} y1={20 - Math.cos(shadowRad) * 10}
                  x2={20 + Math.sin(shadowRad) * 14} y2={20 - Math.cos(shadowRad) * 14}
                  stroke="rgba(0,0,0,0.45)" strokeWidth="1" shapeRendering="crispEdges"
                />
                <line
                  x1={20 + Math.sin(highlightRad) * 10} y1={20 - Math.cos(highlightRad) * 10}
                  x2={20 + Math.sin(highlightRad) * 14} y2={20 - Math.cos(highlightRad) * 14}
                  stroke="rgba(255,255,255,0.1)" strokeWidth="1" shapeRendering="crispEdges"
                />
              </Fragment>
            )
          })}
          <circle cx="20" cy="20" r="9.5" className={styles.cap} />
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />
          <rect
            x="19" y="12.5" width="2" height="4" rx="1"
            fill="var(--accent-contrast)" stroke="var(--bg)" strokeWidth="0.5" strokeOpacity="0.4"
          />
        </g>

        <circle
          data-testid="led-ring" cx="20" cy="20" r="10.25"
          strokeWidth="1.5" className={styles.ledRing}
        />
      </svg>

      <span className={styles.readout} data-testid="readout" aria-hidden="true">{fmt(value)}</span>
    </div>
  )
}
