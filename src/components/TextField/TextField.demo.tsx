import { useState } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { TextField } from './TextField'

export const meta: DemoMeta = {
  name: 'TextField',
  group: 'Primitives',
  route: '/text-field',
  order: 16,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Empty (placeholder)">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Track name…"
          aria-label="Empty"
        />
      </State>

      <State label="Filled">
        <TextField
          value="Drums Bus"
          onChange={() => {}}
          aria-label="Filled"
        />
      </State>

      <State label="Focused">
        {/* autoFocus triggers :focus-visible ring in the gallery */}
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Focus ring visible"
          aria-label="Focused"
          autoFocus
        />
      </State>

      <State label="Error (message)">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Required"
          aria-label="Error with message"
          error="This field is required"
        />
      </State>

      <State label="Error (border only)">
        <TextField
          value="bad-value"
          onChange={() => {}}
          aria-label="Error border only"
          error={true}
        />
      </State>

      <State label="Disabled">
        <TextField
          value="Locked"
          onChange={() => {}}
          aria-label="Disabled"
          disabled
        />
      </State>

      <State label="Search (leading icon)">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Search tracks…"
          aria-label="Search"
          type="search"
          leading={<MagnifyingGlass size={14} />}
        />
      </State>

      <State label="Trailing slot">
        <TextField
          value="Drums Bus"
          onChange={() => {}}
          aria-label="With trailing"
          trailing={<X size={14} />}
        />
      </State>

      <State label="With label">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="e.g. Chorus"
          label="Section name"
        />
      </State>

      <State label="Small">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="sm size"
          aria-label="Small"
          size="sm"
        />
      </State>

      <State label="Small search">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Search…"
          aria-label="Small search"
          size="sm"
          type="search"
          leading={<MagnifyingGlass size={12} />}
        />
      </State>

      <State label="Password">
        <TextField
          value="secret123"
          onChange={() => {}}
          aria-label="Password"
          type="password"
        />
      </State>

      <State label="Surface tone (Home paper face)">
        {/* The calm paper face — a warm light field, ink text, no dark well.
            Used by Home screens (IdeasLibrary search, ReferenceList collector). */}
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Paste a link…"
          aria-label="Surface tone"
          tone="surface"
          leading={<MagnifyingGlass size={14} />}
        />
      </State>

      <State label="Surface tone — focused">
        <TextField
          value=""
          onChange={() => {}}
          placeholder="Focus ring on paper"
          aria-label="Surface tone focused"
          tone="surface"
          autoFocus
        />
      </State>

      <State label="Surface tone — error">
        <TextField
          value="bad-value"
          onChange={() => {}}
          aria-label="Surface tone error"
          tone="surface"
          error="This field is required"
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasLabel, setHasLabel] = useState(true)
  const [hasLeading, setHasLeading] = useState(false)
  const [paperFace, setPaperFace] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <TextField
          value={value}
          onChange={(v) => setValue(v)}
          placeholder="Type something…"
          label={hasLabel ? 'Track name' : undefined}
          aria-label={hasLabel ? undefined : 'Playground field'}
          disabled={disabled}
          error={hasError ? 'Something went wrong' : undefined}
          size={size}
          tone={paperFace ? 'surface' : 'stage'}
          leading={hasLeading ? <MagnifyingGlass size={size === 'sm' ? 12 : 14} /> : undefined}
        />

        {/* Controls — dogfooded from kit Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={disabled}
            onChange={(next) => setDisabled(next)}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={hasError}
            onChange={(next) => setHasError(next)}
            size="sm"
            label="error"
          />
          <Toggle
            checked={hasLabel}
            onChange={(next) => setHasLabel(next)}
            size="sm"
            label="label"
          />
          <Toggle
            checked={hasLeading}
            onChange={(next) => setHasLeading(next)}
            size="sm"
            label="leading icon"
          />
          <Toggle
            checked={paperFace}
            onChange={(next) => setPaperFace(next)}
            size="sm"
            label="paper face (surface)"
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
              <option value="md">md (32px)</option>
              <option value="sm">sm (24px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function TextFieldDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
