// src/components/AutomationLane/AutomationLane.tsx
// Inline automation lane — Volume / Pan envelopes over the track's ghost waveform.
// Presentational: draws and edits the curve, emits intents. Engine-side curve is a
// separate DAW feat. Violet family uses --led-purple (same hue as "violet" in KIT-LEAD §6).
import { useRef, useState, useCallback } from 'react'
import { ChartLine, GearSix, CaretUp, CaretDown } from '@phosphor-icons/react'
import { secondsToX, xToSeconds, snapXToGrid } from '../TimelineRuler'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import { useSpring } from '../../motion/spring'
import styles from './AutomationLane.module.css'

// ─── Constants ─────────────────────────────────────────────────────────────────

const LANE_HEIGHT    = 80
const HEADER_WIDTH   = 88
const READOUT_WIDTH  = 60
const PT_HIT_R       = 8   // pointer hit radius (px) — generous for fine control
const PT_VIS_R       = 4.5 // visual radius
const CLICK_THRESH   = 4   // px — pointer move beyond this cancels click-to-add

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AutomationView = 'none' | 'collapsed' | 'expanded'
export type EnvelopeId     = 'volume' | 'pan'

export interface EnvelopePoint {
  /** Seconds from project start. */
  t: number
  /** Normalized 0–1. Volume: 0=silence, 1=0 dB. Pan: 0=full-left, 0.5=center, 1=full-right. */
  value: number
}

export interface AutomationEnvelope {
  id: EnvelopeId
  label: string
  points: EnvelopePoint[]
  bypassed?: boolean
}

export interface AutomationLaneProps {
  trackId: string
  /** All available envelopes (Volume, Pan). */
  envelopes: AutomationEnvelope[]
  /** Which envelopes to render expanded lanes for. */
  visibleEnvelopes: EnvelopeId[]
  view: AutomationView
  bpm: number
  pxPerBeat: number
  /** Total canvas width in px (matches the track's clip lane width). */
  laneWidth: number
  playheadSeconds?: number
  /** Ghost waveform peaks (0–1) drawn under the envelope. */
  peaks?: number[]
  snap?: boolean
  disabled?: boolean
  onViewChange?: (view: AutomationView) => void
  /** Fired when the user toggles an envelope's visibility from the tab caret-menu. */
  onVisibilityChange?: (ids: EnvelopeId[]) => void
  onPointAdd?: (envelopeId: EnvelopeId, point: EnvelopePoint) => void
  onPointMove?: (envelopeId: EnvelopeId, index: number, point: EnvelopePoint) => void
  onPointDelete?: (envelopeId: EnvelopeId, index: number) => void
  onBypassToggle?: (envelopeId: EnvelopeId, bypassed: boolean) => void
  onRemove?: (envelopeId: EnvelopeId) => void
}

export interface EnvelopeLaneProps {
  envelope: AutomationEnvelope
  pxPerBeat: number
  bpm: number
  /** Width of the SVG canvas (laneWidth − HEADER_WIDTH − READOUT_WIDTH). */
  canvasWidth: number
  laneHeight?: number
  playheadSeconds?: number
  peaks?: number[]
  snap?: boolean
  disabled?: boolean
  /** Show the collapse ▴ button in the header. */
  showCollapseButton?: boolean
  onCollapse?: () => void
  onPointAdd?: (point: EnvelopePoint) => void
  onPointMove?: (index: number, point: EnvelopePoint) => void
  onPointDelete?: (index: number) => void
  onBypassToggle?: (bypassed: boolean) => void
  onRemove?: () => void
}

// ─── Value display utilities ────────────────────────────────────────────────────

