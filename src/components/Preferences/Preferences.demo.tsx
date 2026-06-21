// src/components/Preferences/Preferences.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
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

// ── Sections ──────────────────────────────────────────────────────────────────

const SECTIONS: PreferencesSection[] = [
  { id: 'input',         label: 'Input' },
  { id: 'look-and-feel', label: 'Look and feel' },
  { id: 'shortcuts',     label: 'Shortcuts' },
]

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

// ── Trigger button ────────────────────────────────────────────────────────────

const BTN_STYLE: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  lineHeight: 1,
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
  outline: 'none',
}

// ── State cards ───────────────────────────────────────────────────────────────

function ClosedCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Closed">
      <button style={BTN_STYLE} onClick={() => setOpen(true)}>
        Open Preferences
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active="input"
        onSelect={() => {}}
      >
        <InputPanel />
      </Preferences>
    </State>
  )
}

function InputActiveCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Open — Input section">
      <button style={BTN_STYLE} onClick={() => setOpen(true)}>
        Open (Input)
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active="input"
        onSelect={() => {}}
      >
        <InputPanel />
      </Preferences>
    </State>
  )
}

function LookActiveCard() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  return (
    <State label="Open — Look and feel section">
      <button style={BTN_STYLE} onClick={() => setOpen(true)}>
        Open (Look and feel)
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active="look-and-feel"
        onSelect={() => {}}
      >
        <LookAndFeelPanel
          themes={THEMES}
          active={theme}
          onSelect={setTheme}
        />
      </Preferences>
    </State>
  )
}

function ShortcutsActiveCard() {
  const [open, setOpen] = useState(false)
  const [actions, setActions] = useState(SHORTCUT_ACTIONS)
  return (
    <State label="Open — Shortcuts section">
      <button style={BTN_STYLE} onClick={() => setOpen(true)}>
        Open (Shortcuts)
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active="shortcuts"
        onSelect={() => {}}
      >
        <Shortcuts
          actions={actions}
          onRebind={(id, key) =>
            setActions(prev =>
              prev.map(a => a.id === id ? { ...a, bindings: [key] } : a)
            )
          }
          onCreateMacro={() => {}}
        />
      </Preferences>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <ClosedCard />
      <InputActiveCard />
      <LookActiveCard />
      <ShortcutsActiveCard />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

type SectionId = 'input' | 'look-and-feel' | 'shortcuts'

function PlaygroundDemo() {
  const { theme, setTheme } = useTheme()
  const [open,    setOpen]    = useState(false)
  const [section, setSection] = useState<SectionId>('input')
  const [actions, setActions] = useState(SHORTCUT_ACTIONS)

  function handleRebind(id: string, key: string) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, bindings: [key] } : a))
  }

  function handleCreateMacro(_name: string, _steps: MacroStep[], _key: string) {}

  function renderPanel() {
    if (section === 'input')         return <InputPanel />
    if (section === 'look-and-feel') return <LookAndFeelPanel themes={THEMES} active={theme} onSelect={setTheme} />
    return <Shortcuts actions={actions} onRebind={handleRebind} onCreateMacro={handleCreateMacro} />
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={BTN_STYLE} onClick={() => setOpen(true)}>
          Open Preferences
        </button>

        <Preferences
          open={open}
          onClose={() => setOpen(false)}
          sections={SECTIONS}
          active={section}
          onSelect={(id) => setSection(id as SectionId)}
        >
          {renderPanel()}
        </Preferences>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle
            checked={section === 'input'}
            onChange={() => setSection('input')}
            size="sm"
            label="Input tab"
          />
          <Toggle
            checked={section === 'look-and-feel'}
            onChange={() => setSection('look-and-feel')}
            size="sm"
            label="Look and feel tab"
          />
          <Toggle
            checked={section === 'shortcuts'}
            onChange={() => setSection('shortcuts')}
            size="sm"
            label="Shortcuts tab"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function PreferencesDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
