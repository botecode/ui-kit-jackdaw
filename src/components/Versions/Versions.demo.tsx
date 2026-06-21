import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Versions } from './Versions'
import type { VersionEntry, VersionDiff } from './Versions'

export const meta: DemoMeta = {
  name: 'Versions',
  group: 'Composites',
  route: '/versions',
  order: 75,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VERSIONS_MANY: VersionEntry[] = [
  {
    id: 'v8', name: 'Final Mix', date: '2024-06-15T18:45:00Z',
    note: 'Mastered, ready for export', current: true, author: 'Jordan Lee',
  },
  {
    id: 'v7', name: 'Take 7', date: '2024-06-15T14:20:00Z',
    note: 'Vocal doubles added to chorus', author: 'Jordan Lee',
  },
  {
    id: 'v6', name: 'Bridge Session', date: '2024-06-14T22:10:00Z',
    note: 'New bridge with string arrangement', author: 'Sam Rivera',
  },
  {
    id: 'v5', name: 'Take 5', date: '2024-06-14T17:55:00Z',
    author: 'Jordan Lee',
  },
  {
    id: 'v4', name: 'Chorus Rework', date: '2024-06-13T20:30:00Z',
    note: 'Rewrote the hook entirely', author: 'Sam Rivera',
  },
  {
    id: 'v3', name: 'Take 3', date: '2024-06-12T16:00:00Z',
    author: 'Jordan Lee',
  },
  {
    id: 'v2', name: 'Demo w/ drums', date: '2024-06-11T11:15:00Z',
    note: 'Added live drum track', author: 'Jordan Lee',
  },
  {
    id: 'v1', name: 'Take 1', date: '2024-06-10T09:00:00Z',
    note: 'First save — guitar scratch + voice memo',
  },
]

const VERSIONS_FEW: VersionEntry[] = [
  {
    id: 'a3', name: 'Take 3', date: '2024-06-14T10:00:00Z',
    current: true,
  },
  {
    id: 'a2', name: 'Demo', date: '2024-06-13T18:30:00Z',
    note: 'Added keys',
  },
  {
    id: 'a1', name: 'Take 1', date: '2024-06-12T09:00:00Z',
  },
]

const MOCK_DIFF: VersionDiff = {
  tracksAdded: 2,
  tracksRemoved: 0,
  clipsAdded: 7,
  clipsRemoved: 2,
  clipsModified: 3,
  lyricsChanged: true,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}

  return (
    <StatesGrid>
      <State label="Default (few)">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={[]}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="One selected">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a2']}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Current selected">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a3']}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Two selected (compare, loading)">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a3', 'a1']}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Compare with diff">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a3', 'a1']}
            diff={MOCK_DIFF}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Compare — no changes">
        <div style={{ width: 280 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a3', 'a2']}
            diff={{ tracksAdded: 0, tracksRemoved: 0, clipsAdded: 0, clipsRemoved: 0, clipsModified: 0, lyricsChanged: false }}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Many (scrollable)">
        <div style={{ width: 280, maxHeight: 240, overflow: 'hidden', borderRadius: 'var(--radius)' }}>
          <Versions
            versions={VERSIONS_MANY}
            selected={[]}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Empty (first save)">
        <div style={{ width: 280 }}>
          <Versions
            versions={[]}
            selected={[]}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
          />
        </div>
      </State>

      <State label="Small (sm)">
        <div style={{ width: 240 }}>
          <Versions
            versions={VERSIONS_FEW}
            selected={['a2']}
            onSelect={noop}
            onCompare={noop}
            onRename={noop}
            onRestore={noop}
            size="sm"
          />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [selected, setSelected] = useState<string[]>([])
  const [diff, setDiff] = useState<VersionDiff | undefined>()
  const [showDiff, setShowDiff] = useState(false)
  const [showAuthor, setShowAuthor] = useState(true)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  const versions: VersionEntry[] = showAuthor ? VERSIONS_MANY : VERSIONS_MANY.map(v => ({ ...v, author: undefined }))

  function handleSelect(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  function handleCompare() {
    if (showDiff) {
      setTimeout(() => setDiff(MOCK_DIFF), 600)
    } else {
      setDiff(undefined)
    }
  }

  function handleRename(id: string, name: string) {
    console.log('onRename', id, name)
  }

  function handleRestore(id: string) {
    console.log('onRestore', id)
  }

  return (
    <Playground>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Live instance */}
        <Versions
          versions={versions}
          selected={selected}
          diff={diff}
          onSelect={handleSelect}
          onCompare={handleCompare}
          onRename={handleRename}
          onRestore={handleRestore}
          size={size}
        />

        {/* Controls — dogfood Toggle for booleans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={showDiff}
            onChange={next => {
              setShowDiff(next)
              if (!next) setDiff(undefined)
            }}
            size="sm"
            label="load diff on compare"
          />
          <Toggle
            checked={showAuthor}
            onChange={setShowAuthor}
            size="sm"
            label="show author avatars"
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md</option>
              <option value="sm">sm</option>
            </select>
          </label>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              marginTop: 'var(--space-2)',
              lineHeight: 'var(--leading-base)',
            }}
          >
            <strong style={{ color: 'var(--text-muted)' }}>Selected:</strong>{' '}
            {selected.length === 0
              ? 'none'
              : selected.map(id => versions.find(v => v.id === id)?.name ?? id).join(', ')}
            <br />
            Click to select · click again to deselect · click a 3rd to swap oldest.
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function VersionsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
