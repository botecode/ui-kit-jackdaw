// src/components/Knob/Knob.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Knob } from './Knob'
import { Fader } from '../Fader'

export const meta: DemoMeta = {
  name: 'Knob',
  group: 'Primitives',
  route: '/knob',
  order: 1,
}

const noop = () => {}
const db = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`
const pct = (v: number) => `${Math.round(v)}%`

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Unipolar 0–100% · 0">
        <Knob value={0} onChange={noop} min={0} max={100} format={pct} aria-label="Amount" />
      </State>
      <State label="Unipolar · 70%">
        <Knob value={70} onChange={noop} min={0} max={100} format={pct} aria-label="Amount" />
      </State>
      <State label="Unipolar · 100%">
        <Knob value={100} onChange={noop} min={0} max={100} format={pct} aria-label="Amount" />
      </State>
      <State label="Centered (gain) · 0 dB">
        <Knob value={0} onChange={noop} min={-24} max={24} centered format={db} aria-label="Gain" />
      </State>
      <State label="Centered · −12 dB">
        <Knob value={-12} onChange={noop} min={-24} max={24} centered format={db} aria-label="Gain" />
      </State>
      <State label="Centered · +18 dB">
        <Knob value={18} onChange={noop} min={-24} max={24} centered format={db} aria-label="Gain" />
      </State>
      <State label="sm">
        <Knob value={40} onChange={noop} min={0} max={100} size="sm" format={pct} aria-label="Amount" />
      </State>
      <State label="Custom color">
        <Knob value={60} onChange={noop} min={0} max={100} color="var(--accent-green)" format={pct} aria-label="Amount" />
      </State>
      <State label="Disabled">
        <Knob value={30} onChange={noop} min={0} max={100} disabled format={pct} aria-label="Amount" />
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [value, setValue] = useState(40)
  const [centered, setCentered] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
        <div>
          <Knob
            value={value}
            onChange={setValue}
            min={centered ? -100 : 0}
            max={100}
            centered={centered}
            size={size}
            format={(v) => `${Math.round(v)}`}
            aria-label="Demo value"
          />
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              marginTop: 'var(--space-2)',
              textAlign: 'center',
            }}
          >
            double-click to reset
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            value: {value.toFixed(0)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={value}
                onChange={setValue}
                min={centered ? -100 : 0}
                max={100}
                step={1}
                orientation="horizontal"
                aria-label="Value"
              />
            </div>
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={centered} onChange={(e) => setCentered(e.target.checked)} /> centered (bipolar)
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            size
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as 'sm' | 'md')}
              style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (40px)</option>
              <option value="sm">sm (32px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

export default function KnobDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
