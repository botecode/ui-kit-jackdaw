// src/components/IdeasLibrary/IdeasLibrary.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { IdeasLibrary } from './IdeasLibrary'
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
  {
    id: 'idea-1',
    name: 'Dusty Rhodes Intro',
    bpm: 72,
    source: 'Desert Hymns / Guitar Stem',
    labels: ['guitar', 'ambient'],
    scale: 'D minor',
    peaks: PK_A,
  },
  {
    id: 'idea-2',
    name: 'Pulse Engine',
    bpm: 120,
    source: 'Night Shift / Synth Bus',
    labels: ['synth', 'pad'],
    scale: 'F major',
    peaks: PK_B,
  },
  {
    id: 'idea-3',
    name: 'Breakbeat Loop',
    bpm: 140,
    source: 'Machine Age / Drum Bus',
    labels: ['drums', 'loop'],
    scale: 'G minor',
    peaks: PK_C,
  },
]

const MANY_IDEAS: Idea[] = [
  ...FEW_IDEAS,
  {
    id: 'idea-4',
    name: 'Warm Pad Swell',
    bpm: 85,
    source: 'Cassette Bloom / Keys',
    labels: ['pad', 'ambient'],
    scale: 'Bb major',
    peaks: PK_D,
  },
  {
    id: 'idea-5',
    name: 'Acid Hook',
    bpm: 130,
    source: 'Warehouse 9 / Bass',
    labels: ['bass', 'acid'],
    scale: 'A minor',
    peaks: PK_E,
  },
  {
    id: 'idea-6',
    name: 'Rhodes Melody',
    bpm: 95,
    source: 'Soft Light / Piano',
    labels: ['piano', 'melody'],
    scale: 'Eb major',
    peaks: PK_F,
  },
  {
    id: 'idea-7',
    name: 'Tape Crunch Intro',
    bpm: 76,
    source: 'Golden Dust / Master',
    labels: ['guitar', 'lo-fi'],
    scale: 'C major',
    peaks: PK_A,
  },
  {
    id: 'idea-8',
    name: 'Sidechain Bounce',
    bpm: 128,
    source: 'Sunday Drive / Kick',
    labels: ['synth', 'loop'],
    scale: 'G major',
    peaks: PK_B,
  },
]

// A multi-clip idea — an ordered stem stack saved together. Renders as a group card.
const GROUP_IDEA: Idea = {
  id: 'group-1',
  name: 'Verse Stack',
  bpm: 110,
  source: 'Night Shift / Stems',
  labels: ['stems', 'verse'],
  scale: 'A minor',
  clips: [
    { id: 'g1-guitar', name: 'Guitar',  peaks: PK_A, durationSec: 12 },
    { id: 'g1-bass',   name: 'Bass',    peaks: PK_B, durationSec: 12 },
    { id: 'g1-keys',   name: 'Keys',    peaks: PK_C, durationSec: 12 },
    { id: 'g1-perc',   name: 'Perc',    peaks: PK_D, durationSec: 12 },
  ],
}

const GROUP_IDEA_2: Idea = {
  id: 'group-2',
  name: 'Chorus Layers',
  bpm: 128,
  source: 'Sunday Drive / Stems',
  labels: ['stems', 'chorus'],
  scale: 'G major',
  clips: [
    { id: 'g2-lead', name: 'Lead Synth', peaks: PK_E, durationSec: 8 },
    { id: 'g2-pad',  name: 'Pad',        peaks: PK_F, durationSec: 8 },
  ],
}

const GROUP_IDEAS: Idea[] = [GROUP_IDEA, GROUP_IDEA_2]

const VOICE_IDEAS: Idea[] = [
  { id: 'v-1', name: 'Morning Hook', kind: 'voice', origin: 'app', durationSec: 37, peaks: PK_A },
  { id: 'v-2', name: 'Bridge Idea', kind: 'voice', origin: 'app', durationSec: 92, peaks: PK_B },
]

