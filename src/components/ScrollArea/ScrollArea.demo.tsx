// src/components/ScrollArea/ScrollArea.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ScrollArea } from './ScrollArea'

export const meta: DemoMeta = {
  name: 'ScrollArea',
  group: 'Primitives',
  route: '/scroll-area',
  order: 72,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TallContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-1)' }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            height: 28,
            background: 'var(--surface-2)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            paddingInline: 'var(--space-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          Track {String(i + 1).padStart(2, '0')}
        </div>
      ))}
    </div>
  )
}

function WideContent() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-1)', width: 'max-content' }}>
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: 48,
            height: 40,
            background: 'var(--surface-2)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Vertical (default)">
        <ScrollArea style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Horizontal (timeline)">
        <ScrollArea orientation="horizontal" style={{ width: 200, height: 56 }}>
          <WideContent />
        </ScrollArea>
      </State>

      <State label="Both axes">
        <ScrollArea orientation="both" style={{ width: 200, height: 120 }}>
          <div style={{ width: 400 }}>
            <TallContent />
          </div>
        </ScrollArea>
      </State>

      <State label="Auto-hide (hover to reveal)">
        <ScrollArea autoHide style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Size sm">
        <ScrollArea size="sm" style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Short content (no bar)">
        <ScrollArea style={{ height: 120, width: 160, outline: '1px solid var(--border)', borderRadius: 3 }}>
          <div style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Short content — no overflow, no scrollbar.
          </div>
        </ScrollArea>
      </State>

      <State label="Hover thumb">
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          Hover the thumb in any instance above — it brightens and widens (border-width shrinks).
        </div>
      </State>

      <State label="Drag thumb">
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          Click and drag a thumb to see the pressed/active state — darker, full-width, dimmer catch-light.
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'both'>('vertical')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [autoHide, setAutoHide] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ScrollArea
          orientation={orientation}
          size={size}
          autoHide={autoHide}
          style={
            orientation === 'horizontal'
              ? { width: 240, height: 56 }
              : { width: 200, height: 160 }
          }
        >
          {orientation === 'horizontal' ? <WideContent /> : <TallContent />}
        </ScrollArea>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={autoHide}
            onChange={setAutoHide}
            size="sm"
            label="autoHide"
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            orientation
            <select
              value={orientation}
              onChange={e => setOrientation(e.target.value as typeof orientation)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="vertical">vertical</option>
              <option value="horizontal">horizontal</option>
              <option value="both">both</option>
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (8px)</option>
              <option value="sm">sm (6px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ScrollAreaDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
