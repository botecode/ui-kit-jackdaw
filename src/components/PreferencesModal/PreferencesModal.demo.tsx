// src/components/PreferencesModal/PreferencesModal.demo.tsx
import { useState } from 'react'
import { Plugs, PaintBrush, Keyboard } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { PreferencesModal } from './PreferencesModal'
import type { PreferencesSection } from './PreferencesModal'

export const meta: DemoMeta = {
  name: 'PreferencesModal',
  group: 'Composites',
  route: '/preferences-modal',
  order: 25,
}

// ── Section list used across all demos ────────────────────────────────────────

const SECTIONS: PreferencesSection[] = [
  { id: 'input',     label: 'Input',         icon: <Plugs      size={14} weight="regular" aria-hidden="true" /> },
  { id: 'look-feel', label: 'Look and feel', icon: <PaintBrush size={14} weight="regular" aria-hidden="true" /> },
  { id: 'shortcuts', label: 'Shortcuts',     icon: <Keyboard   size={14} weight="regular" aria-hidden="true" /> },
]

// ── Stub panels (demo-only; real panels are separate spec cards) ──────────────

const PANEL_HEADING: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--weight-bold)',
  color: 'var(--text)',
  margin: '0 0 var(--space-3)',
  lineHeight: 'var(--leading-base)',
}

const PANEL_BODY: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  lineHeight: 'var(--leading-base)',
  margin: '0 0 var(--space-6)',
}

const PANEL_PLACEHOLDER: React.CSSProperties = {
  height: 180,
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-dim)',
}

function InputPanel() {
  return (
    <div>
      <h3 style={PANEL_HEADING}>Input</h3>
      <p style={PANEL_BODY}>
        MIDI and audio input device routing will appear here. This stub represents the Input
        panel card — a separate spec card to pair with this shell.
      </p>
      <div style={PANEL_PLACEHOLDER}>[ Input panel placeholder ]</div>
    </div>
  )
}

function LookAndFeelPanel() {
  return (
    <div>
      <h3 style={PANEL_HEADING}>Look and feel</h3>
      <p style={PANEL_BODY}>
        Theme selection, accent color, and density settings will appear here.
      </p>
      <div style={PANEL_PLACEHOLDER}>[ Look and feel panel placeholder ]</div>
    </div>
  )
}

function ShortcutsPanel() {
  return (
    <div>
      <h3 style={PANEL_HEADING}>Shortcuts</h3>
      <p style={PANEL_BODY}>
        Keyboard shortcut bindings grouped by context (Transport, Edit, View) will appear here.
      </p>
      <div style={PANEL_PLACEHOLDER}>[ Shortcuts panel placeholder ]</div>
    </div>
  )
}

function panelForSection(id: string) {
  if (id === 'input')     return <InputPanel />
  if (id === 'look-feel') return <LookAndFeelPanel />
  return <ShortcutsPanel />
}

// ── Trigger button (kit tokens; no hardcoded colors) ──────────────────────────

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  lineHeight: 1,
  outline: 'none',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
}

// ── State cards ───────────────────────────────────────────────────────────────

function InputActiveCard() {
  const [open, setOpen]   = useState(false)
  const [active, setActive] = useState('input')
  return (
    <State label="Open — Input section active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        Open Preferences (Input)
      </button>
      <PreferencesModal
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelForSection(active)}
      </PreferencesModal>
    </State>
  )
}

function LookFeelActiveCard() {
  const [open, setOpen]   = useState(false)
  const [active, setActive] = useState('look-feel')
  return (
    <State label="Open — Look and feel section active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        Open Preferences (Look and feel)
      </button>
      <PreferencesModal
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelForSection(active)}
      </PreferencesModal>
    </State>
  )
}

function ShortcutsActiveCard() {
  const [open, setOpen]   = useState(false)
  const [active, setActive] = useState('shortcuts')
  return (
    <State label="Open — Shortcuts section active">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        Open Preferences (Shortcuts)
      </button>
      <PreferencesModal
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelForSection(active)}
      </PreferencesModal>
    </State>
  )
}

function ClosedCard() {
  return (
    <State label="Closed (open=false — no DOM output)">
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
        Nothing rendered when closed
      </span>
      <PreferencesModal
        open={false}
        onClose={() => {}}
        sections={SECTIONS}
        active="input"
        onSelect={() => {}}
      >
        <InputPanel />
      </PreferencesModal>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <InputActiveCard />
      <LookFeelActiveCard />
      <ShortcutsActiveCard />
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
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={() => setOpen(true)}>
          Open Preferences
        </button>
        <Toggle
          checked={open}
          onChange={(v) => setOpen(v)}
          size="sm"
          label="open"
        />
      </div>

      <PreferencesModal
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelForSection(active)}
      </PreferencesModal>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function PreferencesModalDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
