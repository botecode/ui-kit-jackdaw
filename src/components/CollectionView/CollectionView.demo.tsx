// src/components/CollectionView/CollectionView.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { CollectionView, type CollectionTrack } from './CollectionView'

export const meta: DemoMeta = {
  name: 'CollectionView',
  group: 'Composites',
  route: '/collection-view',
  order: 125,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOTES = [
  '# Paper Houses',
  '',
  "A winter record — quiet at the edges, warm in the middle. Sequence it so the",
  'long one lands two-thirds in, then let it breathe out.',
  '',
  '- [x] lock the running order',
  '- [ ] re-cut the segue into *The long one*',
].join('\n')

const TRACKS: CollectionTrack[] = [
  { id: 't1', title: 'Opening, slow tape', durationSeconds: 184 },
  { id: 't2', title: 'Second light', durationSeconds: 211 },
  { id: 't3', title: 'Paper houses', durationSeconds: 168 },
  { id: 't4', title: 'The long one', durationSeconds: 372 },
  { id: 't5', title: 'Hairline', durationSeconds: 142 },
  { id: 't6', title: 'Out, into the cold', durationSeconds: 233 },
]

const noop = () => {}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [m] = next.splice(from, 1)
  next.splice(to, 0, m)
  return next
}

// ─── States ───────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default">
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-teal)"
          notes={NOTES}
          tracks={TRACKS}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="hover">
        {/* Hover a row → it warms to --surface; the title shifts toward the accent. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-orange)"
          notes={NOTES}
          tracks={TRACKS.slice(0, 4)}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="focus">
        {/* Tab to a grip / title / play stud → :focus-visible accent ring. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-purple)"
          notes={NOTES}
          tracks={TRACKS.slice(0, 4)}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onOpenSong={noop}
          onBack={noop}
        />
      </State>

      <State label="active">
        {/* A live row — the green play LED lit, the accent spine on the now-playing track. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-green)"
          notes={NOTES}
          tracks={TRACKS}
          nowPlayingId="t4"
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="disabled">
        {/* No tracks → Play album is disabled (greyed, no bloom). */}
        <CollectionView
          title="Untitled album"
          notes=""
          tracks={[]}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="selected">
        {/* nowPlaying = the selected/lit row. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-red)"
          notes={NOTES}
          tracks={TRACKS.slice(0, 5)}
          nowPlayingId="t2"
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="error">
        {/* No cover art and no color — the record-grooves fallback on the stage well. */}
        <CollectionView
          title="Lost masters"
          notes="Cover art didn't resolve — the sleeve falls back to bare grooves."
          tracks={TRACKS.slice(0, 3)}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="empty">
        <CollectionView
          title="New album"
          coverColor="var(--chroma-blue)"
          notes=""
          tracks={[]}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onOpenSong={noop}
        />
      </State>

      <State label="loading">
        {/* sm density — a compact sleeve for tighter shelves. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-yellow)"
          notes={NOTES}
          tracks={TRACKS.slice(0, 4)}
          size="sm"
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onOpenSong={noop}
        />
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [tracks, setTracks] = useState(TRACKS)
  const [notes, setNotes] = useState(NOTES)
  const [nowPlayingId, setNowPlayingId] = useState<string | null>('t2')
  const [withCover, setWithCover] = useState(true)
  const [small, setSmall] = useState(false)
  const [withBack, setWithBack] = useState(true)
  const [lastAction, setLastAction] = useState('')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 380, maxWidth: 620 }}>
          <CollectionView
            title="Paper Houses"
            coverColor={withCover ? 'var(--chroma-teal)' : undefined}
            notes={notes}
            onNotesChange={setNotes}
            tracks={tracks}
            nowPlayingId={nowPlayingId}
            size={small ? 'sm' : 'md'}
            onBack={withBack ? () => setLastAction('back') : undefined}
            onReorder={(from, to) => {
              setTracks(t => move(t, from, to))
              setLastAction(`reorder ${from}→${to}`)
            }}
            onPlayTrack={id => {
              setNowPlayingId(id)
              setLastAction(`playTrack ${id}`)
            }}
            onPlayAll={() => {
              setNowPlayingId(tracks[0]?.id ?? null)
              setLastAction('playAll')
            }}
            onOpenSong={id => setLastAction(`openSong ${id}`)}
          />
        </div>

        {/* ── Controls — dogfood Toggle / Checkbox ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 220 }}>
          <Toggle checked={withCover} onChange={setWithCover} size="sm" label="cover color" />
          <Toggle checked={withBack} onChange={setWithBack} size="sm" label="back button" />
          <Checkbox checked={small} onChange={setSmall} size="sm" label="small density" />
          <Checkbox
            checked={nowPlayingId != null}
            onChange={on => setNowPlayingId(on ? tracks[1]?.id ?? null : null)}
            size="sm"
            label="now playing"
          />

          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              background: 'var(--stage)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
              wordBreak: 'break-all',
            }}>
              {lastAction}
            </div>
          )}

          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            order
          </label>
          <ol style={{
            margin: 0,
            paddingLeft: 'var(--space-5)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}>
            {tracks.map(t => <li key={t.id}>{t.title}</li>)}
          </ol>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function CollectionViewDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
