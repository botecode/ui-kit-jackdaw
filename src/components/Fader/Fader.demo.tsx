// src/components/Fader/Fader.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from './Fader'
import { dbScale } from './faderScales'

export const meta: DemoMeta = {
  name: 'Fader',
  group: 'Primitives',
  route: '/fader',
  order: 2,
}

// ── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  const db = dbScale()
  return (
    <StatesGrid>
      <State label="Unity (0 dB)">
        <Fader value={0} onChange={noop} min={-60} max={6} scale={db} resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
      </State>
      <State label="-6 dB">
        <Fader value={-6} onChange={noop} min={-60} max={6} scale={db} resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
      </State>
      <State label="-∞ (−60 dB)">
        <Fader value={-60} onChange={noop} min={-60} max={6} scale={db} resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
      </State>
      <State label="+6 dB">
        <Fader value={6} onChange={noop} min={-60} max={6} scale={db} resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
      </State>
      <State label="Horizontal">
        <Fader
          value={0}
          onChange={noop}
          min={-60}
          max={6}
          scale={db}
          orientation="horizontal"
          resetValue={0}
          aria-label="Volume horizontal"
        />
      </State>
      <State label="sm size">
        <Fader value={0} onChange={noop} min={-60} max={6} scale={db} size="sm" resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
      </State>
      <State label="Disabled">
        <Fader value={-6} onChange={noop} min={-60} max={6} scale={db} disabled />
      </State>
      <State label="Custom color">
        <Fader
          value={0}
          onChange={noop}
          min={-60}
          max={6}
          scale={db}
          color="var(--accent-green)"
          resetValue={0}
          ticks={[6, 0, -6, -12, -24, -60]}
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────
// Controls are themselves Faders (horizontal) — dogfooding the component.

function PlaygroundDemo() {
  const db = dbScale()
  const [volume, setVolume]     = useState(0)
  const [resetVal, setResetVal] = useState(0)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end' }}>
        {/* Main vertical dB fader on demo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Fader
            value={volume}
            onChange={setVolume}
            min={-60}
            max={6}
            scale={db}
            detent={{ value: 0 }}
            resetValue={resetVal}
            aria-label="Volume"
            size="lg"
            ticks={[6, 0, -6, -12, -24, -60]}
          />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
            double-click to reset
          </span>
        </div>

        {/* Controls as horizontal Faders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            volume: {db.defaultFormat(volume)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={volume}
                onChange={setVolume}
                min={-60}
                max={6}
                scale={db}
                orientation="horizontal"
                detent={{ value: 0 }}
                aria-label="Volume fader control"
              />
            </div>
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            resetValue: {db.defaultFormat(resetVal)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={resetVal}
                onChange={setResetVal}
                min={-60}
                max={6}
                scale={db}
                orientation="horizontal"
                aria-label="Reset value control"
              />
            </div>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function FaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
