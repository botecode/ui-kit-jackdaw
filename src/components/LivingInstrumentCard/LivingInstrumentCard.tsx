// src/components/LivingInstrumentCard/LivingInstrumentCard.tsx
//
// The studio-view instrument card. The hero idea: the card body IS the level
// meter AND the fader, fused into one "living organism".
//
//   • Resting fill HEIGHT  = the set level (volumeDb) — the body is the fader.
//   • When live, the fill  BREATHES around that height, driven by the signal
//     (meterL/meterR dBFS). Level = where it sits; signal = how it moves. This
//     is the ONE animation in the app.
//   • Pan LEANS the fill horizontally — only the favoured side is drawn (centred
//     = full width; panned = the fill hugs that side and narrows). The
//     complement is never drawn.
//
// NOT ChannelStrip (the classic vertical strip with a separate Fader + Meter) —
// a sibling for the studio view. Composes the existing kit primitives.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { InputSelect, type InputSelectOption } from '../InputSelect'
import { FxChip, type FxPlugin } from '../FxChip'
import { PanKnob } from '../PanKnob'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { buildRamp } from '../Meter/Meter'
import { dbScale, clamp } from '../Fader/faderScales'
import styles from './LivingInstrumentCard.module.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_MIN = -60
const DB_MAX = 6
const DB_SCALE = dbScale({ min: DB_MIN, max: DB_MAX })

const SEGMENTS: Record<'sm' | 'md', number> = { sm: 18, md: 26 }

// How hard pan narrows the fill: pan ±1 → fill shrinks to (1 - PAN_NARROW) width.
const PAN_NARROW = 0.55

// Breathing follower — incandescent: fast swell, slow settle (matches the kit's
// LED timing language). Plus a gentle autonomous "lung" so a held signal still
// breathes; the real app's live meter moves on top of it.
const ATTACK_TC = 0.5
const RELEASE_TC = 0.08
const BREATH_RATE = 0.0017 // radians/ms ≈ one cycle / 3.7s
const BREATH_AMPLITUDE = 0.035 // fraction of the body height

// ─── Props ───────────────────────────────────────────────────────────────────

export interface LivingInstrumentCardProps {
  trackId: string
  name: string
  /** Track colour — the tape-lane tie (a small colour tick on the card). */
  color: string

  /** Input source. Omitted on the master variant. */
  input?: { value: string | null; options: InputSelectOption[] }
  onInputChange?: (id: string) => void

  /** FX inserts (the real chain, not a count). Omitted on the master variant. */
  fx?: FxPlugin[]
  fxChainEnabled?: boolean
  onFxToggleChain?: (next: boolean) => void
  onFxTogglePlugin?: (id: string, next: boolean) => void
  onFxReorder?: (fromIdx: number, toIdx: number) => void
  onFxRemove?: (id: string) => void
  onFxAdd?: () => void
  onFxOpen?: (id: string) => void

  /** dBFS in [-60, 6] — the resting fill height. The body is the fader. */
  volumeDb: number
  /** Drag the body / arrow keys → new level. Absent = display-only body. */
  onVolumeChange?: (db: number) => void

  /** Pan in [-1, 1]. Omitted on the master variant. */
  pan: number
  onPanChange?: (pan: number) => void

  armed: boolean
  muted: boolean
  soloed: boolean
  onArm?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onMute?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onSolo?: (e: React.MouseEvent<HTMLButtonElement>) => void
  anySoloActive?: boolean

  /** Live signal, dBFS. Presence = "playing": the body breathes. */
  meterL?: number
  meterR?: number

  /** This is the "now"/active card — lights the body with the scarce accent. */
  selected?: boolean
  /** Click the card → drilldown. */
  onSelect?: () => void

