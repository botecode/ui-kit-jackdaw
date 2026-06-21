// src/components/AutomationLane/AutomationLane.demo.tsx
import { useState, useCallback } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }  from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }  from '../../gallery/ui/Playground'
import { Fader }       from '../Fader'
import { Toggle }      from '../Toggle'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { AutomationLane, EnvelopeLane } from './AutomationLane'
import type {
  AutomationView,
  EnvelopeId,
  AutomationEnvelope,
  EnvelopePoint,
} from './AutomationLane'

export const meta: DemoMeta = {
  name:  'AutomationLane',
  group: 'Composites',
  route: '/automation-lane',
  order: 6,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BPM         = 120
const PX_PER_BEAT = 48
const DURATION_S  = 8          // 8 seconds on screen
const LANE_WIDTH  = secondsToX(DURATION_S, PX_PER_BEAT, BPM)  // 768px

// Waveform-style peaks for the ghost reference
function sineWave(len: number, freq = 0.14, phase = 0): number[] {
  return Array.from({ length: len }, (_, i) => Math.abs(Math.sin(i * freq + phase)))
}
const GHOST_PEAKS = sineWave(200, 0.14, 0.3)

// Default envelopes for the States grid
const VOL_POINTS: EnvelopePoint[] = [
  { t: 0,   value: 0.85 },
  { t: 1,   value: 0.85 },
  { t: 2,   value: 0.5  },
  { t: 3,   value: 0.5  },
  { t: 4,   value: 0.85 },
  { t: 7.5, value: 0.85 },
]

const PAN_POINTS: EnvelopePoint[] = [
  { t: 0,   value: 0.5  },
  { t: 2,   value: 0.35 },
  { t: 4,   value: 0.65 },
  { t: 7.5, value: 0.5  },
]

const VOL_ENV: AutomationEnvelope = { id: 'volume', label: 'Volume', points: VOL_POINTS }
const PAN_ENV: AutomationEnvelope = { id: 'pan',    label: 'Pan',    points: PAN_POINTS }
const ENVELOPES = [VOL_ENV, PAN_ENV]

// ─── Layout wrapper (timeline + lane) ────────────────────────────────────────

function TrackWrap({ children, width = LANE_WIDTH }: { children: React.ReactNode; width?: number }) {
  return (
    <div style={{
      width,
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow:     'hidden',
    }}>
      <TimelineRuler
        bpm={BPM}
        numerator={4}
        denominator={4}
        pxPerBeat={PX_PER_BEAT}
        durationSeconds={DURATION_S}
        size="sm"
      />
      {/* Clip lane placeholder */}
      <div style={{
        width,
        height:     40,
        background: 'var(--stage)',
        borderBottom: '1px solid var(--border)',
        display:    'flex',
        alignItems: 'center',
        paddingLeft: 'var(--space-2)',
      }}>
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize:   'var(--text-xs)',
          color:      'var(--text-dim)',
          opacity:    0.6,
        }}>
          clips
        </span>
      </div>
      {children}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* none — nothing rendered */}
      <State label="none — automation un-engaged">
        <TrackWrap>
          <AutomationLane
            trackId="s-none"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume']}
            view="none"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
          />
        </TrackWrap>
      </State>

      {/* collapsed tab */}
      <State label="collapsed — thin violet tab, automation exists">
        <TrackWrap>
          <AutomationLane
            trackId="s-collapsed"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume']}
            view="collapsed"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
          />
        </TrackWrap>
      </State>

      {/* collapsed — both envelopes */}
      <State label="collapsed — Volume + Pan visible">
        <TrackWrap>
          <AutomationLane
            trackId="s-collapsed-both"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume', 'pan']}
            view="collapsed"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
          />
        </TrackWrap>
      </State>

      {/* expanded — Volume only */}
      <State label="expanded — Volume only with ghost waveform">
        <TrackWrap>
          <AutomationLane
            trackId="s-expanded-vol"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume']}
            view="expanded"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
            peaks={GHOST_PEAKS}
            playheadSeconds={2}
          />
        </TrackWrap>
      </State>

      {/* expanded — Volume + Pan stacked */}
      <State label="expanded — Volume + Pan stacked">
        <TrackWrap>
          <AutomationLane
            trackId="s-expanded-both"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume', 'pan']}
            view="expanded"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
            peaks={GHOST_PEAKS}
            playheadSeconds={3}
          />
        </TrackWrap>
      </State>

      {/* bypassed */}
      <State label="bypassed — 50% opacity, still readable">
        <TrackWrap>
          <AutomationLane
            trackId="s-bypassed"
            envelopes={[{ ...VOL_ENV, bypassed: true }, PAN_ENV]}
            visibleEnvelopes={['volume']}
            view="expanded"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
            peaks={GHOST_PEAKS}
          />
        </TrackWrap>
      </State>

      {/* empty envelope — no points yet */}
      <State label="expanded — no points (click to add)">
        <TrackWrap>
          <AutomationLane
            trackId="s-empty-pts"
            envelopes={[{ id: 'volume', label: 'Volume', points: [] }]}
            visibleEnvelopes={['volume']}
            view="expanded"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
            peaks={GHOST_PEAKS}
          />
        </TrackWrap>
      </State>

      {/* disabled */}
      <State label="disabled">
        <TrackWrap>
          <AutomationLane
            trackId="s-disabled"
            envelopes={ENVELOPES}
            visibleEnvelopes={['volume']}
            view="expanded"
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            laneWidth={LANE_WIDTH}
            peaks={GHOST_PEAKS}
            disabled
          />
        </TrackWrap>
      </State>

      {/* EnvelopeLane standalone — for FocusedTrackDetailPanel reuse */}
      <State label="EnvelopeLane standalone (detail panel reuse)">
        <div style={{
          width:        500,
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow:     'hidden',
        }}>
          <EnvelopeLane
            envelope={VOL_ENV}
            pxPerBeat={PX_PER_BEAT}
            bpm={BPM}
            canvasWidth={352}
            laneHeight={100}
            peaks={GHOST_PEAKS}
            playheadSeconds={1.5}
          />
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [view,             setView]             = useState<AutomationView>('expanded')
  const [visibleEnvs,     setVisibleEnvs]     = useState<EnvelopeId[]>(['volume', 'pan'])
  const [snap,             setSnap]             = useState(false)
  const [pxPerBeat,        setPxPerBeat]        = useState(48)
  const [playheadSec,     setPlayheadSec]     = useState(2)
  const [showGhost,       setShowGhost]       = useState(true)

  // Controlled envelope points
  const [volPoints, setVolPoints] = useState<EnvelopePoint[]>(VOL_POINTS)
  const [panPoints, setPanPoints] = useState<EnvelopePoint[]>(PAN_POINTS)

  const [log, setLog] = useState<string>('—')

  const envelopes: AutomationEnvelope[] = [
    { id: 'volume', label: 'Volume', points: volPoints },
    { id: 'pan',    label: 'Pan',    points: panPoints },
  ]

  function setPoints(id: EnvelopeId, pts: EnvelopePoint[]) {
    if (id === 'volume') setVolPoints(pts)
    else                 setPanPoints(pts)
  }

  function getPoints(id: EnvelopeId): EnvelopePoint[] {
    return id === 'volume' ? volPoints : panPoints
  }

  const handlePointAdd = useCallback((envId: EnvelopeId, pt: EnvelopePoint) => {
    setLog(`add → ${envId} t=${pt.t.toFixed(2)}s val=${pt.value.toFixed(3)}`)
    setPoints(envId, [...getPoints(envId), pt].sort((a, b) => a.t - b.t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volPoints, panPoints])

  const handlePointMove = useCallback((envId: EnvelopeId, index: number, pt: EnvelopePoint) => {
    setLog(`move → ${envId}[${index}] t=${pt.t.toFixed(2)}s val=${pt.value.toFixed(3)}`)
    const updated = [...getPoints(envId)]
    updated[index] = pt
    setPoints(envId, updated.sort((a, b) => a.t - b.t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volPoints, panPoints])

  const handlePointDelete = useCallback((envId: EnvelopeId, index: number) => {
    setLog(`delete → ${envId}[${index}]`)
    const updated = [...getPoints(envId)]
    updated.splice(index, 1)
    setPoints(envId, updated)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volPoints, panPoints])

  const totalWidth = secondsToX(DURATION_S, pxPerBeat, BPM)

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Lane ── */}
        <div style={{ flex: '1 1 480px', overflow: 'auto', maxWidth: 720 }}>
          <div style={{
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow:     'hidden',
            width:        totalWidth,
          }}>
            <TimelineRuler
              bpm={BPM}
              numerator={4}
              denominator={4}
              pxPerBeat={pxPerBeat}
              durationSeconds={DURATION_S}
              size="sm"
            />
            {/* Clip lane placeholder */}
            <div style={{
              width:        totalWidth,
              height:       40,
              background:   'var(--stage)',
              borderBottom: '1px solid var(--border)',
              display:      'flex',
              alignItems:   'center',
              paddingLeft:  'var(--space-2)',
            }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', opacity: 0.5 }}>
                clips
              </span>
            </div>

            <AutomationLane
              trackId="playground"
              envelopes={envelopes}
              visibleEnvelopes={visibleEnvs}
              view={view}
              bpm={BPM}
              pxPerBeat={pxPerBeat}
              laneWidth={totalWidth}
              playheadSeconds={playheadSec}
              peaks={showGhost ? GHOST_PEAKS : undefined}
              snap={snap}
              onViewChange={setView}
              onVisibilityChange={setVisibleEnvs}
              onPointAdd={handlePointAdd}
              onPointMove={handlePointMove}
              onPointDelete={handlePointDelete}
            />
          </div>

          {/* Intent log */}
          <div style={{
            marginTop:  'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
          }}>
            {log}
          </div>
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>

          {/* View */}
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            view
          </div>
          <div role="radiogroup" aria-label="View" style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {(['none', 'collapsed', 'expanded'] as AutomationView[]).map(v => (
              <Toggle
                key={v}
                checked={view === v}
                onChange={checked => { if (checked) setView(v) }}
                label={v}
                size="sm"
                aria-label={`View ${v}`}
              />
            ))}
          </div>

          {/* Visible envelopes */}
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            visible lanes
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {(['volume', 'pan'] as EnvelopeId[]).map(id => (
              <Toggle
                key={id}
                checked={visibleEnvs.includes(id)}
                onChange={on => {
                  setVisibleEnvs(prev =>
                    on ? [...prev, id] : prev.filter(x => x !== id)
                  )
                }}
                label={id}
                size="sm"
                aria-label={`Show ${id}`}
              />
            ))}
          </div>

          <label style={labelStyle}>
            playhead ({playheadSec.toFixed(1)}s)
            <Fader
              value={playheadSec}
              onChange={v => setPlayheadSec(Math.round(v * 10) / 10)}
              min={0}
              max={DURATION_S}
              orientation="horizontal"
              size="sm"
              aria-label="Playhead position"
            />
          </label>

          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader
              value={pxPerBeat}
              onChange={v => setPxPerBeat(Math.max(12, Math.round(v)))}
              min={12}
              max={96}
              orientation="horizontal"
              size="sm"
              aria-label="Pixels per beat"
            />
          </label>

          <Toggle
            checked={snap}
            onChange={setSnap}
            label="snap to grid"
            size="sm"
          />

          <Toggle
            checked={showGhost}
            onChange={setShowGhost}
            label="ghost waveform"
            size="sm"
          />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
            lineHeight: 1.5,
          }}>
            click canvas → add point{'\n'}
            drag point → move{'\n'}
            focus + Delete → remove{'\n'}
            right-click point → remove
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function AutomationLaneDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
