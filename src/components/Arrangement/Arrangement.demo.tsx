// src/components/Arrangement/Arrangement.demo.tsx
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Arrangement } from './Arrangement'
import type { ArrangementProps, ArrangementTrack } from './Arrangement'
import type { SelectionRange } from '../TimeSelection'
import type { Division } from '../TimelineGrid'

export const meta: DemoMeta = {
  name:  'Arrangement',
  group: 'Composites',
  route: '/arrangement',
  order: 3,
}

// ─── Time constants ───────────────────────────────────────────────────────────

const BPM      = 120
const PPB      = 48    // px per beat
const DURATION = 32    // seconds (~16 bars @ 120bpm)
const DIV: Division = '1/4'

function bar(n: number, num = 4): number {
  return ((n - 1) * num * 60) / BPM
}

// ─── Synthetic waveform data ──────────────────────────────────────────────────

function wave(len: number, freq = 0.12, phase = 0): number[] {
  return Array.from({ length: len }, (_, i) => Math.abs(Math.sin(i * freq + phase)))
}

const W_GUITAR = wave(120, 0.15, 0)
const W_BASS   = wave(120, 0.08, 1.2)
const W_KEYS   = wave(120, 0.22, 2.4)
const W_DRUMS  = wave(120, 0.35, 0.6)
const W_VOCAL  = wave(120, 0.11, 0.9)
const W_SYNTH  = wave(120, 0.28, 3.1)

// ─── Fixture tracks ───────────────────────────────────────────────────────────

const GUITAR_TRACK: ArrangementTrack = {
  id: 'guitar', name: 'Guitar', color: 'var(--chroma-blue)',
  type: 'audio', armed: false, muted: false, soloed: false,
  volumeDb: -6, pan: -0.1, inputId: 'in-1', plugins: [], chainEnabled: true,
  clips: [
    { clipId: 'g1', start: bar(1), length: bar(3) - bar(1), peaks: W_GUITAR, color: 'var(--chroma-blue)',  label: 'Guitar A' },
    { clipId: 'g2', start: bar(5), length: bar(2) - bar(1), peaks: W_GUITAR, color: 'var(--chroma-blue)',  label: 'Guitar B', splitLeft: true },
  ],
}

const BASS_TRACK: ArrangementTrack = {
  id: 'bass', name: 'Bass', color: 'var(--chroma-green)',
  type: 'audio', armed: false, muted: false, soloed: false,
  volumeDb: -8, pan: 0, inputId: 'in-2', plugins: [], chainEnabled: true,
  clips: [
    { clipId: 'b1', start: bar(1), length: bar(7) - bar(1), peaks: W_BASS, color: 'var(--chroma-green)', label: 'Bass' },
  ],
}

const KEYS_TRACK: ArrangementTrack = {
  id: 'keys', name: 'Keys', color: 'var(--chroma-purple)',
  type: 'instrument', armed: false, muted: true, soloed: false,
  volumeDb: -10, pan: 0.15, inputId: null, plugins: [], chainEnabled: true,
  clips: [
    { clipId: 'k1', start: bar(3), length: bar(3) - bar(1), peaks: W_KEYS, color: 'var(--chroma-purple)', label: 'Keys', muted: true },
    { clipId: 'k2', start: bar(7), length: bar(2) - bar(1), peaks: W_KEYS, color: 'var(--chroma-purple)', label: 'Keys 2' },
  ],
}

