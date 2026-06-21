// src/components/AppShell/AppShell.demo.tsx
import { useState, useCallback, useRef, type CSSProperties } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { AppShell } from './AppShell'
import type { AppShellProps, NavSection } from './AppShell'
import type { ArrangementTrack } from '../Arrangement'
import type { MixerChannel, MixerMaster } from '../Mixer'
import type { Comment } from '../CommentsPanel'
import type { VersionEntry } from '../Versions'
import type { Idea } from '../IdeasLibrary'
import type { RecordModeState, RecordModeValue } from '../RecordMode'

export const meta: DemoMeta = {
  name:  'AppShell',
  group: 'Composites',
  route: '/app-shell',
  order: 100,
}

// ── Time helpers ──────────────────────────────────────────────────────────────

const BPM      = 120
const PPB      = 48
const DURATION = 32

function bar(n: number, num = 4): number {
  return ((n - 1) * num * 60) / BPM
}

function wave(len: number, freq = 0.12, phase = 0): number[] {
  return Array.from({ length: len }, (_, i) => Math.abs(Math.sin(i * freq + phase)))
}

const W_GUITAR = wave(120, 0.15, 0)
const W_BASS   = wave(120, 0.08, 1.2)
const W_DRUMS  = wave(120, 0.35, 0.6)
const W_VOCAL  = wave(120, 0.11, 0.9)
const W_KEYS   = wave(120, 0.22, 2.4)

// ── Fixture tracks ────────────────────────────────────────────────────────────

