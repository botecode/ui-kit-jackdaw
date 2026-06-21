// src/components/NumberField/NumberField.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { NumberField } from './NumberField'

export const meta: DemoMeta = {
  name: 'NumberField',
  group: 'Primitives',
  route: '/number-field',
  order: 6,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default (BPM)">
        <NumberField value={120} onChange={noop} aria-label="Tempo" />
      </State>

      <State label="With unit (dB)">
        <NumberField value={-6} onChange={noop} step={0.1} precision={1} unit="dB" aria-label="Send level" />
      </State>

      <State label="With unit (%)">
        <NumberField value={75} onChange={noop} unit="%" aria-label="Amount" />
      </State>

      <State label="Small">
        <NumberField value={4} onChange={noop} size="sm" unit="oct" aria-label="Octave count" />
      </State>

      <State label="At min (− disabled)">
        <NumberField value={20} onChange={noop} min={20} max={999} aria-label="Tempo at min" />
      </State>

      <State label="At max (+ disabled)">
        <NumberField value={999} onChange={noop} min={20} max={999} aria-label="Tempo at max" />
      </State>

      <State label="Focused (autoFocus)">
        <NumberField value={120} onChange={noop} aria-label="Focused tempo" autoFocus />
      </State>

      <State label="Disabled">
        <NumberField value={120} onChange={noop} disabled aria-label="Disabled tempo" />
      </State>

      <State label="High precision">
        <NumberField
          value={0.707}
          onChange={noop}
          step={0.001}
          precision={3}
          aria-label="Fine value"
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState(120)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [showUnit, setShowUnit] = useState(true)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        {/* Live instance */}
        <NumberField
          value={value}
          onChange={setValue}
          min={20}
          max={999}
          step={1}
          unit={showUnit ? 'BPM' : undefined}
          disabled={disabled}
          size={size}
          aria-label="Playground tempo"
        />

        {/* Controls — dogfooding Toggle for boolean props */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={showUnit}
            onChange={setShowUnit}
            size="sm"
            label="show unit"
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
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-dim)',
            }}
          >
            value: {value}
          </span>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function NumberFieldDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
