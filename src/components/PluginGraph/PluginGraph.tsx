// src/components/PluginGraph/PluginGraph.tsx
//
// PluginGraph — a reusable graph/analyzer surface for plugin UIs.
//
// Why this isn't a webpage:
//   A generic charting lib renders a white card with a blue line. This is an
//   *instrument display*: the graph lives in a recessed dark stage well (the
//   same black matrix panel the meters sit in), grid lines are printed hairlines
//   derived from --stage-text (never a hardcoded grey), the response curve glows
//   in the warm --accent, the spectrum sits behind it as a cool jewel-cyan wash,
//   and each EQ band handle is a real LED — a per-band coloured core with an
//   incandescent bloom halo that swells when you grab it. Frequency runs on a
//   log axis with mono-typeface tick labels, like the faceplate of a hardware
//   analyzer. Reskins through every theme by swapping tokens; verified light+dark.
//
// Controlled + presentational. The host owns all data and DSP — PluginGraph
// draws exactly what it is handed (a response curve, an optional spectrum, band
// nodes, or a scope trace) and emits drag/select intents. No audio, no FFT, no
// math beyond mapping data-space ↔ pixel-space. Two consumers drive the shape:
// Frequalizer's EQ response + spectrum (analyzer mode) and ChowPhaser's LFO
// motion scope (scope mode).

import { useCallback, useRef, useState } from 'react'
import { DEFAULT_PALETTE } from '../ColorSwatch'
import styles from './PluginGraph.module.css'

// ─── Types (the contract) ───────────────────────────────────────────────────────

export type GraphMode = 'analyzer' | 'scope'

/** One sample of the host-computed response curve. */
export interface GraphCurvePoint {
  /** Frequency in Hz. */
  freq: number
  /** Gain in dB. */
  db: number
}

/** An interactive EQ band handle. The host positions it; PluginGraph drags it. */
export interface GraphNode {
  id: string
  /** Frequency in Hz. */
  freq: number
  /** Gain in dB. */
  gain: number
  /** Per-band colour (reuses the ColorSwatch palette by default, cycled by index). */
  color?: string
  /** Short label for the readout (e.g. "Peak 1", "LowShelf"). */
  label?: string
  disabled?: boolean
}

/** A freq/gain pair emitted as a drag intent. */
export interface NodePosition {
  freq: number
  gain: number
}

export interface PluginGraphProps {
  /** 'analyzer' = EQ curve + spectrum + band nodes · 'scope' = LFO motion trace. */
  mode?: GraphMode
  size?: 'sm' | 'md'
  /** Pixel width. Defaults from size (md 480 / sm 300). */
  width?: number
  /** Pixel height. Defaults from size (md 220 / sm 132). */
  height?: number

  // ── analyzer data ──
  /** Response curve samples, frequency ascending. */
  curve?: GraphCurvePoint[]
  /** FFT magnitudes normalized 0..1, log-spaced across the freq axis by the host. */
  spectrum?: number[]
  /** Interactive band handles. */
  nodes?: GraphNode[]
  /** [min, max] Hz — log x-axis. Default [20, 20000]. */
  freqRange?: [number, number]
  /** [min, max] dB — linear y-axis. Default [-18, 18]. */
  dbRange?: [number, number]

  // ── scope data ──
  /** Scope samples normalized -1..1, left→right. Host drives each frame. */
  trace?: number[]

  showGrid?: boolean
  disabled?: boolean
  /** Keyboard gain step in dB (Up/Down on a focused node). Default 1. */
  gainStep?: number
  'aria-label'?: string

  /** Live during a node drag (every move). Host updates the node → controlled. */
  onNodeDrag?: (id: string, pos: NodePosition) => void
  /** Fired once when a node drag / keyboard nudge settles (commit to history). */
  onNodeDragEnd?: (id: string, pos: NodePosition) => void
  /** Fired when a node is focused or pressed. */
  onNodeSelect?: (id: string) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const SIZE_DIMS: Record<'sm' | 'md', { w: number; h: number }> = {
  sm: { w: 300, h: 132 },
  md: { w: 480, h: 220 },
}

const DEFAULT_FREQ_RANGE: [number, number] = [20, 20000]
const DEFAULT_DB_RANGE: [number, number] = [-18, 18]

// Standard analyzer faceplate tick frequencies (Hz). Filtered to the live range.
const FREQ_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]

