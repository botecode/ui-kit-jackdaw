// src/components/PanKnob/PanKnob.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { PanKnob } from './PanKnob'

export const meta: DemoMeta = {
  name: 'PanKnob',
  group: 'Primitives',
  route: '/pan-knob',
  order: 1,
}

// ── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default (C)">
        <PanKnob pan={0} onChange={noop} />
      </State>
      <State label="L40">
        <PanKnob pan={-0.4} onChange={noop} />
      </State>
      <State label="R75">
        <PanKnob pan={0.75} onChange={noop} />
      </State>
      <State label="sm size">
        <PanKnob pan={0.3} onChange={noop} size="sm" />
      </State>
      <State label="Custom color">
        <PanKnob pan={0} onChange={noop} color="var(--accent-green)" />
      </State>
      <State label="Disabled">
        <PanKnob pan={0.3} onChange={noop} disabled />
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [pan, setPan] = useState(0)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [color, setColor] = useState('')
  const [resetValue, setResetValue] = useState(0)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
        <div>
          <PanKnob
            pan={pan}
            onChange={setPan}
            size={size}
            color={color || undefined}
            resetValue={resetValue}
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
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            pan: {pan.toFixed(2)}
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={pan}
              onChange={(e) => setPan(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            size
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as 'sm' | 'md')}
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="md">md (40px)</option>
              <option value="sm">sm (32px)</option>
            </select>
          </label>
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            color (CSS value)
            <input
              type="text"
              value={color}
              placeholder="var(--accent)"
              onChange={(e) => setColor(e.target.value)}
              style={{
                display: 'block',
                width: '160px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
              }}
            />
          </label>
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            resetValue: {resetValue}
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={resetValue}
              onChange={(e) => setResetValue(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export (the gallery page) ────────────────────────────────────────

export default function PanKnobDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
