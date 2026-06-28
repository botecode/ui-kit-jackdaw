// src/components/LivingInstrumentCard/LivingInstrumentCard.tsx
//
// The studio-view instrument card. The hero idea: the card body IS the level
// meter AND the fader, fused into one "living organism".
//
//   • The body shows ONLY the live signal as LED meter strips (the Meter ramp,
//     green→orange→red). At rest the strips are dark; when playing they light
//     with the signal. A stereo track shows two strips (L / R), each breathing
//     on its OWN channel (meterL / meterR dBFS); a mono track shows one. This is
//     the ONE animation in the app.
//   • Volume is a horizontal SET-POINT LINE drawn across the meter at the
//     volumeDb height — the fader. You drag it (or the meter body) VERTICALLY to
//     set the level; the line carries role="slider" and arrow keys nudge it. It
//     is NOT a fill: the meter underneath stays visible so you can read the
//     signal against the set level.
//   • Pan is a horizontal zone at the BOTTOM of the card, dragged LEFT/RIGHT.
//     Pan is channel BALANCE, not a squish: the strips stay fixed side-by-side;
//     panning attenuates the OPPOSITE channel's displayed level (pan left dims
//     the right strip, pan right dims the left). The strips never move.
//
// The drag axes are kept separate so they never fight: VERTICAL drag on the
// meter body = volume; HORIZONTAL drag on the bottom pan zone = pan.
//
// NOT ChannelStrip (the classic vertical strip with a separate Fader + Meter) —
// a sibling for the studio view. Composes the existing kit primitives.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { InputSelect, type InputSelectOption } from '../InputSelect'
import { FxChip, type FxPlugin } from '../FxChip'
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

// Breathing follower — incandescent: fast swell, slow settle (matches the kit's
// LED timing language). Plus a gentle autonomous "lung" so a held signal still
// breathes; the real app's live meter moves on top of it.
const ATTACK_TC = 0.5
const RELEASE_TC = 0.08
const BREATH_RATE = 0.0017 // radians/ms ≈ one cycle / 3.7s
const BREATH_AMPLITUDE = 0.035 // fraction of the body height
// Offset the right lung so two strips never pulse in perfect lockstep.
const R_PHASE_OFFSET = 1.7

