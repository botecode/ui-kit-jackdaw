import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from './Checkbox'

export const meta: DemoMeta = {
  name: 'Checkbox',
  group: 'Primitives',
  route: '/checkbox',
  order: 6,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Unchecked">
        <Checkbox checked={false} onChange={noop} aria-label="Unchecked" />
      </State>
      <State label="Checked">
        <Checkbox checked onChange={noop} aria-label="Checked" />
      </State>
      <State label="Indeterminate">
        <Checkbox checked={false} indeterminate onChange={noop} aria-label="Indeterminate" />
      </State>
      <State label="Disabled off">
        <Checkbox checked={false} onChange={noop} aria-label="Disabled off" disabled />
      </State>
      <State label="Disabled on">
        <Checkbox checked onChange={noop} aria-label="Disabled on" disabled />
      </State>
      <State label="Small">
        <Checkbox checked size="sm" onChange={noop} aria-label="Small checked" />
      </State>
      <State label="Focus">
        <Checkbox checked={false} onChange={noop} aria-label="Focus demo" autoFocus />
      </State>
      <State label="With label">
        <Checkbox checked onChange={noop} label="Reverb" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        {/* Live instance */}
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onChange={(next) => setChecked(next)}
          disabled={disabled}
          size={size}
          aria-label="Checkbox playground"
        />

        {/* Controls — Checkbox dogfoods itself for boolean controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox
            checked={checked}
            onChange={(next) => setChecked(next)}
            size="sm"
            label="checked"
          />
          <Checkbox
            checked={indeterminate}
            onChange={(next) => setIndeterminate(next)}
            size="sm"
            label="indeterminate"
          />
          <Checkbox
            checked={disabled}
            onChange={(next) => setDisabled(next)}
            size="sm"
            label="disabled"
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
              <option value="md">md (16×16px)</option>
              <option value="sm">sm (12×12px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function CheckboxDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