  /** Master bus: no input / fx / pan / arm. */
  isMaster?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

// ─── Reduced motion ──────────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LivingInstrumentCard({
  trackId,
  name,
  color,
  input,
  onInputChange,
  fx = [],
  fxChainEnabled,
  onFxToggleChain,
  onFxTogglePlugin,
  onFxReorder,
  onFxRemove,
  onFxAdd,
  onFxOpen,
  volumeDb,
  onVolumeChange,
  pan,
  onPanChange,
  armed,
  muted,
  soloed,
  onArm,
  onMute,
  onSolo,
  anySoloActive = false,
  meterL,
  meterR,
  selected = false,
  onSelect,
  isMaster = false,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
}: LivingInstrumentCardProps) {
  const segCount = SEGMENTS[size]
  const ramp = useRef(buildRamp(segCount, 'level'))
  // Rebuild the ramp if the size (segment count) changes.
  if (ramp.current.length !== segCount) ramp.current = buildRamp(segCount, 'level')

  const reduced = usePrefersReducedMotion()

  const displayName = isMaster ? name || 'MASTER' : name
  const interactive = !!onVolumeChange && !disabled
  const isLive = meterL !== undefined || meterR !== undefined
  const active = (armed || selected) && !disabled // "now"/armed → scarce accent

  // Resting fill = the fader position.
  const restingPos = clamp(DB_SCALE.toPosition(volumeDb, DB_MIN, DB_MAX), 0, 1)
  const faderLit = Math.round(restingPos * segCount)

  // Live signal → the breath target (loudest of L/R drives the one fused body).
  const signalDb = isLive
    ? Math.max(meterL ?? DB_MIN, meterR ?? DB_MIN)
    : DB_MIN
  const signalPos = clamp(DB_SCALE.toPosition(signalDb, DB_MIN, DB_MAX), 0, 1)

  // ── Breathing follower (rAF) ───────────────────────────────────────────────
  // The live signal moves every frame; the loop reads it from a ref so it's set
  // up once when breathing starts (not torn down + rebuilt on each new sample).
  const bloomRef = useRef(signalPos)
  const signalPosRef = useRef(signalPos)
  const phaseRef = useRef(0)
  const lastRef = useRef(0)
  const [, forceRender] = useState(0)
  useEffect(() => { signalPosRef.current = signalPos })

  const breathing = isLive && !reduced && !disabled
  useEffect(() => {
    if (!breathing) {
      bloomRef.current = signalPosRef.current
      return
    }
    let raf: number
    function step(t: number) {
      const dt = lastRef.current ? t - lastRef.current : 16
      lastRef.current = t
      phaseRef.current += dt * BREATH_RATE
      const sig = signalPosRef.current
      // Gentle autonomous lung, scaled by how much signal there is.
      const lung = Math.sin(phaseRef.current) * BREATH_AMPLITUDE * (0.4 + 0.6 * sig)
      const target = clamp(sig + lung, 0, 1)
      const cur = bloomRef.current
      const delta = target - cur
      bloomRef.current = cur + delta * (delta > 0 ? ATTACK_TC : RELEASE_TC)
      forceRender(n => (n + 1) % 1_000_000)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      lastRef.current = 0
    }
  }, [breathing])

  const bloomPos = breathing ? bloomRef.current : signalPos
  const bloomLit = isLive ? Math.max(faderLit, Math.round(bloomPos * segCount)) : faderLit

  // ── Pan lean ───────────────────────────────────────────────────────────────
  const panMag = isMaster ? 0 : Math.abs(clamp(pan, -1, 1))
  const fillScale = 1 - panMag * PAN_NARROW
  const lean: 'left' | 'center' | 'right' = isMaster || pan === 0 ? 'center' : pan < 0 ? 'left' : 'right'

  // ── Body drag (the body is the fader) ──────────────────────────────────────
  const bodyRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startAxis: 0, startPos: 0, travel: 1 })
  const volumeRef = useRef(volumeDb)
  const onVolumeRef = useRef(onVolumeChange)
  useEffect(() => { volumeRef.current = volumeDb })
  useEffect(() => { onVolumeRef.current = onVolumeChange })

  function commit(pos: number) {
    onVolumeRef.current?.(clamp(DB_SCALE.toValue(clamp(pos, 0, 1), DB_MIN, DB_MAX), DB_MIN, DB_MAX))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = bodyRef.current!.getBoundingClientRect()
    dragRef.current = {
      startAxis: e.clientY,
      startPos: clamp(DB_SCALE.toPosition(volumeRef.current, DB_MIN, DB_MAX), 0, 1),
      travel: Math.max(rect.height, 1),
    }
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const delta = e.clientY - dragRef.current.startAxis
    // Drag up (negative delta) raises the level.
    const next = dragRef.current.startPos - delta / dragRef.current.travel
    commit(next)
  }

  function handlePointerUp() {
    if (!dragging) return
    setDragging(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!interactive) return
    const fine = e.shiftKey
    const step = fine ? 0.25 : 1
    const coarse = 6
    let next: number | null = null
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': next = volumeRef.current + step; break
      case 'ArrowDown':
      case 'ArrowLeft': next = volumeRef.current - step; break
      case 'PageUp': next = volumeRef.current + coarse; break
      case 'PageDown': next = volumeRef.current - coarse; break
      case 'Home': next = DB_MIN; break
      case 'End': next = DB_MAX; break
      default: return
    }
    e.preventDefault()
    onVolumeRef.current?.(clamp(next, DB_MIN, DB_MAX))
  }

  // ── FX wiring (forward the real intents; noop where the host omits them) ────
  const noop = () => {}
  const chainOn = fxChainEnabled ?? fx.some(p => p.enabled)

  const readout = volumeDb <= DB_MIN ? '−∞' : `${volumeDb >= 0 ? '+' : ''}${volumeDb.toFixed(1)}`

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? `${displayName} instrument`}
      className={styles.root}
      data-size={size}
      data-track-id={trackId}
      data-master={isMaster || undefined}
      data-armed={armed || undefined}
      data-muted={muted || undefined}
      data-soloed={soloed || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      style={{ '--card-color': color } as CSSProperties}
      onClick={onSelect}
    >
      {/* ── Header: colour tick + name + input ── */}
      <div className={styles.header}>
        <span className={styles.tick} aria-hidden />
        <span className={styles.name} title={displayName}>{displayName}</span>
        {!isMaster && input && (
          <div
            className={styles.input}
            data-testid="card-input"
            onClick={e => e.stopPropagation()}
          >
            <InputSelect
              variant="chip"
              size="sm"
              value={input.value}
              options={input.options}
              onChange={onInputChange ?? noop}
              disabled={disabled || !onInputChange}
              aria-label={`${displayName} input`}
            />
          </div>
        )}
      </div>

      {/* ── FX inserts ── */}
      {!isMaster && (
        <div
          className={styles.fxRow}
          data-testid="card-fx"
          onClick={e => e.stopPropagation()}
        >
          <FxChip
            plugins={fx}
            chainEnabled={chainOn}
            onToggleChain={onFxToggleChain ?? noop}
            onTogglePlugin={onFxTogglePlugin ?? noop}
            onReorder={onFxReorder ?? noop}
            onRemove={onFxRemove ?? noop}
            onAdd={onFxAdd ?? noop}
            onOpenPlugin={onFxOpen ?? noop}
            size="sm"
            disabled={disabled}
            aria-label={`${displayName} FX`}
          />
        </div>
      )}

      {/* ── The living body: meter = fader, fused ── */}
      <div
        ref={bodyRef}
        className={styles.body}
        data-testid="card-body"
        data-active={active || undefined}
        data-live={isLive || undefined}
        data-dragging={dragging || undefined}
        data-readonly={!interactive || undefined}
        role="slider"
        aria-orientation="vertical"
        aria-valuemin={DB_MIN}
        aria-valuemax={DB_MAX}
        aria-valuenow={volumeDb}
        aria-valuetext={DB_SCALE.defaultFormat(volumeDb)}
        aria-label={`${displayName} level`}
        aria-disabled={disabled || undefined}
        aria-readonly={!onVolumeChange || undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.well}>
          <div
            className={styles.fill}
            data-testid="card-fill"
            data-lean={lean}
            data-active={active || undefined}
            style={{ '--fill-scale': fillScale } as CSSProperties}
          >
            {Array.from({ length: segCount }, (_, i) => {
              const zone = i < faderLit ? 'fader' : i < bloomLit ? 'bloom' : 'off'
              const entry = ramp.current[i]
              return (
                <div
                  key={i}
                  className={styles.segment}
                  data-zone={zone}
                  data-lit={zone !== 'off' || undefined}
                  data-testid={`segment-${i}`}
                  style={{
                    '--seg-core': entry.core,
                    '--seg-body': entry.body,
                    '--seg-deep': entry.deep,
                  } as CSSProperties}
                />
              )
            })}
          </div>
        </div>
        <span className={styles.readout} aria-hidden>{readout}</span>
      </div>

      {/* ── Controls: pan · arm · mute/solo ── */}
      <div className={styles.controls} onClick={e => e.stopPropagation()}>
        {!isMaster && (
          <div className={styles.pan} data-testid="card-pan">
            <PanKnob
              pan={pan}
              onChange={onPanChange ?? noop}
              color={color}
              size="sm"
              disabled={disabled || !onPanChange}
              aria-label={`${displayName} pan`}
            />
          </div>
        )}
        <div className={styles.buttons}>
          {!isMaster && onArm && (
            <ArmButton
              armed={armed}
              recording={armed && isLive}
              onToggle={onArm}
              size="sm"
              disabled={disabled}
              aria-label={`${displayName} arm for recording`}
            />
          )}
          {onMute && onSolo && (
            <MuteSoloToggle
              muted={muted}
              soloed={soloed}
              onToggleMute={onMute}
              onToggleSolo={onSolo}
              anySoloActive={anySoloActive}
              orientation="inline"
              size="sm"
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  )
}
