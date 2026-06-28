// src/components/ReferenceList/ReferenceList.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { ReferenceList, type RefMeta } from './ReferenceList'

export const meta: DemoMeta = {
  name: 'ReferenceList',
  group: 'Composites',
  route: '/reference-list',
  order: 56,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_MD = [
  '[Reference mix — keep the low end](https://youtu.be/dQw4w9WgXcQ)',
  'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
  '![Album cover direction](https://images.example.com/cover.jpg)',
  '[Mix notes from the session](https://example.com/notes/session-3)',
  'takes/lead-vocal-comp-v4.wav',
].join('\n')

const SHORT_MD = [
  '[Tone reference](https://youtu.be/dQw4w9WgXcQ)',
  'https://example.com/article/warm-tape-saturation',
].join('\n')

// App-resolved previews (no scraping in the kit — the app injects these by url).
const RESOLVED_META: Record<string, RefMeta> = {
  'https://example.com/notes/session-3': {
    status: 'ready',
    title: 'Session 3 — mix notes',
    description: 'Pull the vocal 1.5 dB, tighten the 200 Hz buildup, ride the chorus.',
  },
  'https://example.com/article/warm-tape-saturation': {
    status: 'ready',
    title: 'Warm tape saturation, demystified',
    description: 'Why a touch of 2nd-harmonic distortion reads as “expensive”.',
  },
}

const LOADING_META: Record<string, RefMeta> = {
  'https://example.com/article/warm-tape-saturation': { status: 'loading' },
}

const ERROR_META: Record<string, RefMeta> = {
  'https://example.com/article/warm-tape-saturation': { status: 'error' },
}

const noop = () => {}

// ─── States ───────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default">
        <ReferenceList value={FULL_MD} meta={RESOLVED_META} onChange={noop} />
      </State>

      <State label="hover">
        {/* Cards lift their keyline toward the accent on hover; the play disc blooms. */}
        <ReferenceList value={SHORT_MD} meta={RESOLVED_META} onChange={noop} />
      </State>

      <State label="focus">
        {/* Tab to a grip / card → :focus-visible accent ring. */}
        <ReferenceList value={SHORT_MD} meta={RESOLVED_META} onChange={noop} />
      </State>

      <State label="active">
        {/* A live player — the YouTube facade pressed into an embed. */}
        <ActivePlayer />
      </State>

      <State label="disabled">
        <ReferenceList value={SHORT_MD} meta={RESOLVED_META} disabled />
      </State>

      <State label="selected">
        <ReferenceList value={FULL_MD} meta={RESOLVED_META} selectedId="ref-3" onSelect={noop} onChange={noop} />
      </State>

      <State label="error">
        <ReferenceList value={SHORT_MD} meta={ERROR_META} onChange={noop} />
      </State>

      <State label="empty">
        <ReferenceList value="" onChange={noop} />
      </State>

      <State label="loading">
        <ReferenceList value={SHORT_MD} meta={LOADING_META} onChange={noop} />
      </State>
    </StatesGrid>
  )
}

function ActivePlayer() {
  const [value] = useState('[Tone reference](https://youtu.be/dQw4w9WgXcQ)')
  return <ReferenceList value={value} onChange={noop} />
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState(FULL_MD)
  const [readOnly, setReadOnly] = useState(false)
  const [selectable, setSelectable] = useState(true)
  const [resolve, setResolve] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>('ref-3')
  const [lastAction, setLastAction] = useState('')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 360, maxWidth: 560 }}>
          <ReferenceList
            value={value}
            onChange={setValue}
            meta={resolve ? RESOLVED_META : undefined}
            disabled={readOnly}
            selectedId={selectable ? selectedId : undefined}
            onSelect={selectable ? id => { setSelectedId(id); setLastAction(`select ${id}`) } : undefined}
            onAddLink={url => setLastAction(`addLink ${url}`)}
            onReorder={(from, to) => setLastAction(`reorder ${from}→${to}`)}
            onLabel={(id, label) => setLastAction(`label ${id} = "${label}"`)}
            onDelete={id => setLastAction(`delete ${id}`)}
            aria-label="Song references"
          />
        </div>

        {/* ── Controls — dogfood Toggle / Checkbox ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 220 }}>
          <Toggle checked={readOnly} onChange={setReadOnly} size="sm" label="read-only (disabled)" />
          <Toggle checked={selectable} onChange={setSelectable} size="sm" label="selectable cards" />
          <Checkbox checked={resolve} onChange={setResolve} size="sm" label="resolve link previews" />

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

          {/* Round-trips as markdown — the source of truth, shown live. */}
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            value (markdown)
          </label>
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxWidth: 260,
          }}>
            {value || '(empty)'}
          </pre>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ────────────────────────────────────────────────────────────

export default function ReferenceListDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
