// src/components/TapeStrip/TapeStrip.demo.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TapeStrip } from './TapeStrip'
import type { TapeTrack } from './TapeStrip'
import type { SelectionRange } from '../TimeSelection'
import type { AnnotationItem } from '../AnnotationLane'

export const meta: DemoMeta = {
  name:  'TapeStrip',
  group: 'Composites',
  route: '/tape-strip',
  order: 123,
}

// ─── Time constants ───────────────────────────────────────────────────────────

const BPM      = 120
const PPB      = 22    // px per beat — slim
const NUM      = 4
const DEN      = 4
const DURATION = 32    // seconds (~16 bars @ 120bpm)

function bar(n: number): number {
  return ((n - 1) * NUM * 60) / BPM
}

// ─── Synthetic waveform data ──────────────────────────────────────────────────

function wave(len: number, freq = 0.12, phase = 0): number[] {
  return Array.from({ length: len }, (_, i) => Math.abs(Math.sin(i * freq + phase)))
}

const W_GTR  = wave(96, 0.16, 0)
const W_BASS = wave(96, 0.08, 1.2)
const W_KEYS = wave(96, 0.24, 2.4)
const W_DRUM = wave(96, 0.36, 0.6)

// ─── Fixture tracks ───────────────────────────────────────────────────────────

const TRACKS: TapeTrack[] = [
  {
    id: 'guitar',
    color: 'var(--chroma-blue)',
    clips: [
      { clipId: 'g1', startSeconds: bar(1), lengthSeconds: bar(3) - bar(1), peaks: W_GTR },
      { clipId: 'g2', startSeconds: bar(5), lengthSeconds: bar(6) - bar(5), peaks: W_GTR },
    ],
  },
  {
    id: 'bass',
    color: 'var(--chroma-green)',
    clips: [{ clipId: 'b1', startSeconds: bar(1), lengthSeconds: bar(7) - bar(1), peaks: W_BASS }],
  },
  {
    id: 'keys',
    color: 'var(--chroma-purple)',
    clips: [
      { clipId: 'k1', startSeconds: bar(3), lengthSeconds: bar(5) - bar(3), peaks: W_KEYS },
    ],
  },
  {
    id: 'drums',
    color: 'var(--chroma-orange)',
    clips: [
      { clipId: 'd1', startSeconds: bar(1), lengthSeconds: bar(2) - bar(1), peaks: W_DRUM },
      { clipId: 'd2', startSeconds: bar(3), lengthSeconds: bar(4) - bar(3), peaks: W_DRUM },
      { clipId: 'd3', startSeconds: bar(5), lengthSeconds: bar(7) - bar(5), peaks: W_DRUM },
    ],
  },
]

// A full 10-track session — proves the grid stays the same height whether it
// holds 0, a few, or all ten tracks.
const PALETTE = [
  'var(--chroma-blue)', 'var(--chroma-green)', 'var(--chroma-purple)', 'var(--chroma-orange)',
  'var(--chroma-teal)', 'var(--chroma-yellow)', 'var(--chroma-red)', 'var(--chroma-blue)',
  'var(--chroma-green)', 'var(--chroma-purple)',
]
const FULL_TRACKS: TapeTrack[] = PALETTE.map((color, i) => ({
  id: `track-${i + 1}`,
  color,
  clips: [
    { clipId: `c${i}a`, startSeconds: bar(1), lengthSeconds: bar(3) - bar(1), peaks: W_GTR },
    { clipId: `c${i}b`, startSeconds: bar(4), lengthSeconds: bar(6) - bar(4), peaks: W_BASS },
  ],
}))

const MARKERS: AnnotationItem[] = [
  { id: 'm1', start: bar(1), text: 'Intro' },
  { id: 'm2', start: bar(3), text: 'Verse' },
  { id: 'm3', start: bar(7), text: 'Chorus' },
]

const PUNCH: SelectionRange = { start: bar(3), end: bar(5) }

const noop = () => {}

// ─── A static (non-playing) tape, for the states grid ─────────────────────────

function StaticTape({
  selectedTrackId,
  selection,
  playing,
  recording,
  markers = MARKERS,
  tracks = TRACKS,
  interactive = true,
}: {
  selectedTrackId?: string | null
  selection?: SelectionRange | null
  playing?: boolean
  recording?: boolean
  markers?: AnnotationItem[]
  tracks?: TapeTrack[]
  interactive?: boolean
}) {
  return (
    <div style={{ width: 360 }}>
      <TapeStrip
        tracks={tracks}
        bpm={BPM}
        numerator={NUM}
        denominator={DEN}
        pxPerBeat={PPB}
        durationSeconds={DURATION}
        playheadSeconds={playing || recording ? bar(2) : bar(4)}
        getPlayheadSeconds={() => bar(2)}
        playing={playing}
        recording={recording}
        markers={markers}
        selection={selection ?? null}
        selectedTrackId={selectedTrackId ?? null}
        onSelectTrack={interactive ? noop : undefined}
        onSelectionChange={interactive ? noop : undefined}
        onSelectionClear={interactive ? noop : undefined}
      />
    </div>
  )
}

// ─── Live playground — a real rAF-driven playhead, dogfooded kit controls ─────

