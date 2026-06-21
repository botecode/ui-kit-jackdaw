// src/components/InputLabels/InputLabels.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

export const meta: DemoMeta = {
  name: 'InputLabels',
  group: 'Composites',
  route: '/input-labels',
  order: 40,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FOUR_INPUTS: InputEntry[] = [
  { id: 'in-1', name: 'Input 1' },
  { id: 'in-2', name: 'Input 2' },
  { id: 'in-3', name: 'Input 3' },
  { id: 'in-4', name: 'Input 4' },
]

const SOME_LABELLED: InputEntry[] = [
  { id: 'in-1', name: 'Input 1', label: 'Guitar - ez1073' },
  { id: 'in-2', name: 'Input 2', label: 'Bass DI' },
  { id: 'in-3', name: 'Input 3' },
  { id: 'in-4', name: 'Input 4' },
]

const MANY_INPUTS: InputEntry[] = [
  { id: 'in-1',  name: 'Input 1',  label: 'Guitar - ez1073' },
  { id: 'in-2',  name: 'Input 2',  label: 'Bass DI' },
  { id: 'in-3',  name: 'Input 3',  label: 'Kick' },
  { id: 'in-4',  name: 'Input 4',  label: 'Snare Top' },
  { id: 'in-5',  name: 'Input 5' },
  { id: 'in-6',  name: 'Input 6' },
  { id: 'in-7',  name: 'Input 7' },
  { id: 'in-8',  name: 'Input 8' },
  { id: 'in-9',  name: 'Input 9' },
  { id: 'in-10', name: 'Input 10' },
]

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="All empty (placeholders)">
        <div style={{ width: 280 }}>
          <InputLabels inputs={FOUR_INPUTS} onLabel={() => {}} />
        </div>
      </State>

      <State label="Some labelled">
        <div style={{ width: 280 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} />
        </div>
      </State>

      <State label="Field focused / editing">
        {/* autoFocus on one field shows the accent focus ring */}
        <div style={{ width: 280 }}>
          <InputLabelsFocused />
        </div>
      </State>

      <State label="Many inputs (scroll)">
        <div style={{ width: 280, height: 180, display: 'flex', flexDirection: 'column' }}>
          <InputLabels inputs={MANY_INPUTS} onLabel={() => {}} />
        </div>
      </State>

      <State label="Empty list">
        <div style={{ width: 280 }}>
          <InputLabels inputs={[]} onLabel={() => {}} />
        </div>
      </State>
    </StatesGrid>
  )
}

// Separate component so autoFocus is live on mount inside the State cell
function InputLabelsFocused() {
  const inputs: InputEntry[] = [
    { id: 'in-1', name: 'Input 1', label: 'Guitar - ez1073' },
    { id: 'in-2', name: 'Input 2' },
    { id: 'in-3', name: 'Input 3' },
  ]
  return (
    <div style={{ position: 'relative' }}>
      {/* Render normally but mark the second field as auto-focused via key trick */}
      <InputLabelsFocusedInner inputs={inputs} />
    </div>
  )
}

function InputLabelsFocusedInner({ inputs }: { inputs: InputEntry[] }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(inputs.map(i => [i.id, i.label ?? '']))
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <InputLabels
        inputs={inputs.map(i => ({ ...i, label: vals[i.id] }))}
        onLabel={(id, label) => setVals(prev => ({ ...prev, [id]: label }))}
      />
    </div>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

const PLAYGROUND_INPUTS: InputEntry[] = [
  { id: 'p-1', name: 'Input 1' },
  { id: 'p-2', name: 'Input 2' },
  { id: 'p-3', name: 'Input 3' },
  { id: 'p-4', name: 'Input 4' },
]

function PlaygroundDemo() {
  const [inputs, setInputs] = useState<InputEntry[]>(PLAYGROUND_INPUTS)
  const [showMany, setShowMany] = useState(false)

  const displayInputs = showMany ? MANY_INPUTS.map(i => ({
    ...i,
    label: inputs.find(p => p.id === i.id)?.label ?? i.label,
  })) : inputs

  function handleLabel(id: string, label: string) {
    setInputs(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <div style={{
          width: 300,
          height: showMany ? 200 : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <InputLabels inputs={displayInputs} onLabel={handleLabel} />
        </div>

        {/* Controls — dogfooded from kit Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={showMany}
            onChange={setShowMany}
            size="sm"
            label="many inputs"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function InputLabelsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
