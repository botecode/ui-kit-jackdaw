// src/components/PanKnob/PanKnob.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import styles from './PanKnob.module.css'

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function panToAngle(pan: number): number {
  return clamp(pan * 135, -135, 135)
}

export function formatReadout(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `L${pct}` : `R${pct}`
}

export function formatAriaValueText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'Center'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `Left ${pct}` : `Right ${pct}`
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface PanKnobProps {
  pan: number
  onChange: (pan: number) => void
  size?: 'sm' | 'md'
  color?: string
  resetValue?: number
  disabled?: boolean
  'aria-label'?: string
}

export function PanKnob({
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
  const uid = useId()
  const gradId = `jd-cap-${uid.replace(/:/g, '')}`

  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, pan: 0, shift: false })

  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => ({
    from: panToAngle(pan), key: 0, target: panToAngle(pan),
  }))

  const springAngle = useSpring(resetSeed.target, {
    stiffness: 200,
    damping: 30,
    from: resetSeed.from,
    key: resetSeed.key,
  })

  const displayAngle = resetting ? springAngle : panToAngle(pan)

  // Sync mutable refs every render so stable callbacks read current values
  useEffect(() => { panRef.current = pan })
  useEffect(() => { onChangeRef.current = onChange })

  // End reset mode once spring has settled
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
      const delta = clamp(-e.deltaY * 0.0015, -0.08, 0.08)
      onChangeRef.current(clamp(panRef.current + delta, -1, 1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled])

  function handleReset() {
    if (disabled) return
    onChange(resetValue)
    setResetSeed(prev => ({
      from: panToAngle(pan),
      key: prev.key + 1,
      target: panToAngle(resetValue),
    }))
    setResetting(true)
  }

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
    const next = clamp(dragStart.current.pan + dy * -sensitivity, -1, 1)
    onChange(next)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleDoubleClick() {
    handleReset()
  }

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
      case '0':         handleReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) onChange(next)
  }

  const knurlCount = size === 'sm' ? 16 : 24
  const capColor = color ?? 'var(--accent)'

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
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
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        <defs>
          <radialGradient id={gradId} cx="38%" cy="28%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Static layer: recessed well ── */}
        <circle cx="20" cy="20" r="18" fill="var(--surface-2)" />
        <circle
          cx="20" cy="20" r="17.5"
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.4"
        />

        {/* ── Static layer: 13 tick marks −135°..+135° at 22.5° steps ── */}
        {Array.from({ length: 13 }, (_, i) => {
          const deg = -135 + i * 22.5
          const rad = (deg * Math.PI) / 180
          const center = i === 6
          return (
            <line
              key={i}
              data-testid="tick"
              x1={20 + Math.sin(rad) * 15.5} y1={20 - Math.cos(rad) * 15.5}
              x2={20 + Math.sin(rad) * (center ? 17.5 : 16.5)}
              y2={20 - Math.cos(rad) * (center ? 17.5 : 16.5)}
              stroke={center ? 'var(--border-strong)' : 'var(--border)'}
              strokeWidth={center ? 1.5 : 0.8}
              shapeRendering="crispEdges"
            />
          )
        })}

        {/* ── Rotating layer: knurled grip + cap + pointer ── */}
        <g
          data-testid="knob-body"
          style={{
            transform: `rotate(${displayAngle}deg)`,
            transformOrigin: '20px 20px',
          }}
        >
          {/* Knurled grip lines — outer band only (r 10→14), no inner fill */}
          {Array.from({ length: knurlCount }, (_, i) => {
            const rad = ((360 / knurlCount) * i * Math.PI) / 180
            return (
              <line
                key={i}
                x1={20 + Math.sin(rad) * 10} y1={20 - Math.cos(rad) * 10}
                x2={20 + Math.sin(rad) * 14} y2={20 - Math.cos(rad) * 14}
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
                shapeRendering="crispEdges"
              />
            )
          })}

          {/* Colored cap */}
          <circle cx="20" cy="20" r="9.5" fill={capColor} />
          {/* Soft top-highlight — radial gradient; no filter (no re-raster on rotate) */}
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />

          {/* Pointer notch — uses accent-contrast so it's legible on any theme's accent */}
          <rect
            x="19" y="12.5" width="2" height="4" rx="1"
            fill="var(--accent-contrast)"
            stroke="var(--bg)" strokeWidth="0.5" strokeOpacity="0.4"
          />
        </g>
      </svg>

      <span className={styles.readout} data-testid="readout" aria-hidden="true">
        {formatReadout(pan)}
      </span>
    </div>
  )
}
