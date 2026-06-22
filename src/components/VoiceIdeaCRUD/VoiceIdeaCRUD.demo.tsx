// src/components/VoiceIdeaCRUD/VoiceIdeaCRUD.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProductFrame } from '../ProductFrame'
import { VoiceIdeaList, VoiceIdeaRow } from './VoiceIdeaCRUD'
import type { VoiceIdea } from './VoiceIdeaCRUD'

export const meta: DemoMeta = {
  name: 'VoiceIdeaCRUD',
  group: 'Composites',
  route: '/voice-idea-crud',
  order: 112,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const IDEAS: VoiceIdea[] = [
  { id: 'v-1', title: 'Morning Hook',        durationSec: 37,  audioUri: 'jackdaw://nest/v-1.m4a', synced: true,  kind: 'idea' },
  { id: 'v-2', title: 'Bridge Idea',          durationSec: 92,  audioUri: 'jackdaw://nest/v-2.m4a', synced: false, kind: 'idea' },
  { id: 'v-3', title: 'Hum in the car',       durationSec: 19,  audioUri: 'jackdaw://nest/v-3.m4a', synced: true,  kind: 'idea' },
  { id: 'm-1', title: 'Desert Hymns — Master', durationSec: 218, audioUri: 'jackdaw://nest/m-1.wav', synced: true,  kind: 'master' },
  { id: 'm-2', title: 'Night Shift — Master',  durationSec: 184, audioUri: 'jackdaw://nest/m-2.wav', synced: false, kind: 'master' },
]

const IDEAS_ONLY: VoiceIdea[] = IDEAS.filter(i => i.kind === 'idea')

const NOOP = {
  onPlay:   () => {},
  onPause:  () => {},
  onShare:  () => {},
  onRename: () => {},
  onDelete: () => {},
}

// A phone-shaped well so the list reads as the mobile Nest surface, not a panel.
const PANEL: React.CSSProperties = {
  width: 360,
  height: 420,
  display: 'flex',
  flexDirection: 'column',
}

// ─── Interactive list (drives play / rename / delete / share live) ─────────────

function LiveList({
  initial = IDEAS,
  initialPlaying = null,
}: {
  initial?: VoiceIdea[]
  initialPlaying?: string | null
}) {
  const [ideas, setIdeas]         = useState(initial)
  const [playingId, setPlayingId] = useState<string | null>(initialPlaying)

  return (
    <VoiceIdeaList
      ideas={ideas}
      playingId={playingId}
      onPlay={setPlayingId}
      onPause={() => setPlayingId(null)}
      onShare={id => console.info('[Nest] share', id)}
      onRename={(id, title) =>
        setIdeas(prev => prev.map(i => (i.id === id ? { ...i, title } : i)))
      }
      onDelete={id => {
        setIdeas(prev => prev.filter(i => i.id !== id))
        setPlayingId(p => (p === id ? null : p))
      }}
    />
  )
}

// ─── State cards ──────────────────────────────────────────────────────────────

function DefaultCard() {
  return (
    <State label="default — All filter">
      <div style={PANEL}><LiveList /></div>
    </State>
  )
}

function PlayingCard() {
  return (
    <State label="playing row — green LED rolling">
      <div style={PANEL}><LiveList initialPlaying="v-2" /></div>
    </State>
  )
}

function MenuOpenCard() {
  return (
    <State label="row ⋮ open — click a kebab">
      <div style={PANEL}><LiveList /></div>
      <span style={hintStyle}>Click ⋮ to open rename / share / delete</span>
    </State>
  )
}

function DeleteConfirmCard() {
  return (
    <State label="delete-confirm — ⋮ → Delete">
      <div style={PANEL}><LiveList /></div>
      <span style={hintStyle}>⋮ → Delete opens the confirm dialog</span>
    </State>
  )
}

function RenameCard() {
  // Static row in rename mode so the inline editor is visible without interaction.
  return (
    <State label="rename — inline editor">
      <div style={{ ...PANEL, height: 'auto' }}>
        <VoiceIdeaRow idea={IDEAS[0]} {...NOOP} renaming />
      </div>
    </State>
  )
}

function FilterIdeasCard() {
  const [ideas] = useState(IDEAS)
  return (
    <State label="filter — Ideas only">
      <div style={PANEL}>
        <VoiceIdeaList ideas={ideas} {...NOOP} aria-label="Voice ideas (Ideas)" />
      </div>
      <span style={hintStyle}>Select “Ideas” in the filter</span>
    </State>
  )
}

function FilterMastersCard() {
  return (
    <State label="filter — Masters only">
      <div style={PANEL}>
        <VoiceIdeaList ideas={IDEAS} {...NOOP} aria-label="Voice ideas (Masters)" />
      </div>
      <span style={hintStyle}>Select “Masters” in the filter</span>
    </State>
  )
}

function EmptyCard() {
  return (
    <State label="empty — nothing in the Nest">
      <div style={PANEL}>
        <VoiceIdeaList ideas={[]} {...NOOP} />
      </div>
    </State>
  )
}

function FilteredEmptyCard() {
  return (
    <State label="empty — filter matches nothing">
      <div style={PANEL}>
        <VoiceIdeaList ideas={IDEAS_ONLY} {...NOOP} />
      </div>
      <span style={hintStyle}>Select “Masters” — no masters here</span>
    </State>
  )
}

function SmallCard() {
  return (
    <State label="sm — compact rows">
      <div style={PANEL}>
        <VoiceIdeaList ideas={IDEAS} {...NOOP} size="sm" />
      </div>
    </State>
  )
}

function PhoneCard() {
  return (
    <State label="phone-frame preview — the Nest on mobile">
      <div style={{ width: 280 }}>
        <ProductFrame variant="phone" caption="The Nest — voice ideas on your phone">
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-3)',
            background: 'var(--bg)',
          }}>
            <LiveList initial={IDEAS} initialPlaying="v-1" />
          </div>
        </ProductFrame>
      </div>
    </State>
  )
}

