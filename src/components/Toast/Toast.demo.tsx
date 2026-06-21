// src/components/Toast/Toast.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ToastProvider, useToast } from './Toast'
import type { ToastVariant } from './Toast'

export const meta: DemoMeta = {
  name: 'Toast',
  group: 'Primitives',
  route: '/toast',
  order: 17,
}

// ── Shared trigger button style (tokens only) ─────────────────────────────────

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-3)',
  lineHeight: 1,
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
  outline: 'none',
}

// ── States ────────────────────────────────────────────────────────────────────

function InfoState() {
  const { push } = useToast()
  return (
    <State label="Info">
      <button style={TRIGGER} onClick={() => push({ variant: 'info', message: 'Share link copied to clipboard.' })}>
        Fire info toast
      </button>
    </State>
  )
}

function SuccessState() {
  const { push } = useToast()
  return (
    <State label="Success">
      <button style={TRIGGER} onClick={() => push({ variant: 'success', message: 'Project saved.' })}>
        Fire success toast
      </button>
    </State>
  )
}

function ErrorState() {
  const { push } = useToast()
  return (
    <State label="Error">
      <button style={TRIGGER} onClick={() => push({ variant: 'error', message: 'Export failed — check your audio driver.' })}>
        Fire error toast
      </button>
    </State>
  )
}

function WithActionState() {
  const { push, dismiss } = useToast()
  return (
    <State label="With action">
      <button
        style={TRIGGER}
        onClick={() => {
          const id = push({
            variant: 'info',
            message: 'Track deleted.',
            action: { label: 'Undo', onClick: () => dismiss(id) },
          })
        }}
      >
        Fire toast with action
      </button>
    </State>
  )
}

function PersistentState() {
  const { push } = useToast()
  return (
    <State label="Persistent (no auto-dismiss)">
      <button style={TRIGGER} onClick={() => push({ variant: 'error', message: 'Audio interface disconnected.', duration: 0 })}>
        Fire persistent toast
      </button>
    </State>
  )
}

function StackedState() {
  const { push } = useToast()
  function fireStack() {
    push({ variant: 'info',    message: 'Stem 1 exported.',     duration: 6000 })
    push({ variant: 'success', message: 'Stem 2 exported.',     duration: 6000 })
    push({ variant: 'info',    message: 'Stem 3 exported.',     duration: 6000 })
  }
  return (
    <State label="Stacked (3 toasts)">
      <button style={TRIGGER} onClick={fireStack}>
        Fire 3 toasts
      </button>
    </State>
  )
}

function LongMessageState() {
  const { push } = useToast()
  return (
    <State label="Long message">
      <button
        style={TRIGGER}
        onClick={() =>
          push({ variant: 'error', message: 'Bounce failed: insufficient disk space. Free up space and try again.' })
        }
      >
        Fire long message
      </button>
    </State>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <InfoState />
      <SuccessState />
      <ErrorState />
      <WithActionState />
      <PersistentState />
      <StackedState />
      <LongMessageState />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const { push } = useToast()
  const [variant,    setVariant]    = useState<ToastVariant>('info')
  const [withAction, setWithAction] = useState(false)
  const [persistent, setPersistent] = useState(false)

  const MESSAGES: Record<ToastVariant, string> = {
    info:    'Share link copied to clipboard.',
    success: 'Project saved.',
    error:   'Export failed — check your audio driver.',
  }

  function fire() {
    push({
      variant,
      message:  MESSAGES[variant],
      duration: persistent ? 0 : undefined,
      action:   withAction ? { label: 'Undo', onClick: () => {} } : undefined,
    })
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={{ ...TRIGGER, padding: 'var(--space-2) var(--space-4)' }} onClick={fire}>
          Fire toast
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Variant selector */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            variant
            <select
              value={variant}
              onChange={e => setVariant(e.target.value as ToastVariant)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="info">info</option>
              <option value="success">success</option>
              <option value="error">error</option>
            </select>
          </label>

          <Toggle checked={withAction} onChange={setWithAction} size="sm" label="with action" />
          <Toggle checked={persistent} onChange={setPersistent} size="sm" label="persistent (duration=0)" />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export (wraps entire demo in ToastProvider) ───────────────────────

export default function ToastDemo() {
  return (
    <ToastProvider>
      <DemoShell meta={meta}>
        <StatesDemo />
        <PlaygroundDemo />
      </DemoShell>
    </ToastProvider>
  )
}
