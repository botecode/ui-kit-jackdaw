import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { DEFAULT_PALETTE } from '../ColorSwatch'
import { PluginGraph } from './PluginGraph'
import type { GraphNode, GraphCurvePoint, NodePosition, GraphMode } from './PluginGraph'

export const meta: DemoMeta = {
  name: 'PluginGraph',
  group: 'Composites',
  route: '/plugin-graph',
  order: 92,
}

// ── Host-side maths (lives in the demo — the kit renders, the host computes) ────
//
// A tiny peak-EQ magnitude model so the response curve reshapes as you drag the
// band handles. This is exactly the kind of DSP the real plugin owns; the kit
// stays presentational and only draws the points it's handed.

const FREQ_RANGE: [number, number] = [20, 20000]
const DB_RANGE: [number, number] = [-18, 18]

function bandDbAt(f: number, node: GraphNode, width = 0.6): number {
  const d = (Math.log(f) - Math.log(node.freq)) / width
  return node.gain * Math.exp(-(d * d))
}

function curveFromNodes(nodes: GraphNode[], samples = 96): GraphCurvePoint[] {
  const [fmin, fmax] = FREQ_RANGE
  const lmin = Math.log(fmin)
  const lmax = Math.log(fmax)
  const out: GraphCurvePoint[] = []
  for (let i = 0; i < samples; i++) {
    const f = Math.exp(lmin + (i / (samples - 1)) * (lmax - lmin))
    const db = nodes.reduce((sum, n) => (n.disabled ? sum : sum + bandDbAt(f, n)), 0)
    out.push({ freq: f, db })
  }
  return out
}

// A stable pink-ish spectrum shape (falls with frequency), plus per-bin ripple.
function pinkSpectrum(bins = 64, phase = 0): number[] {
  return Array.from({ length: bins }, (_, i) => {
    const t = i / (bins - 1)
    const tilt = 0.85 - t * 0.6 // high end rolls off
    const ripple = 0.12 * Math.sin(t * 22 + phase) + 0.08 * Math.sin(t * 7 - phase * 0.5)
    return Math.max(0.02, Math.min(1, tilt + ripple))
  })
}

const DEMO_NODES: GraphNode[] = [
  { id: 'lo', freq: 90, gain: 5, label: 'Low shelf', color: DEFAULT_PALETTE[2] },
  { id: 'mid', freq: 900, gain: -7, label: 'Peak 1', color: DEFAULT_PALETTE[5] },
  { id: 'hi', freq: 6500, gain: 4, label: 'Peak 2', color: DEFAULT_PALETTE[1] },
]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

// ── States grid ────────────────────────────────────────────────────────────────

function StaticStates() {
  const curve = useMemo(() => curveFromNodes(DEMO_NODES), [])
  const spectrum = useMemo(() => pinkSpectrum(), [])
  return (
    <StatesGrid>
      <State label="Analyzer (curve + spectrum + bands)">
        <PluginGraph curve={curve} spectrum={spectrum} nodes={DEMO_NODES} />
      </State>
      <State label="Response curve only">
        <PluginGraph curve={curve} nodes={DEMO_NODES} />
      </State>
      <State label="Spectrum only">
        <PluginGraph spectrum={spectrum} />
      </State>
      <State label="Empty (no signal)">
        <PluginGraph />
      </State>
      <State label="Disabled">
        <PluginGraph curve={curve} spectrum={spectrum} nodes={DEMO_NODES} disabled />
      </State>
      <State label="No grid">
        <PluginGraph curve={curve} spectrum={spectrum} nodes={DEMO_NODES} showGrid={false} />
      </State>
      <State label="Small">
        <PluginGraph size="sm" curve={curve} nodes={DEMO_NODES} />
      </State>
    </StatesGrid>
  )
}

// ── Scope states (ChowPhaser LFO) ────────────────────────────────────────────────

function scopeTrace(phase: number, samples = 128): number[] {
  return Array.from({ length: samples }, (_, i) => {
    const t = (i / (samples - 1)) * Math.PI * 2
    return Math.sin(t * 2 + phase) * 0.8 * (0.7 + 0.3 * Math.sin(t + phase * 0.5))
  })
}

