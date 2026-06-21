// src/components/Knob/Knob.tsx
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import styles from './Knob.module.css'

// ─── Geometry ────────────────────────────────────────────────────────────────
// Generic rotary control. Shares PanKnob's visual language (recessed well,
// knurled grip, colored cap, LED ring, −135°..+135° sweep) but works for any
// [min, max] range — unipolar by default, or `centered` for bipolar params.

const ANGLE_MIN = -135
const ANGLE_MAX = 135
const SWEEP = ANGLE_MAX - ANGLE_MIN // 270°
const ARC_R = 18
const ARC_C = 20

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

export function valueToAngle(value: number, min: number, max: number): number {
  return ANGLE_MIN + normalize(value, min, max) * SWEEP
}

export function snap(value: number, step: number | undefined, min: number, max: number): number {
  if (!step || step <= 0) return clamp(value, min, max)
  const snapped = Math.round((value - min) / step) * step + min
  return clamp(snapped, min, max)
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
  const dAngle = toDeg - fromDeg
  const largeArc = Math.abs(dAngle) > 180 ? 1 : 0
  const sweep = dAngle > 0 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface KnobProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Optional quantisation; also drives the default keyboard arrow step. */
  step?: number
  /** Bipolar: value arc grows from the centre (resetValue) instead of from min. */
  centered?: boolean
  size?: 'sm' | 'md'
  color?: string
  /** Value snapped to on double-click / 0 / Delete. Defaults to centre or min. */
  resetValue?: number
  disabled?: boolean
  /** Formats the hover/focus readout and the ARIA value text. */
  format?: (value: number) => string
  'aria-label'?: string
}

