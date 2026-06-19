// src/components/InputSelect/InputSelect.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { InputSelect } from './InputSelect'
import type { InputSelectOption } from './InputSelect'

export const meta: DemoMeta = {
  name: 'InputSelect',
  group: 'Primitives',
  route: '/input-select',
  order: 7,
}

const BASIC_OPTIONS: InputSelectOption[] = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
  { id: 'in-3', label: 'Input 3 (Guitar)' },
  { id: 'in-4', label: 'Input 4' },
]

const LONG_OPTIONS: InputSelectOption[] = Array.from({ length: 20 }, (_, i) => ({
  id: `in-${i + 1}`,
  label: i === 0 ? 'Input 1 (Vocal mic)' : `Input ${i + 1}`,
}))

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      {/* ── field variant column ── */}
      <State label="field · empty">
        <div style={{ width: 180 }}>
          <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} />
        </div>
      </State>
      <State label="field · selected">
        <div style={{ width: 180 }}>
          <InputSelect value="in-3" onChange={noop} options={BASIC_OPTIONS} />
        </div>
      </State>
      <State label="field · IN tag">
        <div style={{ width: 180 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} showInTag />
        </div>
      </State>
      <State label="field · sm">
        <div style={{ width: 160 }}>
          <InputSelect value="in-2" onChange={noop} options={BASIC_OPTIONS} size="sm" />
        </div>
      </State>
      <State label="field · disabled">
        <div style={{ width: 180 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} disabled />
        </div>
      </State>
      <State label="field · focus">
        <div style={{ width: 180 }}>
          <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} aria-label="Focus demo" />
        </div>
      </State>

      {/* ── chip variant column ── */}
      <State label="chip · empty">
        <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} variant="chip" />
      </State>
      <State label="chip · selected">
        <InputSelect value="in-3" onChange={noop} options={BASIC_OPTIONS} variant="chip" />
      </State>
      <State label="chip · disabled">
        <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} variant="chip" disabled />
      </State>

      {/* ── chip in mock track corner (FX chip sibling) ── */}
      <State label="chip in track corner">
        <div
          style={{
            width: 200,
            height: 36,
            background: 'var(--strip-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-1)',
            padding: '0 var(--space-2)',
          }}
        >
          {/* Fake FX chip for sibling comparison */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            REVERB
          </div>
          <InputSelect value="in-2" onChange={noop} options={BASIC_OPTIONS} variant="chip" aria-label="Audio input" />
        </div>
      </State>

      {/* ── open states last — portaled dropdowns float past the grid edge ── */}
      <State label="field · open">
        <div style={{ width: 180, paddingBottom: 140 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} defaultOpen />
        </div>
      </State>
      <State label="chip · open">
        <div style={{ paddingBottom: 140 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} variant="chip" defaultOpen />
        </div>
      </State>
      <State label="field · long list">
        <div style={{ width: 180, paddingBottom: 220 }}>
          <InputSelect value="in-1" onChange={noop} options={LONG_OPTIONS} defaultOpen />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState<string | null>('in-1')
  const [variant, setVariant] = useState<'field' | 'chip'>('field')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [showInTag, setShowInTag] = useState(false)
  const [optionCount, setOptionCount] = useState(4)

  const options = LONG_OPTIONS.slice(0, optionCount)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ minWidth: 200 }}>
          <InputSelect
            value={value}
            onChange={v => setValue(v)}
            options={options}
            variant={variant}
            size={size}
            disabled={disabled}
            showInTag={showInTag}
            aria-label="Playground input select"
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={variant === 'chip'}
            onChange={next => setVariant(next ? 'chip' : 'field')}
            size="sm"
            label="variant=chip"
          />
          <Toggle
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size=sm"
          />
          <Toggle
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={showInTag}
            onChange={setShowInTag}
            size="sm"
            label="showInTag (field only)"
          />
          <Toggle
            checked={value === null}
            onChange={next => setValue(next ? null : 'in-1')}
            size="sm"
            label="no selection (placeholder)"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            options
            <Fader
              value={optionCount}
              onChange={v => setOptionCount(Math.round(v))}
              min={1}
              max={20}
              step={1}
              orientation="horizontal"
              size="sm"
              aria-label="Option count"
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '2ch', textAlign: 'right' }}>{optionCount}</span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function InputSelectDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
