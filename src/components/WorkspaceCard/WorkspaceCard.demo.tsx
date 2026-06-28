// src/components/WorkspaceCard/WorkspaceCard.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { WorkspaceCard } from './WorkspaceCard'

export const meta: DemoMeta = {
  name: 'WorkspaceCard',
  group: 'Composites',
  route: '/workspace-card',
  order: 82,
}

// A real cover image (kit ships none, so a stable remote art url stands in for the demo).
const ART = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70&auto=format&fit=crop'

const noop = () => {}

// ─── States ───────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default">
        <WorkspaceCard
          kind="song"
          title="Hairline"
          coverColor="var(--chroma-teal)"
          subtitle="Take 7 · today"
          onOpen={noop}
        />
      </State>

      <State label="hover">
        {/* Hover raises the keyline (no shadow/lift) and wakes the preview stud. */}
        <WorkspaceCard
          kind="song"
          title="Second light"
          coverColor="var(--chroma-orange)"
          subtitle="Take 3 · yesterday"
          onOpen={noop}
          onPreview={noop}
        />
      </State>

      <State label="focus">
        {/* Tab to the card → :focus-visible accent ring; Tab again → the preview stud. */}
        <WorkspaceCard
          kind="song"
          title="Out, into the cold"
          coverColor="var(--chroma-purple)"
          subtitle="Take 1 · last week"
          onOpen={noop}
          onPreview={noop}
        />
      </State>

      <State label="active">
        {/* A collection — stacked-sleeve cue + ALBUM · N tag, with art. */}
        <WorkspaceCard
          kind="collection"
          title="Paper Houses"
          cover={ART}
          count={6}
          subtitle="Album · 6 tracks"
          onOpen={noop}
          onPreview={noop}
        />
      </State>

      <State label="disabled">
        {/* No disabled state — Home hides workspaces you can't open. Shown: a plain song. */}
        <WorkspaceCard
          kind="song"
          title="Untitled idea"
          coverColor="var(--chroma-yellow)"
          subtitle="Take 1 · just now"
          onOpen={noop}
        />
      </State>

      <State label="selected">
        {/* Selected → the keyline lights to the accent, the body warms. */}
        <WorkspaceCard
          kind="collection"
          title="Winter demos"
          coverColor="var(--chroma-green)"
          count={9}
          subtitle="Album · 9 tracks"
          selected
          onOpen={noop}
        />
      </State>

      <State label="error">
        {/* Art didn't resolve → the flat colour block carries the cover instead. */}
        <WorkspaceCard
          kind="song"
          title="Lost master"
          coverColor="var(--chroma-red)"
          subtitle="Take 2 · cover art missing"
          onOpen={noop}
        />
      </State>

      <State label="empty">
        {/* No art and no colour → the flat well + a faint kind glyph (wave / stack). */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <WorkspaceCard kind="song" title="New take" onOpen={noop} />
          <WorkspaceCard kind="collection" title="New album" onOpen={noop} />
        </div>
      </State>

      <State label="loading">
        {/* sm density — a tighter Home grid. */}
        <WorkspaceCard
          kind="song"
          title="Hairline"
          coverColor="var(--chroma-teal)"
          subtitle="Take 7 · today"
          size="sm"
          onOpen={noop}
          onPreview={noop}
        />
      </State>
    </StatesGrid>
  )
}

// ─── Gallery row — the Home shelf: song cards + an album, with/without art ──────

function GalleryRow() {
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--text)',
        margin: '0 0 var(--space-4)',
      }}>
        The Home shelf
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <WorkspaceCard kind="song" title="Hairline" cover={ART} subtitle="Take 7 · today" onOpen={noop} onPreview={noop} />
        <WorkspaceCard kind="song" title="Second light" coverColor="var(--chroma-orange)" subtitle="Take 3 · yesterday" onOpen={noop} onPreview={noop} />
        <WorkspaceCard kind="song" title="Out, into the cold" coverColor="var(--chroma-purple)" subtitle="Take 1 · last week" onOpen={noop} />
        <WorkspaceCard kind="collection" title="Paper Houses" cover={ART} count={6} subtitle="Album · 6 tracks" onOpen={noop} onPreview={noop} />
        <WorkspaceCard kind="collection" title="Winter demos" coverColor="var(--chroma-green)" count={9} subtitle="Album · 9 tracks" onOpen={noop} />
        <WorkspaceCard kind="song" title="New take" onOpen={noop} />
      </div>
    </section>
  )
}

// ─── Playground — dogfood Toggle / Checkbox ─────────────────────────────────────

function PlaygroundDemo() {
  const [isCollection, setIsCollection] = useState(false)
  const [withArt, setWithArt] = useState(false)
  const [withSubtitle, setWithSubtitle] = useState(true)
  const [withPreview, setWithPreview] = useState(true)
  const [selected, setSelected] = useState(false)
  const [small, setSmall] = useState(false)
  const [lastAction, setLastAction] = useState('')

  const kind = isCollection ? 'collection' : 'song'

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 240 }}>
          <WorkspaceCard
            kind={kind}
            title={isCollection ? 'Paper Houses' : 'Hairline'}
            cover={withArt ? ART : undefined}
            coverColor={withArt ? undefined : isCollection ? 'var(--chroma-green)' : 'var(--chroma-teal)'}
            count={isCollection ? 6 : undefined}
            subtitle={withSubtitle ? (isCollection ? 'Album · 6 tracks' : 'Take 7 · today') : undefined}
            selected={selected}
            size={small ? 'sm' : 'md'}
            onOpen={() => setLastAction('open')}
            onPreview={withPreview ? () => setLastAction('preview') : undefined}
          />
        </div>

        {/* ── Controls — dogfood Toggle / Checkbox ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 200 }}>
          <Toggle checked={isCollection} onChange={setIsCollection} size="sm" label="collection (album)" />
          <Toggle checked={withArt} onChange={setWithArt} size="sm" label="cover art" />
          <Checkbox checked={withSubtitle} onChange={setWithSubtitle} size="sm" label="subtitle" />
          <Checkbox checked={withPreview} onChange={setWithPreview} size="sm" label="preview action" />
          <Checkbox checked={selected} onChange={setSelected} size="sm" label="selected" />
          <Checkbox checked={small} onChange={setSmall} size="sm" label="small density" />

          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              background: 'var(--stage)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
            }}>
              {lastAction}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function WorkspaceCardDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <GalleryRow />
      <PlaygroundDemo />
    </DemoShell>
  )
}