export function Knob({
  value,
  onChange,
  min = 0,
  max = 1,
  step,
  centered = false,
  size = 'md',
  color,
  resetValue,
  disabled = false,
  format,
  'aria-label': ariaLabel = 'Value',
}: KnobProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const uid = useId()
  const gradId = `jd-knobcap-${uid.replace(/:/g, '')}`

  const range = max - min
  const center = resetValue ?? (centered ? (min + max) / 2 : min)
  const fmt = format ?? ((v: number) => `${Math.round(v * 100) / 100}`)

  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, value: 0, shift: false })

  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => ({
    from: valueToAngle(value, min, max), key: 0, target: valueToAngle(value, min, max),
  }))

  const springAngle = useSpring(resetSeed.target, {
    stiffness: 200,
    damping: 30,
    from: resetSeed.from,
    key: resetSeed.key,
  })

  const displayAngle = resetting ? springAngle : valueToAngle(value, min, max)

  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => {
    if (resetting && Math.abs(springAngle - resetSeed.target) < 0.5) {
      setResetting(false)
    }
  }, [resetting, springAngle, resetSeed.target])

  // Native wheel listener — must be non-passive to call preventDefault()
  useEffect(() => {
    const el = svgRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const delta = clamp(-e.deltaY * 0.0015, -0.08, 0.08) * range
      onChangeRef.current(snap(valueRef.current + delta, step, min, max))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled, range, step, min, max])

  function emit(next: number) {
    onChange(snap(next, step, min, max))
  }

  function handleReset() {
    if (disabled) return
    onChange(snap(center, step, min, max))
    setResetSeed(prev => ({
      from: valueToAngle(value, min, max),
      key: prev.key + 1,
      target: valueToAngle(center, min, max),
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
    emit(clamp(dragStart.current.value + dy * -sensitivity, min, max))
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const small = step && step > 0 ? step : range * 0.01
    const big = range * 0.1
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   next = clamp(value + (e.shiftKey ? big : small), min, max); break
      case 'ArrowLeft':
      case 'ArrowDown': next = clamp(value - (e.shiftKey ? big : small), min, max); break
      case 'PageUp':    next = clamp(value + big, min, max); break
      case 'PageDown':  next = clamp(value - big, min, max); break
      case 'Home':      next = min; break
      case 'End':       next = max; break
      case 'Backspace':
      case 'Delete':
      case '0':         e.preventDefault(); handleReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) emit(next)
  }

  const knurlCount = size === 'sm' ? 16 : 24
  const arcStart = centered ? valueToAngle(center, min, max) : ANGLE_MIN
  const showValueArc = Math.abs(displayAngle - arcStart) > 0.5

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

        {/* ── Static layer: 13 tick marks −135°..+135° at 22.5° steps ── */}
        {Array.from({ length: 13 }, (_, i) => {
          const deg = ANGLE_MIN + i * 22.5
          const rad = (deg * Math.PI) / 180
          const edge = centered && i === 6
          return (
            <line
              key={i}
              data-testid="tick"
              x1={20 + Math.sin(rad) * 15.5} y1={20 - Math.cos(rad) * 15.5}
              x2={20 + Math.sin(rad) * (edge ? 17.5 : 16.5)}
              y2={20 - Math.cos(rad) * (edge ? 17.5 : 16.5)}
              stroke={edge ? 'var(--border-strong)' : 'var(--text-muted)'}
              strokeWidth={edge ? 1.5 : 0.8}
              shapeRendering="crispEdges"
            />
          )
        })}

        {/* ── Arc layer: range groove + value arc (+ centre tick if bipolar) ── */}
        <path
          data-testid="range-arc"
          aria-hidden="true"
          d={arcPath(ARC_C, ARC_C, ARC_R, ANGLE_MIN, ANGLE_MAX)}
          className={styles.rangeArc}
          strokeWidth="2.5"
        />
        {centered && (
          <line
            data-testid="center-tick"
            aria-hidden="true"
            x1={ARC_C} y1={ARC_C - ARC_R - 1.5}
            x2={ARC_C} y2={ARC_C - ARC_R + 1.5}
            className={styles.centerTick}
            strokeWidth="2.5"
          />
        )}
        {showValueArc && (
          <path
            data-testid="value-arc"
            aria-hidden="true"
            d={arcPath(ARC_C, ARC_C, ARC_R, arcStart, displayAngle)}
            className={styles.valueArc}
            strokeWidth="2.5"
          />
        )}

        {/* ── Rotating layer: knurled grip + cap + pointer ── */}
        <g
          data-testid="knob-body"
          className={styles.knobBody}
          style={{
            transform: `rotate(${displayAngle}deg)`,
            transformOrigin: '20px 20px',
          }}
        >
          {Array.from({ length: knurlCount }, (_, i) => {
            const shadowRad = ((360 / knurlCount) * i * Math.PI) / 180
            const highlightRad = shadowRad + (1.5 * Math.PI) / 180
            return (
              <Fragment key={i}>
                <line
                  x1={20 + Math.sin(shadowRad) * 10} y1={20 - Math.cos(shadowRad) * 10}
                  x2={20 + Math.sin(shadowRad) * 14} y2={20 - Math.cos(shadowRad) * 14}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
                <line
                  x1={20 + Math.sin(highlightRad) * 10} y1={20 - Math.cos(highlightRad) * 10}
                  x2={20 + Math.sin(highlightRad) * 14} y2={20 - Math.cos(highlightRad) * 14}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
              </Fragment>
            )
          })}

          <circle cx="20" cy="20" r="9.5" className={styles.cap} />
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />

          <rect
            x="19" y="12.5" width="2" height="4" rx="1"
            fill="var(--accent-contrast)"
            stroke="var(--bg)" strokeWidth="0.5" strokeOpacity="0.4"
          />
        </g>

        {/* ── LED ring — edge ring + diffuse spill; CSS controls opacity ── */}
        <circle
          data-testid="led-ring"
          cx="20" cy="20" r="10.25"
          strokeWidth="1.5"
          className={styles.ledRing}
        />
      </svg>

      <span className={styles.readout} data-testid="readout" aria-hidden="true">
        {fmt(value)}
      </span>
    </div>
  )
}