// One incandescent breath step: gentle autonomous lung scaled by signal, then a
// fast-attack / slow-release follow toward it. Shared by both channel strips.
function breathe(cur: number, sig: number, phase: number): number {
  const lung = Math.sin(phase) * BREATH_AMPLITUDE * (0.4 + 0.6 * sig)
  const target = clamp(sig + lung, 0, 1)
  const delta = target - cur
  return cur + delta * (delta > 0 ? ATTACK_TC : RELEASE_TC)
}

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

  /** dBFS in [-60, 6] — the set level. Drawn as the set-point line (the fader). */
  volumeDb: number
  /** Drag the body / line / arrow keys → new level. Absent = display-only. */
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

  /** Live signal, dBFS. Presence = "playing": the body breathes.
   *  meterL drives the left strip, meterR the right — each breathes on its own
   *  channel. The set level (the line) stays single across both. */
  meterL?: number
  meterR?: number
  /** Channel layout. Stereo → two breathing strips (L / R); mono → one strip.
   *  Default infers: stereo if meterR is provided, else mono. Pass explicitly to
   *  disambiguate a stereo track that isn't currently feeding R (or vice-versa). */
  channels?: 'mono' | 'stereo'

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
  channels,
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
  const panInteractive = !!onPanChange && !disabled && !isMaster
  const isLive = meterL !== undefined || meterR !== undefined
  const active = (armed || selected) && !disabled // "now"/armed → scarce accent

  // Channel layout: stereo → two strips, mono → one. Default infers from meterR.
  const stereo = channels ? channels === 'stereo' : meterR !== undefined

  // The set-point line position = the fader — ONE level for the channel.
  const restingPos = clamp(DB_SCALE.toPosition(volumeDb, DB_MIN, DB_MAX), 0, 1)

  // Per-channel signal → each strip's breath target. The mono strip rides meterL
  // (the channel signal); stereo splits L / R so each strip breathes on its own.
  const signalPosL = clamp(DB_SCALE.toPosition(meterL ?? DB_MIN, DB_MIN, DB_MAX), 0, 1)
  const signalPosR = clamp(DB_SCALE.toPosition(meterR ?? DB_MIN, DB_MIN, DB_MAX), 0, 1)

  // ── Breathing follower (rAF) ───────────────────────────────────────────────
  // The live signal moves every frame; the loop reads it from refs so it's set
  // up once when breathing starts (not torn down + rebuilt on each new sample).
  // Two independent followers (L / R); the second strip is only drawn in stereo.
  const bloomLRef = useRef(signalPosL)
  const bloomRRef = useRef(signalPosR)
  const signalPosLRef = useRef(signalPosL)
  const signalPosRRef = useRef(signalPosR)
  const phaseRef = useRef(0)
  const lastRef = useRef(0)
  const [, forceRender] = useState(0)
  useEffect(() => { signalPosLRef.current = signalPosL })
  useEffect(() => { signalPosRRef.current = signalPosR })

  const breathing = isLive && !reduced && !disabled
  useEffect(() => {
    if (!breathing) {
      bloomLRef.current = signalPosLRef.current
      bloomRRef.current = signalPosRRef.current
      return
    }
    let raf: number
    function step(t: number) {
      const dt = lastRef.current ? t - lastRef.current : 16
      lastRef.current = t
      phaseRef.current += dt * BREATH_RATE
      bloomLRef.current = breathe(bloomLRef.current, signalPosLRef.current, phaseRef.current)
      bloomRRef.current = breathe(bloomRRef.current, signalPosRRef.current, phaseRef.current + R_PHASE_OFFSET)
      forceRender(n => (n + 1) % 1_000_000)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      lastRef.current = 0
    }
  }, [breathing])

  const bloomPosL = breathing ? bloomLRef.current : signalPosL
  const bloomPosR = breathing ? bloomRRef.current : signalPosR

  // ── Pan = channel balance (attenuate the OPPOSITE channel) ─────────────────
  // The strips stay fixed side-by-side. Pan only scales the DISPLAYED level of
  // the opposite channel (linear law): pan left dims the right strip, pan right
  // dims the left; center leaves both full; hard-over floors the opposite strip.
  const panClamped = isMaster ? 0 : clamp(pan, -1, 1)
  const gainL = panClamped > 0 ? 1 - panClamped : 1 // pan RIGHT dims LEFT
  const gainR = panClamped < 0 ? 1 + panClamped : 1 // pan LEFT dims RIGHT
  const litL = Math.round(bloomPosL * gainL * segCount)
  const litR = Math.round(bloomPosR * gainR * segCount)
  // Mono = one channel → no balance to skew; pan is a no-op on the strip.
  const litMono = Math.round(bloomPosL * segCount)

  // ── Volume drag (the meter body / the line is the fader) ────────────────────
  const bodyRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startY: 0, startPos: 0, travel: 1 })
  const volumeRef = useRef(volumeDb)
  const onVolumeRef = useRef(onVolumeChange)
  useEffect(() => { volumeRef.current = volumeDb })
  useEffect(() => { onVolumeRef.current = onVolumeChange })

  function commitVolume(pos: number) {
    onVolumeRef.current?.(clamp(DB_SCALE.toValue(clamp(pos, 0, 1), DB_MIN, DB_MAX), DB_MIN, DB_MAX))
  }

  function handleVolumePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    lineRef.current?.focus()
    const rect = bodyRef.current!.getBoundingClientRect()
    dragRef.current = {
      startY: e.clientY,
      startPos: clamp(DB_SCALE.toPosition(volumeRef.current, DB_MIN, DB_MAX), 0, 1),
      travel: Math.max(rect.height, 1),
    }
    setDragging(true)
  }

  function handleVolumePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const delta = e.clientY - dragRef.current.startY
    // Drag up (negative delta) raises the level.
    commitVolume(dragRef.current.startPos - delta / dragRef.current.travel)
  }

  function handleVolumePointerUp() {
    if (!dragging) return
    setDragging(false)
  }

  function handleVolumeKeyDown(e: React.KeyboardEvent) {
    if (!interactive) return
    const step = e.shiftKey ? 0.25 : 1
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

  // ── Pan drag (the bottom zone, dragged horizontally) ────────────────────────
  const panRef = useRef<HTMLDivElement>(null)
  const [panning, setPanning] = useState(false)
  const panDragRef = useRef({ startX: 0, startPan: 0, travel: 1 })
  const panValRef = useRef(pan)
  const onPanRef = useRef(onPanChange)
  useEffect(() => { panValRef.current = pan })
  useEffect(() => { onPanRef.current = onPanChange })

  function handlePanPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!panInteractive) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const rect = panRef.current!.getBoundingClientRect()
    panDragRef.current = {
      startX: e.clientX,
      startPan: clamp(panValRef.current, -1, 1),
      travel: Math.max(rect.width, 1),
    }
    setPanning(true)
  }

  function handlePanPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panning) return
    // Full zone width spans the whole pan range (-1 → +1), so scale by 2.
    const delta = (e.clientX - panDragRef.current.startX) / panDragRef.current.travel
    onPanRef.current?.(clamp(panDragRef.current.startPan + delta * 2, -1, 1))
  }

  function handlePanPointerUp() {
    if (!panning) return
    setPanning(false)
  }

  function handlePanKeyDown(e: React.KeyboardEvent) {
    if (!panInteractive) return
    const step = e.shiftKey ? 0.01 : 0.05
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp': next = panValRef.current + step; break
      case 'ArrowLeft':
      case 'ArrowDown': next = panValRef.current - step; break
      case 'Home': next = -1; break
      case 'End': next = 1; break
      default: return
    }
    e.preventDefault()
    onPanRef.current?.(clamp(next, -1, 1))
  }

  // ── FX wiring (forward the real intents; noop where the host omits them) ────
  const noop = () => {}
  const chainOn = fxChainEnabled ?? fx.some(p => p.enabled)

  const readout = volumeDb <= DB_MIN ? '−∞' : `${volumeDb >= 0 ? '+' : ''}${volumeDb.toFixed(1)}`
  const panText = panClamped === 0
    ? 'Center'
    : panClamped < 0
      ? `Left ${Math.round(-panClamped * 100)}%`
      : `Right ${Math.round(panClamped * 100)}%`

  // One LED strip: the live signal, drawn with the Meter ramp (green→orange→red).
  // No fader fill — the body shows ONLY the signal; the set level is the line.
  function renderStrip(channel: 'l' | 'r' | 'mono', lit: number) {
    return (
      <div className={styles.strip} data-channel={channel} data-lit={lit} data-testid="card-strip">
        {Array.from({ length: segCount }, (_, i) => {
          const zone = i < lit ? 'bloom' : 'off'
          const entry = ramp.current[i]
          return (
            <div
              key={i}
              className={styles.segment}
              data-zone={zone}
              data-lit={zone !== 'off' || undefined}
              data-testid={`segment-${channel}-${i}`}
              style={{
                '--seg-core': entry.core,
                '--seg-body': entry.body,
                '--seg-deep': entry.deep,
              } as CSSProperties}
            />
          )
        })}
      </div>
    )
  }

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

      {/* ── The living body: meter + the set-point line (the fader) ── */}
      <div
        ref={bodyRef}
        className={styles.body}
        data-testid="card-body"
        data-active={active || undefined}
        data-live={isLive || undefined}
        data-dragging={dragging || undefined}
        data-readonly={!interactive || undefined}
        onPointerDown={handleVolumePointerDown}
        onPointerMove={handleVolumePointerMove}
        onPointerUp={handleVolumePointerUp}
        onPointerCancel={handleVolumePointerUp}
      >
        <div className={styles.well}>
          <div className={styles.strips} data-channels={stereo ? 'stereo' : 'mono'}>
            {stereo
              ? <>{renderStrip('l', litL)}{renderStrip('r', litR)}</>
              : renderStrip('mono', litMono)}
          </div>
          {/* The set-point line — the fader. Drawn once across the full meter
              width (both strips). It IS the volume slider: drag it / the body
              vertically, or focus it and nudge with the arrow keys. */}
          <div
            ref={lineRef}
            className={styles.setpoint}
            data-testid="card-setpoint"
            data-active={active || undefined}
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
            onKeyDown={handleVolumeKeyDown}
            style={{ '--setpoint-pos': restingPos } as CSSProperties}
          >
            <span className={styles.setpointBar} aria-hidden />
          </div>
        </div>
        <span className={styles.readout} aria-hidden>{readout}</span>
      </div>

      {/* ── Pan: a horizontal balance zone at the bottom (drag left/right) ── */}
      {!isMaster && (
        <div
          ref={panRef}
          className={styles.pan}
          data-testid="card-pan"
          data-pan={panClamped === 0 ? 'center' : panClamped < 0 ? 'left' : 'right'}
          data-panning={panning || undefined}
          data-readonly={!panInteractive || undefined}
          role="slider"
          aria-orientation="horizontal"
          aria-valuemin={-1}
          aria-valuemax={1}
          aria-valuenow={panClamped}
          aria-valuetext={panText}
          aria-label={`${displayName} pan`}
          aria-disabled={disabled || undefined}
          aria-readonly={!onPanChange || undefined}
          tabIndex={panInteractive ? 0 : -1}
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          onPointerCancel={handlePanPointerUp}
          onKeyDown={handlePanKeyDown}
          onClick={e => e.stopPropagation()}
        >
          <span className={styles.panTrack} aria-hidden>
            <span className={styles.panHandle} style={{ '--pan-pos': (panClamped + 1) / 2 } as CSSProperties} />
          </span>
        </div>
      )}

      {/* ── Controls: arm · mute/solo ── */}
      <div className={styles.controls} onClick={e => e.stopPropagation()}>
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
  )
}
