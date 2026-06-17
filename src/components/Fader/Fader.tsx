// src/components/Fader/Fader.tsx
import { useEffect, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import { clamp, linearScale, quantizeValue } from './faderScales'
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
  step,
  orientation = 'vertical',
  scale,
  detent,
  resetValue,
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
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ pointerAxis: 0, position: 0, travelLength: 0, shift: false })

  // ── Spring for reset / detent snap ───────────────────────────────────────
  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => {
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

  // ── Reset ─────────────────────────────────────────────────────────────────
  function triggerReset(targetValue?: number) {
    const resolvedTarget = targetValue ?? resetValue ?? min
    const fromPct   = resetting ? springPct : effectiveScale.toPosition(valueRef.current, min, max) * 100
    const targetPct = effectiveScale.toPosition(resolvedTarget, min, max) * 100
    setResetSeed(prev => ({ from: fromPct, target: targetPct, key: prev.key + 1 }))
    setResetting(true)
    onChangeRef.current(resolvedTarget)
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const capLength = CAP_LENGTHS[effectiveSize]
  const capWidth  = CAP_WIDTHS[effectiveSize]
  const capColor  = color ?? 'var(--accent)'
  const readoutText = format ? format(value) : effectiveScale.defaultFormat(value)
  const detentPosition = detent
    ? clamp(effectiveScale.toPosition(detent.value, min, max), 0, 1)
    : 0

  // ── Keyboard ─────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const rangeSize = max - min
    const normalStep = step ?? rangeSize * 0.02
    const fineStep   = step ? step / 5 : rangeSize * 0.004
    const coarseStep = rangeSize * 0.1

    const increment = e.shiftKey ? fineStep : normalStep
    let next: number | null = null

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': next = clamp(valueRef.current + increment, min, max); break
      case 'ArrowDown':
      case 'ArrowLeft':  next = clamp(valueRef.current - increment, min, max); break
      case 'PageUp':     next = clamp(valueRef.current + coarseStep, min, max); break
      case 'PageDown':   next = clamp(valueRef.current - coarseStep, min, max); break
      case 'Home':       next = min; break
      case 'End':        next = max; break
      case 'Backspace':
      case 'Delete':     e.preventDefault(); triggerReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) {
      onChangeRef.current(quantizeValue(next, step, min, max))
    }
  }

  // ── Pointer drag ─────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setResetting(false)

    const trackEl = trackRef.current!
    const rect = trackEl.getBoundingClientRect()
    const capLen = CAP_LENGTHS[effectiveSize]
    const travelLength = Math.max(
      (orientation === 'vertical' ? rect.height : rect.width) - capLen,
      1,
    )

    // If click lands outside the cap, jump to the click position first
    const capEl = capRef.current!
    const capRect = capEl.getBoundingClientRect()
    const HIT_PAD = 6
    const onCap = (
      e.clientX >= capRect.left - HIT_PAD && e.clientX <= capRect.right  + HIT_PAD &&
      e.clientY >= capRect.top  - HIT_PAD && e.clientY <= capRect.bottom + HIT_PAD
    )

    let startValue = valueRef.current
    if (!onCap) {
      const capHalf = capLen / 2
      const rawPos = orientation === 'vertical'
        ? 1 - (e.clientY - rect.top  - capHalf) / travelLength
        : (e.clientX  - rect.left - capHalf) / travelLength
      const jumped = clamp(
        scaleRef.current.toValue(clamp(rawPos, 0, 1), min, max),
        min, max,
      )
      startValue = quantizeValue(jumped, step, min, max)
      onChangeRef.current(startValue)
    }

    dragStart.current = {
      pointerAxis: orientation === 'vertical' ? e.clientY : e.clientX,
      position: scaleRef.current.toPosition(startValue, min, max),
      travelLength,
      shift: e.shiftKey,
    }
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const axis = orientation === 'vertical' ? e.clientY : e.clientX
    const delta = axis - dragStart.current.pointerAxis
    const sensitivity = dragStart.current.shift ? 0.2 : 1.0
    const direction = orientation === 'vertical' ? -1 : 1
    const newPos = clamp(
      dragStart.current.position + direction * delta / dragStart.current.travelLength * sensitivity,
      0, 1,
    )
    const rawValue = clamp(scaleRef.current.toValue(newPos, min, max), min, max)
    onChangeRef.current(quantizeValue(rawValue, step, min, max))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(false)

    // Detent snap on release (Shift bypasses)
    if (!e.shiftKey && detent) {
      const currentPos = scaleRef.current.toPosition(valueRef.current, min, max)
      const detentPos  = scaleRef.current.toPosition(detent.value, min, max)
      const snapRadius = (detent.strength ?? 1) * 0.05
      if (Math.abs(currentPos - detentPos) <= snapRadius) {
        triggerReset(detent.value)
      }
    }
  }

  function handleDoubleClick() {
    if (disabled) return
    triggerReset()
  }

  // ── Wheel (non-passive, attached once) ────────────────────────────────────
  // value and onChange are read from refs inside the listener — NOT in deps —
  // so the listener is only recreated when structural props (disabled/min/max/step) change.
  useEffect(() => {
    const el = rootRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const rangeSize = max - min
      const delta = -e.deltaY * 0.002 * rangeSize
      const next = clamp(valueRef.current + delta, min, max)
      onChangeRef.current(quantizeValue(next, step, min, max))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled, min, max, step])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={isPreset ? effectiveSize : 'custom'}
      data-dragging={dragging || undefined}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={readoutText}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      style={!isPreset ? { '--fader-length': size } as React.CSSProperties : undefined}
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
