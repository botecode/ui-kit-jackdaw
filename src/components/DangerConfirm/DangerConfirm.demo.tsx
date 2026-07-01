// src/components/DangerConfirm/DangerConfirm.demo.tsx
import { useState } from 'react'
import { Trash } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Button } from '../Button'
import { DangerConfirm } from './DangerConfirm'

export const meta: DemoMeta = {
  name: 'DangerConfirm',
  group: 'Composites',
  route: '/danger-confirm',
  order: 21,
}

// A single opened-from-a-trigger example. The trigger is a kit Button (dogfood);
// the DangerConfirm portals over the whole gallery like it would in the app.
// The type-to-confirm field renders tone="surface" (paper), not the default
// stage well — check the gated cards in a light theme (Chroma): the input must
// read as a light recessed field with ink text, never a black box on cream.
function ConfirmCard({
  label,
  title,
  message,
  destructiveLabel,
  confirmPhrase,
}: {
  label: string
  title: string
  message: React.ReactNode
  destructiveLabel: string
  confirmPhrase?: string
}) {
  const [open, setOpen] = useState(false)
  const [lastAction, setLastAction] = useState<'confirmed' | 'cancelled' | null>(null)

  return (
    <State label={label}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <Button
          variant="default"
          size="sm"
          icon={<Trash size={16} />}
          onClick={() => { setOpen(true); setLastAction(null) }}
        >
          {destructiveLabel}…
        </Button>
        {lastAction && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
            {lastAction}
          </span>
        )}
      </div>
      <DangerConfirm
        open={open}
        title={title}
        message={message}
        destructiveLabel={destructiveLabel}
        confirmPhrase={confirmPhrase}
        onConfirm={() => { setOpen(false); setLastAction('confirmed') }}
        onCancel={() => { setOpen(false); setLastAction('cancelled') }}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <ConfirmCard
        label="Plain confirm (button live)"
        title="Discard take?"
        message="This take hasn't been saved. Discarding it can't be undone."
        destructiveLabel="Discard take"
      />
      <ConfirmCard
        label="Type-to-confirm (button gated)"
        title="Delete song?"
        message="This can't be undone — every track, take and note will be lost."
        destructiveLabel="Delete song"
        confirmPhrase="delete My Song"
      />
      <ConfirmCard
        label="Type-to-confirm — short phrase"
        title="Clear all ideas?"
        message="Every idea in this library will be permanently removed."
        destructiveLabel="Clear library"
        confirmPhrase="clear"
      />
      <ConfirmCard
        label="Long consequence copy"
        title="Delete project?"
        message={
          <>
            This permanently deletes <b>Midnight Sessions</b> — all 14 tracks, their
            takes, comments and exports. Collaborators will lose access immediately.
            This cannot be undone.
          </>
        }
        destructiveLabel="Delete project"
        confirmPhrase="Midnight Sessions"
      />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open, setOpen] = useState(false)
  const [gated, setGated] = useState(true)
  const [result, setResult] = useState<'confirmed' | 'cancelled' | null>(null)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <Button variant="default" icon={<Trash size={20} />} onClick={() => { setOpen(true); setResult(null) }}>
            Delete song…
          </Button>
          {result && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
              onConfirm / onCancel → {result}
            </span>
          )}
        </div>

        <DangerConfirm
          open={open}
          title="Delete song?"
          message="This can't be undone — everything will be lost."
          destructiveLabel="Delete song"
          confirmPhrase={gated ? 'delete My Song' : undefined}
          onConfirm={() => { setOpen(false); setResult('confirmed') }}
          onCancel={() => { setOpen(false); setResult('cancelled') }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={gated} onChange={setGated} size="sm" label="type-to-confirm" />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function DangerConfirmDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
