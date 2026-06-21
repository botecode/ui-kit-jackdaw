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
        <IdeasLibrary ideas={[]} {...NOOP} />
      </div>
    </State>
  )
}

function FewIdeasCard() {
  return (
    <State label="default — a few ideas">
      <div style={PANEL}>
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} />
      </div>
    </State>
  )
}

function ManyIdeasCard() {
  return (
    <State label="many ideas — scroll">
      <div style={PANEL}>
        <IdeasLibrary ideas={MANY_IDEAS} {...NOOP} />
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
          onDelete={id => setIdeas(prev => prev.filter(i => i.id !== id))}
        />
      </div>
    </State>
  )
}

function PreviewingCard() {
  const [playingId, setPlayingId] = useState<string | null>('idea-2')
  // Show "previewing" by rendering with a playing indicator in the gallery;
  // actual play state is managed by IdeasLibrary internally on user interaction.
  // Here we just note which idea is "active" via the story label.
  return (
    <State label="hovered / previewing — press Play on a card">
      <div style={PANEL}>
        <IdeasLibrary
          ideas={FEW_IDEAS}
          {...NOOP}
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
        <IdeasLibrary ideas={FEW_IDEAS} {...NOOP} />
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

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <EmptyCard />
      <FewIdeasCard />
      <ManyIdeasCard />
      <SearchingCard />
      <PreviewingCard />
      <DraggingCard />
      <EmptySearchCard />
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [useMany,    setUseMany]    = useState(false)
  const [ideas,      setIdeas]      = useState(FEW_IDEAS)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const allIdeas = useMany ? MANY_IDEAS : FEW_IDEAS

  // Keep deletions in local state, reset when toggling many/few
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const displayedIdeas = allIdeas.filter(i => !deleted.has(i.id))

  function handleUseManyChange(next: boolean) {
    setUseMany(next)
    setDeleted(new Set())
  }

  void ideas // suppresses unused warning — ideas is managed via allIdeas
  void setIdeas

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Library ────────────────────────────────────────────────────── */}
        <div style={{ width: 400, height: 480, display: 'flex', flexDirection: 'column' }}>
          <IdeasLibrary
            ideas={displayedIdeas}
            onPlay={id => {
              const idea = allIdeas.find(i => i.id === id)
              setLastAction(`▶ Play: ${idea?.name ?? id}`)
            }}
            onDragToProject={id => {
              const idea = allIdeas.find(i => i.id === id)
              setLastAction(`↖ Drag: ${idea?.name ?? id}`)
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
            label="many ideas (8)"
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