function ScopeStates() {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduced) return
    let last = 0
    const tick = (ts: number) => {
      if (ts - last > 33) {
        setPhase(p => p + 0.12)
        last = ts
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [reduced])

  const trace = useMemo(() => scopeTrace(phase), [phase])
  const still = useMemo(() => scopeTrace(0), [])

  return (
    <StatesGrid>
      <State label={reduced ? 'Scope (static — reduced motion)' : 'Scope (host-driven frames)'}>
        <PluginGraph mode="scope" trace={reduced ? still : trace} size="sm" />
      </State>
      <State label="Scope, empty">
        <PluginGraph mode="scope" size="sm" />
      </State>
      <State label="Scope, md">
        <PluginGraph mode="scope" trace={reduced ? still : trace} />
      </State>
    </StatesGrid>
  )
}

// ── Playground — live, controlled EQ ─────────────────────────────────────────────

function PlaygroundDemo() {
  const reduced = usePrefersReducedMotion()
  const [mode, setMode] = useState<GraphMode>('analyzer')
  const [nodes, setNodes] = useState<GraphNode[]>(DEMO_NODES)
  const [showSpectrum, setShowSpectrum] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [selected, setSelected] = useState<string | null>(null)

  // Live spectrum + scope phase (simulated host frames).
  const [phase, setPhase] = useState(0)
  const rafRef = useRef(0)
  useEffect(() => {
    if (reduced) return
    let last = 0
    const tick = (ts: number) => {
      if (ts - last > 40) {
        setPhase(p => p + 0.1)
        last = ts
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [reduced])

  const curve = useMemo(() => curveFromNodes(nodes), [nodes])
  const spectrum = useMemo(() => (showSpectrum ? pinkSpectrum(64, phase) : []), [showSpectrum, phase])
  const trace = useMemo(() => scopeTrace(reduced ? 0 : phase), [reduced, phase])

  // Controlled: drag intent updates host state → node re-renders at the new spot.
  const handleDrag = useCallback((id: string, pos: NodePosition) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, freq: pos.freq, gain: pos.gain } : n)))
  }, [])

  const selectedNode = nodes.find(n => n.id === selected) ?? null

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <PluginGraph
          mode={mode}
          size={size}
          curve={curve}
          spectrum={spectrum}
          nodes={nodes}
          trace={trace}
          showGrid={showGrid}
          disabled={disabled}
          freqRange={FREQ_RANGE}
          dbRange={DB_RANGE}
          aria-label="Playground EQ"
          onNodeDrag={handleDrag}
          onNodeSelect={setSelected}
        />

        {/* Controls — dogfooding Toggle / Checkbox / Fader */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 180 }}>
          <Toggle
            checked={mode === 'scope'}
            onChange={next => setMode(next ? 'scope' : 'analyzer')}
            size="sm"
            label="scope mode"
          />
          <Toggle
            checked={showSpectrum}
            onChange={setShowSpectrum}
            size="sm"
            label="spectrum"
          />
          <Toggle
            checked={showGrid}
            onChange={setShowGrid}
            size="sm"
            label="grid"
          />
          <Checkbox
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size sm"
          />
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />

          {/* Gain fader for the selected band — another route to the same intent. */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <Fader
              value={selectedNode?.gain ?? 0}
              min={DB_RANGE[0]}
              max={DB_RANGE[1]}
              step={0.5}
              orientation="horizontal"
              size="sm"
              disabled={!selectedNode || disabled}
              color={selectedNode?.color}
              aria-label="Selected band gain"
              format={v => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} dB`}
              onChange={v => selectedNode && handleDrag(selectedNode.id, { freq: selectedNode.freq, gain: v })}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {selectedNode ? selectedNode.label : 'no band'}
            </span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ───────────────────────────────────────────────────────────────

export default function PluginGraphDemo() {
  return (
    <DemoShell meta={meta}>
      <StaticStates />
      <ScopeStates />
      <PlaygroundDemo />
    </DemoShell>
  )
}
