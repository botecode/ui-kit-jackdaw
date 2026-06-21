// src/components/Shortcuts/Shortcuts.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Shortcuts } from './Shortcuts'
import type { ShortcutAction, MacroStep } from './Shortcuts'

export const meta: DemoMeta = {
  name: 'Shortcuts',
  group: 'Composites',
  route: '/shortcuts',
  order: 60,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const ALL_ACTIONS: ShortcutAction[] = [
  { id: 'play',       name: 'Play / Pause',     category: 'Transport', bindings: ['Space'] },
  { id: 'stop',       name: 'Stop',             category: 'Transport', bindings: ['Escape'] },
  { id: 'record',     name: 'Record',           category: 'Transport', bindings: ['R'] },
  { id: 'loop',       name: 'Toggle Loop',      category: 'Transport', bindings: ['L'] },
  { id: 'undo',       name: 'Undo',             category: 'Edit',      bindings: ['⌘Z'] },
  { id: 'redo',       name: 'Redo',             category: 'Edit',      bindings: ['⌘⇧Z'] },
  { id: 'cut',        name: 'Cut',              category: 'Clip',      bindings: ['⌘X', 'Ctrl+X'] },
  { id: 'copy',       name: 'Copy',             category: 'Clip',      bindings: ['⌘C', 'Ctrl+C'] },
  { id: 'paste',      name: 'Paste',            category: 'Clip',      bindings: ['⌘V', 'Ctrl+V'] },
  { id: 'split',      name: 'Split at Playhead',category: 'Clip',      bindings: ['S'] },
  { id: 'delete',     name: 'Delete',           category: 'Clip',      bindings: ['Backspace'] },
  { id: 'new-clip',   name: 'New Clip',         category: 'Clip',      bindings: [] },
  { id: 'mute-track', name: 'Mute Track',       category: 'Track',     bindings: ['M'] },
  { id: 'solo-track', name: 'Solo Track',       category: 'Track',     bindings: [] },
  { id: 'arm-track',  name: 'Arm Track',        category: 'Track',     bindings: [] },
  { id: 'zoom-in',    name: 'Zoom In',          category: 'View',      bindings: ['='] },
  { id: 'zoom-out',   name: 'Zoom Out',         category: 'View',      bindings: ['-'] },
  { id: 'fit-window', name: 'Fit to Window',    category: 'View',      bindings: ['⌘⇧F'] },
]

const SHORT_LIST = ALL_ACTIONS.slice(0, 5)

const noop = () => {}

// ── Interactive playground ────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [actions, setActions] = useState(ALL_ACTIONS)

  function handleRebind(id: string, key: string) {
    setActions(prev =>
      prev.map(a => a.id === id ? { ...a, bindings: [key, ...a.bindings.slice(1)] } : a)
    )
  }

  function handleCreateMacro(name: string, steps: MacroStep[], key: string) {
    const newAction: ShortcutAction = {
      id: `macro-${Date.now()}`,
      name,
      category: 'Custom',
      bindings: [key],
    }
    setActions(prev => [...prev, newAction])
    console.info('[Shortcuts] macro created', { name, steps, key })
  }

  return (
    <Shortcuts
      actions={actions}
      onRebind={handleRebind}
      onCreateMacro={handleCreateMacro}
    />
  )
}

// ── Demo ──────────────────────────────────────────────────────────────────────

export default function ShortcutsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <State label="default (category sort, 5 actions)">
          <Shortcuts actions={SHORT_LIST} onRebind={noop} onCreateMacro={noop} />
        </State>

        <State label="empty list">
          <Shortcuts actions={[]} onRebind={noop} onCreateMacro={noop} />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