const LYRIC_IDEAS: Idea[] = [
  {
    id: 'l-1',
    name: 'Verse One Draft',
    kind: 'lyric',
    origin: 'app',
    text: 'The light falls through the window\nSoft and warm and slow\nLike everything I remember\nEverything I know',
  },
  {
    id: 'l-2',
    name: 'Chorus Fragment',
    kind: 'lyric',
    origin: 'app',
    text: 'We were burning like the sun\nBefore the world went cold\nNow we carry what was done\nIn stories never told',
  },
]

const LONG_LYRIC_IDEA: Idea = {
  id: 'l-long',
  name: 'Long Verse',
  kind: 'lyric',
  origin: 'app',
  text: 'Line one of the verse\nLine two continues\nLine three goes longer still\nLine four overflows the card and gets clamped here at the end',
}

const MIXED_IDEAS: Idea[] = [
  ...FEW_IDEAS,
  ...GROUP_IDEAS,
  ...VOICE_IDEAS,
  ...LYRIC_IDEAS,
]

const APP_SYNC_URL = 'https://jackdaw.app/get'

const NOOP = {
  onPlay:          () => {},
  onDragToProject: () => {},
  onLabel:         () => {},
  onDelete:        () => {},
}

// ─── Panel size constraint ────────────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  width: 380,
  height: 420,
  display: 'flex',
  flexDirection: 'column',
}

// ─── State cards ──────────────────────────────────────────────────────────────

