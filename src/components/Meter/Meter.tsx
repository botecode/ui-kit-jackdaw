// src/components/Meter/Meter.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { dbScale, clamp } from '../Fader/faderScales'
import type { FaderScale } from '../Fader/faderScales'
import styles from './Meter.module.css'

// ─── LED ramp ────────────────────────────────────────────────────────────────

interface RampEntry {
  core: string
  body: string
  deep: string
}

const LED: Record<string, RampEntry> = {
  // Safe-zone green — body reads from --meter-safe so theme can override the hue
  safe:   { core: 'var(--led-green-core)',  body: 'var(--meter-safe)',  deep: 'var(--led-green-deep)'  },
  purple: { core: 'var(--led-purple-core)', body: 'var(--led-purple)',  deep: 'var(--led-purple-deep)' },
  cyan:   { core: 'var(--led-cyan-core)',   body: 'var(--led-cyan)',    deep: 'var(--led-cyan-deep)'   },
  green:  { core: 'var(--led-green-core)',  body: 'var(--led-green)',   deep: 'var(--led-green-deep)'  },
  yellow: { core: 'var(--led-yellow-core)', body: 'var(--led-yellow)',  deep: 'var(--led-yellow-deep)' },
  orange: { core: 'var(--led-orange-core)', body: 'var(--led-orange)',  deep: 'var(--led-orange-deep)' },
  hot:    { core: 'var(--led-yellow-core)', body: 'var(--meter-hot)',   deep: 'var(--led-yellow-deep)' },
  clip:   { core: 'var(--led-red-core)',    body: 'var(--meter-clip)',  deep: 'var(--led-red-deep)'    },
}

// level palette: hot zone — strictly warming amber → orange (bridges into red clip)
const HOT_LEVEL = ['hot', 'orange'] as const
// chroma palette: safe spectrum — cool → neutral (purple → cyan → green)
const SAFE_SPECTRUM = ['purple', 'cyan', 'green'] as const
// chroma palette: hot zone — strictly warming green bridge → yellow → amber → orange
const HOT_WARMING   = ['green', 'yellow', 'hot', 'orange'] as const

/**
 * Build a per-segment LED ramp from bottom (index 0) to top (index N-1).
 *
 * level  — calm heat ramp: solid green safe zone, amber→orange hot band, red clip cap.
 *           Instantly legible as a level indicator.
 * chroma — Hologram rainbow showpiece: purple→cyan→green spectrum, then strictly-
 *           warming hot band, red clip cap.
 */
