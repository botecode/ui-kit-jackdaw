// src/components/Fader/Fader.tsx
import { useEffect, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import { clamp, linearScale } from './faderScales'
import type { FaderScale } from './faderScales'
import styles from './Fader.module.css'

export type { FaderScale }
export { linearScale, dbScale } from './faderScales'

// ─── Constants ─────────────────────────────────────────────────────────────

const PRESET_SIZES = new Set(['sm', 'md', 'lg'])
const CAP_LENGTHS: Record<'sm' | 'md' | 'lg', number> = { sm: 24, md: 32, lg: 44 }
const CAP_WIDTHS:  Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 20, lg: 28 }

const DEFAULT_SCALE = linearScale()

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FaderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  orientation?: 'vertical' | 'horizontal'
  scale?: FaderScale
  detent?: { value: number; strength?: number }
  resetValue?: number
  size?: 'sm' | 'md' | 'lg' | (string & {})
  disabled?: boolean
  color?: string
  format?: (value: number) => string
  'aria-label'?: string
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Fader({
  value,
  onChange,
  min = 0,
  max = 1,
  orientation = 'vertical',
  scale,
  detent,
  size = 'md',
  disabled = false,
  color,
  format,
  'aria-label': ariaLabel = 'Fader',
}: FaderProps) {
  const effectiveScale = scale ?? DEFAULT_SCALE
  const isPreset = PRESET_SIZES.has(size)
  const effectiveSize = isPreset ? (size as 'sm' | 'md' | 'lg') : 'md'

  // ── Mutable refs (read by stable callbacks) ───────────────────────────────
  const valueRef    = useRef(value)
  const onChangeRef = useRef(onChange)
  const scaleRef    = useRef(effectiveScale)
  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { scaleRef.current = effectiveScale })

  // ── Drag state ────────────────────────────────────────────────────────────
  const rootRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const capRef   = useRef<HTMLDivElement>(null)

  // ── Spring for reset / detent snap ───────────────────────────────────────
  const [resetting, setResetting] = useState(false)
  const [resetSeed] = useState(() => {
    const pct = effectiveScale.toPosition(value, min, max) * 100
    return { from: pct, target: pct, key: 0 }
  })

  const springPct = useSpring(resetSeed.target, {
    stiffness: 200,
    damping: 30,
    from: resetSeed.from,
    key: resetSeed.key,
  })

  useEffect(() => {
    if (resetting && Math.abs(springPct - resetSeed.target) < 0.5) {
      setResetting(false)
    }
  }, [resetting, springPct, resetSeed.target])

  const displayPosition = resetting
    ? clamp(springPct / 100, 0, 1)
    : clamp(effectiveScale.toPosition(value, min, max), 0, 1)

  // ── Derived values ────────────────────────────────────────────────────────
  const capLength = CAP_LENGTHS[effectiveSize]
  const capWidth  = CAP_WIDTHS[effectiveSize]
  const capColor  = color ?? 'var(--accent)'
  const readoutText = format ? format(value) : effectiveScale.defaultFormat(value)
  const detentPosition = detent
    ? clamp(effectiveScale.toPosition(detent.value, min, max), 0, 1)
    : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={isPreset ? effectiveSize : 'custom'}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={readoutText}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      style={!isPreset ? { '--fader-length': size } as React.CSSProperties : undefined}
    >
      <div ref={trackRef} className={styles.track} data-testid="fader-track">
        {detent && (
          <div
            className={styles.detentTick}
            data-testid="fader-detent"
            style={{ '--detent-pos': detentPosition } as React.CSSProperties}
          />
        )}
        <div
          className={styles.fill}
          style={{
            '--pos': displayPosition,
            '--fader-accent': capColor,
          } as React.CSSProperties}
        />
        <div
          ref={capRef}
          className={styles.cap}
          data-testid="fader-cap"
          style={{
            '--pos': displayPosition,
            '--cap-length': `${capLength}px`,
            '--cap-width': `${capWidth}px`,
            '--fader-accent': capColor,
          } as React.CSSProperties}
        />
      </div>
      <span className={styles.readout} data-testid="fader-readout" aria-hidden="true">
        {readoutText}
      </span>
    </div>
  )
}
