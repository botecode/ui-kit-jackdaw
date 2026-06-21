import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { ColorSwatch, SwatchPalette, SwatchPicker, DEFAULT_PALETTE } from './ColorSwatch'

export const meta: DemoMeta = {
  name: 'ColorSwatch',
  group: 'Primitives',
  route: '/color-swatch',
  order: 15,
}

// ── States grid — single chip ─────────────────────────────────────────────────

function SwatchStates() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Unselected">
        <ColorSwatch color="#e8a87c" aria-label="#e8a87c" onClick={noop} />
      </State>
      <State label="Selected">
        <ColorSwatch color="#e8a87c" aria-label="#e8a87c" selected onClick={noop} />
      </State>
      <State label="Unselected sm">
        <ColorSwatch color="#7ec8a4" size="sm" aria-label="#7ec8a4" onClick={noop} />
      </State>
      <State label="Selected sm">
        <ColorSwatch color="#7ec8a4" size="sm" aria-label="#7ec8a4" selected onClick={noop} />
      </State>
      <State label="Disabled">
        <ColorSwatch color="#7eb8d4" aria-label="#7eb8d4" disabled onClick={noop} />
      </State>
      <State label="Disabled selected">
        <ColorSwatch color="#c4a0e4" aria-label="#c4a0e4" selected disabled onClick={noop} />
      </State>
      <State label="Focus">
        <ColorSwatch color="#e4c84a" aria-label="#e4c84a" autoFocus onClick={noop} />
      </State>
      <State label="Focus selected">
        <ColorSwatch color="#e47a7a" aria-label="#e47a7a" selected autoFocus onClick={noop} />
      </State>
    </StatesGrid>
  )
}

// ── States grid — palette row ─────────────────────────────────────────────────

function PaletteStates() {
  const [value, setValue] = useState<string | null>('#7eb8d4')
  return (
    <StatesGrid>
      <State label="With selection">
        <SwatchPalette value={value} palette={DEFAULT_PALETTE} onChange={setValue} />
      </State>
      <State label="No selection">
        <SwatchPalette value={null} palette={DEFAULT_PALETTE} onChange={() => {}} />
      </State>
      <State label="Small">
        <SwatchPalette value="#c4a0e4" size="sm" palette={DEFAULT_PALETTE} onChange={() => {}} />
      </State>
    </StatesGrid>
  )
}

// ── States grid — picker (trigger + popover) ───────────────────────────────────

function PickerStates() {
  const [value, setValue] = useState<string | null>('#e8a87c')
  return (
    <StatesGrid>
      <State label="Closed, value set">
        <SwatchPicker value={value} palette={DEFAULT_PALETTE} onChange={setValue} />
      </State>
      <State label="Closed, no value">
        <SwatchPicker value={null} palette={DEFAULT_PALETTE} onChange={() => {}} />
      </State>
      <State label="Open">
        <SwatchPicker
          value="#7ec8a4"
          palette={DEFAULT_PALETTE}
          onChange={() => {}}
          defaultOpen
        />
      </State>
      <State label="Disabled">
        <SwatchPicker value="#e4c84a" palette={DEFAULT_PALETTE} onChange={() => {}} disabled />
      </State>
      <State label="Small">
        <SwatchPicker value="#c4a0e4" size="sm" palette={DEFAULT_PALETTE} onChange={() => {}} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState<string | null>(DEFAULT_PALETTE[0] ?? null)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        {/* Live instance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <SwatchPicker
            value={value}
            palette={DEFAULT_PALETTE}
            onChange={setValue}
            size={size}
            disabled={disabled}
            aria-label="Track color"
          />
          {value && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {value}
            </span>
          )}
        </div>

        {/* Controls — dogfooding Checkbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox
            checked={disabled}
            onChange={next => setDisabled(next)}
            size="sm"
            label="disabled"
          />
          <Checkbox
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size sm"
          />
          <Checkbox
            checked={value === null}
            onChange={next => setValue(next ? null : (DEFAULT_PALETTE[0] ?? null))}
            size="sm"
            label="no value"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ColorSwatchDemo() {
  return (
    <DemoShell meta={meta}>
      <SwatchStates />
      <PaletteStates />
      <PickerStates />
      <PlaygroundDemo />
    </DemoShell>
  )
}
