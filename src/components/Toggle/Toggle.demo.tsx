import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from './Toggle'

export const meta: DemoMeta = {
  name: 'Toggle',
  group: 'Primitives',
  route: '/toggle',
  order: 4,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off">
        <Toggle checked={false} onChange={noop} aria-label="Off" />
      </State>
      <State label="On">
        <Toggle checked onChange={noop} aria-label="On" />
      </State>
      <State label="Disabled off">
        <Toggle checked={false} onChange={noop} aria-label="Disabled off" disabled />
      </State>
      <State label="Disabled on">
        <Toggle checked onChange={noop} aria-label="Disabled on" disabled />
      </State>
      <State label="Small">
        <Toggle checked size="sm" onChange={noop} aria-label="Small on" />
      </State>
      <State label="Focus">
        {/* autoFocus demonstrates :focus-visible ring */}
        <Toggle checked={false} onChange={noop} aria-label="Focus demo" autoFocus />
      </State>
      <State label="With label">
        <Toggle checked onChange={noop} label="Reverb" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [checked, setChecked] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        {/* Live instance */}
        <Toggle
          checked={checked}
          onChange={(next) => setChecked(next)}
          disabled={disabled}
          size={size}
          aria-label="Toggle playground"
        />

        {/* Controls — Toggle dogfoods itself for boolean controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={checked}
            onChange={(next) => setChecked(next)}
            size="sm"
            label="checked"
          />
          <Toggle
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
              <option value="md">md (44×24px)</option>
              <option value="sm">sm (32×18px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ToggleDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
