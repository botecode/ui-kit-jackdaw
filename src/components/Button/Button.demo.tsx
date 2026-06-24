import { useState } from 'react'
import { ArrowUUpLeft, ArrowUUpRight, FloppyDisk, ShareNetwork } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Button } from './Button'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'Button',
  group: 'Primitives',
  route: '/button',
  order: 9,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default">
        <Button icon={<FloppyDisk size={20} />} onClick={noop}>Save</Button>
      </State>
      <State label="Ghost">
        <Button variant="ghost" icon={<ArrowUUpLeft size={20} />} onClick={noop}>Undo</Button>
      </State>
      <State label="Primary (accent-lit)">
        <Button variant="primary" icon={<ShareNetwork size={20} />} onClick={noop}>Share</Button>
      </State>
      <State label="Label only">
        <Button onClick={noop}>Lyrics</Button>
      </State>
      <State label="Icon only (undo)">
        <Button icon={<ArrowUUpLeft size={20} />} aria-label="Undo" onClick={noop} />
      </State>
      <State label="Icon only (redo)">
        <Button icon={<ArrowUUpRight size={20} />} aria-label="Redo" onClick={noop} />
      </State>
      <State label="Disabled (default)">
        <Button icon={<FloppyDisk size={20} />} disabled onClick={noop}>Save</Button>
      </State>
      <State label="Disabled (ghost)">
        <Button variant="ghost" icon={<ArrowUUpLeft size={20} />} disabled onClick={noop}>Undo</Button>
      </State>
      <State label="Disabled (primary)">
        <Button variant="primary" disabled onClick={noop}>Share</Button>
      </State>
      <State label="sm — default">
        <Button size="sm" icon={<FloppyDisk size={16} />} onClick={noop}>Save</Button>
      </State>
      <State label="sm — primary">
        <Button size="sm" variant="primary" onClick={noop}>Share</Button>
      </State>
      <State label="sm — icon only">
        <Button size="sm" icon={<ArrowUUpLeft size={16} />} aria-label="Undo" onClick={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

type Variant = 'default' | 'ghost' | 'primary'

function PlaygroundDemo() {
  const [variant, setVariant] = useState<Variant>('default')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [showIcon, setShowIcon] = useState(true)
  const [showLabel, setShowLabel] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [clicks, setClicks] = useState(0)

  const iconPx = size === 'sm' ? 16 : 20

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  // Keep an accessible name when the label is hidden (icon-only).
  const ariaLabel = showLabel ? undefined : 'Save'

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
            icon={showIcon ? <FloppyDisk size={iconPx} /> : undefined}
            aria-label={ariaLabel}
            onClick={() => setClicks(c => c + 1)}
          >
            {showLabel ? 'Save' : undefined}
          </Button>
          <span style={{ ...labelStyle, color: 'var(--text-dim)' }}>clicks: {clicks}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            variant
            <select
              value={variant}
              onChange={e => setVariant(e.target.value as Variant)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="default">default</option>
              <option value="ghost">ghost</option>
              <option value="primary">primary</option>
            </select>
          </label>
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36px)</option>
              <option value="sm">sm (28px)</option>
            </select>
          </label>
          <Checkbox checked={showIcon} onChange={setShowIcon} size="sm" label="icon" />
          <Checkbox checked={showLabel} onChange={setShowLabel} size="sm" label="label" />
          <Checkbox checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
