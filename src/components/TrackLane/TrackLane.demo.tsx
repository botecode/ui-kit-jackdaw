// src/components/TrackLane/TrackLane.demo.tsx
import { useState, useCallback } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { TrackLane } from './TrackLane'
import type { ClipInfo, ClipMoveIntent } from './TrackLane'
import type { Division } from '../TimelineGrid'

export const meta: DemoMeta = {
  name:  'TrackLane',
  group: 'Composites',
  route: '/track-lane',
  order: 2,
}

// ─── Synthetic waveform data ──────────────────────────────────────────────────

function sineWave(length: number, freq = 0.12, phase = 0): number[] {
  return Array.from({ length }, (_, i) => Math.abs(Math.sin(i * freq + phase)))
}

const PEAKS_GUITAR  = sineWave(120, 0.15, 0)
const PEAKS_BASS    = sineWave(120, 0.08, 1.2)
const PEAKS_KEYS    = sineWave(120, 0.22, 2.4)
const PEAKS_DRUMS   = sineWave(120, 0.35, 0.6)

// ─── Fixture clips (4/4, 120 BPM, 48 px/beat) ────────────────────────────────

const BPM = 120
const PX_PER_BEAT = 48

// bar n starts at: (n-1) × numerator beats × (60/bpm) seconds
const BAR = (n: number, num = 4) => ((n - 1) * num * 60) / BPM

const GUITAR_CLIPS: ClipInfo[] = [
  { clipId: 'g1', start: BAR(1), length: BAR(3) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)',   label: 'Guitar' },
  { clipId: 'g2', start: BAR(4), length: BAR(2) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)',   label: 'Guitar', splitLeft: true },
]
const BASS_CLIPS: ClipInfo[] = [
  { clipId: 'b1', start: BAR(1), length: BAR(5) - BAR(1), peaks: PEAKS_BASS,   color: 'var(--chroma-green)',  label: 'Bass' },
]
const KEYS_CLIPS: ClipInfo[] = [
  { clipId: 'k1', start: BAR(2), length: BAR(3) - BAR(1), peaks: PEAKS_KEYS,   color: 'var(--chroma-purple)', label: 'Keys', muted: true },
]
const DRUMS_CLIPS: ClipInfo[] = [
  { clipId: 'd1', start: BAR(1), length: BAR(2) - BAR(1), peaks: PEAKS_DRUMS,  color: 'var(--chroma-orange)' },
  { clipId: 'd2', start: BAR(3), length: BAR(2) - BAR(1), peaks: PEAKS_DRUMS,  color: 'var(--chroma-orange)' },
  { clipId: 'd3', start: BAR(5), length: BAR(1) - BAR(0), peaks: PEAKS_DRUMS,  color: 'var(--chroma-orange)' },
]

// ─── Shared lane wrapper ──────────────────────────────────────────────────────

