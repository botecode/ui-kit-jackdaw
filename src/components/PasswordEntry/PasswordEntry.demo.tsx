// src/components/PasswordEntry/PasswordEntry.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { PasswordEntry } from './PasswordEntry'
import type { PasswordEntryMode } from './PasswordEntry'

export const meta: DemoMeta = {
  name: 'PasswordEntry',
  group: 'Composites',
  route: '/password-entry',
  order: 51,
}

const NOOP = () => {}

// Each card owns its own value so the masked field is interactive in the gallery.
function Card({ label, mode, initial = '', error, disabled }: {
  label: string
  mode: PasswordEntryMode
  initial?: string
  error?: string | boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <State label={label}>
      <div style={{ minWidth: 240 }}>
        <PasswordEntry
          mode={mode}
          value={value}
          onChange={setValue}
          onSubmit={NOOP}
          error={error}
          disabled={disabled}
        />
      </div>
    </State>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      {/* default (enter, empty → submit disabled) */}
      <Card label="enter · default (empty)" mode="enter" />
      {/* filled → submit enabled (focus/active reachable via Tab + click) */}
      <Card label="enter · filled" mode="enter" initial="correcthorse" />
      {/* error / retry */}
      <Card label="enter · wrong password (retry)" mode="enter" initial="nope" error="Wrong password — try again." />
      {/* set mode (sender) */}
      <Card label="set · default" mode="set" />
      <Card label="set · filled" mode="set" initial="open-sesame" />
      {/* disabled */}
      <Card label="disabled" mode="enter" initial="locked" disabled />
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [value, setValue]   = useState('hunter2')
  const [mode, setMode]     = useState<PasswordEntryMode>('enter')
  const [showErr, setShowErr] = useState(false)
  const [disabled, setDisabled] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260 }}>
          <PasswordEntry
            mode={mode}
            value={value}
            onChange={setValue}
            onSubmit={NOOP}
            error={showErr ? 'Wrong password — try again.' : undefined}
            disabled={disabled}
          />
        </div>

        {/* Controls — dogfood Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <Toggle checked={mode === 'set'} onChange={(v) => setMode(v ? 'set' : 'enter')} size="sm" label="set mode" />
          <Toggle checked={showErr} onChange={setShowErr} size="sm" label="wrong password" />
          <Toggle checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
        </div>
      </div>
    </Playground>
  )
}

export default function PasswordEntryDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