const TRACKS: ArrangementTrack[] = [
  {
    id: 'guitar', name: 'Guitar', color: 'var(--chroma-blue)',
    type: 'audio', armed: false, muted: false, soloed: false,
    volumeDb: -6, pan: -0.1, inputId: 'in-1', plugins: [], chainEnabled: true,
    clips: [
      { clipId: 'g1', start: bar(1), length: bar(3) - bar(1), peaks: W_GUITAR, color: 'var(--chroma-blue)', label: 'Guitar A' },
      { clipId: 'g2', start: bar(5), length: bar(2) - bar(1), peaks: W_GUITAR, color: 'var(--chroma-blue)', label: 'Guitar B' },
    ],
  },
  {
    id: 'bass', name: 'Bass', color: 'var(--chroma-green)',
    type: 'audio', armed: false, muted: false, soloed: false,
    volumeDb: -8, pan: 0, inputId: 'in-2', plugins: [], chainEnabled: true,
    clips: [
      { clipId: 'b1', start: bar(1), length: bar(7) - bar(1), peaks: W_BASS, color: 'var(--chroma-green)', label: 'Bass' },
    ],
  },
  {
    id: 'drums', name: 'Drums', color: 'var(--chroma-orange)',
    type: 'audio', armed: false, muted: false, soloed: false,
    volumeDb: -4, pan: 0, inputId: 'in-3', plugins: [], chainEnabled: true,
    clips: [
      { clipId: 'd1', start: bar(1), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
      { clipId: 'd2', start: bar(3), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
      { clipId: 'd3', start: bar(5), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
      { clipId: 'd4', start: bar(7), length: bar(2) - bar(1), peaks: W_DRUMS, color: 'var(--chroma-orange)' },
    ],
  },
  {
    id: 'vocal', name: 'Lead Vocal', color: 'var(--chroma-red)',
    type: 'audio', armed: true, muted: false, soloed: false,
    volumeDb: -3, pan: 0.05, inputId: 'in-4', plugins: [], chainEnabled: true,
    meterLevel: 0.72,
    clips: [
      { clipId: 'v1', start: bar(2), length: bar(5) - bar(2), peaks: W_VOCAL, color: 'var(--chroma-red)', label: 'Verse 1' },
      { clipId: 'v2', start: bar(7), length: bar(2) - bar(1), peaks: W_VOCAL, color: 'var(--chroma-red)', label: 'Chorus' },
    ],
  },
  {
    id: 'keys', name: 'Keys', color: 'var(--chroma-purple)',
    type: 'instrument', armed: false, muted: true, soloed: false,
    volumeDb: -10, pan: 0.15, inputId: null, plugins: [], chainEnabled: true,
    clips: [
      { clipId: 'k1', start: bar(3), length: bar(3) - bar(1), peaks: W_KEYS, color: 'var(--chroma-purple)', label: 'Keys', muted: true },
    ],
  },
]

// ── Mixer fixture ─────────────────────────────────────────────────────────────

const MIXER_CHANNELS: MixerChannel[] = TRACKS.map(t => ({
  trackId:  t.id,
  name:     t.name,
  color:    t.color,
  kind:     'audio' as const,
  armed:    t.armed,
  muted:    t.muted,
  soloed:   t.soloed,
  volumeDb: t.volumeDb,
  pan:      t.pan,
}))

const MIXER_MASTER: MixerMaster = {
  muted: false, soloed: false, volumeDb: 0, pan: 0, meterL: 0.78, meterR: 0.72,
}

// ── Comments fixture ──────────────────────────────────────────────────────────

const COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: { id: 'user-a', name: 'Ana Lima', initials: 'AL' },
    time:   Date.now() - 3_600_000,
    text:   'The verse 1 vocal sits well. Maybe a tiny bit of reverb tail?',
    timelineAt: bar(2),
    replies: [
      {
        id: 'r1',
        author: { id: 'user-b', name: 'Ben Park', initials: 'BP' },
        time:   Date.now() - 1_800_000,
        text:   "Agreed, I'll add a short plate to the tail.",
      },
    ],
  },
  {
    id: 'c2',
    author: { id: 'user-b', name: 'Ben Park', initials: 'BP' },
    time:   Date.now() - 900_000,
    text:   'Drums feel tight — no notes from me.',
    resolved: true,
  },
]

// ── Versions fixture ──────────────────────────────────────────────────────────

const VERSIONS: VersionEntry[] = [
  { id: 'v3', name: 'Chorus idea v3', date: new Date(Date.now() - 3_600_000).toISOString(),   current: true },
  { id: 'v2', name: 'Chorus idea v2', date: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 'v1', name: 'Initial draft',  date: new Date(Date.now() - 172_800_000).toISOString() },
]

// ── Ideas fixture ─────────────────────────────────────────────────────────────

const IDEAS: Idea[] = [
  { id: 'i1', name: 'Bridge riff loop',    bpm: 120, source: 'Summer Sessions / Guitar', labels: ['guitar', 'loop'], peaks: wave(60, 0.15) },
  { id: 'i2', name: 'Bass ostinato',        bpm: 120, source: 'Summer Sessions / Bass',   labels: ['bass'],           peaks: wave(60, 0.08, 1.2) },
  { id: 'i3', name: 'Verse hook idea',      kind: 'lyric', text: 'When the lights go down' },
  { id: 'i4', name: 'Drum fill voice memo', kind: 'voice', durationSec: 4.2 },
]

// ── Shared noop callbacks ─────────────────────────────────────────────────────

type NoopProps = Omit<AppShellProps,
  | 'activeSection'
  | 'playing' | 'recording' | 'playheadSeconds' | 'getPlayheadSeconds'
  | 'bpm' | 'numerator' | 'denominator'
  | 'loopEnabled' | 'recordState' | 'recordMode'
  | 'selectionStart' | 'selectionEnd' | 'gridDivision' | 'rate'
  | 'tracks' | 'pxPerBeat' | 'division' | 'durationSeconds'
  | 'cursorSeconds' | 'selection' | 'focusedTrackId' | 'inputOptions'
  | 'chordItems' | 'lyricItems'
  | 'detailTrack' | 'detailClips' | 'detailPlugins' | 'detailChainEnabled' | 'detailPanelHeight'
  | 'mixerOpen' | 'mixerChannels' | 'mixerMaster'
  | 'comments' | 'versions' | 'versionsSelected' | 'ideas' | 'ideasAppSyncUrl'
  | 'disabled'
>

const NOOP: NoopProps = {
  onSelectSection:     () => {},
  onPlay:              () => {},
  onStop:              () => {},
  onGoToStart:         () => {},
  onGoToEnd:           () => {},
  onToggleRecord:      () => {},
  onSelectRecordMode:  () => {},
  onToggleLoop:        () => {},
  onSetTempo:          () => {},
  onSetTimeSignature:  () => {},
  onToggleMixer:       () => {},
  onSelectTrack:       () => {},
  onSeek:              () => {},
  onSelectRange:       () => {},
  onClearSelection:    () => {},
  onRenameTrack:       () => {},
  onArmTrack:          () => {},
  onMuteTrack:         () => {},
  onSoloTrack:         () => {},
  onVolumeTrack:       () => {},
  onPanTrack:          () => {},
  onSelectInput:       () => {},
  onToggleChain:       () => {},
  onTogglePlugin:      () => {},
  onReorderPlugin:     () => {},
  onRemovePlugin:      () => {},
  onAddPlugin:         () => {},
  onOpenPlugin:        () => {},
  onDetailPanelResize: () => {},
  onDetailPanelClose:  () => {},
  onDetailToggleChain:   () => {},
  onDetailTogglePlugin:  () => {},
  onDetailReorderPlugin: () => {},
  onDetailRemovePlugin:  () => {},
  onDetailAddPlugin:     () => {},
  onDetailOpenPlugin:    () => {},
  onMixerMute:         () => {},
  onMixerSolo:         () => {},
  onMixerVolume:       () => {},
  onMixerPan:          () => {},
  onMasterVolume:      () => {},
  onMasterPan:         () => {},
  onPostComment:       () => {},
  onReplyComment:      () => {},
  onResolveComment:    () => {},
  onVersionSelect:     () => {},
  onVersionCompare:    () => {},
  onVersionRename:     () => {},
  onVersionRestore:    () => {},
  onIdeaPlay:          () => {},
  onIdeaDragToProject: () => {},
  onIdeaLabel:         () => {},
  onIdeaDelete:        () => {},
}

// ── Shared static props ───────────────────────────────────────────────────────

const STATIC = {
  playing:            false,
  recording:          false,
  playheadSeconds:    0,
  getPlayheadSeconds: (): number => 0,
  bpm:                BPM,
  numerator:          4,
  denominator:        4,
  loopEnabled:        false,
  recordState:        'idle' as RecordModeState,
  recordMode:         'normal' as RecordModeValue,
  selectionStart:     0,
  selectionEnd:       0,
  gridDivision:       '1/4',
  rate:               1,
  pxPerBeat:          PPB,
  division:           '1/4' as const,
  durationSeconds:    DURATION,
  cursorSeconds:      0,
  selection:          null,
  focusedTrackId:     null,
  inputOptions:       [],
  chordItems:         [],
  lyricItems:         [],
  detailClips:        [],
  detailPlugins:      [],
  detailChainEnabled: false,
  detailPanelHeight:  240,
  mixerMaster:        MIXER_MASTER,
  versionsSelected:   [] as string[],
  ideasAppSyncUrl:    'https://jackdaw.app/mobile',
}

// ── Shell frame (simulates the app window boundary) ───────────────────────────

function ShellFrame({
  height = 540,
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
      position:     'relative',
    } as CSSProperties}>
      {children}
    </div>
  )
}