function volToDb(value: number): string {
  if (value <= 0.001) return '−∞ dB'
  const db = 20 * Math.log10(value)
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`
}

function panToReadout(value: number): string {
  const pct = Math.round(Math.abs(value - 0.5) * 200)
  if (pct <= 1) return 'C'
  return value < 0.5 ? `${pct}%L` : `${pct}%R`
}

function formatValue(id: EnvelopeId, value: number): string {
  return id === 'volume' ? volToDb(value) : panToReadout(value)
}

function interpolateAt(points: EnvelopePoint[], t: number, defaultVal = 0.75): number {
  if (points.length === 0) return defaultVal
  const sorted = [...points].sort((a, b) => a.t - b.t)
  if (t <= sorted[0].t) return sorted[0].value
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].value
  const afterIdx = sorted.findIndex(p => p.t > t)
  const p0 = sorted[afterIdx - 1]
  const p1 = sorted[afterIdx]
  return p0.value + ((t - p0.t) / (p1.t - p0.t)) * (p1.value - p0.value)
}

// ─── Hit testing ───────────────────────────────────────────────────────────────

function hitTestPoint(
  svgX: number,
  svgY: number,
  points: EnvelopePoint[],
  pxPerBeat: number,
  bpm: number,
  laneH: number,
): number {
  for (let i = 0; i < points.length; i++) {
    const px = secondsToX(points[i].t, pxPerBeat, bpm)
    const py = (1 - points[i].value) * laneH
    const dx = svgX - px
    const dy = svgY - py
    if (Math.sqrt(dx * dx + dy * dy) <= PT_HIT_R) return i
  }
  return -1
}

// ─── Ghost waveform path ───────────────────────────────────────────────────────

function buildGhostPath(peaks: number[], width: number, height: number): string {
  if (peaks.length === 0) return ''
  const step    = width / peaks.length
  const maxAmp  = height * 0.42
  const midY    = height / 2
  const pts: string[] = [`M0,${midY}`]
  for (let i = 0; i < peaks.length; i++) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y  = (midY - peaks[i] * maxAmp).toFixed(1)
    pts.push(`L${x0},${y}L${x1},${y}`)
  }
  pts.push(`L${width},${midY}`)
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y  = (midY + peaks[i] * maxAmp).toFixed(1)
    pts.push(`L${x1},${y}L${x0},${y}`)
  }
  return pts.join('') + 'Z'
}

// ─── Drag / settle state (internal to EnvelopeLane) ───────────────────────────

interface PointDrag {
  index: number
  startPointerX: number
  startPointerY: number
  startT: number
  startValue: number
  currentT: number
  currentValue: number
}

interface Settle {
  index: number
  fromY: number
  targetY: number
  key: number
}

// ─── EnvelopeLane ──────────────────────────────────────────────────────────────

export function EnvelopeLane({
  envelope,
  pxPerBeat,
  bpm,
  canvasWidth,
  laneHeight = LANE_HEIGHT,
  playheadSeconds,
  peaks,
  snap = false,
  disabled = false,
  showCollapseButton = false,
  onCollapse,
  onPointAdd,
  onPointMove,
  onPointDelete,
  onBypassToggle,
  onRemove,
}: EnvelopeLaneProps) {
  const canvasRef  = useRef<HTMLDivElement>(null)
  const gearRef    = useRef<HTMLButtonElement>(null)
  const closeTimeRef = useRef(0)

  const [drag,          setDrag]          = useState<PointDrag | null>(null)
  const [selectedIdx,   setSelectedIdx]   = useState<number | null>(null)
  const [hoveredIdx,    setHoveredIdx]    = useState<number | null>(null)
  const [settle,        setSettle]        = useState<Settle | null>(null)
  const [gearOpen,      setGearOpen]      = useState(false)
  const [gearPos,       setGearPos]       = useState({ x: 0, y: 0 })

  // Mutable drag ref to avoid stale closures in pointer-move
  const dragRef = useRef<PointDrag | null>(null)
  // Pending click tracking (down position, to distinguish click vs drag)
  const downPosRef = useRef<{ x: number; y: number } | null>(null)

  // Spring settle: fromY → targetY whenever key increments
  const settleSpringY = useSpring(settle?.targetY ?? 0, {
    from:  settle?.fromY,
    key:   settle?.key ?? 0,
  })

  // ── Coordinate helpers ──────────────────────────────────────────────────────

  function toSvg(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function clampValue(v: number): number {
    return Math.max(0, Math.min(1, v))
  }

  function toEnvelopePoint(svgX: number, svgY: number): EnvelopePoint {
    const rawT   = xToSeconds(svgX, pxPerBeat, bpm)
    const t      = snap
      ? xToSeconds(snapXToGrid(svgX, pxPerBeat), pxPerBeat, bpm)
      : Math.max(0, rawT)
    const value  = clampValue(1 - svgY / laneHeight)
    return { t, value }
  }

  // ── Pointer down ────────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.preventDefault()
    const pos = toSvg(e.clientX, e.clientY)
    downPosRef.current = { x: pos.x, y: pos.y }

    const hitIdx = hitTestPoint(pos.x, pos.y, envelope.points, pxPerBeat, bpm, laneHeight)

    if (hitIdx >= 0) {
      // Start dragging an existing point
      const pt    = envelope.points[hitIdx]
      const drag: PointDrag = {
        index:        hitIdx,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startT:        pt.t,
        startValue:    pt.value,
        currentT:      pt.t,
        currentValue:  pt.value,
      }
      dragRef.current = drag
      setDrag(drag)
      setSelectedIdx(hitIdx)
      canvasRef.current?.setPointerCapture(e.pointerId)
    } else {
      // Potential click-to-add — confirm on pointer up
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, envelope.points, pxPerBeat, bpm, laneHeight, snap])

  // ── Pointer move ────────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return

    const dx  = e.clientX - d.startPointerX
    const dy  = e.clientY - d.startPointerY
    const rawSvgX = secondsToX(d.startT, pxPerBeat, bpm) + dx
    const rawSvgY = (1 - d.startValue) * laneHeight + dy

    const snapSvgX = snap ? snapXToGrid(Math.max(0, rawSvgX), pxPerBeat) : Math.max(0, rawSvgX)
    const t     = xToSeconds(snapSvgX, pxPerBeat, bpm)
    const value = clampValue(1 - rawSvgY / laneHeight)

    const updated: PointDrag = { ...d, currentT: t, currentValue: value }
    dragRef.current = updated
    setDrag(updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerBeat, bpm, laneHeight, snap])

  // ── Pointer up ──────────────────────────────────────────────────────────────

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d    = dragRef.current
    const down = downPosRef.current

    if (d) {
      // Finalize point move
      const pt = { t: d.currentT, value: d.currentValue }
      onPointMove?.(d.index, pt)

      // Spring: settle from drag-release y to the natural y of the snapped position
      const fromY   = (1 - d.currentValue) * laneHeight
      const targetY = fromY  // parent updates points → natural y equals final position
      setSettle(prev => ({
        index:   d.index,
        fromY,
        targetY,
        key:     (prev?.key ?? 0) + 1,
      }))

      dragRef.current = null
      setDrag(null)
      downPosRef.current = null
      return
    }

    // Click-to-add: only if pointer didn't travel > CLICK_THRESH
    if (down) {
      const pos = toSvg(e.clientX, e.clientY)
      const dx  = Math.abs(pos.x - down.x)
      const dy  = Math.abs(pos.y - down.y)
      if (dx <= CLICK_THRESH && dy <= CLICK_THRESH) {
        onPointAdd?.(toEnvelopePoint(down.x, down.y))
      }
    }
    downPosRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laneHeight, onPointAdd, onPointMove])

  // ── Keyboard: Delete focused point ─────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    if (selectedIdx === null) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onPointDelete?.(selectedIdx)
      setSelectedIdx(null)
    }
  }

  // ── Gear menu ──────────────────────────────────────────────────────────────

  function openGear() {
    if (Date.now() - closeTimeRef.current < 300) return
    const el = gearRef.current
    if (!el) return
    el.focus()
    const rect = el.getBoundingClientRect()
    setGearPos({ x: rect.left, y: rect.bottom + 2 })
    setGearOpen(true)
  }

  function closeGear() {
    closeTimeRef.current = Date.now()
    setGearOpen(false)
  }

  const gearItems: MenuEntry[] = [
    {
      id:       'bypass',
      label:    envelope.bypassed ? 'Unbypass' : 'Bypass',
      onSelect: () => onBypassToggle?.(!envelope.bypassed),
    },
    { id: 'sep', separator: true },
    {
      id:       'remove',
      label:    'Remove',
      danger:   true,
      onSelect: () => onRemove?.(),
    },
  ]

  // ── Render geometry ────────────────────────────────────────────────────────

  const sorted = [...envelope.points].sort((a, b) => a.t - b.t)

  // Determine which point to read out (drag active → drag, else hovered, else playhead)
  const readoutValue = drag !== null
    ? drag.currentValue
    : hoveredIdx !== null
      ? envelope.points[hoveredIdx]?.value ?? 0.75
      : playheadSeconds !== undefined
        ? interpolateAt(sorted, playheadSeconds)
        : (sorted[sorted.length - 1]?.value ?? 0.75)

  const playheadX = playheadSeconds !== undefined
    ? secondsToX(playheadSeconds, pxPerBeat, bpm)
    : null

  // Build polyline points string for the envelope curve
  function getPointXY(pt: EnvelopePoint, idx: number): { x: number; y: number } {
    const isSettling = settle !== null && settle.index === idx && drag === null
    const isActive   = drag !== null && drag.index === idx
    const x = isActive
      ? secondsToX(drag.currentT, pxPerBeat, bpm)
      : secondsToX(pt.t, pxPerBeat, bpm)
    const naturalY = (1 - pt.value) * laneHeight
    const y = isActive
      ? (1 - drag.currentValue) * laneHeight
      : isSettling
        ? settleSpringY
        : naturalY
    return { x, y }
  }

  const polyPoints = sorted
    .map(pt => {
      const origIdx = envelope.points.indexOf(pt)
      const { x, y } = getPointXY(pt, origIdx)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  // Horizontal extends to canvas edges at first/last point values
  const firstPt = sorted[0]
  const lastPt  = sorted[sorted.length - 1]
  const firstOrigIdx = firstPt ? envelope.points.indexOf(firstPt) : -1
  const lastOrigIdx  = lastPt  ? envelope.points.indexOf(lastPt)  : -1

  return (
    <div
      className={styles.laneRow}
      data-envelope-id={envelope.id}
      data-bypassed={envelope.bypassed || undefined}
      data-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
    >
      {/* ── Header ── */}
      <div className={styles.laneHeader}>
        <div className={styles.laneHeaderTop}>
          <div
            className={styles.activeDot}
            data-active={envelope.points.length > 0 || undefined}
            aria-hidden="true"
          />
          <span className={styles.paramName}>{envelope.label}</span>
          {showCollapseButton && (
            <button
              type="button"
              className={styles.collapseBtn}
              aria-label="Collapse automation"
              onClick={() => onCollapse?.()}
            >
              <CaretUp aria-hidden size={10} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            ref={gearRef}
            type="button"
            className={styles.gearBtn}
            aria-label={`${envelope.label} options`}
            aria-haspopup="menu"
            aria-expanded={gearOpen}
            onClick={openGear}
          >
            <GearSix aria-hidden size={12} />
          </button>
        </div>
      </div>

      {/* ── SVG canvas ── */}
      <div
        ref={canvasRef}
        className={styles.laneCanvas}
        data-testid={`envelope-canvas-${envelope.id}`}
        data-dragging={drag !== null || undefined}
        tabIndex={disabled ? -1 : 0}
        aria-label={`${envelope.label} automation curve`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          className={styles.canvasSvg}
          viewBox={`0 0 ${canvasWidth} ${laneHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Ghost waveform */}
          {peaks && peaks.length > 0 && (
            <path
              className={styles.ghostWaveform}
              d={buildGhostPath(peaks, canvasWidth, laneHeight)}
              fill="var(--text-dim)"
            />
          )}

          {/* Playhead marker */}
          {playheadX !== null && (
            <line
              className={styles.playheadLine}
              x1={playheadX}
              y1={0}
              x2={playheadX}
              y2={laneHeight}
            />
          )}

          {/* Horizontal extend lines (at first/last point values) */}
          {firstPt && (
            <line
              className={styles.envLineExtend}
              x1={0}
              y1={getPointXY(firstPt, firstOrigIdx).y}
              x2={getPointXY(firstPt, firstOrigIdx).x}
              y2={getPointXY(firstPt, firstOrigIdx).y}
            />
          )}
          {lastPt && (
            <line
              className={styles.envLineExtend}
              x1={getPointXY(lastPt, lastOrigIdx).x}
              y1={getPointXY(lastPt, lastOrigIdx).y}
              x2={canvasWidth}
              y2={getPointXY(lastPt, lastOrigIdx).y}
            />
          )}

          {/* Envelope curve line */}
          {sorted.length >= 2 && (
            <polyline
              className={styles.envLine}
              points={polyPoints}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Point handles */}
          {envelope.points.map((pt, origIdx) => {
            const { x, y } = getPointXY(pt, origIdx)
            const isSelected = selectedIdx === origIdx
            const isDragging = drag?.index === origIdx
            const isHovered  = hoveredIdx === origIdx
            return (
              <circle
                key={origIdx}
                className={styles.envPoint}
                cx={x}
                cy={y}
                r={isSelected || isDragging || isHovered ? 6 : PT_VIS_R}
                data-selected={isSelected || undefined}
                data-dragging={isDragging || undefined}
                tabIndex={disabled ? -1 : 0}
                aria-label={`${envelope.label} point at ${formatValue(envelope.id, pt.value)}`}
                onFocus={() => setSelectedIdx(origIdx)}
                onBlur={() => setSelectedIdx(null)}
                onPointerEnter={() => setHoveredIdx(origIdx)}
                onPointerLeave={() => setHoveredIdx(null)}
              />
            )
          })}
        </svg>
      </div>

      {/* ── Value readout ── */}
      <div className={styles.laneReadout}>
        <span
          className={styles.readoutValue}
          data-dim={drag === null && hoveredIdx === null && playheadSeconds === undefined || undefined}
        >
          {formatValue(envelope.id, readoutValue)}
        </span>
      </div>

      {/* ── Gear menu ── */}
      {gearOpen && (
        <ContextMenu
          items={gearItems}
          open
          x={gearPos.x}
          y={gearPos.y}
          onClose={closeGear}
          aria-label={`${envelope.label} options`}
        />
      )}
    </div>
  )
}

