// src/components/Metronome/Metronome.demo.tsx
import { useEffect, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Metronome } from './Metronome'

export const meta: DemoMeta = {
  name: 'Metronome',
  group: 'Primitives',
  route: '/metronome',
  order: 72,
}

const NOOP = () => {}

// The record room is dark — show the control on a stage well so the lit cyan reads.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--stage)',
        backgroundImage: 'var(--texture-stage)',
        backgroundBlendMode: 'multiply',
        padding: 'var(--space-6)',
        borderRadius: 'calc(var(--radius) * 2)',
        display: 'inline-flex',
      }}
    >
      {children}
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="off — recessed, no click">
        <Stage><Metronome enabled={false} onToggle={NOOP} bpm={120} /></Stage>
      </State>
      <State label="on — downbeat lit (cyan)">
        <Stage><Metronome enabled onToggle={NOOP} bpm={120} beat={0} /></Stage>
      </State>
      <State label="on — beat 3 of 4">
        <Stage><Metronome enabled onToggle={NOOP} bpm={120} beat={2} /></Stage>
      </State>
      <State label="3/4 time">
        <Stage><Metronome enabled onToggle={NOOP} bpm={96} numerator={3} beat={1} /></Stage>
      </State>
      <State label="sm">
        <Stage><Metronome enabled onToggle={NOOP} bpm={140} beat={0} size="sm" /></Stage>
      </State>
      <State label="disabled">
        <Stage><Metronome enabled={false} onToggle={NOOP} bpm={120} disabled /></Stage>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [enabled, setEnabled] = useState(true)
  const bpm = 120
  const numerator = 4
  const [beat, setBeat] = useState(0)

  // Dogfood: a real ticking click so you can see the bar light across.
  useEffect(() => {
    if (!enabled) return
    const ms = (60 / bpm) * 1000
    const id = setInterval(() => setBeat(b => (b + 1) % numerator), ms)
    return () => clearInterval(id)
  }, [enabled])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Stage><Metronome enabled={enabled} onToggle={setEnabled} bpm={bpm} numerator={numerator} beat={beat} /></Stage>
        <Toggle checked={enabled} onChange={setEnabled} size="sm" label="click on" />
      </div>
    </Playground>
  )
}

export default function MetronomeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
