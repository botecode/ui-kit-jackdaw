// src/components/IdeasLibrary/IdeasLibrary.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { IdeasLibrary, ideaDurationSec } from './IdeasLibrary'
import type { Idea } from './IdeasLibrary'

export const meta: DemoMeta = {
  name: 'IdeasLibrary',
  group: 'Composites',
  route: '/ideas-library',
  order: 55,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PK_A = [0.2,0.5,0.8,0.6,0.9,0.4,0.7,0.3,0.6,0.8,0.5,0.4,0.7,0.9,0.6,0.3,0.8,0.5,0.4,0.7]
const PK_B = [0.8,0.6,0.4,0.9,0.3,0.7,0.5,0.8,0.4,0.6,0.9,0.5,0.3,0.7,0.8,0.4,0.6,0.9,0.5,0.3]
const PK_C = [0.1,0.3,0.6,0.9,0.7,0.4,0.2,0.5,0.8,0.6,0.3,0.9,0.5,0.2,0.7,0.4,0.8,0.6,0.3,0.5]
const PK_D = [0.5,0.9,0.3,0.7,0.8,0.2,0.6,0.4,0.9,0.5,0.7,0.3,0.8,0.6,0.4,0.9,0.3,0.7,0.5,0.8]
const PK_E = [0.4,0.7,0.9,0.5,0.3,0.8,0.6,0.4,0.7,0.9,0.5,0.3,0.8,0.6,0.4,0.7,0.9,0.5,0.3,0.8]
const PK_F = [0.6,0.2,0.8,0.4,0.7,0.9,0.3,0.6,0.5,0.8,0.4,0.7,0.9,0.3,0.6,0.2,0.8,0.4,0.7,0.9]

const FEW_IDEAS: Idea[] = [
  { id: 'idea-1', name: 'Dusty Rhodes Intro', bpm: 72,  source: 'Desert Hymns / Guitar Stem', labels: ['guitar', 'ambient'], scale: 'D minor', peaks: PK_A, durationSec: 45 },
  { id: 'idea-2', name: 'Pulse Engine',        bpm: 120, source: 'Night Shift / Synth Bus',    labels: ['synth', 'pad'],      scale: 'F major', peaks: PK_B, durationSec: 92 },
  { id: 'idea-3', name: 'Breakbeat Loop',      bpm: 140, source: 'Machine Age / Drum Bus',     labels: ['drums', 'loop'],     scale: 'G minor', peaks: PK_C, durationSec: 12 },
]

const MANY_IDEAS: Idea[] = [
  ...FEW_IDEAS,
  { id: 'idea-4', name: 'Twilight Pad',   bpm: 96,  source: 'Sunday Drive / Keys',    labels: ['synth', 'ambient'], scale: 'C major', peaks: PK_D, durationSec: 64 },
  { id: 'idea-5', name: 'Gutter Bass',    bpm: 128, source: 'Machine Age / Bass',     labels: ['bass', 'loop'],     scale: 'E minor', peaks: PK_E, durationSec: 30 },
  { id: 'idea-6', name: 'Paper Percussion', bpm: 105, source: 'Desert Hymns / Perc',  labels: ['drums', 'guitar'],  scale: 'A minor', peaks: PK_F, durationSec: 18 },
]

const GROUP_IDEA: Idea = {
  id: 'group-1', name: 'Verse Stack', bpm: 110, source: 'Night Shift / Stems', labels: ['stems', 'verse'], scale: 'A minor',
  clips: [
    { id: 'g1-guitar', name: 'Guitar', peaks: PK_A, durationSec: 12 },
    { id: 'g1-bass',   name: 'Bass',   peaks: PK_B, durationSec: 12 },
    { id: 'g1-keys',   name: 'Keys',   peaks: PK_C, durationSec: 12 },
    { id: 'g1-perc',   name: 'Perc',   peaks: PK_D, durationSec: 12 },
  ],
}

const GROUP_IDEA_2: Idea = {
  id: 'group-2', name: 'Chorus Layers', bpm: 128, source: 'Sunday Drive / Stems', labels: ['stems', 'chorus'], scale: 'G major',
  clips: [
    { id: 'g2-lead', name: 'Lead Synth', peaks: PK_E, durationSec: 8 },
    { id: 'g2-pad',  name: 'Pad',        peaks: PK_F, durationSec: 10 },
  ],
}

const GROUP_IDEAS: Idea[] = [GROUP_IDEA, GROUP_IDEA_2]

const VOICE_IDEAS: Idea[] = [
  { id: 'v-1', name: 'Morning Hook', kind: 'voice', origin: 'app', durationSec: 37, peaks: PK_A },
  { id: 'v-2', name: 'Bridge Idea',  kind: 'voice', origin: 'app', durationSec: 92, peaks: PK_B },
]

const LYRIC_IDEAS: Idea[] = [
  { id: 'l-1', name: 'Verse One Draft', kind: 'lyric', origin: 'app',
    text: 'The light falls through the window\nSoft and warm and slow\nLike everything I remember\nEverything I know' },
  { id: 'l-2', name: 'Chorus Fragment', kind: 'lyric', origin: 'app',
    text: 'We were burning like the sun\nBefore the world went cold\nNow we carry what was done\nIn stories never told' },
]

// Rich mixed set for clustering + the live playground: clip / stack / voice / lyric all present.
const MIXED_IDEAS: Idea[] = [...FEW_IDEAS, ...GROUP_IDEAS, ...VOICE_IDEAS, ...LYRIC_IDEAS]

const APP_SYNC_URL = 'https://jackdaw.app/get'

const NOOP = {
  onPlay:          () => {},
  onDragToProject: () => {},
  onLabel:         () => {},
  onDelete:        () => {},
}

const PANEL: React.CSSProperties = {
  width: 420,
  height: 460,
  display: 'flex',
  flexDirection: 'column',
}

// ─── A controlled host — owns audio + queue, drives position via rAF ───────────
//
// The kit is presentational; a real host would own <audio>. This demo host fakes the transport with
// a rAF clock so the states light and auto-advance for real: onPlay toggles/loads, onNext/onPrev skip
// the queue, onEnded advances, onSeek scrubs. It's exactly the wiring the app supplies (out of scope
// for the kit itself), shown here so the gallery plays like the instrument it is.
function useIdeasHost(queue: Idea[]) {
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [position,     setPosition]     = useState(0)
  const rafRef  = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  const indexOf = (id: string | null) => (id ? queue.findIndex(i => i.id === id) : -1)

  function onPlay(id: string) {
    if (id === nowPlayingId) { setIsPlaying(p => !p); return }
    setNowPlayingId(id); setPosition(0); setIsPlaying(true)
  }
  function goto(delta: number) {
    const i = indexOf(nowPlayingId)
    if (i < 0) return
    const next = i + delta
    if (next < 0 || next >= queue.length) { setIsPlaying(false); return }
    setNowPlayingId(queue[next].id); setPosition(0); setIsPlaying(true)
  }

  useEffect(() => {
    if (!isPlaying || nowPlayingId == null) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastRef.current = null
      return
    }
    const idea = queue.find(i => i.id === nowPlayingId)
    const dur  = idea ? ideaDurationSec(idea) : undefined
    function tick(t: number) {
      if (lastRef.current == null) lastRef.current = t
      const dt = (t - lastRef.current) / 1000
      lastRef.current = t
      setPosition(p => (dur != null ? Math.min(dur, p + dt) : p + dt))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastRef.current = null
    }
  }, [isPlaying, nowPlayingId, queue])

  return {
    nowPlayingId,
    isPlaying,
    positionSeconds: position,
    onPlay,
    onNext: () => goto(1),
    onPrev: () => goto(-1),
    onEnded: () => goto(1),
    onSeek: (sec: number) => setPosition(sec),
  }
}