// ── Convenience wrapper for static states ─────────────────────────────────────

function StaticShell(props: Partial<AppShellProps> & Pick<AppShellProps, 'activeSection'>) {
  return (
    <AppShell
      {...NOOP}
      {...STATIC}
      tracks={TRACKS}
      mixerChannels={MIXER_CHANNELS}
      comments={COMMENTS}
      versions={VERSIONS}
      ideas={IDEAS}
      mixerOpen={false}
      {...props}
    />
  )
}

// ── Guitar detail track (shared across states) ────────────────────────────────

const GUITAR = TRACKS[0]

const GUITAR_DETAIL = {
  id:       GUITAR.id,
  name:     GUITAR.name,
  color:    GUITAR.color,
  kind:     'audio' as const,
  armed:    GUITAR.armed,
  muted:    GUITAR.muted,
  soloed:   GUITAR.soloed,
  volumeDb: GUITAR.volumeDb,
  pan:      GUITAR.pan,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* 1. Default — arrangement view */}
      <State label="arrange — default view">
        <ShellFrame>
          <StaticShell activeSection="arrange" />
        </ShellFrame>
      </State>

      {/* 2. Track focused — Guitar detail panel */}
      <State label="arrange — Guitar track focused (detail panel)">
        <ShellFrame>
          <StaticShell
            activeSection="arrange"
            focusedTrackId="guitar"
            detailTrack={GUITAR_DETAIL}
            detailClips={GUITAR.clips}
          />
        </ShellFrame>
      </State>

      {/* 3. Mixer overlay open */}
      <State label="arrange — mixer overlay open">
        <ShellFrame>
          <StaticShell
            activeSection="arrange"
            mixerOpen={true}
            mixerChannels={MIXER_CHANNELS}
          />
        </ShellFrame>
      </State>

      {/* 4. Comments panel */}
      <State label="comments panel">
        <ShellFrame>
          <StaticShell activeSection="comments" comments={COMMENTS} />
        </ShellFrame>
      </State>

      {/* 5. Versions panel */}
      <State label="versions panel">
        <ShellFrame>
          <StaticShell activeSection="versions" versions={VERSIONS} versionsSelected={[]} />
        </ShellFrame>
      </State>

      {/* 6. Ideas panel */}
      <State label="ideas panel">
        <ShellFrame>
          <StaticShell activeSection="ideas" ideas={IDEAS} />
        </ShellFrame>
      </State>

      {/* 7. Empty project */}
      <State label="empty project — no tracks">
        <ShellFrame>
          <StaticShell activeSection="arrange" tracks={[]} mixerChannels={[]} />
        </ShellFrame>
      </State>
    </StatesGrid>
  )
}