const DRUMS_TRACK: ArrangementTrack = {
  id: 'drums', name: 'Drums', color: 'var(--chroma-orange)',
  type: 'audio', armed: false, muted: false, soloed: false,
  volumeDb: -4, pan: 0, inputId: 'in-3', plugins: [], chainEnabled: true,
  clips: [
    { clipId: 'd1', start: bar(1), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
    { clipId: 'd2', start: bar(3), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
    { clipId: 'd3', start: bar(5), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
    { clipId: 'd4', start: bar(7), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
  ],
}

const VOCAL_TRACK: ArrangementTrack = {
  id: 'vocal', name: 'Vocal', color: 'var(--chroma-red)',
  type: 'audio', armed: true, muted: false, soloed: false,
  volumeDb: -3, pan: 0.05, inputId: 'in-4', plugins: [], chainEnabled: true,
  meterLevel: 0.72, clipping: false,
  clips: [
    { clipId: 'v1', start: bar(2), length: bar(5) - bar(2), peaks: W_VOCAL, color: 'var(--chroma-red)', label: 'Verse 1' },
    { clipId: 'v2', start: bar(7), length: bar(2) - bar(1), peaks: W_VOCAL, color: 'var(--chroma-red)', label: 'Chorus' },
  ],
}

const SYNTH_TRACK: ArrangementTrack = {
  id: 'synth', name: 'Synth Pad', color: 'var(--chroma-teal)',
  type: 'instrument', armed: false, muted: false, soloed: false,
  volumeDb: -12, pan: -0.2, inputId: null, plugins: [], chainEnabled: true,
  clips: [
    { clipId: 's1', start: bar(4), length: bar(5) - bar(1), peaks: W_SYNTH, color: 'var(--chroma-teal)' },
  ],
}

const FX_TRACK: ArrangementTrack = {
  id: 'fx', name: 'FX Bus', color: 'var(--chroma-yellow)',
  type: 'audio', armed: false, muted: false, soloed: false,
  volumeDb: -14, pan: 0, inputId: null, plugins: [], chainEnabled: true,
  clips: [],
}

const AMBIENT_TRACK: ArrangementTrack = {
  id: 'ambient', name: 'Ambient', color: 'var(--chroma-purple)',
  type: 'instrument', armed: false, muted: false, soloed: false,
  volumeDb: -18, pan: 0, inputId: null, plugins: [], chainEnabled: true,
  clips: [
    { clipId: 'a1', start: bar(1), length: bar(8) - bar(1), peaks: W_SYNTH, color: 'var(--chroma-purple)', label: 'Pad loop' },
  ],
}

// ── Folder (bus) tracks ───────────────────────────────────────────────────────

const DRUMS_BUS_TRACK: ArrangementTrack = {
  id: 'drums-bus', name: 'Drums Bus', color: 'var(--chroma-orange)',
  type: 'audio', isFolder: true, armed: false, muted: false, soloed: false,
  volumeDb: -2, pan: 0, inputId: null, plugins: [], chainEnabled: true,
  clips: [],
}

const SYNTH_BUS_TRACK: ArrangementTrack = {
  id: 'synth-bus', name: 'Synth Bus', color: 'var(--chroma-teal)',
  type: 'audio', isFolder: true, armed: false, muted: false, soloed: false,
  volumeDb: -4, pan: 0, inputId: null, plugins: [], chainEnabled: true,
  clips: [],
}

// Cross-lane selection: g1 (Guitar) + d2 (Drums) read as selected, spanning lanes.
const withClipSelected = (t: ArrangementTrack, ...ids: string[]): ArrangementTrack => ({
  ...t,
  clips: t.clips.map(c => (ids.includes(c.clipId) ? { ...c, selected: true } : c)),
})
const MULTISELECT_TRACKS = [
  withClipSelected(GUITAR_TRACK, 'g1'),
  BASS_TRACK,
  withClipSelected(DRUMS_TRACK, 'd2', 'd4'),
]

const FEW_TRACKS         = [GUITAR_TRACK, BASS_TRACK, DRUMS_TRACK]
const MANY_TRACKS        = [GUITAR_TRACK, BASS_TRACK, KEYS_TRACK, DRUMS_TRACK, VOCAL_TRACK, SYNTH_TRACK, FX_TRACK, AMBIENT_TRACK]
const TRACKS_WITH_FOLDERS = [DRUMS_BUS_TRACK, DRUMS_TRACK, GUITAR_TRACK, SYNTH_BUS_TRACK, SYNTH_TRACK, KEYS_TRACK, BASS_TRACK]

const NOOP_CALLBACKS: Omit<ArrangementProps,
  'tracks' | 'bpm' | 'numerator' | 'denominator' | 'pxPerBeat' | 'division' |
  'durationSeconds' | 'playheadSeconds' | 'getPlayheadSeconds' |
  'cursorSeconds' | 'selection' | 'inputOptions' | 'focusedTrackId' |
  'playing' | 'recording' | 'disabled' | 'trackHeight' | 'headerWidth' | 'detailPanel'
> = {
  onSelectTrack:    () => {},
  onSeek:           () => {},
  onSelectRange:    () => {},
  onClearSelection: () => {},
  onRenameTrack:    () => {},
  onArmTrack:       () => {},
  onMuteTrack:      () => {},
  onSoloTrack:      () => {},
  onVolumeTrack:    () => {},
  onPanTrack:       () => {},
  onSelectInput:    () => {},
  onToggleChain:    () => {},
  onTogglePlugin:   () => {},
  onReorderPlugin:  () => {},
  onRemovePlugin:   () => {},
  onAddPlugin:      () => {},
  onOpenPlugin:     () => {},
}

// ─── Shared static props ──────────────────────────────────────────────────────

const STATIC: Pick<ArrangementProps,
  'bpm' | 'numerator' | 'denominator' | 'pxPerBeat' | 'division' |
  'durationSeconds' | 'cursorSeconds' | 'selection' | 'inputOptions'
> = {
  bpm: BPM, numerator: 4, denominator: 4,
  pxPerBeat: PPB, division: DIV,
  durationSeconds: DURATION,
  cursorSeconds: 0,
  selection: null,
  inputOptions: [],
}

const GET_ZERO = () => 0

// ─── Fixture wrapper ──────────────────────────────────────────────────────────
// Fixed-height frame so each state cell reads like an instrument surface.

function Frame({
  height = 300,
  children,
}: {
  height?: number
  children: React.ReactNode
}) {
  return (
    <div style={{
      height,
      border:       '1px solid var(--border-strong)',
      borderRadius: 'var(--radius)',
      overflow:     'hidden',
    } as CSSProperties}>
      {children}
    </div>
  )
}

// ─── Playing state helper ─────────────────────────────────────────────────────
// Self-contained sub-component so the rAF loop lifecycle is scoped cleanly.

function PlayingArrangement({ height = 300, focusedTrackId = null }: { height?: number; focusedTrackId?: string | null }) {
  const startRef = useRef(performance.now())
  const getPlayheadSeconds = useCallback(
    () => ((performance.now() - startRef.current) / 1000) % DURATION,
    [],
  )

  return (
    <Frame height={height}>
      <Arrangement
        {...STATIC}
        {...NOOP_CALLBACKS}
        tracks={FEW_TRACKS}
        playheadSeconds={0}
        getPlayheadSeconds={getPlayheadSeconds}
        playing
        focusedTrackId={focusedTrackId}
      />
    </Frame>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────

function StatesDemo() {
  const sel: SelectionRange = { start: bar(3), end: bar(5) }

  return (
    <StatesGrid>
      {/* Empty — no tracks */}
      <State label="empty — no tracks">
        <Frame height={200}>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={[]}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
          />
        </Frame>
      </State>

      {/* Default — few tracks */}
      <State label="default — 3 tracks">
        <Frame>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={FEW_TRACKS}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
          />
        </Frame>
      </State>

      {/* Focused track */}
      <State label="focused track (Guitar, accent keyline)">
        <Frame>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={FEW_TRACKS}
            playheadSeconds={bar(2)}
            getPlayheadSeconds={GET_ZERO}
            focusedTrackId="guitar"
          />
        </Frame>
      </State>

      {/* Cross-lane multi-clip selection */}
      <State label="multi-clip selection (cross-lane: Guitar + Drums)">
        <Frame>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={MULTISELECT_TRACKS}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
            focusedTrackId="guitar"
          />
        </Frame>
      </State>

      {/* Playing — rAF sweeping playhead */}
      <State label="playing — playhead sweeping">
        <PlayingArrangement />
      </State>

      {/* With time selection */}
      <State label="with time selection">
        <Frame>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={FEW_TRACKS}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
            selection={sel}
            cursorSeconds={bar(3)}
          />
        </Frame>
      </State>

      {/* Many tracks — vertical scroll */}
      <State label="many tracks (8) — vertical scroll">
        <Frame height={320}>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={MANY_TRACKS}
            playheadSeconds={bar(2)}
            getPlayheadSeconds={GET_ZERO}
          />
        </Frame>
      </State>

      {/* Focused track + playing */}
      <State label="focused + playing">
        <PlayingArrangement focusedTrackId="bass" />
      </State>

      {/* With detail panel slot */}
      <State label="detail panel slot">
        <Frame height={380}>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={FEW_TRACKS}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
            focusedTrackId="guitar"
            detailPanel={
              <div style={{
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-dim)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
              }}>
                FocusedTrackDetailPanel slot
              </div>
            }
          />
        </Frame>
      </State>

      {/* Disabled */}
      <State label="disabled">
        <Frame>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={FEW_TRACKS}
            playheadSeconds={bar(2)}
            getPlayheadSeconds={GET_ZERO}
            disabled
          />
        </Frame>
      </State>

      {/* Folder tracks — collapse-all button visible in ruler spacer */}
      <State label="with folder tracks — collapse-all button">
        <Frame height={380}>
          <Arrangement
            {...STATIC}
            {...NOOP_CALLBACKS}
            tracks={TRACKS_WITH_FOLDERS}
            playheadSeconds={0}
            getPlayheadSeconds={GET_ZERO}
          />
        </Frame>
      </State>

      {/* All folders collapsed — compact rows for bus tracks */}
      <State label="all folders collapsed (compact rows)">
        <CollapsedFoldersArrangement />
      </State>
    </StatesGrid>
  )
}

// Sub-component so collapse-all interaction is self-contained
function CollapsedFoldersArrangement() {
  return (
    <Frame height={320}>
      <Arrangement
        {...STATIC}
        {...NOOP_CALLBACKS}
        tracks={TRACKS_WITH_FOLDERS}
        playheadSeconds={0}
        getPlayheadSeconds={GET_ZERO}
      />
    </Frame>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [playing,        setPlaying]        = useState(false)
  const [showSelection,  setShowSelection]  = useState(false)
  const [focusedId,      setFocusedId]      = useState<string | null>(null)
  const [showMeters,     setShowMeters]     = useState(false)
  const [manyTracks,     setManyTracks]     = useState(false)
  const [withFolders,    setWithFolders]    = useState(false)

  // Playhead simulation
  const playStartRef    = useRef(performance.now())
  const playSecondsRef  = useRef(0)

  const [playheadSeconds, setPlayheadSeconds] = useState(0)

  const getPlayheadSeconds = useCallback(() => {
    if (!playing) return playheadSeconds
    return playSecondsRef.current + (performance.now() - playStartRef.current) / 1000
  }, [playing, playheadSeconds])

  function handlePlayToggle(next: boolean) {
    if (next) {
      playStartRef.current   = performance.now()
      playSecondsRef.current = playheadSeconds
      setPlaying(true)
    } else {
      const currentSeconds = Math.min(
        playSecondsRef.current + (performance.now() - playStartRef.current) / 1000,
        DURATION,
      )
      setPlayheadSeconds(currentSeconds)
      setPlaying(false)
    }
  }

  function handleSeek(s: number) {
    setPlayheadSeconds(s)
    playSecondsRef.current = s
    playStartRef.current   = performance.now()
  }

  const [selection, setSelection] = useState<SelectionRange | null>(null)
  const [selectedClips, setSelectedClips] = useState<string[]>([])

  function handleShowSelection(next: boolean) {
    setShowSelection(next)
    setSelection(next ? { start: bar(3), end: bar(5) } : null)
  }

  // Controlled tracks so cross-track clip drags actually relocate the clip between
  // lanes (the whole point of this card). Resets to the chosen fixture set when the
  // track-count / folder toggles change which base set is shown.
  const baseTracks = withFolders ? TRACKS_WITH_FOLDERS : manyTracks ? MANY_TRACKS : FEW_TRACKS
  const [arrTracks, setArrTracks] = useState<ArrangementTrack[]>(baseTracks)
  useEffect(() => { setArrTracks(baseTracks) }, [baseTracks])

  // Live drop-target readout, fed by onClipDragOver (composite-resolved sibling lane).
  const [dragOver, setDragOver] = useState<string | null>(null)

  // clip:move — same-lane repositions; a populated intent.trackId relocates the clip
  // to the resolved sibling lane (remove from origin, append to destination).
  const handleClipMove = useCallback((trackId: string, intent: { clipId: string; start: number; trackId?: string }) => {
    const destId = intent.trackId ?? trackId
    setArrTracks(prev => {
      if (destId === trackId) {
        return prev.map(t => t.id === trackId
          ? { ...t, clips: t.clips.map(c => c.clipId === intent.clipId ? { ...c, start: intent.start } : c) }
          : t)
      }
      let moved: ArrangementTrack['clips'][number] | undefined
      const without = prev.map(t => {
        if (t.id !== trackId) return t
        moved = t.clips.find(c => c.clipId === intent.clipId)
        return { ...t, clips: t.clips.filter(c => c.clipId !== intent.clipId) }
      })
      if (!moved) return prev
      const clip = { ...moved, start: intent.start }
      return without.map(t => t.id === destId ? { ...t, clips: [...t.clips, clip] } : t)
    })
    setDragOver(null)
  }, [])

  const tracks = arrTracks

  return (
    <>
      <Playground>
        <Toggle
          checked={playing}
          onChange={handlePlayToggle}
          label="Playing"
          size="sm"
        />
        <Toggle
          checked={showSelection}
          onChange={handleShowSelection}
          label="Time selection"
          size="sm"
        />
        <Toggle
          checked={focusedId === 'guitar'}
          onChange={v => setFocusedId(v ? 'guitar' : null)}
          label="Focus Guitar"
          size="sm"
        />
        <Toggle
          checked={focusedId === 'bass'}
          onChange={v => setFocusedId(v ? 'bass' : null)}
          label="Focus Bass"
          size="sm"
        />
        <Toggle
          checked={showMeters}
          onChange={setShowMeters}
          label="Show all meters"
          size="sm"
        />
        <Toggle
          checked={manyTracks}
          onChange={next => { setManyTracks(next); if (next) setWithFolders(false) }}
          label="Many tracks (8)"
          size="sm"
        />
        <Toggle
          checked={withFolders}
          onChange={next => { setWithFolders(next); if (next) setManyTracks(false) }}
          label="With folder tracks"
          size="sm"
        />
      </Playground>

      <div style={{ height: 480, marginTop: 'var(--space-4)' }}>
        <Arrangement
          tracks={tracks}
          bpm={BPM}
          numerator={4}
          denominator={4}
          pxPerBeat={PPB}
          division={DIV}
          durationSeconds={DURATION}
          playheadSeconds={playheadSeconds}
          getPlayheadSeconds={getPlayheadSeconds}
          playing={playing}
          cursorSeconds={playheadSeconds}
          selection={selection}
          focusedTrackId={focusedId}
          inputOptions={[]}
          showAllMeters={showMeters}
          onSelectTrack={id => setFocusedId(id)}
          onSeek={handleSeek}
          onSelectRange={range => {
            setSelection(range)
            setShowSelection(true)
          }}
          onClearSelection={() => {
            setSelection(null)
            setShowSelection(false)
          }}
          onRenameTrack={() => {}}
          onArmTrack={() => {}}
          onMuteTrack={() => {}}
          onSoloTrack={() => {}}
          onVolumeTrack={() => {}}
          onPanTrack={() => {}}
          onSelectInput={() => {}}
          onToggleChain={() => {}}
          onTogglePlugin={() => {}}
          onReorderPlugin={() => {}}
          onRemovePlugin={() => {}}
          onAddPlugin={() => {}}
          onOpenPlugin={() => {}}
          onClipMove={handleClipMove}
          onClipDragOver={info => setDragOver(
            info.targetTrackId == null
              ? null
              : `${info.invalid ? '⊘ can’t drop on folder' : '→ drop on'} ${info.targetTrackId}`
          )}
          onSelectClips={setSelectedClips}
        />
      </div>

      {/* Selection + drag readout — drag a clip vertically onto another lane to move it */}
      <div style={{
        marginTop:  'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize:   'var(--text-xs)',
        color:      'var(--text-dim)',
      }}>
        {dragOver
          ? dragOver
          : selectedClips.length === 0
            ? 'click a clip to select · Shift+click to extend across lanes · drag a clip onto another lane to move it'
            : `selected (${selectedClips.length}): ${selectedClips.join(', ')}`}
      </div>
    </>
  )
}

// ─── Demo default export ──────────────────────────────────────────────────────

export default function ArrangementDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