// ─── State cards ──────────────────────────────────────────────────────────────

function EmptyCard() {
  return (
    <State label="empty — no ideas yet">
      <div style={PANEL}><IdeasLibrary ideas={[]} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

function DefaultCard() {
  return (
    <State label="default — the setlist">
      <div style={PANEL}><IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

function NowPlayingCard() {
  return (
    <State label="now playing — top player + lit row">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          nowPlayingId="idea-2"
          isPlaying
          positionSeconds={38}
          onNext={() => {}}
          onPrev={() => {}}
          onSeek={() => {}}
        />
      </div>
    </State>
  )
}

function PausedCard() {
  return (
    <State label="paused — row lit, transport idle">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          nowPlayingId="idea-2"
          isPlaying={false}
          positionSeconds={38}
          onNext={() => {}}
          onPrev={() => {}}
          onSeek={() => {}}
        />
      </div>
    </State>
  )
}

function ManyIdeasCard() {
  return (
    <State label="many ideas — scroll the setlist">
      <div style={PANEL}><IdeasLibrary ideas={MANY_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

function GroupedHint() {
  return (
    <State label="group by tag — toggle the switch to fold into folders">
      <div style={PANEL}><IdeasLibrary ideas={MANY_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
      <span style={hintStyle}>Flip "Group by tag" — rows cluster under each label with a "Play tag" stud</span>
    </State>
  )
}

function MultiClipCard() {
  return (
    <State label="multi-clip — stack row + per-clip sub-rows">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={GROUP_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onPlayClip={(ideaId, clipId) => console.info(`[Ideas] play clip ${clipId} of ${ideaId}`)}
          onDragClipToProject={(ideaId, clipId) => console.info(`[Ideas] drag clip ${clipId} of ${ideaId}`)}
        />
      </div>
    </State>
  )
}

function VoiceCard() {
  return (
    <State label="voice — recordings as playable rows">
      <div style={PANEL}><IdeasLibrary ideas={VOICE_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

function LyricsCard() {
  return (
    <State label="lyrics — text rows, no transport">
      <div style={PANEL}><IdeasLibrary ideas={LYRIC_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

function SearchHint() {
  return (
    <State label="no matches — filtered empty">
      <div style={{ ...PANEL, height: 300 }}><IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
      <span style={hintStyle}>Try "xyznotfound" in search</span>
    </State>
  )
}

function VoiceQrHint() {
  return (
    <State label="voice — empty QR sync state">
      <div style={PANEL}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} onGetApp={() => console.info('[Ideas] Get the app')} />
      </div>
      <span style={hintStyle}>Select "Voice recordings" to see the QR</span>
    </State>
  )
}

function LyricsQrHint() {
  return (
    <State label="lyrics — empty QR sync state">
      <div style={PANEL}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} onGetApp={() => console.info('[Ideas] Get the app')} />
      </div>
      <span style={hintStyle}>Select "Lyrics" to see the QR</span>
    </State>
  )
}

function WideCard() {
  return (
    <State label="wide container — the setlist breathes">
      <div style={{ ...PANEL, width: 660 }}><IdeasLibrary ideas={MIXED_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} /></div>
    </State>
  )
}

const hintStyle: React.CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-dim)',
}

function StatesDemo() {
  return (
    <StatesGrid>
      <EmptyCard />
      <DefaultCard />
      <NowPlayingCard />
      <PausedCard />
      <ManyIdeasCard />
      <GroupedHint />
      <MultiClipCard />
      <VoiceCard />
      <LyricsCard />
      <SearchHint />
      <VoiceQrHint />
      <LyricsQrHint />
      <WideCard />
    </StatesGrid>
  )
}

// ─── Playground — the live, auto-advancing setlist ─────────────────────────────

function PlaygroundDemo() {
  const [useMany, setUseMany] = useState(true)
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const [lastAction, setLastAction] = useState<string | null>(null)

  const source = useMany ? MIXED_IDEAS : FEW_IDEAS
  const ideas  = source.filter(i => !deleted.has(i.id))
  const host   = useIdeasHost(ideas)

  function handleUseMany(next: boolean) {
    setUseMany(next)
    setDeleted(new Set())
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 460, height: 520, display: 'flex', flexDirection: 'column' }}>
          <IdeasLibrary
            ideas={ideas}
            appSyncUrl={APP_SYNC_URL}
            nowPlayingId={host.nowPlayingId}
            isPlaying={host.isPlaying}
            positionSeconds={host.positionSeconds}
            onPlay={id => {
              host.onPlay(id)
              setLastAction(`▶ Play: ${source.find(i => i.id === id)?.name ?? id}`)
            }}
            onNext={() => { host.onNext(); setLastAction('⏭ Next') }}
            onPrev={() => { host.onPrev(); setLastAction('⏮ Prev') }}
            onSeek={host.onSeek}
            onEnded={host.onEnded}
            onGetApp={() => setLastAction('📱 Get the app')}
            onDragToProject={id => setLastAction(`↖ Drag: ${source.find(i => i.id === id)?.name ?? id}`)}
            onPlayClip={(ideaId, clipId) => setLastAction(`▶ Clip: ${clipId} (${ideaId})`)}
            onDragClipToProject={(ideaId, clipId) => setLastAction(`↖ Clip: ${clipId} (${ideaId})`)}
            onLabel={(id, labels) => setLastAction(`🏷 ${id}: ${labels.join(', ')}`)}
            onDelete={id => {
              setLastAction(`✕ Delete: ${source.find(i => i.id === id)?.name ?? id}`)
              setDeleted(prev => new Set([...prev, id]))
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={useMany} onChange={handleUseMany} size="sm" label="mixed ideas (clips + stacks + voice + lyrics)" />

          {deleted.size > 0 && (
            <button
              onClick={() => setDeleted(new Set())}
              style={{
                appearance: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                padding: '4px var(--space-2)',
                cursor: 'pointer',
              }}
            >
              Restore {deleted.size} deleted
            </button>
          )}

          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              background: 'var(--stage)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
              maxWidth: 200,
              wordBreak: 'break-all',
            }}>
              {lastAction}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ────────────────────────────────────────────────────────────

export default function IdeasLibraryDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
