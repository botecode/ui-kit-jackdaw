// src/components/TrackLane/TrackLane.demo.tsx
import { useState, useCallback } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
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

// Time-stretchable clips: `sourceDuration` (source seconds at rate 1.0) bounds the
// stretch. Content = sourceDuration - offset; implied rate = content / length.
const ONE_BAR = BAR(2) - BAR(1)   // 2 s at this tempo
const STRETCH_CLIPS: ClipInfo[] = [
  // 2-bar source on a 2-bar timeline → rate 1.0 (natural, no hatch).
  { clipId: 'sx1', start: BAR(1), length: 2 * ONE_BAR, peaks: PEAKS_DRUMS, color: 'var(--chroma-orange)',
    label: 'Loop', sourceDuration: 2 * ONE_BAR, offset: 0 },
  // 2-bar source compressed into 1 bar → rate 2.0 (faster).
  { clipId: 'sx2', start: BAR(4), length: ONE_BAR, peaks: PEAKS_DRUMS, color: 'var(--chroma-orange)',
    label: '2.00×', sourceDuration: 2 * ONE_BAR, offset: 0 },
  // 1-bar source expanded across 2 bars → rate 0.5 (slower).
  { clipId: 'sx3', start: BAR(5), length: 2 * ONE_BAR, peaks: PEAKS_DRUMS, color: 'var(--chroma-orange)',
    label: '0.50×', sourceDuration: ONE_BAR, offset: 0 },
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

      <State label="multi-selected clips (Shift+click)">
        <LaneWrap>
          <TrackLane
            trackId="multisel"
            clips={DRUMS_CLIPS.map((c, i) => (i !== 1 ? { ...c, selected: true } : c))}
            bpm={BPM} numerator={4} denominator={4}
            pxPerBeat={PX_PER_BEAT} division="1/4"
            height={56}
          />
        </LaneWrap>
      </State>

      <State label="time-stretched clips (rate ≠ 1 → hatch + chip)">
        <LaneWrap>
          <TrackLane
            trackId="stretch"
            clips={STRETCH_CLIPS}
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

  // Controlled clips for interactive drag demo. Each carries sourceDuration/offset
  // so Alt + dragging an edge time-stretches (rate) instead of trimming.
  const [clips, setClips] = useState<ClipInfo[]>([
    { clipId: 'p1', start: BAR(1), length: BAR(2) - BAR(1), peaks: PEAKS_GUITAR, color: 'var(--chroma-blue)',   label: 'Guitar', sourceDuration: BAR(2) - BAR(1), offset: 0 },
    { clipId: 'p2', start: BAR(4), length: BAR(2) - BAR(1), peaks: PEAKS_BASS,   color: 'var(--chroma-green)',  label: 'Bass',   sourceDuration: BAR(2) - BAR(1), offset: 0 },
    { clipId: 'p3', start: BAR(7), length: BAR(2) - BAR(1), peaks: PEAKS_DRUMS,  color: 'var(--chroma-orange)',                  sourceDuration: BAR(2) - BAR(1), offset: 0 },
  ])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Consumer-owned context menu — the kit only surfaces the gesture (event + ids);
  // here the demo plays the consumer, opening the shared ContextMenu in point mode
  // from the surfaced event's clientX/clientY.
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; items: MenuEntry[] }>({
    open: false, x: 0, y: 0, items: [],
  })
  const closeMenu = useCallback(() => setMenu(m => ({ ...m, open: false })), [])

  const [log, setLog] = useState<string>('—')

  const totalWidth = secondsToX(16, pxPerBeat, bpm)

  const handleSelect = useCallback((clipId: string) => {
    setLog(`clip.select → ${clipId}`)
    setSelectedIds(new Set([clipId]))
  }, [])

  const handleShiftSelect = useCallback((clipId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(clipId)) next.delete(clipId)
      else next.add(clipId)
      setLog(`clip.shift-select → ${[...next].join(', ') || '(none)'}`)
      return next
    })
  }, [])

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

  // Edge time-stretch. rate is absolute (content / length); reconstruct length from
  // it so the clip stays consistent (content / length === rate). newStart is present
  // only for the end-anchored left edge.
  const handleSetRate = useCallback((clipId: string, rate: number, newStart?: number) => {
    setLog(`clip.set-rate → ${clipId} @ ${rate.toFixed(2)}×${newStart != null ? ` · start ${newStart.toFixed(2)}s` : ''}`)
    setClips(prev => prev.map(c => {
      if (c.clipId !== clipId) return c
      const content   = (c.sourceDuration ?? c.length) - (c.offset ?? 0)
      const newLength = content / rate
      return { ...c, start: newStart ?? c.start, length: newLength }
    }))
  }, [])

  const handleCursor = useCallback((seconds: number) => {
    setLog(`set-cursor → ${seconds.toFixed(2)}s`)
  }, [])

  const handleClipContextMenu = useCallback((e: React.MouseEvent, clipId: string) => {
    setLog(`clip.context-menu → ${clipId} @ (${e.clientX}, ${e.clientY})`)
    setSelectedIds(new Set([clipId]))
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        { id: 'cut',    label: 'Cut',        shortcut: '⌘X', onSelect: closeMenu },
        { id: 'copy',   label: 'Copy',       shortcut: '⌘C', onSelect: closeMenu },
        { id: 'split',  label: 'Split at playhead', shortcut: 'S', onSelect: closeMenu },
        { id: 'sep1',   separator: true },
        { id: 'rename', label: 'Rename…',    onSelect: closeMenu },
        { id: 'delete', label: 'Delete clip', shortcut: '⌫', danger: true,
          onSelect: () => { handleDelete(clipId); closeMenu() } },
      ],
    })
  }, [closeMenu, handleDelete])

  const handleLaneContextMenu = useCallback((e: React.MouseEvent, trackId: string) => {
    setLog(`lane.context-menu → ${trackId} @ (${e.clientX}, ${e.clientY})`)
    setMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        { id: 'paste',     label: 'Paste',          shortcut: '⌘V', onSelect: closeMenu },
        { id: 'insert',    label: 'Insert silence', onSelect: closeMenu },
        { id: 'sep1',      separator: true },
        { id: 'select-all', label: 'Select all on track', onSelect: closeMenu },
      ],
    })
  }, [closeMenu])

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
                clips={clips.map(c => ({ ...c, selected: selectedIds.has(c.clipId) }))}
                bpm={bpm}
                numerator={4}
                denominator={4}
                pxPerBeat={pxPerBeat}
                division={division}
                height={laneHeight}
                selected={selected}
                disabled={disabled}
                onClipMove={handleMove}
                onClipSetRate={handleSetRate}
                onClipDelete={handleDelete}
                onClipSelect={handleSelect}
                onClipShiftSelect={handleShiftSelect}
                onClipContextMenu={handleClipContextMenu}
                onLaneContextMenu={handleLaneContextMenu}
                onSetCursor={handleCursor}
              />
            </div>
          </div>

          {/* Consumer-owned menu, anchored at the surfaced pointer (point mode). */}
          <ContextMenu
            open={menu.open}
            x={menu.x}
            y={menu.y}
            items={menu.items}
            onClose={closeMenu}
            aria-label="Clip / lane actions"
          />

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
            click selects · Shift+click multi-selects · drag clips · drag an edge trims · Alt+drag an edge time-stretches (left edge is end-anchored) · Delete removes · click lane sets cursor · right-click a clip or empty lane for the menu
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
