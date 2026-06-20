// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
import type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
import type { ClipInfo } from '../TrackLane'
import type { FxPlugin } from '../FxChip'

export const meta: DemoMeta = {
  name: 'FocusedTrackDetailPanel',
  group: 'Composites',
  route: '/focused-track-detail-panel',
  order: 2,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const TRACK_VOCAL = {
  id: 't1', name: 'Vocals', color: 'var(--track-color-1)', kind: 'audio' as const,
  armed: false, muted: false, soloed: false, volumeDb: -6, pan: 0,
}

const TRACK_DRUMS = {
  id: 't2', name: 'Drums', color: 'var(--track-color-2)', kind: 'audio' as const,
  armed: true, muted: false, soloed: false, volumeDb: -3, pan: 0,
}

const CLIPS: ClipInfo[] = [
  {
    clipId: 'c1', start: 0, length: 4,
    peaks: Array.from({ length: 40 }, (_, i) => Math.abs(Math.sin(i * 0.4)) * 0.8 + 0.1),
    label: 'Take 1',
  },
  {
    clipId: 'c2', start: 4.5, length: 2.5,
    peaks: Array.from({ length: 25 }, (_, i) => Math.abs(Math.cos(i * 0.6)) * 0.6 + 0.2),
    label: 'Fill',
  },
]

const PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Compressor', enabled: true },
  { id: 'p2', name: 'EQ', enabled: true },
  { id: 'p3', name: 'Reverb', enabled: false },
]

const noop       = () => {}
const noopId     = (_: string) => {}
const noopFromTo = (_from: number, _to: number) => {}
const noopIdBool = (_id: string, _next: boolean) => {}

const BASE: Omit<FocusedTrackDetailPanelProps, 'track' | 'open' | 'height'> = {
  clips: CLIPS, plugins: PLUGINS, chainEnabled: true,
  pxPerBeat: 60, bpm: 120, numerator: 4, denominator: 4, division: '1/4',
  meterValueL: -12, meterValueR: -18,
  onResize: noop, onClose: noop, onClipMove: noop,
  onToggleChain: noop, onTogglePlugin: noopIdBool,
  onReorderPlugin: noopFromTo, onRemovePlugin: noopId,
  onAddPlugin: noop, onOpenPlugin: noopId,
}

// ── Shared panel wrapper ──────────────────────────────────────────────────────