export function buildRamp(segments: number, palette: 'level' | 'chroma'): RampEntry[] {
  // Both palettes share the same clip proportion (~12.5% pure red cap)
  const clipCount = Math.max(1, Math.round(segments * 0.125))

  if (palette === 'level') {
    // Hot band is narrow (~12.5%); safe zone fills the rest (~75%)
    const hotCount  = Math.max(1, Math.round(segments * 0.125))
    const safeCount = segments - clipCount - hotCount
    const entries: RampEntry[] = []
    for (let i = 0; i < safeCount; i++) entries.push(LED.safe)
    for (let i = 0; i < hotCount; i++) {
      const t   = hotCount > 1 ? i / (hotCount - 1) : 0
      const hue = HOT_LEVEL[Math.min(Math.floor(t * HOT_LEVEL.length), HOT_LEVEL.length - 1)]
      entries.push(LED[hue])
    }
    for (let i = 0; i < clipCount; i++) entries.push(LED.clip)
    return entries
  }

  // palette === 'chroma': rainbow showpiece
  // Larger hot band (~25%); cool spectrum fills the safe zone (~62.5%)
  const hotCount  = Math.max(1, Math.round(segments * 0.25))
  const specCount = segments - clipCount - hotCount
  const entries: RampEntry[] = []
  for (let i = 0; i < specCount; i++) {
    const t   = specCount > 1 ? i / (specCount - 1) : 0
    const hue = SAFE_SPECTRUM[Math.min(Math.floor(t * SAFE_SPECTRUM.length), SAFE_SPECTRUM.length - 1)]
    entries.push(LED[hue])
  }
  for (let i = 0; i < hotCount; i++) {
    const t   = hotCount > 1 ? i / (hotCount - 1) : 0
    const hue = HOT_WARMING[Math.min(Math.floor(t * HOT_WARMING.length), HOT_WARMING.length - 1)]
    entries.push(LED[hue])
  }
  for (let i = 0; i < clipCount; i++) entries.push(LED.clip)
  return entries
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MeterProps {
  /** dBFS mono level */
  value?: number
  /** dBFS stereo left (renders two columns when combined with valueR) */
  valueL?: number
  /** dBFS stereo right */
  valueR?: number
  min?: number
  max?: number
  segments?: number
  /**
   * "level" (default) — calm green→amber→red heat ramp; instantly legible as headroom.
   * "chroma" — decorative Hologram rainbow showpiece; opt-in for idle / hero contexts.
   */
  palette?: 'level' | 'chroma'
  /**
   * "standard" (default) — normal segment height.
   * "fine" — half-height segments; pair with a higher segment count (e.g. segments={32})
   *   for a finer, more LED-dense read at the same well height.
   */
  density?: 'standard' | 'fine'
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg' | (string & {})
  peakHold?: boolean
  /** Latch top segment(s) on clip; click the meter to clear */
  clipLatch?: boolean
  onResetClip?: () => void
  ballistics?: boolean
  'aria-label'?: string
}

// ─── Internal channel ────────────────────────────────────────────────────────

const ATTACK_TC    = 0.85
const RELEASE_TC   = 0.12
const PEAK_HOLD_MS = 1500
const PEAK_FALL_TC = 0.04

interface ChannelProps {
  value: number
  scale: FaderScale
  min: number
  max: number
  segments: number
  orientation: 'vertical' | 'horizontal'
  size: 'sm' | 'md' | 'lg'
  density: 'standard' | 'fine'
  ramp: RampEntry[]
  clipCount: number
  peakHold: boolean
  clipLatch: boolean
  onResetClip?: () => void
  ballistics: boolean
  ariaLabel: string
}

function MeterChannel({
  value,
  scale,
  min,
  max,
  segments,
  orientation,
  size,
  density,
  ramp,
  clipCount,
  peakHold,
  clipLatch,
  onResetClip,
  ballistics,
  ariaLabel,
}: ChannelProps) {
  const valueRef    = useRef(value)
  const displayRef  = useRef(value)
  const peakRef     = useRef(value)
  const peakTimeRef = useRef(Date.now())
  const rmRef       = useRef(false)
  const [, forceRender] = useState(0)

  useEffect(() => { valueRef.current = value })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    rmRef.current = mq.matches
    const handler = (e: MediaQueryListEvent) => { rmRef.current = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [isClipped, setIsClipped] = useState(false)
  useEffect(() => {
    if (value >= max) setIsClipped(true)
  }, [value, max])

  useEffect(() => {
    if (!ballistics) return
    let raf: number
    function step() {
      const target  = valueRef.current
      const display = displayRef.current
      const peak    = peakRef.current
      let changed   = false

      if (rmRef.current) {
        if (display !== target) { displayRef.current = target; changed = true }
        if (peak !== target)    { peakRef.current    = target; changed = true }
      } else {
        const delta = target - display
        if (Math.abs(delta) > 0.01) {
          displayRef.current = display + delta * (delta > 0 ? ATTACK_TC : RELEASE_TC)
          changed = true
        } else if (display !== target) {
          displayRef.current = target
          changed = true
        }
        if (target >= peak) {
          if (target > peak) { peakRef.current = target; changed = true }
          peakTimeRef.current = Date.now()
        } else if (peakHold && Date.now() - peakTimeRef.current > PEAK_HOLD_MS) {
          const pd = target - peak
          if (Math.abs(pd) > 0.01) { peakRef.current = peak + pd * PEAK_FALL_TC; changed = true }
          else                      { peakRef.current = target }
        }
      }

      if (changed) forceRender(n => n + 1)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [ballistics, peakHold])

  const displayLevel = ballistics ? displayRef.current : value
  const peakLevel    = ballistics ? peakRef.current    : value

  const pos      = clamp(scale.toPosition(displayLevel, min, max), 0, 1)
  const litCount = Math.floor(pos * segments)

  const peakPos   = clamp(scale.toPosition(peakLevel, min, max), 0, 1)
  const peakIndex = Math.min(Math.floor(peakPos * segments), segments - 1)

  const clipStart = segments - clipCount

  function handleClick() {
    if (!clipLatch || !isClipped) return
    setIsClipped(false)
    onResetClip?.()
  }

  const readout = scale.defaultFormat(value)

  return (
    <div
      className={styles.channel}
      data-orientation={orientation}
      data-size={size}
      data-density={density}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={readout}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <div className={styles.well} data-testid="meter-well">
        {Array.from({ length: segments }, (_, i) => {
          const entry  = ramp[i] ?? LED.clip
          const isLit  = i < litCount || (clipLatch && isClipped && i >= clipStart)
          const isPeak = peakHold && !isLit && i === peakIndex && peakIndex > 0
          return (
            <div
              key={i}
              className={styles.segment}
              data-lit={isLit || undefined}
              data-peak={isPeak || undefined}
              data-testid={`segment-${i}`}
              style={{
                '--seg-core': entry.core,
                '--seg-body': entry.body,
                '--seg-deep': entry.deep,
              } as React.CSSProperties}
            />
          )
        })}
      </div>
      <span className={styles.readout} aria-hidden="true" data-testid="meter-readout">
        {readout}
      </span>
    </div>
  )
}

// ─── Meter ───────────────────────────────────────────────────────────────────

const PRESET_SIZES = new Set(['sm', 'md', 'lg'])

export function Meter({
  value,
  valueL,
  valueR,
  min         = -60,
  max         = 6,
  segments    = 16,
  palette     = 'level',
  density     = 'standard',
  orientation = 'vertical',
  size        = 'md',
  peakHold    = false,
  clipLatch   = false,
  onResetClip,
  ballistics  = true,
  'aria-label': ariaLabel = 'Meter',
}: MeterProps) {
  const isPreset      = PRESET_SIZES.has(size)
  const effectiveSize = isPreset ? (size as 'sm' | 'md' | 'lg') : 'md'
  const scale         = useMemo(() => dbScale({ min, max }), [min, max])
  const ramp          = useMemo(() => buildRamp(segments, palette), [segments, palette])
  const clipCount     = Math.max(1, Math.round(segments * 0.125))

  const isStereo = valueL !== undefined && valueR !== undefined

  const sharedProps = {
    scale, min, max, segments,
    orientation, size: effectiveSize, density,
    ramp, clipCount,
    peakHold, clipLatch, onResetClip, ballistics,
  }

  return (
    <div
      className={styles.root}
      data-orientation={orientation}
      data-size={isPreset ? effectiveSize : 'custom'}
      data-stereo={isStereo || undefined}
      style={!isPreset ? { '--meter-length': size } as React.CSSProperties : undefined}
    >
      {isStereo ? (
        <>
          <MeterChannel {...sharedProps} value={valueL} ariaLabel={`${ariaLabel} L`} />
          <MeterChannel {...sharedProps} value={valueR} ariaLabel={`${ariaLabel} R`} />
        </>
      ) : (
        <MeterChannel {...sharedProps} value={value ?? min} ariaLabel={ariaLabel} />
      )}
    </div>
  )
}