function LiveTape() {
  const [playing, setPlaying]     = useState(false)
  const [recording, setRecording] = useState(false)
  const [showMarkers, setShow]    = useState(true)
  const [punchOn, setPunch]       = useState(true)
  const [selectedTrackId, setSel] = useState<string | null>('bass')
  const [selection, setSelection] = useState<SelectionRange | null>(PUNCH)

  // Imperative transport clock — the authoritative source for the rAF read.
  const posRef   = useRef(bar(2))
  const startRef = useRef(0)

  useEffect(() => {
    if (!playing && !recording) return
    startRef.current = performance.now()
    const base = posRef.current
    let raf = 0
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000
      posRef.current = (base + elapsed) % DURATION
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, recording])

  const getPos = useCallback(() => posRef.current, [])

  return (
    <>
      <div style={{ width: 520, maxWidth: '100%' }}>
        <TapeStrip
          tracks={TRACKS}
          bpm={BPM}
          numerator={NUM}
          denominator={DEN}
          pxPerBeat={PPB}
          durationSeconds={DURATION}
          playheadSeconds={posRef.current}
          getPlayheadSeconds={getPos}
          playing={playing}
          recording={recording}
          markers={showMarkers ? MARKERS : []}
          onMarkerAdd={s => console.log('marker add', s)}
          onMarkerMove={(id, s) => console.log('marker move', id, s)}
          selection={punchOn ? selection : null}
          onSelectionChange={setSelection}
          onSelectionClear={() => setPunch(false)}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSel}
          aria-label="Song tape"
        />
      </div>

      <Playground>
        <Toggle
          checked={playing}
          onChange={v => { setPlaying(v); if (v) setRecording(false) }}
          label="Playing"
        />
        <Toggle
          checked={recording}
          onChange={v => { setRecording(v); if (v) setPlaying(false) }}
          label="Recording"
        />
        <Toggle checked={showMarkers} onChange={setShow} label="Markers" />
        <Toggle
          checked={punchOn}
          onChange={v => { setPunch(v); if (v && !selection) setSelection(PUNCH) }}
          label="Punch region"
        />
      </Playground>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        Selected track: <strong>{selectedTrackId ?? 'none'}</strong> — click a lane to open its
        drilldown.
      </p>
    </>
  )
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export default function TapeStripDemo() {
  return (
    <DemoShell meta={meta}>
      <p style={{ color: 'var(--text-muted)', maxWidth: 640, lineHeight: 1.5 }}>
        The slim, read-only <strong>tape</strong> that rides on top of the studio view — a map you
        read and navigate, never an edit surface. A <strong>fixed lane grid</strong> (default 10
        lanes) keeps the tape the same height no matter how many tracks exist: the first N lanes
        carry the tracks (a colour-pill in the track's colour + its clips), the rest sit empty
        (a neutral pill). Adding a track lights the next lane's pill — the height never grows.
        Clicking a track-backed lane is the doorway to that track's drilldown; empty lanes are
        inert. The single accent is reserved for the playhead, the punch region, and the markers.
        No clip drag, trim, fade, or split anywhere.
      </p>

      <h2 style={{ font: 'var(--font-ui)', fontSize: 14, marginTop: 8 }}>Live</h2>
      <LiveTape />

      <StatesGrid>
        <State label="default (idle)">
          <StaticTape />
        </State>
        <State label="selected track">
          <StaticTape selectedTrackId="keys" />
        </State>
        <State label="punch region">
          <StaticTape selection={PUNCH} />
        </State>
        <State label="playing">
          <StaticTape playing />
        </State>
        <State label="recording">
          <StaticTape recording selection={PUNCH} />
        </State>
        <State label="display-only (no handlers)">
          <StaticTape interactive={false} />
        </State>
        <State label="no markers">
          <StaticTape markers={[]} />
        </State>
      </StatesGrid>

      {/* ── Fixed lane grid: same height at 0, a few, and a full 10 tracks ── */}
      <h2 style={{ font: 'var(--font-ui)', fontSize: 14, marginTop: 8 }}>
        Constant height — 0, a few, full 10
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 640, lineHeight: 1.5, fontSize: 13 }}>
        The grid is the same height across all three — empty lanes show a neutral pill; the tape
        never grows as tracks are added.
      </p>
      <StatesGrid>
        <State label="0 tracks (all neutral)">
          <StaticTape tracks={[]} markers={[]} />
        </State>
        <State label="a few (mixed)">
          <StaticTape tracks={[TRACKS[0]]} markers={[]} />
        </State>
        <State label="full (10 tracks)">
          <StaticTape tracks={FULL_TRACKS} markers={[]} />
        </State>
      </StatesGrid>

      {/* ── Cross-theme proof: one component reskins through tokens, light + dark ── */}
      <h2 style={{ font: 'var(--font-ui)', fontSize: 14, marginTop: 8 }}>Across themes</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {(['chroma', 'manuscript', 'nocturne', 'ink'] as const).map(theme => (
          <ThemeProvider key={theme} theme={theme}>
            <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
              <span style={{
                display: 'block', marginBottom: 8, fontFamily: 'var(--font-mono)',
                fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-dim)',
              }}>
                {theme}
              </span>
              <StaticTape selectedTrackId="bass" selection={PUNCH} />
            </div>
          </ThemeProvider>
        ))}
      </div>
    </DemoShell>
  )
}