function EmptyCard() {
  return (
    <State label="empty — no ideas yet">
      <div style={PANEL}>
        <IdeasLibrary ideas={[]} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function FewIdeasCard() {
  return (
    <State label="default — a few ideas">
      <div style={PANEL}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function ManyIdeasCard() {
  return (
    <State label="many ideas — scroll">
      <div style={PANEL}>
        <IdeasLibrary ideas={MANY_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function ClipsOnlyCard() {
  return (
    <State label="clips only — select Clips in the kind bar">
      <div style={PANEL}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function SearchingCard() {
  const [ideas, setIdeas] = useState(FEW_IDEAS)
  return (
    <State label="searching / filtered">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={ideas}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onDelete={id => setIdeas(prev => prev.filter(i => i.id !== id))}
        />
      </div>
    </State>
  )
}

function PreviewingCard() {
  const [playingId, setPlayingId] = useState<string | null>('idea-2')
  return (
    <State label="hovered / previewing — press Play on a card">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onPlay={id => setPlayingId(id)}
        />
      </div>
      {playingId && (
        <span style={{
          marginTop: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--led-green-core)',
        }}>
          ▶ {FEW_IDEAS.find(i => i.id === playingId)?.name}
        </span>
      )}
    </State>
  )
}

function DraggingCard() {
  return (
    <State label="dragging — grab a handle">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onDragToProject={id => {
            const idea = FEW_IDEAS.find(i => i.id === id)
            if (idea) console.info(`[Ideas] drag to project: ${idea.name}`)
          }}
        />
      </div>
    </State>
  )
}

function EmptySearchCard() {
  return (
    <State label="no matches — filtered empty">
      <div style={{ ...PANEL, height: 300 }}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
      <span style={{
        marginTop: 4,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-dim)',
      }}>
        Try "xyznotfound" in search
      </span>
    </State>
  )
}

function VoiceWithItemsCard() {
  return (
    <State label="voice — with recordings">
      <div style={PANEL}>
        <IdeasLibrary ideas={VOICE_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function VoiceEmptyQrCard() {
  return (
    <State label="voice — empty QR state">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onGetApp={() => console.info('[Ideas] Get the app clicked')}
        />
      </div>
      <span style={{
        marginTop: 4,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-dim)',
      }}>
        Select "Voice recordings" to see QR
      </span>
    </State>
  )
}

function LyricsWithItemsCard() {
  return (
    <State label="lyrics — with items">
      <div style={PANEL}>
        <IdeasLibrary ideas={LYRIC_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function LyricsEmptyQrCard() {
  return (
    <State label="lyrics — empty QR state">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onGetApp={() => console.info('[Ideas] Get the app clicked')}
        />
      </div>
      <span style={{
        marginTop: 4,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-dim)',
      }}>
        Select "Lyrics" to see QR
      </span>
    </State>
  )
}

function LongLyricCard() {
  return (
    <State label="lyric — long text clamped">
      <div style={PANEL}>
        <IdeasLibrary ideas={[LONG_LYRIC_IDEA]} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

function MultiClipCard() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <State label="multi-clip — group card (Play all + per-clip chips)">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={GROUP_IDEAS}
          {...NOOP}
          appSyncUrl={APP_SYNC_URL}
          onPlayClip={(ideaId, clipId) => setLast(`▶ clip ${clipId} of ${ideaId}`)}
          onDragClipToProject={(ideaId, clipId) => setLast(`↖ drag clip ${clipId} of ${ideaId}`)}
        />
      </div>
      {last && (
        <span style={{
          marginTop: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--led-green-core)',
        }}>
          {last}
        </span>
      )}
    </State>
  )
}

function MixedFromAppCard() {
  return (
    <State label="mixed — all kinds with app tags">
      <div style={{ ...PANEL, height: 520 }}>
        <IdeasLibrary ideas={MIXED_IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL} />
      </div>
    </State>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <EmptyCard />
      <FewIdeasCard />
      <ClipsOnlyCard />
      <ManyIdeasCard />
      <SearchingCard />
      <PreviewingCard />
      <DraggingCard />
      <EmptySearchCard />
      <VoiceWithItemsCard />
      <VoiceEmptyQrCard />
      <LyricsWithItemsCard />
      <LyricsEmptyQrCard />
      <LongLyricCard />
      <MultiClipCard />
      <MixedFromAppCard />
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [useMany,    setUseMany]    = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const allIdeas = useMany ? MIXED_IDEAS : FEW_IDEAS

  // Keep deletions in local state, reset when toggling many/few
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const displayedIdeas = allIdeas.filter(i => !deleted.has(i.id))

  function handleUseManyChange(next: boolean) {
    setUseMany(next)
    setDeleted(new Set())
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Library ────────────────────────────────────────────────────── */}
        <div style={{ width: 400, height: 480, display: 'flex', flexDirection: 'column' }}>
          <IdeasLibrary
            ideas={displayedIdeas}
            appSyncUrl={APP_SYNC_URL}
            onGetApp={() => setLastAction('📱 Get the app clicked')}
            onPlay={id => {
              const idea = allIdeas.find(i => i.id === id)
              setLastAction(`▶ Play: ${idea?.name ?? id}`)
            }}
            onDragToProject={id => {
              const idea = allIdeas.find(i => i.id === id)
              setLastAction(`↖ Drag: ${idea?.name ?? id}`)
            }}
            onPlayClip={(ideaId, clipId) => {
              const idea = allIdeas.find(i => i.id === ideaId)
              const clip = idea?.clips?.find(c => c.id === clipId)
              setLastAction(`▶ Clip: ${clip?.name ?? clipId} (${idea?.name ?? ideaId})`)
            }}
            onDragClipToProject={(ideaId, clipId) => {
              const idea = allIdeas.find(i => i.id === ideaId)
              const clip = idea?.clips?.find(c => c.id === clipId)
              setLastAction(`↖ Clip: ${clip?.name ?? clipId} (${idea?.name ?? ideaId})`)
            }}
            onLabel={(id, labels) => {
              setLastAction(`🏷 Label ${id}: ${labels.join(', ')}`)
            }}
            onDelete={id => {
              const idea = allIdeas.find(i => i.id === id)
              setLastAction(`✕ Delete: ${idea?.name ?? id}`)
              setDeleted(prev => new Set([...prev, id]))
            }}
          />
        </div>

        {/* ── Controls — dogfood Toggle ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={useMany}
            onChange={handleUseManyChange}
            size="sm"
            label="mixed ideas (clips + groups + voice + lyrics)"
          />

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