const hintStyle: React.CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-dim)',
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <DefaultCard />
      <PlayingCard />
      <MenuOpenCard />
      <RenameCard />
      <DeleteConfirmCard />
      <FilterIdeasCard />
      <FilterMastersCard />
      <EmptyCard />
      <FilteredEmptyCard />
      <SmallCard />
      <PhoneCard />
    </StatesGrid>
  )
}

// ─── Playground — dogfood Toggle ────────────────────────────────────────────────

function PlaygroundDemo() {
  const [seed, setSeed]       = useState(IDEAS)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [small, setSmall]     = useState(false)
  const [synced, setSynced]   = useState(true)
  const [last, setLast]       = useState<string | null>(null)

  const ideas = synced ? seed : seed.map(i => ({ ...i, synced: false }))

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 380, height: 460, display: 'flex', flexDirection: 'column' }}>
          <VoiceIdeaList
            ideas={ideas}
            size={small ? 'sm' : 'md'}
            playingId={playingId}
            onPlay={id => { setPlayingId(id); setLast(`▶ Play ${id}`) }}
            onPause={id => { setPlayingId(null); setLast(`⏸ Pause ${id}`) }}
            onShare={id => setLast(`↗ Share ${id}`)}
            onRename={(id, title) => {
              setSeed(prev => prev.map(i => (i.id === id ? { ...i, title } : i)))
              setLast(`✎ Rename ${id} → “${title}”`)
            }}
            onDelete={id => {
              setSeed(prev => prev.filter(i => i.id !== id))
              setPlayingId(p => (p === id ? null : p))
              setLast(`✕ Delete ${id}`)
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={small}  onChange={setSmall}  size="sm" label="compact rows (sm)" />
          <Toggle checked={synced} onChange={setSynced} size="sm" label="synced to phone" />
          {seed.length < IDEAS.length && (
            <button
              onClick={() => setSeed(IDEAS)}
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
              Restore deleted
            </button>
          )}
          {last && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              background: 'var(--stage)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
              maxWidth: 220,
              wordBreak: 'break-all',
            }}>
              {last}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function VoiceIdeaCRUDDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