const NODE_HIT_R = 11 // generous pointer hit radius (px)
const NODE_VIS_R = 5.5 // visual core radius (px)

// ─── Coordinate maths (data-space ↔ pixel-space) ────────────────────────────────

function freqToX(freq: number, w: number, [fmin, fmax]: [number, number]): number {
  const lf = Math.log(Math.max(freq, 1e-6))
  const lmin = Math.log(fmin)
  const lmax = Math.log(fmax)
  return ((lf - lmin) / (lmax - lmin)) * w
}

function xToFreq(x: number, w: number, [fmin, fmax]: [number, number]): number {
  const lmin = Math.log(fmin)
  const lmax = Math.log(fmax)
  return Math.exp(lmin + (x / w) * (lmax - lmin))
}

function dbToY(db: number, h: number, [dmin, dmax]: [number, number]): number {
  return h - ((db - dmin) / (dmax - dmin)) * h
}

function yToDb(y: number, h: number, [dmin, dmax]: [number, number]): number {
  return dmax - (y / h) * (dmax - dmin)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function formatFreq(freq: number): string {
  if (freq >= 1000) {
    const k = freq / 1000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `${Math.round(freq)}`
}

function formatGain(db: number): string {
  const r = Math.round(db * 10) / 10
  // Signed like the automation readout: 0 dB shows "+0.0 dB".
  return `${r >= 0 ? '+' : '−'}${Math.abs(r).toFixed(1)} dB`
}

function nodeColor(node: GraphNode, index: number): string {
  return node.color ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]!
}

// ─── Curve / spectrum / trace path builders ──────────────────────────────────────

function buildCurvePath(
  curve: GraphCurvePoint[],
  w: number,
  h: number,
  freqRange: [number, number],
  dbRange: [number, number],
): string {
  if (curve.length === 0) return ''
  return curve
    .map((p, i) => {
      const x = freqToX(p.freq, w, freqRange).toFixed(1)
      const y = dbToY(p.db, h, dbRange).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join('')
}

/** Filled area under the spectrum. Index maps linearly across x (host log-spaces). */
function buildSpectrumPath(spectrum: number[], w: number, h: number): string {
  const n = spectrum.length
  if (n === 0) return ''
  const step = n === 1 ? w : w / (n - 1)
  const pts = spectrum.map((m, i) => {
    const x = (i * step).toFixed(1)
    const y = (h - clamp(m, 0, 1) * h).toFixed(1)
    return `L${x},${y}`
  })
  return `M0,${h}${pts.join('')}L${w.toFixed(1)},${h}Z`
}

/** Scope trace polyline. Samples -1..1 → vertical, centred, 90% of half-height. */
function buildTracePath(trace: number[], w: number, h: number): string {
  const n = trace.length
  if (n === 0) return ''
  const step = n === 1 ? w : w / (n - 1)
  const mid = h / 2
  const amp = (h / 2) * 0.9
  return trace
    .map((s, i) => {
      const x = (i * step).toFixed(1)
      const y = (mid - clamp(s, -1, 1) * amp).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join('')
}

// ─── Drag state ─────────────────────────────────────────────────────────────────

interface NodeDrag {
  id: string
  index: number
}

// ─── Component ───────────────────────────────────────────────────────────────────

export function PluginGraph({
  mode = 'analyzer',
  size = 'md',
  width,
  height,
  curve = [],
  spectrum = [],
  nodes = [],
  freqRange = DEFAULT_FREQ_RANGE,
  dbRange = DEFAULT_DB_RANGE,
  trace = [],
  showGrid = true,
  disabled = false,
  gainStep = 1,
  'aria-label': ariaLabel,
  onNodeDrag,
  onNodeDragEnd,
  onNodeSelect,
}: PluginGraphProps) {
  const w = width ?? SIZE_DIMS[size].w
  const h = height ?? SIZE_DIMS[size].h

  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<NodeDrag | null>(null)
  const [drag, setDrag] = useState<NodeDrag | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // ── client → svg pixel coords ──
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    // Guard against a zero-size rect (jsdom) so maths stay finite.
    const sx = rect.width ? (clientX - rect.left) * (w / rect.width) : clientX - rect.left
    const sy = rect.height ? (clientY - rect.top) * (h / rect.height) : clientY - rect.top
    return { x: sx, y: sy }
  }, [w, h])

  const hitTest = useCallback((sx: number, sy: number): number => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!
      if (n.disabled) continue
      const nx = freqToX(n.freq, w, freqRange)
      const ny = dbToY(n.gain, h, dbRange)
      if (Math.hypot(sx - nx, sy - ny) <= NODE_HIT_R) return i
    }
    return -1
  }, [nodes, w, h, freqRange, dbRange])

  const posFromSvg = useCallback((sx: number, sy: number): NodePosition => ({
    freq: clamp(xToFreq(clamp(sx, 0, w), w, freqRange), freqRange[0], freqRange[1]),
    gain: clamp(yToDb(clamp(sy, 0, h), h, dbRange), dbRange[0], dbRange[1]),
  }), [w, h, freqRange, dbRange])

  // ── pointer drag ──
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || mode !== 'analyzer') return
    const { x, y } = toSvg(e.clientX, e.clientY)
    const idx = hitTest(x, y)
    if (idx < 0) return
    e.preventDefault()
    const node = nodes[idx]!
    const d: NodeDrag = { id: node.id, index: idx }
    dragRef.current = d
    setDrag(d)
    setSelectedId(node.id)
    onNodeSelect?.(node.id)
    svgRef.current?.setPointerCapture(e.pointerId)
  }, [disabled, mode, toSvg, hitTest, nodes, onNodeSelect])

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d) return
    const { x, y } = toSvg(e.clientX, e.clientY)
    onNodeDrag?.(d.id, posFromSvg(x, y))
  }, [toSvg, posFromSvg, onNodeDrag])

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current
    if (!d) return
    const { x, y } = toSvg(e.clientX, e.clientY)
    onNodeDragEnd?.(d.id, posFromSvg(x, y))
    dragRef.current = null
    setDrag(null)
  }, [toSvg, posFromSvg, onNodeDragEnd])

  // ── keyboard nudge (a11y) ──
  function handleNodeKeyDown(e: React.KeyboardEvent<SVGCircleElement>, node: GraphNode) {
    if (node.disabled) return
    let { freq, gain } = node
    // Arrow left/right walk the log freq axis by a musical step; up/down step gain.
    switch (e.key) {
      case 'ArrowUp':    gain = clamp(gain + gainStep, dbRange[0], dbRange[1]); break
      case 'ArrowDown':  gain = clamp(gain - gainStep, dbRange[0], dbRange[1]); break
      case 'ArrowLeft':  freq = clamp(freq / 1.1, freqRange[0], freqRange[1]); break
      case 'ArrowRight': freq = clamp(freq * 1.1, freqRange[0], freqRange[1]); break
      default: return
    }
    e.preventDefault()
    const pos = { freq, gain }
    onNodeDrag?.(node.id, pos)
    onNodeDragEnd?.(node.id, pos)
  }

  // ── derived geometry ──
  const freqTicks = showGrid ? FREQ_TICKS.filter(f => f >= freqRange[0] && f <= freqRange[1]) : []
  // dB grid lines every 6 dB within range (0 dB is the emphasised reference).
  const dbTicks: number[] = []
  if (showGrid) {
    const start = Math.ceil(dbRange[0] / 6) * 6
    for (let d = start; d <= dbRange[1]; d += 6) dbTicks.push(d)
  }

  const activeNode = drag ? nodes.find(n => n.id === drag.id) : null
  const readoutNode = activeNode ?? nodes.find(n => n.id === (hoveredId ?? selectedId)) ?? null

  const isEmpty = mode === 'analyzer'
    ? curve.length === 0 && spectrum.length === 0 && nodes.length === 0
    : trace.length === 0

  return (
    <div
      className={styles.frame}
      data-mode={mode}
      data-size={size}
      data-disabled={disabled || undefined}
      data-dragging={drag !== null || undefined}
    >
      <svg
        ref={svgRef}
        className={styles.canvas}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel ?? (mode === 'scope' ? 'LFO motion scope' : 'EQ analyzer')}
        data-testid="plugin-graph-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* ── Grid ── */}
        {freqTicks.map(f => {
          const x = freqToX(f, w, freqRange)
          return (
            <line
              key={`fx-${f}`}
              className={styles.gridLine}
              x1={x}
              y1={0}
              x2={x}
              y2={h}
            />
          )
        })}
        {mode === 'analyzer' && dbTicks.map(d => {
          const y = dbToY(d, h, dbRange)
          return (
            <line
              key={`dy-${d}`}
              className={styles.gridLine}
              data-zero={d === 0 || undefined}
              x1={0}
              y1={y}
              x2={w}
              y2={y}
            />
          )
        })}
        {mode === 'scope' && showGrid && (
          <line
            className={styles.gridLine}
            data-zero
            x1={0}
            y1={h / 2}
            x2={w}
            y2={h / 2}
          />
        )}

        {/* ── Spectrum wash (behind the curve) ── */}
        {mode === 'analyzer' && spectrum.length > 0 && (
          <path className={styles.spectrum} d={buildSpectrumPath(spectrum, w, h)} />
        )}

        {/* ── Response curve ── */}
        {mode === 'analyzer' && curve.length >= 2 && (
          <path
            className={styles.curve}
            d={buildCurvePath(curve, w, h, freqRange, dbRange)}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* ── Scope trace ── */}
        {mode === 'scope' && trace.length >= 2 && (
          <path
            className={styles.trace}
            d={buildTracePath(trace, w, h)}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* ── Band nodes ── */}
        {mode === 'analyzer' && nodes.map((n, i) => {
          const x = freqToX(n.freq, w, freqRange)
          const y = dbToY(n.gain, h, dbRange)
          const color = nodeColor(n, i)
          const isActive = drag?.id === n.id
          const isHot = isActive || hoveredId === n.id || selectedId === n.id
          return (
            <g
              key={n.id}
              className={styles.node}
              data-active={isActive || undefined}
              data-hot={isHot || undefined}
              data-disabled={n.disabled || undefined}
              style={{ '--_node-color': color } as React.CSSProperties}
            >
              <circle className={styles.nodeHalo} cx={x} cy={y} r={NODE_VIS_R * 2.4} />
              <circle
                className={styles.nodeCore}
                cx={x}
                cy={y}
                r={NODE_VIS_R}
                tabIndex={disabled || n.disabled ? -1 : 0}
                role="slider"
                aria-label={`${n.label ?? `Band ${i + 1}`}: ${formatFreq(n.freq)} Hz, ${formatGain(n.gain)}`}
                aria-valuetext={`${formatFreq(n.freq)} Hz, ${formatGain(n.gain)}`}
                aria-disabled={n.disabled || undefined}
                onFocus={() => { setSelectedId(n.id); onNodeSelect?.(n.id) }}
                onBlur={() => setSelectedId(prev => (prev === n.id ? null : prev))}
                onPointerEnter={() => setHoveredId(n.id)}
                onPointerLeave={() => setHoveredId(prev => (prev === n.id ? null : prev))}
                onKeyDown={e => handleNodeKeyDown(e, n)}
              />
            </g>
          )
        })}
      </svg>

      {/* ── Readout — mono digital, on the stage ── */}
      {mode === 'analyzer' && (
        <div className={styles.readout} aria-hidden="true">
          {readoutNode ? (
            <>
              <span
                className={styles.readoutSwatch}
                style={{ '--_node-color': nodeColor(readoutNode, nodes.indexOf(readoutNode)) } as React.CSSProperties}
              />
              <span className={styles.readoutLabel}>{readoutNode.label ?? 'Band'}</span>
              <span className={styles.readoutValue}>{`${formatFreq(readoutNode.freq)} Hz`}</span>
              <span className={styles.readoutValue}>{formatGain(readoutNode.gain)}</span>
            </>
          ) : (
            <span className={styles.readoutValue} data-dim>
              {isEmpty ? 'No signal' : `${formatFreq(freqRange[0])}–${formatFreq(freqRange[1])} Hz`}
            </span>
          )}
        </div>
      )}
      {mode === 'scope' && (
        <div className={styles.readout} aria-hidden="true">
          <span className={styles.readoutValue} data-dim>
            {isEmpty ? 'No signal' : 'LFO'}
          </span>
        </div>
      )}
    </div>
  )
}
