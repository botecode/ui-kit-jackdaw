// src/components/CollectionView/CollectionView.demo.tsx
import { useEffect, useState } from 'react'
import { Camera } from '@phosphor-icons/react'
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

// A stand-in for the host's on-cover control. The kit only renders the node; the
// real picker is the app's. Styled with tokens so it reads as a recessed chip on
// the plate (mirrors the song page's "Add cover" overlay).
function CoverActionButton({ onClick = noop }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Change cover"
      style={{
        appearance: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-1) var(--space-2)',
        border: '1px solid color-mix(in srgb, var(--stage-text) 30%, transparent)',
        borderRadius: 'var(--radius)',
        background: 'color-mix(in srgb, var(--stage) 78%, transparent)',
        color: 'var(--stage-text)',
        font: 'var(--weight-medium) var(--text-xs)/1 var(--font-ui)',
        letterSpacing: '0.02em',
        cursor: 'pointer',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Camera weight="fill" aria-hidden="true" /> Cover
    </button>
  )
}

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
        {/* A "Change cover" control sits ON the plate (host-provided coverAction) —
            revealed on hover/focus, keyboard-reachable, never floating above. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-teal)"
          coverAction={<CoverActionButton />}
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
        {/* Hover a row → it warms to --surface-2 and the mono index turns into a
            recessed play stud (Spotify's number→play). Title shifts to the accent. */}
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
        {/* Tab to a grip / play stud / title → :focus-visible accent ring; focusing
            the stud reveals it even without hover (keyboard-reachable). */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-purple)"
          coverAction={<CoverActionButton />}
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
        {/* A live row — the green now-playing bars pulse (the lit indicator),
            the accent spine + the now-playing transport seeker scrubbing the live
            track's position. Hovering the live row reveals its pause stud. */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-green)"
          notes={NOTES}
          tracks={TRACKS}
          nowPlayingId="t4"
          positionSeconds={142}
          isPlaying
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
          onSeek={noop}
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
        {/* nowPlaying = the selected/lit row; paused, so the seeker holds its
            position with no rolling bloom (isPlaying={false}). */}
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-red)"
          notes={NOTES}
          tracks={TRACKS.slice(0, 5)}
          nowPlayingId="t2"
          positionSeconds={64}
          isPlaying={false}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
          onSeek={noop}
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

// ─── Wide container ─────────────────────────────────────────────────────────────
// Regression guard on the shelf: the host (the DAW collection page) hands the
// component the full viewport. Render it in a deliberately wide, uncapped
// container so the sleeve must hold itself together — the title + meta stay with
// the cover, the column doesn't sprawl edge-to-edge — and this class of breakage
// is caught here, not only in the app.

function WideDemo() {
  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 'var(--space-4)',
      }}>
        Wide container (full width, uncapped)
      </h2>
      {/* No maxWidth here — the component caps itself to a coherent album column. */}
      <div style={{ width: '100%' }}>
        <CollectionView
          title="Paper Houses"
          coverColor="var(--chroma-teal)"
          notes={NOTES}
          tracks={TRACKS}
          nowPlayingId="t4"
          positionSeconds={142}
          isPlaying
          onBack={noop}
          onNotesChange={noop}
          onReorder={noop}
          onPlayTrack={noop}
          onPlayAll={noop}
          onOpenSong={noop}
          onSeek={noop}
        />
      </div>
    </section>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [tracks, setTracks] = useState(TRACKS)
  const [notes, setNotes] = useState(NOTES)
  const [nowPlayingId, setNowPlayingId] = useState<string | null>('t2')
  const [playing, setPlaying] = useState(true)
  const [position, setPosition] = useState(64)
  const [withCover, setWithCover] = useState(true)
  const [small, setSmall] = useState(false)
  const [withBack, setWithBack] = useState(true)
  const [wide, setWide] = useState(false)
  const [lastAction, setLastAction] = useState('')

  const nowDuration = tracks.find(t => t.id === nowPlayingId)?.durationSeconds ?? 0

  // Roll the now-playing position forward while playing — the host owns the
  // clock; CollectionView only renders positionSeconds (audio is native).
  useEffect(() => {
    if (!playing || nowPlayingId == null) return
    const id = window.setInterval(() => {
      setPosition(p => (p >= nowDuration ? 0 : p + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, nowPlayingId, nowDuration])

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 380, maxWidth: wide ? undefined : 620 }}>
          <CollectionView
            title="Paper Houses"
            coverColor={withCover ? 'var(--chroma-teal)' : undefined}
            coverAction={<CoverActionButton onClick={() => setLastAction('changeCover')} />}
            notes={notes}
            onNotesChange={setNotes}
            tracks={tracks}
            nowPlayingId={nowPlayingId}
            positionSeconds={position}
            isPlaying={playing}
            size={small ? 'sm' : 'md'}
            onBack={withBack ? () => setLastAction('back') : undefined}
            onReorder={(from, to) => {
              setTracks(t => move(t, from, to))
              setLastAction(`reorder ${from}→${to}`)
            }}
            onPlayTrack={id => {
              setNowPlayingId(id)
              setPosition(0)
              setPlaying(true)
              setLastAction(`playTrack ${id}`)
            }}
            onPlayAll={() => {
              setNowPlayingId(tracks[0]?.id ?? null)
              setPosition(0)
              setPlaying(true)
              setLastAction('playAll')
            }}
            onOpenSong={id => setLastAction(`openSong ${id}`)}
            onSeek={s => {
              setPosition(s)
              setLastAction(`seek → ${s.toFixed(0)}s`)
            }}
          />
        </div>

        {/* ── Controls — dogfood Toggle / Checkbox ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 220 }}>
          <Toggle checked={withCover} onChange={setWithCover} size="sm" label="cover color" />
          <Toggle checked={withBack} onChange={setWithBack} size="sm" label="back button" />
          <Toggle checked={wide} onChange={setWide} size="sm" label="wide container" />
          <Checkbox checked={small} onChange={setSmall} size="sm" label="small density" />
          <Checkbox
            checked={nowPlayingId != null}
            onChange={on => {
              setNowPlayingId(on ? tracks[1]?.id ?? null : null)
              setPosition(0)
            }}
            size="sm"
            label="now playing"
          />
          <Toggle
            checked={playing}
            onChange={setPlaying}
            size="sm"
            label="rolling (seeker bloom)"
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
      <WideDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
