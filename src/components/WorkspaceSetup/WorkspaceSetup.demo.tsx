// src/components/WorkspaceSetup/WorkspaceSetup.demo.tsx
import { useState } from 'react'
import type { DemoMeta }     from '../../gallery/registry'
import { DemoShell }         from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }        from '../../gallery/ui/Playground'
import { Toggle }            from '../Toggle'
import { WorkspaceSetup, OTHER_TYPE } from './WorkspaceSetup'
import type { WorkspaceSetupValue, WorkspaceSetupMode } from './WorkspaceSetup'

export const meta: DemoMeta = {
  name:  'WorkspaceSetup',
  group: 'Composites',
  route: '/workspace-setup',
  order: 83,
}

// Kit-token trigger — the dialog portals a full-viewport scrim, so each State
// opens on click rather than rendering inline (rendering N open dialogs would
// stack their scrims). Matches the ExportDialog demo pattern.
const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  lineHeight: 1,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
}

function base(over: Partial<WorkspaceSetupValue> = {}): WorkspaceSetupValue {
  return { userName: '', workspaceName: '', type: 'solo', customType: '', ...over }
}

// A self-contained state card: a trigger that opens a live, controlled dialog.
function SetupCard({
  label, trigger, mode, initial, error, size,
}: {
  label:    string
  trigger:  string
  mode:     WorkspaceSetupMode
  initial:  WorkspaceSetupValue
  error?:   string
  size?:    'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initial)
  return (
    <State label={label}>
      <button style={TRIGGER} onClick={() => setOpen(true)}>{trigger}</button>
      <WorkspaceSetup
        open={open}
        mode={mode}
        value={value}
        error={error}
        size={size}
        onChange={setValue}
        onSubmit={() => setOpen(false)}
        onClose={() => setOpen(false)}
      />
    </State>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <SetupCard
        label="Default — first-run, empty (CTA disabled until filled)"
        trigger="Welcome…" mode="first-run" initial={base({ type: '' })}
      />
      <SetupCard
        label="Selected — first-run, ready (name + workspace + type)"
        trigger="Welcome (ready)…" mode="first-run"
        initial={base({ userName: 'Fernando', workspaceName: 'Debut EP', type: 'band' })}
      />
      <SetupCard
        label="Active — new workspace (name field hidden, Cancel + Create)"
        trigger="New workspace…" mode="new"
        initial={base({ workspaceName: 'B-sides', type: 'solo' })}
      />
      <SetupCard
        label="Custom / other — the free-text type field is revealed"
        trigger="Custom type…" mode="first-run"
        initial={base({ userName: 'Fernando', workspaceName: 'Choir Sessions', type: OTHER_TYPE, customType: 'Choir' })}
      />
      <SetupCard
        label="Error — host rejected the name (duplicate)"
        trigger="Duplicate name…" mode="new"
        initial={base({ workspaceName: 'Debut EP', type: 'solo' })}
        error="A workspace named “Debut EP” already exists."
      />
      <SetupCard
        label="Empty — new workspace, nothing typed (CTA disabled)"
        trigger="Empty form…" mode="new" initial={base({ type: '' })}
      />
      <SetupCard
        label="sm — compact first-run"
        trigger="Compact…" mode="first-run" size="sm"
        initial={base({ userName: 'Fernando', workspaceName: 'Debut EP', type: 'duo' })}
      />
      <SetupCard
        label="Disabled CTA — only a name (workspace still needed)"
        trigger="Half-filled…" mode="first-run"
        initial={base({ userName: 'Fernando', workspaceName: '', type: 'solo' })}
      />
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [mode, setMode] = useState<WorkspaceSetupMode>('first-run')
  const [open, setOpen] = useState(false)
  const [val,  setVal]  = useState<WorkspaceSetupValue>(base({ userName: 'Fernando' }))
  const [submitted, setSubmitted] = useState('—')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={mode === 'new'}
            onChange={c => setMode(c ? 'new' : 'first-run')}
            size="sm"
            label="new-workspace mode"
          />
          <button style={TRIGGER} onClick={() => setOpen(true)}>Open setup…</button>
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
          }}>
            <span>user: <span style={{ color: 'var(--text)' }}>{val.userName || '∅'}</span></span>
            <span>workspace: <span style={{ color: 'var(--text)' }}>{val.workspaceName || '∅'}</span></span>
            <span>type: <span style={{ color: 'var(--text)' }}>{val.type === OTHER_TYPE ? `other:${val.customType || '∅'}` : val.type}</span></span>
            <span>submitted: <span style={{ color: 'var(--text)' }}>{submitted}</span></span>
          </div>
        </div>

        <WorkspaceSetup
          open={open}
          mode={mode}
          value={val}
          onChange={setVal}
          onSubmit={v => { setSubmitted(`${v.workspaceName} (${v.type})`); setOpen(false) }}
          onClose={() => setOpen(false)}
        />
      </div>
    </Playground>
  )
}

export default function WorkspaceSetupDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
