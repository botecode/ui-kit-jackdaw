// src/components/Dialog/Dialog.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Dialog } from './Dialog'

export const meta: DemoMeta = {
  name: 'Dialog',
  group: 'Composites',
  route: '/dialog',
  order: 20,
}

// ── Action button styles (kit tokens; no hardcoded colors) ───────────────────

const BTN_BASE: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  lineHeight: 1,
  outline: 'none',
}

const BTN_SECONDARY: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--stage)',
  color: 'var(--stage-text)',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
}

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--accent)',
  color: 'var(--accent-contrast)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
}

const BTN_DANGER: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--danger)',
  color: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
}

const TRIGGER_STYLE: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
}

// ── State cards ───────────────────────────────────────────────────────────────

function DefaultCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Default (md, dismissible)">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Save changes?"
        actions={
          <>
            <button style={BTN_SECONDARY} onClick={() => setOpen(false)}>Cancel</button>
            <button style={BTN_PRIMARY}   onClick={() => setOpen(false)}>Save</button>
          </>
        }
      >
        <p>You have unsaved changes. Would you like to save them before leaving?</p>
      </Dialog>
    </State>
  )
}

function SmCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sm size">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open small dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Rename track"
        size="sm"
        actions={
          <>
            <button style={BTN_SECONDARY} onClick={() => setOpen(false)}>Cancel</button>
            <button style={BTN_PRIMARY}   onClick={() => setOpen(false)}>Rename</button>
          </>
        }
      >
        <p>Enter a new name for this track.</p>
      </Dialog>
    </State>
  )
}

function NonDismissibleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Non-dismissible (scrim click ignored)">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open (no scrim close)
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Exporting audio…"
        dismissible={false}
        actions={
          <button style={BTN_SECONDARY} onClick={() => setOpen(false)}>
            Cancel export
          </button>
        }
      >
        <p>Click the scrim — nothing happens. Use the button or Esc to close.</p>
      </Dialog>
    </State>
  )
}

function LongBodyCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Long body (scrolls within)">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open long dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="About Jackdaw"
        actions={
          <button style={BTN_PRIMARY} onClick={() => setOpen(false)}>Close</button>
        }
      >
        {Array.from({ length: 8 }, (_, i) => (
          <p key={i} style={{ marginTop: i > 0 ? 'var(--space-3)' : 0 }}>
            Jackdaw is a songwriter's DAW built for intuitive, fast capture of musical
            ideas. It emphasizes feel over precision editing. Paragraph {i + 1} of 8 —
            scroll the body to see overflow contained within the dialog.
          </p>
        ))}
      </Dialog>
    </State>
  )
}

function DestructiveCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Destructive confirm">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Delete track…
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete track?"
        actions={
          <>
            <button style={BTN_DANGER}  onClick={() => setOpen(false)}>Delete</button>
            <button style={BTN_PRIMARY} onClick={() => setOpen(false)}>Keep</button>
          </>
        }
      >
        <p>
          <strong>Drums</strong> and all its clips will be permanently deleted.
          This cannot be undone.
        </p>
      </Dialog>
    </State>
  )
}

function NoTitleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="No title (aria-label fallback)">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open titleless
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-label="Quick action dialog"
        actions={
          <>
            <button style={BTN_SECONDARY} onClick={() => setOpen(false)}>Cancel</button>
            <button style={BTN_PRIMARY}   onClick={() => setOpen(false)}>OK</button>
          </>
        }
      >
        <p>No title rendered. <code>aria-label</code> labels the dialog for screen readers.</p>
      </Dialog>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <DefaultCard />
      <SmCard />
      <NonDismissibleCard />
      <LongBodyCard />
      <DestructiveCard />
      <NoTitleCard />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,        setOpen]        = useState(false)
  const [size,        setSize]        = useState<'sm' | 'md'>('md')
  const [dismissible, setDismissible] = useState(true)
  const [destructive, setDestructive] = useState(false)

  const title = destructive ? 'Delete project?' : 'Save changes?'
  const body  = destructive
    ? 'This will permanently delete the project and all its clips. This cannot be undone.'
    : 'You have unsaved changes. Would you like to save them before leaving?'

  const actions = destructive
    ? (
        <>
          <button style={BTN_DANGER}  onClick={() => setOpen(false)}>Delete</button>
          <button style={BTN_PRIMARY} onClick={() => setOpen(false)}>Keep</button>
        </>
      )
    : (
        <>
          <button style={BTN_SECONDARY} onClick={() => setOpen(false)}>Cancel</button>
          <button style={BTN_PRIMARY}   onClick={() => setOpen(false)}>Save</button>
        </>
      )

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
          Open dialog
        </button>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          size={size}
          dismissible={dismissible}
          actions={actions}
        >
          <p>{body}</p>
        </Dialog>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={size === 'sm'}  onChange={(v) => setSize(v ? 'sm' : 'md')}  size="sm" label="sm size" />
          <Toggle checked={!dismissible}   onChange={(v) => setDismissible(!v)}          size="sm" label="non-dismissible" />
          <Toggle checked={destructive}    onChange={setDestructive}                     size="sm" label="destructive" />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function DialogDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
