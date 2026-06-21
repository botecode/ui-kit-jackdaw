// src/components/Preferences/Preferences.demo.tsx
import { useState } from 'react'
import { Sliders, PaintBrush, Keyboard } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

export const meta: DemoMeta = {
  name: 'Preferences',
  group: 'Composites',
  route: '/preferences',
  order: 22,
}

// ── Default sections used across states ───────────────────────────────────────

const SECTIONS: PreferencesSection[] = [
  { id: 'input',     label: 'Input',       icon: <Sliders size={14} /> },
  { id: 'look-feel', label: 'Look & feel', icon: <PaintBrush size={14} /> },
  { id: 'shortcuts', label: 'Shortcuts',   icon: <Keyboard size={14} /> },
]

// ── Placeholder panel content ──────────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
}

const HEADING: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--text)',
  margin: 0,
}

const BODY: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
  lineHeight: 'var(--leading-base)',
}

const HR: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: 0,
}

function InputPanel() {
  return (
    <div style={PANEL}>
      <p style={HEADING}>Input</p>
      <hr style={HR} />
      <p style={BODY}>
        Configure your audio interface, sample rate, and buffer size. Input devices
        and monitoring settings live here.
      </p>
    </div>
  )
}

function LookFeelPanel() {
  return (
    <div style={PANEL}>
      <p style={HEADING}>Look &amp; feel</p>
      <hr style={HR} />
      <p style={BODY}>
        Theme, display density, and visual preferences. Choose a colour theme and
        adjust the interface to your workflow.
      </p>
    </div>
  )
}

function ShortcutsPanel() {
  return (
    <div style={PANEL}>
      <p style={HEADING}>Shortcuts</p>
      <hr style={HR} />
      <p style={BODY}>
        Keyboard shortcuts and MIDI mapping. Customise transport controls, edit
        operations, and navigation to match your muscle memory.
      </p>
    </div>
  )
}

function panelFor(id: string) {
  if (id === 'look-feel') return <LookFeelPanel />
  if (id === 'shortcuts') return <ShortcutsPanel />
  return <InputPanel />
}

// ── Trigger button (demo-only) ────────────────────────────────────────────────

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
  outline: 'none',
}

// ── State cards ───────────────────────────────────────────────────────────────

function OpenInputCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('input')
  return (
    <State label="Open — Input active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Open Preferences</button>
      <Preferences open={open} onClose={() => setOpen(false)} sections={SECTIONS} active={active} onSelect={setActive}>
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function OpenLookFeelCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('look-feel')
  return (
    <State label="Open — Look & feel active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Open → Look &amp; feel</button>
      <Preferences open={open} onClose={() => setOpen(false)} sections={SECTIONS} active={active} onSelect={setActive}>
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function OpenShortcutsCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('shortcuts')
  return (
    <State label="Open — Shortcuts active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Open → Shortcuts</button>
      <Preferences open={open} onClose={() => setOpen(false)} sections={SECTIONS} active={active} onSelect={setActive}>
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function ClosedCard() {
  return (
    <State label="Closed (open=false — dialog not mounted)">
      <button style={{ ...TRIGGER, opacity: 0.5, cursor: 'not-allowed' }} disabled>
        Open Preferences
      </button>
      <Preferences open={false} onClose={() => {}} sections={SECTIONS} active="input" onSelect={() => {}}>
        <InputPanel />
      </Preferences>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <OpenInputCard />
      <OpenLookFeelCard />
      <OpenShortcutsCard />
      <ClosedCard />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open, setOpen]     = useState(false)
  const [active, setActive] = useState('input')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={() => setOpen(true)}>
          Open Preferences
        </button>

        <Preferences
          open={open}
          onClose={() => setOpen(false)}
          sections={SECTIONS}
          active={active}
          onSelect={setActive}
        >
          {panelFor(active)}
        </Preferences>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={open} onChange={setOpen} size="sm" label="open" />
          {SECTIONS.map(s => (
            <Toggle
              key={s.id}
              checked={active === s.id}
              onChange={v => { if (v) setActive(s.id) }}
              size="sm"
              label={s.label}
            />
          ))}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function PreferencesDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