// ── Interactive playground ────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [section,       setSection]       = useState<NavSection>('arrange')
  const [playing,       setPlaying]       = useState(false)
  const [mixerOpen,     setMixerOpen]     = useState(false)
  const [focusedId,     setFocusedId]     = useState<string | null>(null)
  const [detailHeight,  setDetailHeight]  = useState(240)
  const [showAllMeters, setShowAllMeters] = useState(false)

  const playStartRef  = useRef(performance.now())
  const playSecsRef   = useRef(0)
  const [playheadSecs, setPlayheadSecs] = useState(0)

  const getPlayheadSeconds = useCallback((): number => {
    if (!playing) return playheadSecs
    return playSecsRef.current + (performance.now() - playStartRef.current) / 1000
  }, [playing, playheadSecs])

  function handlePlayToggle(next: boolean) {
    if (next) {
      playStartRef.current = performance.now()
      playSecsRef.current  = playheadSecs
      setPlaying(true)
    } else {
      const s = Math.min(
        playSecsRef.current + (performance.now() - playStartRef.current) / 1000,
        DURATION,
      )
      setPlayheadSecs(s)
      setPlaying(false)
    }
  }

  const focusedTrack = focusedId !== null
    ? TRACKS.find(t => t.id === focusedId)
    : undefined

  const detailTrack = focusedTrack
    ? {
        id:       focusedTrack.id,
        name:     focusedTrack.name,
        color:    focusedTrack.color,
        kind:     'audio' as const,
        armed:    focusedTrack.armed,
        muted:    focusedTrack.muted,
        soloed:   focusedTrack.soloed,
        volumeDb: focusedTrack.volumeDb,
        pan:      focusedTrack.pan,
      }
    : undefined

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
          checked={mixerOpen}
          onChange={setMixerOpen}
          label="Mixer overlay"
          size="sm"
        />
        <Toggle
          checked={showAllMeters}
          onChange={setShowAllMeters}
          label="Show all meters"
          size="sm"
        />
        <Toggle
          checked={focusedId === 'guitar'}
          onChange={v => setFocusedId(v ? 'guitar' : null)}
          label="Focus Guitar"
          size="sm"
        />
        <Toggle
          checked={focusedId === 'vocal'}
          onChange={v => setFocusedId(v ? 'vocal' : null)}
          label="Focus Vocal"
          size="sm"
        />
      </Playground>

      <div style={{ height: 600, marginTop: 'var(--space-4)' }}>
        <AppShell
          {...NOOP}
          {...STATIC}
          activeSection={section}
          onSelectSection={setSection}
          playing={playing}
          recording={false}
          playheadSeconds={playheadSecs}
          getPlayheadSeconds={getPlayheadSeconds}
          tracks={TRACKS}
          focusedTrackId={focusedId}
          cursorSeconds={playheadSecs}
          showAllMeters={showAllMeters}
          mixerOpen={mixerOpen}
          mixerChannels={MIXER_CHANNELS}
          detailTrack={detailTrack}
          detailClips={focusedTrack?.clips ?? []}
          detailPanelHeight={detailHeight}
          comments={COMMENTS}
          versions={VERSIONS}
          ideas={IDEAS}
          onPlay={() => handlePlayToggle(true)}
          onStop={() => handlePlayToggle(false)}
          onToggleMixer={setMixerOpen}
          onSelectTrack={id => setFocusedId(id)}
          onDetailPanelClose={() => setFocusedId(null)}
          onDetailPanelResize={setDetailHeight}
        />
      </div>
    </>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function AppShellDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
