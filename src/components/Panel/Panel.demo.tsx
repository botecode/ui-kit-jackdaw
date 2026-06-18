// src/components/Panel/Panel.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ArmButton } from '../ArmButton/ArmButton'
import { Fader } from '../Fader/Fader'
import { Panel } from './Panel'

export const meta: DemoMeta = {
  name: 'Panel',
  group: 'Primitives',
  route: '/panel',
  order: 5,
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const CHROMA_SWATCHES = [
  { color: 'var(--chroma-red)',    label: 'DRIVE' },
  { color: 'var(--chroma-orange)', label: 'SWEETEN' },
  { color: 'var(--chroma-yellow)', label: 'FUZZ' },
  { color: 'var(--chroma-green)',  label: 'HOWL' },
  { color: 'var(--chroma-teal)',   label: 'SWELL' },
  { color: 'var(--chroma-blue)',   label: 'FILTER' },
  { color: 'var(--chroma-purple)', label: 'MOD' },
]

function SwatchList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {CHROMA_SWATCHES.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            lineHeight: 1,
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function HeaderLed({ color }: { color: string }) {
  return (
    <div style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 4px 1px color-mix(in srgb, ${color} 55%, transparent)`,
      flexShrink: 0,
    }} />
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Outlined (title only)">
        <Panel title="CHARACTER" style={{ width: 140 }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            margin: 0,
            lineHeight: 'var(--leading-sm)',
          }}>
            Cream panel, printed outline.
          </p>
        </Panel>
      </State>

      <State label="Header LED + control">
        <Panel
          title="CHARACTER"
          headerLead={<HeaderLed color="var(--led-orange)" />}
          headerControl={<ArmButton armed={false} onToggle={noop} size="sm" aria-label="Arm" />}
          style={{ width: 160 }}
        >
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Header slots compose.
          </p>
        </Panel>
      </State>

      <State label="Swatch list (CHARACTER)">
        <Panel title="CHARACTER" style={{ width: 140 }}>
          <SwatchList />
        </Panel>
      </State>

      <State label="Stage tone">
        <Panel tone="stage" title="MATRIX" style={{ width: 140 }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--stage-text)',
            margin: 0,
            opacity: 0.5,
          }}>
            Dark recessed well.
          </p>
        </Panel>
      </State>

      <State label="No header (frame only)">
        <Panel style={{ width: 140 }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            margin: 0,
          }}>
            Frame without header collapses cleanly.
          </p>
        </Panel>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────
// Tone + texture via ArmButton; padding via Fader — dogfoods the kit.

const PADDINGS = ['sm', 'md', 'lg'] as const

function PlaygroundDemo() {
  const [stage, setStage]           = useState(false)
  const [texture, setTexture]       = useState(true)
  const [padIndex, setPadIndex]     = useState(1)
  const [showLead, setShowLead]     = useState(true)
  const [showControl, setShowControl] = useState(true)

  const tone    = stage ? 'stage' : 'outlined'
  const padding = PADDINGS[Math.round(Math.max(0, Math.min(2, padIndex)))]

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live Panel instance */}
        <Panel
          title="CHARACTER"
          tone={tone}
          texture={texture}
          padding={padding}
          headerLead={showLead ? <HeaderLed color="var(--led-orange)" /> : undefined}
          headerControl={showControl
            ? <ArmButton armed={false} onToggle={() => {}} size="sm" aria-label="Arm" />
            : undefined}
          style={{ width: 160, flexShrink: 0 }}
        >
          <SwatchList />
        </Panel>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            <ArmButton
              armed={stage}
              onToggle={() => setStage(s => !s)}
              size="sm"
              aria-label="Toggle stage tone"
            />
            tone: {tone}
          </label>

          <label style={labelStyle}>
            <ArmButton
              armed={texture}
              onToggle={() => setTexture(t => !t)}
              size="sm"
              aria-label="Toggle texture"
            />
            texture
          </label>

          <label style={labelStyle}>
            <ArmButton
              armed={showLead}
              onToggle={() => setShowLead(s => !s)}
              size="sm"
              aria-label="Toggle header lead"
            />
            headerLead
          </label>

          <label style={labelStyle}>
            <ArmButton
              armed={showControl}
              onToggle={() => setShowControl(s => !s)}
              size="sm"
              aria-label="Toggle header control"
            />
            headerControl
          </label>

          <label style={{ ...labelStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
            <span>padding: {padding}</span>
            <Fader
              value={padIndex}
              onChange={v => setPadIndex(Math.max(0, Math.min(2, v)))}
              min={0}
              max={2}
              orientation="horizontal"
              size="sm"
              aria-label="Padding size"
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function PanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