function LaneWrap({
  width    = 480,
  height   = 56,
  children,
}: {
  width?:   number
  height?:  number
  children: React.ReactNode
}) {
  const totalWidth = secondsToX(12, PX_PER_BEAT, BPM)
  return (
    <div style={{
      width,
      overflow:     'hidden',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
    }}>
      <TimelineRuler
        bpm={BPM}
        numerator={4}
        denominator={4}
        pxPerBeat={PX_PER_BEAT}
        durationSeconds={12}
        size="sm"
      />
      <div style={{ width: totalWidth, height }}>
        {children}
      </div>
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="empty — paper + grid only">
        <LaneWrap>
          <TrackLane
            trackId="empty"
            clips={[]}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="with clips (guitar, blue)">
        <LaneWrap>
          <TrackLane
            trackId="guitar"
            clips={GUITAR_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="multiple clips (drums, orange)">
        <LaneWrap>
          <TrackLane
            trackId="drums"
            clips={DRUMS_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="selected / focused track">
        <LaneWrap>
          <TrackLane
            trackId="bass"
            clips={BASS_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
            selected
          />
        </LaneWrap>
      </State>

      <State label="muted clip (keys, purple, 50% opacity)">
        <LaneWrap>
          <TrackLane
            trackId="keys"
            clips={KEYS_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="disabled">
        <LaneWrap>
          <TrackLane
            trackId="disabled"
            clips={GUITAR_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
            disabled
          />
        </LaneWrap>
      </State>

      <State label="tall lane (arrangement row size)">
        <LaneWrap height={88}>
          <TrackLane
            trackId="tall"
            clips={BASS_CLIPS}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={88}
            selected
          />
        </LaneWrap>
      </State>

      <State label="split seams (hard cuts at clip edges)">
        <LaneWrap>
          <TrackLane
            trackId="splits"
            clips={[
              { clipId: 's1', start: BAR(1), length: BAR(2) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)', splitRight: true },
              { clipId: 's2', start: BAR(3), length: BAR(2) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)', splitLeft: true, splitRight: true },
              { clipId: 's3', start: BAR(5), length: BAR(1) - BAR(0), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)', splitLeft: true },
            ]}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="selected clip">
        <LaneWrap>
          <TrackLane
            trackId="selclip"
            clips={[{ ...GUITAR_CLIPS[0], selected: true }]}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [pxPerBeat,  setPxPerBeat]  = useState(48)
  const [division,   setDivision]   = useState<Division>('1/4')
  const [laneHeight, setLaneHeight] = useState(64)
  const [selected,   setSelected]   = useState(false)
  const [disabled,   setDisabled]   = useState(false)
  const [bpm,        setBpm]        = useState(120)

  // Controlled clips for interactive drag demo
  const [clips, setClips] = useState<ClipInfo[]>([
    { clipId: 'p1', start: BAR(1), length: BAR(2) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)',   label: 'Guitar' },
    { clipId: 'p2', start: BAR(4), length: BAR(2) - BAR(1), peaks: PEAKS_BASS,   color: 'var(--chroma-green)',  label: 'Bass' },
    { clipId: 'p3', start: BAR(7), length: BAR(2) - BAR(1), peaks: PEAKS_DRUMS,  color: 'var(--chroma-orange)' },
  ])

  const [log, setLog] = useState<string>('—')

  const totalWidth = secondsToX(16, pxPerBeat, bpm)

  const handleMove = useCallback((intent: ClipMoveIntent) => {
    setLog(`clip.move → ${intent.clipId} @ ${intent.start.toFixed(2)}s`)
    setClips(prev => prev.map(c =>
      c.clipId === intent.clipId ? { ...c, start: intent.start } : c
    ))
  }, [])

  const handleDelete = useCallback((clipId: string) => {
    setLog(`clip.delete → ${clipId}`)
    setClips(prev => prev.filter(c => c.clipId !== clipId))
  }, [])

  const handleCursor = useCallback((seconds: number) => {
    setLog(`set-cursor → ${seconds.toFixed(2)}s`)
  }, [])

  const ALL_DIVISIONS: Division[] = ['1/1', '1/2', '1/4', '1/8', '1/16']

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

        {/* Lane */}
        <div style={{ flex: '1 1 360px', overflow: 'auto', maxWidth: 600 }}>
          <div style={{
            border:        '1px solid var(--border)',
            borderRadius:  'var(--radius)',
            overflow:      'hidden',
          }}>
            <TimelineRuler
              bpm={bpm}
              numerator={4}
              denominator={4}
              pxPerBeat={pxPerBeat}
              durationSeconds={16}
              size="sm"
            />
            <div style={{ width: totalWidth, height: laneHeight }}>
              <TrackLane
                trackId="playground"
                clips={clips}
                bpm={bpm}
                numerator={4}
                denominator={4}
                pxPerBeat={pxPerBeat}
                division={division}
                height={laneHeight}
                selected={selected}
                disabled={disabled}
                onClipMove={handleMove}
                onClipDelete={handleDelete}
                onSetCursor={handleCursor}
              />
            </div>
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

        {/* Controls — dogfooded from kit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>

          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            division
          </div>
          <div role="radiogroup" aria-label="Division" style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {ALL_DIVISIONS.map(d => (
              <Toggle
                key={d}
                checked={division === d}
                onChange={checked => { if (checked) setDivision(d) }}
                label={d}
                size="sm"
                aria-label={`Division ${d}`}
              />
            ))}
          </div>

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

          <label style={labelStyle}>
            BPM ({bpm})
            <Fader
              value={bpm}
              onChange={v => setBpm(Math.round(v))}
              min={60}
              max={180}
              orientation="horizontal"
              size="sm"
              aria-label="BPM"
            />
          </label>

          <label style={labelStyle}>
            height ({laneHeight}px)
            <Fader
              value={laneHeight}
              onChange={v => setLaneHeight(Math.round(v))}
              min={40}
              max={120}
              orientation="horizontal"
              size="sm"
              aria-label="Lane height"
            />
          </label>

          <Toggle
            checked={selected}
            onChange={setSelected}
            label="selected track"
            size="sm"
          />

          <Toggle
            checked={disabled}
            onChange={setDisabled}
            label="disabled"
            size="sm"
          />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
          }}>
            drag clips · Delete removes · click lane sets cursor
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function TrackLaneDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