function PanelFrame({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div style={{
      height,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius, 4px)',
      background: 'var(--arrange-bg, var(--stage))',
    }}>
      {children}
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="open — vocal track with clips">
        <PanelFrame height={300}>
          <FocusedTrackDetailPanel {...BASE} track={TRACK_VOCAL} open height={300} />
        </PanelFrame>
      </State>

      <State label="open — armed + hot meter">
        <PanelFrame height={280}>
          <FocusedTrackDetailPanel
            {...BASE}
            track={{ ...TRACK_DRUMS, armed: true }}
            open height={280}
            meterValueL={2} meterValueR={0}
          />
        </PanelFrame>
      </State>

      <State label="open — empty track (no clips)">
        <PanelFrame height={260}>
          <FocusedTrackDetailPanel
            {...BASE}
            clips={[]}
            track={TRACK_DRUMS}
            open height={260}
          />
        </PanelFrame>
      </State>

      <State label="open — muted + soloed">
        <PanelFrame height={280}>
          <FocusedTrackDetailPanel
            {...BASE}
            track={{ ...TRACK_VOCAL, muted: true, soloed: true }}
            open height={280}
            meterValueL={-24} meterValueR={-30}
          />
        </PanelFrame>
      </State>

      <State label="closed (open=false)">
        <div style={{ height: 40, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius, 4px)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            panel is closed — height: 0
          </div>
          <FocusedTrackDetailPanel {...BASE} track={TRACK_VOCAL} open={false} height={280} />
        </div>
      </State>

      <State label="disabled">
        <PanelFrame height={260}>
          <FocusedTrackDetailPanel {...BASE} track={TRACK_VOCAL} open height={260} disabled />
        </PanelFrame>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,         setOpen]         = useState(true)
  const [height,       setHeight]       = useState(320)
  const [armed,        setArmed]        = useState(false)
  const [muted,        setMuted]        = useState(false)
  const [soloed,       setSoloed]       = useState(false)
  const [chainEnabled, setChainEnabled] = useState(true)
  const [meterL,       setMeterL]       = useState(-12)
  const [meterR,       setMeterR]       = useState(-18)
  const [plugins,      setPlugins]      = useState<FxPlugin[]>(PLUGINS)
  const [clips,        setClips]        = useState<ClipInfo[]>(CLIPS)
  const [color,        setColor]        = useState('var(--track-color-1)')

  const track = {
    id: 'pg', name: 'Vocals', color, kind: 'audio' as const,
    armed, muted, soloed, volumeDb: -6, pan: 0,
  }

  const COLORS = [
    { label: 'Orange', value: 'var(--track-color-1)' },
    { label: 'Green',  value: 'var(--track-color-2)' },
    { label: 'Blue',   value: 'var(--track-color-3)' },
    { label: 'Purple', value: 'var(--track-color-4)' },
    { label: 'Yellow', value: 'var(--track-color-5)' },
    { label: 'Red',    value: 'var(--track-color-6)' },
  ]

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Live instance */}
        <div style={{ width: 680, flexShrink: 0 }}>
          <PanelFrame height={height}>
            <FocusedTrackDetailPanel
              track={track}
              clips={clips}
              plugins={plugins}
              chainEnabled={chainEnabled}
              pxPerBeat={60} bpm={120} numerator={4} denominator={4} division="1/4"
              meterValueL={meterL} meterValueR={meterR}
              height={height}
              onResize={setHeight}
              open={open}
              onClose={() => setOpen(false)}
              onToggleChain={setChainEnabled}
              onTogglePlugin={(id, next) =>
                setPlugins(ps => ps.map(p => p.id === id ? { ...p, enabled: next } : p))
              }
              onReorderPlugin={(from, to) =>
                setPlugins(ps => {
                  const arr = [...ps]
                  const [item] = arr.splice(from, 1)
                  arr.splice(to, 0, item)
                  return arr
                })
              }
              onRemovePlugin={id => setPlugins(ps => ps.filter(p => p.id !== id))}
              onAddPlugin={() =>
                setPlugins(ps => [...ps, { id: `p${Date.now()}`, name: 'New Plugin', enabled: true }])
              }
              onOpenPlugin={id => console.log('open plugin', id)}
            />
          </PanelFrame>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={open}         onChange={setOpen}         size="sm" label="open" />
          <Toggle checked={armed}        onChange={setArmed}        size="sm" label="armed" />
          <Toggle checked={muted}        onChange={setMuted}        size="sm" label="muted" />
          <Toggle checked={soloed}       onChange={setSoloed}       size="sm" label="soloed" />
          <Toggle checked={chainEnabled} onChange={setChainEnabled} size="sm" label="chainEnabled" />
          <Toggle
            checked={clips.length === 0}
            onChange={v => setClips(v ? [] : CLIPS)}
            size="sm"
            label="empty (no clips)"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            <span style={{ minWidth: '4ch' }}>L</span>
            <Fader value={meterL} onChange={setMeterL} min={-60} max={6} orientation="horizontal" size="sm" aria-label="Meter L" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '5ch', textAlign: 'right' }}>
              {meterL.toFixed(0)} dB
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            <span style={{ minWidth: '4ch' }}>R</span>
            <Fader value={meterR} onChange={setMeterR} min={-60} max={6} orientation="horizontal" size="sm" aria-label="Meter R" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '5ch', textAlign: 'right' }}>
              {meterR.toFixed(0)} dB
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            <span style={{ minWidth: '4ch' }}>H</span>
            <Fader value={height} onChange={h => setHeight(Math.round(h))} min={120} max={560} orientation="horizontal" size="sm" aria-label="Panel height" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '4ch', textAlign: 'right' }}>
              {height}px
            </span>
          </div>

          {/* Track color swatches */}
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', paddingTop: 'var(--space-1)' }}>
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                style={{
                  width: 16, height: 16,
                  background: c.value,
                  border: color === c.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={`Track color: ${c.label}`}
                aria-pressed={color === c.value}
              />
            ))}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function FocusedTrackDetailPanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
