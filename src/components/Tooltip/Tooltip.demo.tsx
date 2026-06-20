// src/components/Tooltip/Tooltip.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }         from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }        from '../../gallery/ui/Playground'
import { Tooltip }           from './Tooltip'
import type { TooltipPlacement } from './Tooltip'
import { Toggle }            from '../Toggle'
import { ArmButton }         from '../ArmButton'

export const meta: DemoMeta = {
  name:  'Tooltip',
  group: 'Primitives',
  route: '/tooltip',
  order: 15,
}

// Plain button styled with tokens — used as the demo trigger throughout.
const triggerStyle: React.CSSProperties = {
  fontFamily:   'var(--font-ui)',
  fontSize:     'var(--text-sm)',
  fontWeight:   'var(--weight-medium)',
  padding:      'var(--space-1) var(--space-3)',
  background:   'var(--surface)',
  color:        'var(--text)',
  border:       '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor:       'pointer',
  outline:      'none',
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Hidden (default)">
        <Tooltip content="No action needed">
          <button style={triggerStyle}>Hover me</button>
        </Tooltip>
      </State>

      <State label="Visible (focus)">
        {/* autoFocus → onFocus fires immediately → tooltip shows without delay */}
        <Tooltip content="Keyboard focus shows immediately" delay={0}>
          <button style={triggerStyle} autoFocus>Focused</button>
        </Tooltip>
      </State>

      <State label="Placement: top (default)">
        <Tooltip content="Above the trigger" placement="top">
          <button style={triggerStyle}>Top</button>
        </Tooltip>
      </State>

      <State label="Placement: bottom">
        <Tooltip content="Below the trigger" placement="bottom">
          <button style={triggerStyle}>Bottom</button>
        </Tooltip>
      </State>

      <State label="Placement: left">
        <Tooltip content="Left side" placement="left">
          <button style={triggerStyle}>Left</button>
        </Tooltip>
      </State>

      <State label="Placement: right">
        <Tooltip content="Right side" placement="right">
          <button style={triggerStyle}>Right</button>
        </Tooltip>
      </State>

      <State label="Long content (wraps)">
        <Tooltip content="This is a much longer tooltip label that wraps to a second line because it exceeds the 240 px max-width of the bubble.">
          <button style={triggerStyle}>Long content</button>
        </Tooltip>
      </State>

      <State label="Disabled (no tooltip)">
        <Tooltip content="You will never see this" disabled>
          <button style={triggerStyle}>Disabled</button>
        </Tooltip>
      </State>

      <State label="Kit — ArmButton">
        <Tooltip content="Arm track for recording" placement="top">
          <ArmButton armed={false} onToggle={() => {}} />
        </Tooltip>
      </State>

      <State label="Kit — Toggle">
        <Tooltip content="Enable reverb send" placement="top">
          <Toggle checked={false} onChange={() => {}} aria-label="Reverb" />
        </Tooltip>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [placement, setPlacement] = useState<TooltipPlacement>('top')
  const [delay,     setDelay]     = useState(500)
  const [disabled,  setDisabled]  = useState(false)

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        {/* Live trigger — hover or focus to see the tooltip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140, minHeight: 64 }}>
          <Tooltip
            content="Save the current project (Ctrl+S)"
            placement={placement}
            delay={delay}
            disabled={disabled}
          >
            <button style={triggerStyle}>Save project</button>
          </Tooltip>
        </div>

        {/* Controls — dogfooding Toggle for boolean props */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={disabled}
            onChange={v => setDisabled(v)}
            size="sm"
            label="disabled"
          />

          <label style={labelStyle}>
            placement
            <select
              value={placement}
              onChange={e => setPlacement(e.target.value as TooltipPlacement)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="top">top (default)</option>
              <option value="bottom">bottom</option>
              <option value="left">left</option>
              <option value="right">right</option>
            </select>
          </label>

          <label style={labelStyle}>
            delay
            <select
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value={0}>0 ms (immediate)</option>
              <option value={300}>300 ms</option>
              <option value={500}>500 ms (default)</option>
              <option value={800}>800 ms</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function TooltipDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