// ─── CollapsedTab ──────────────────────────────────────────────────────────────

interface CollapsedTabProps {
  envelopes: AutomationEnvelope[]
  visibleEnvelopes: EnvelopeId[]
  disabled?: boolean
  onExpand: () => void
  onVisibilityChange?: (ids: EnvelopeId[]) => void
}

function CollapsedTab({
  envelopes,
  visibleEnvelopes,
  disabled,
  onExpand,
  onVisibilityChange,
}: CollapsedTabProps) {
  const caretRef     = useRef<HTMLButtonElement>(null)
  const closeTimeRef = useRef(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ x: 0, y: 0 })

  const visCount   = visibleEnvelopes.length
  const labelParts = visCount > 0
    ? envelopes
        .filter(e => visibleEnvelopes.includes(e.id))
        .map(e => e.label)
        .join(' + ')
    : 'Automation'

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation()  // don't also expand
    if (Date.now() - closeTimeRef.current < 300) return
    const el = caretRef.current
    if (!el) return
    el.focus()
    const rect = el.getBoundingClientRect()
    setMenuPos({ x: rect.left, y: rect.bottom + 2 })
    setMenuOpen(true)
  }

  function closeMenu() {
    closeTimeRef.current = Date.now()
    setMenuOpen(false)
  }

  const menuItems: MenuEntry[] = envelopes.map(env => ({
    id:       env.id,
    label:    env.label,
    checked:  visibleEnvelopes.includes(env.id),
    onSelect: () => {
      const next = visibleEnvelopes.includes(env.id)
        ? visibleEnvelopes.filter(id => id !== env.id)
        : [...visibleEnvelopes, env.id as EnvelopeId]
      onVisibilityChange?.(next)
    },
  }))

  return (
    <div
      className={styles.tab}
      data-disabled={disabled || undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Expand automation"
      onClick={onExpand}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand() } }}
    >
      <span className={styles.tabIcon} aria-hidden="true">
        <ChartLine size={10} />
      </span>
      <span className={styles.tabLabel}>{labelParts}</span>
      <button
        ref={caretRef}
        type="button"
        className={styles.tabCaret}
        aria-label="Choose automation lanes"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={openMenu}
      >
        <CaretDown aria-hidden size={9} />
      </button>

      {menuOpen && (
        <div onClick={e => e.stopPropagation()}>
          <ContextMenu
            items={menuItems}
            open
            x={menuPos.x}
            y={menuPos.y}
            onClose={closeMenu}
            aria-label="Automation lanes"
          />
        </div>
      )}
    </div>
  )
}

