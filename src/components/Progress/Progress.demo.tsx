// src/components/Progress/Progress.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Progress } from './Progress'

export const meta: DemoMeta = {
  name: 'Progress',
  group: 'Primitives',
  route: '/progress',
  order: 16,
}

// ── Bar states ─────────────────────────────────────────────────────────────

function BarStates() {
  return (
    <StatesGrid>
      <State label="Bar 0%">
        <div style={{ width: 200 }}>
          <Progress value={0} aria-label="0%" />
        </div>
      </State>
      <State label="Bar 40%">
        <div style={{ width: 200 }}>
          <Progress value={0.4} aria-label="40%" />
        </div>
      </State>
      <State label="Bar 100%">
        <div style={{ width: 200 }}>
          <Progress value={1} aria-label="100%" />
        </div>
      </State>
      <State label="Bar indeterminate">
        <div style={{ width: 200 }}>
          <Progress aria-label="Loading" />
        </div>
      </State>
      <State label="Bar with label">
        <div style={{ width: 200 }}>
          <Progress value={0.6} label="Scanning plugins… 60%" />
        </div>
      </State>
      <State label="Bar sm 40%">
        <div style={{ width: 200 }}>
          <Progress value={0.4} size="sm" aria-label="40% small" />
        </div>
      </State>
      <State label="Bar sm indeterminate">
        <div style={{ width: 200 }}>
          <Progress size="sm" aria-label="Loading small" />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Ring states ────────────────────────────────────────────────────────────

const RING_STATES: { label: string; value?: number; size: 'sm' | 'md' }[] = [
  { label: 'Ring 0%',    value: 0,         size: 'md' },
  { label: 'Ring 40%',   value: 0.4,       size: 'md' },
  { label: 'Ring 100%',  value: 1,         size: 'md' },
  { label: 'Indet. md',  value: undefined, size: 'md' },
  { label: 'Ring sm 0%', value: 0,         size: 'sm' },
  { label: 'Ring sm 40%',value: 0.4,       size: 'sm' },
  { label: 'Ring sm 100%',value: 1,        size: 'sm' },
  { label: 'Indet. sm',  value: undefined, size: 'sm' },
]

function RingStates() {
  return (
    <section style={{ marginTop: 'var(--space-6)' }}>
      <h2 style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 'var(--space-4)',
        marginTop: 0,
      }}>
        Ring variant
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {RING_STATES.map(({ label, value, size }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Progress variant="ring" value={value} size={size} aria-label={label} />
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
            }}>
              {label}
            </span>
          </div>
        ))}
        {/* Ring with label prop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Progress variant="ring" value={0.75} label="Exporting…" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
            Ring + label
          </span>
        </div>
      </div>
    </section>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [isRing, setIsRing]             = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [isSm, setIsSm]                 = useState(false)
  const [showLabel, setShowLabel]       = useState(false)
  const [rawValue, setRawValue]         = useState(0.4)

  const variant  = isRing ? 'ring' : 'bar'
  const size     = isSm   ? 'sm'   : 'md'
  const value    = indeterminate ? undefined : rawValue
  const label    = showLabel ? 'Rendering…' : undefined
  const ariaLabel = showLabel ? undefined : 'Progress playground'

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ flex: '1 1 200px', minWidth: 0, paddingTop: 'var(--space-2)' }}>
          <Progress variant={variant} value={value} size={size} label={label} aria-label={ariaLabel} />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={isRing}        onChange={setIsRing}        size="sm" label="ring variant"   />
          <Toggle checked={indeterminate} onChange={setIndeterminate} size="sm" label="indeterminate"  />
          <Toggle checked={isSm}          onChange={setIsSm}          size="sm" label="size sm"         />
          <Toggle checked={showLabel}     onChange={setShowLabel}     size="sm" label="show label"      />

          {!indeterminate && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}>
              value
              <input
                type="range"
                min={0} max={1} step={0.01}
                value={rawValue}
                onChange={e => setRawValue(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-dim)',
                minWidth: 32,
              }}>
                {Math.round(rawValue * 100)}%
              </span>
            </label>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ──────────────────────────────────────────────────────────

export default function ProgressDemo() {
  return (
    <DemoShell meta={meta}>
      <BarStates />
      <RingStates />
      <PlaygroundDemo />
    </DemoShell>
  )
}
