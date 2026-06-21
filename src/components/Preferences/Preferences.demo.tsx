// src/components/Preferences/Preferences.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import { LookAndFeelPanel } from '../LookAndFeelPanel'
import { Shortcuts } from '../Shortcuts'
import type { ShortcutAction, MacroStep } from '../Shortcuts'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

export const meta: DemoMeta = {
  name: 'Preferences',
  group: 'Composites',
  route: '/preferences',
  order: 65,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const SHORTCUT_ACTIONS: ShortcutAction[] = [
  { id: 'play',       name: 'Play / Pause',      category: 'Transport', bindings: ['Space'] },
  { id: 'stop',       name: 'Stop',              category: 'Transport', bindings: ['Escape'] },
  { id: 'record',     name: 'Record',            category: 'Transport', bindings: ['R'] },
  { id: 'undo',       name: 'Undo',              category: 'Edit',      bindings: ['⌘Z'] },
  { id: 'redo',       name: 'Redo',              category: 'Edit',      bindings: ['⌘⇧Z'] },
  { id: 'cut',        name: 'Cut',               category: 'Clip',      bindings: ['⌘X'] },
  { id: 'copy',       name: 'Copy',              category: 'Clip',      bindings: ['⌘C'] },
  { id: 'paste',      name: 'Paste',             category: 'Clip',      bindings: ['⌘V'] },
  { id: 'mute-track', name: 'Mute Track',        category: 'Track',     bindings: ['M'] },
  { id: 'solo-track', name: 'Solo Track',        category: 'Track',     bindings: [] },
]

// ── Input stub panel ──────────────────────────────────────────────────────────

function InputPanel() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          lineHeight: 'var(--leading-base)',
        }}
      >
        Input device settings — panel coming soon.
      </p>
    </div>
  )
}

// ── States ────────────────────────────────────────────────────────────────────

function AllClosedCard() {
  const { theme, setTheme } = useTheme()
  const [actions, setActions] = useState(SHORTCUT_ACTIONS)

  const sections: PreferencesSection[] = [
    { id: 'input',         label: 'Input',         panel: <InputPanel /> },
    { id: 'look-and-feel', label: 'Look and feel', panel: <LookAndFeelPanel themes={THEMES} active={theme} onSelect={setTheme} /> },
    { id: 'shortcuts',     label: 'Shortcuts',      panel: (
        <Shortcuts
          actions={actions}
          onRebind={(id, key) => setActions(prev => prev.map(a => a.id === id ? { ...a, bindings: [key] } : a))}
          onCreateMacro={() => {}}
        />
      ),
    },
  ]

  return (
    <State label="All closed — click gear to open menu">
      <Preferences sections={sections} />
    </State>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const { theme, setTheme } = useTheme()
  const [actions, setActions] = useState(SHORTCUT_ACTIONS)

  function handleRebind(id: string, key: string) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, bindings: [key] } : a))
  }

  function handleCreateMacro(_name: string, _steps: MacroStep[], _key: string) {}

  const sections: PreferencesSection[] = [
    {
      id:    'input',
      label: 'Input',
      panel: <InputPanel />,
    },
    {
      id:    'look-and-feel',
      label: 'Look and feel',
      panel: <LookAndFeelPanel themes={THEMES} active={theme} onSelect={setTheme} />,
    },
    {
      id:    'shortcuts',
      label: 'Shortcuts',
      panel: (
        <Shortcuts
          actions={actions}
          onRebind={handleRebind}
          onCreateMacro={handleCreateMacro}
        />
      ),
    },
  ]

  return (
    <Playground>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Preferences sections={sections} />
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          Click the gear to open Preferences
        </span>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function PreferencesDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <AllClosedCard />
      </StatesGrid>
      <PlaygroundDemo />
    </DemoShell>
  )
}
