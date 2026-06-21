// src/components/Badge/Badge.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Badge } from './Badge'
import type { BadgeTone, BadgeVariant } from './Badge'

export const meta: DemoMeta = {
  name: 'Badge',
  group: 'Primitives',
  route: '/badge',
  order: 5,
}

// ─── Variant states ───────────────────────────────────────────────────────────

function VariantsDemo() {
  return (
    <StatesGrid>
      <State label="count · 1 digit">
        <Badge variant="count" count={7} />
      </State>
      <State label="count · 2 digits">
        <Badge variant="count" count={42} />
      </State>
      <State label="count · 99+">
        <Badge variant="count" count={128} />
      </State>
      <State label="dot">
        <Badge variant="dot" aria-label="Inactive" />
      </State>
      <State label="label · short">
        <Badge variant="label">NEW</Badge>
      </State>
      <State label="label · word">
        <Badge variant="label">BETA</Badge>
      </State>
    </StatesGrid>
  )
}

// ─── Tones grid ───────────────────────────────────────────────────────────────

function TonesDemo() {
  const tones: BadgeTone[] = ['default', 'accent', 'red', 'amber', 'green']

  return (
    <StatesGrid>
      {tones.map(tone => (
        <State key={`count-${tone}`} label={`count · ${tone}`}>
          <Badge variant="count" count={7} tone={tone} />
        </State>
      ))}
      {tones.map(tone => (
        <State key={`dot-${tone}`} label={`dot · ${tone}`}>
          <Badge variant="dot" tone={tone} aria-label={`${tone} dot`} />
        </State>
      ))}
      {tones.map(tone => (
        <State key={`label-${tone}`} label={`label · ${tone}`}>
          <Badge variant="label" tone={tone}>LIVE</Badge>
        </State>
      ))}
    </StatesGrid>
  )
}

// ─── Sizes grid ───────────────────────────────────────────────────────────────

function SizesDemo() {
  return (
    <StatesGrid>
      <State label="count · md">
        <Badge variant="count" count={12} size="md" />
      </State>
      <State label="dot · md">
        <Badge variant="dot" size="md" aria-label="md dot" />
      </State>
      <State label="label · md">
        <Badge variant="label" size="md">PRO</Badge>
      </State>
      <State label="count · sm">
        <Badge variant="count" count={12} size="sm" />
      </State>
      <State label="dot · sm">
        <Badge variant="dot" size="sm" aria-label="sm dot" />
      </State>
      <State label="label · sm">
        <Badge variant="label" size="sm">PRO</Badge>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

const controlLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
}

function PlaygroundDemo() {
  const [variant, setVariant]   = useState<BadgeVariant>('count')
  const [tone, setTone]         = useState<BadgeTone>('default')
  const [size, setSize]         = useState<'sm' | 'md'>('md')
  const [count, setCount]       = useState(7)
  const [overflow, setOverflow] = useState(false)

  const effectiveCount = overflow ? 128 : count

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        {/* Live instance */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 60, justifyContent: 'center' }}>
          {variant === 'count' && (
            <Badge variant="count" count={effectiveCount} tone={tone} size={size} />
          )}
          {variant === 'dot' && (
            <Badge variant="dot" tone={tone} size={size} aria-label="Playground dot" />
          )}
          {variant === 'label' && (
            <Badge variant="label" tone={tone} size={size}>LIVE</Badge>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={controlLabel}>
            variant
            <select value={variant} onChange={e => setVariant(e.target.value as BadgeVariant)} style={selectStyle}>
              <option value="count">count</option>
              <option value="dot">dot</option>
              <option value="label">label</option>
            </select>
          </label>
          <label style={controlLabel}>
            tone
            <select value={tone} onChange={e => setTone(e.target.value as BadgeTone)} style={selectStyle}>
              <option value="default">default</option>
              <option value="accent">accent</option>
              <option value="red">red</option>
              <option value="amber">amber</option>
              <option value="green">green</option>
            </select>
          </label>
          <label style={controlLabel}>
            size
            <select value={size} onChange={e => setSize(e.target.value as 'sm' | 'md')} style={selectStyle}>
              <option value="md">md</option>
              <option value="sm">sm</option>
            </select>
          </label>
          {variant === 'count' && (
            <>
              <label style={controlLabel}>
                count
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={count}
                  onChange={e => setCount(Number(e.target.value))}
                  style={{ ...selectStyle, width: 60 }}
                />
              </label>
              <Toggle
                checked={overflow}
                onChange={setOverflow}
                size="sm"
                label="force 99+ overflow"
              />
            </>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function BadgeDemo() {
  return (
    <DemoShell meta={meta}>
      <VariantsDemo />
      <TonesDemo />
      <SizesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