// ─── AutomationLane ────────────────────────────────────────────────────────────

export function AutomationLane({
  trackId,
  envelopes,
  visibleEnvelopes,
  view,
  bpm,
  pxPerBeat,
  laneWidth,
  playheadSeconds,
  peaks,
  snap = false,
  disabled = false,
  onViewChange,
  onVisibilityChange,
  onPointAdd,
  onPointMove,
  onPointDelete,
  onBypassToggle,
  onRemove,
}: AutomationLaneProps) {
  if (view === 'none') return null

  const canvasWidth = Math.max(0, laneWidth - HEADER_WIDTH - READOUT_WIDTH)

  const visibleLanes = envelopes.filter(e => visibleEnvelopes.includes(e.id))
  const isFirstLane  = (idx: number) => idx === 0

  return (
    <div
      data-testid="automation-lane"
      data-track-id={trackId}
      data-view={view}
    >
      {/* Collapsed tab — always rendered for the expand/collapse toggle */}
      <CollapsedTab
        envelopes={envelopes}
        visibleEnvelopes={visibleEnvelopes}
        disabled={disabled}
        onExpand={() => onViewChange?.('expanded')}
        onVisibilityChange={onVisibilityChange}
      />

      {/* Expanded lanes */}
      {view === 'expanded' && visibleLanes.map((env, idx) => (
        <EnvelopeLane
          key={env.id}
          envelope={env}
          pxPerBeat={pxPerBeat}
          bpm={bpm}
          canvasWidth={canvasWidth}
          laneHeight={LANE_HEIGHT}
          playheadSeconds={playheadSeconds}
          peaks={peaks}
          snap={snap}
          disabled={disabled}
          showCollapseButton={isFirstLane(idx)}
          onCollapse={() => onViewChange?.('collapsed')}
          onPointAdd={pt => onPointAdd?.(env.id, pt)}
          onPointMove={(i, pt) => onPointMove?.(env.id, i, pt)}
          onPointDelete={i => onPointDelete?.(env.id, i)}
          onBypassToggle={b => onBypassToggle?.(env.id, b)}
          onRemove={() => onRemove?.(env.id)}
        />
      ))}
    </div>
  )
}
