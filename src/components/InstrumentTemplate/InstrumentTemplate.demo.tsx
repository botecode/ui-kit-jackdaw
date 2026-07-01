// src/components/InstrumentTemplate/InstrumentTemplate.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Badge } from '../Badge'
import { DEFAULT_PALETTE } from '../ColorSwatch'
import { InstrumentTemplate } from './InstrumentTemplate'
import type { InstrumentTemplateFx } from './InstrumentTemplate'

export const meta: DemoMeta = {
  name: 'InstrumentTemplate',
  group: 'Composites',
  route: '/instrument-template',
  order: 72,
}

const noop = () => {}

const INPUT = {
  value: 'in1',
  options: [
    { id: 'in1', label: 'Input 1', inputName: 'ez1073' },
    { id: 'in2', label: 'Input 2', inputName: 'DI' },
    { id: 'in3', label: 'Stereo 3–4' },
  ],
}

const FX: InstrumentTemplateFx[] = [
  { id: 'fx1', name: 'Drive' },
  { id: 'fx2', name: 'Sweeten' },
  { id: 'fx3', name: 'Tape' },
]

const BASE = {
  input: INPUT,
  fx: FX,
  onNameChange: noop,
  onColorChange: noop,
  onInputChange: noop,
  onFxAdd: noop,
  onFxRemove: noop,
  onFxReorder: noop,
}

// Small origin badges — the host sets these; built-in vs the user's own presets.
const JackdawBadge = <Badge variant="label" tone="accent" size="sm">Jackdaw</Badge>
const MineBadge    = <Badge variant="label" size="sm">Mine</Badge>

// ── Interactive playground (dogfooded kit controls) ─────────────────────────────

function PlaygroundDemo() {
  const [name, setName]     = useState('Guitar')
  const [color, setColor]   = useState<string | null>('#7eb8d4')
  const [inputVal, setInput] = useState<string | null>('in1')
  const [fx, setFx]         = useState<InstrumentTemplateFx[]>(FX)
  const [disabled, setDisabled] = useState(false)
  const [asTile, setAsTile] = useState(false)
  const [builtIn, setBuiltIn] = useState(true)
  const [dropped, setDropped] = useState<string | null>(null)

  let addSeq = fx.length
  function reorder(from: number, to: number) {
    setFx(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      if (moved) next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Toggle checked={asTile}   onChange={setAsTile}   label="Tile (drawer chip)" size="sm" />
        <Toggle checked={builtIn}  onChange={setBuiltIn}  label="Origin: Jackdaw"    size="sm" />
        <Toggle checked={disabled} onChange={setDisabled} label="Disabled"           size="sm" />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <InstrumentTemplate
          {...BASE}
          variant={asTile ? 'tile' : 'card'}
          name={name}
          color={color}
          colorOptions={DEFAULT_PALETTE}
          input={{ value: inputVal, options: INPUT.options }}
          fx={fx}
          disabled={disabled}
          origin={builtIn ? JackdawBadge : MineBadge}
          dragData={{ 'application/x-instrument-template': name }}
          onDragStart={() => setDropped(name)}
          onNameChange={setName}
          onColorChange={setColor}
          onInputChange={setInput}
          onFxAdd={() => setFx(prev => [...prev, { id: `fx${++addSeq}${prev.length}`, name: 'New FX' }])}
          onFxRemove={id => setFx(prev => prev.filter(f => f.id !== id))}
          onFxReorder={reorder}
        />
      </div>

      {asTile && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          {dropped ? `Last drag started: “${dropped}”` : 'Drag the tile — the host would drop it onto the studio to spawn a track.'}
        </p>
      )}

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', maxWidth: 520, lineHeight: 1.5 }}>
        The cold twin of the living card: a track’s starting identity, before it makes a sound. Rename it
        in place, pick a colour from the presets, choose an input, and order its FX as bare identities — no
        meter, no fader, no bypass, no plugin windows. The tile is the same identity as a grabbable drawer
        chip. Everything is controlled and emits intents only; the host owns the data.
      </p>
    </div>
  )
}

// ── Demo ────────────────────────────────────────────────────────────────────────

export default function InstrumentTemplateDemo() {
  return (
    <DemoShell meta={meta}>
      {/* The drawer row — tiles side by side, as the instrument drawer shows them. */}
      <section style={{ padding: '8px 0 24px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <InstrumentTemplate {...BASE} variant="tile" name="Guitar" color="#7eb8d4" origin={JackdawBadge} />
          <InstrumentTemplate {...BASE} variant="tile" name="Bass" color="#e4c84a" origin={JackdawBadge} />
          <InstrumentTemplate {...BASE} variant="tile" name="Keys" color="#c4a0e4" origin={JackdawBadge} />
          <InstrumentTemplate {...BASE} variant="tile" name="Drums" color="#e8a87c" origin={JackdawBadge} />
          <InstrumentTemplate {...BASE} variant="tile" name="My Vox Chain" color="#7ec8a4" origin={MineBadge} />
          <InstrumentTemplate {...BASE} variant="tile" name="Blank" color={null} origin={MineBadge} />
        </div>
      </section>

      <StatesGrid>
        <State label="default — editable card">
          <InstrumentTemplate {...BASE} name="Guitar" color="#7eb8d4" />
        </State>

        <State label="with origin — Jackdaw preset">
          <InstrumentTemplate {...BASE} name="Grand Piano" color="#c4a0e4" origin={JackdawBadge} />
        </State>

        <State label="with origin — user preset">
          <InstrumentTemplate {...BASE} name="My Vox Chain" color="#7ec8a4" origin={MineBadge} />
        </State>

        <State label="colour unset">
          <InstrumentTemplate {...BASE} name="Untitled" color={null} />
        </State>

        <State label="empty name (placeholder)">
          <InstrumentTemplate {...BASE} name="" color="#e8a87c" />
        </State>

        <State label="empty FX chain">
          <InstrumentTemplate {...BASE} name="Clean" color="#7eb8d4" fx={[]} />
        </State>

        <State label="no input selected">
          <InstrumentTemplate {...BASE} name="Aux" color="#e47a7a" input={{ value: null, options: INPUT.options }} />
        </State>

        <State label="long name + long chain">
          <InstrumentTemplate
            {...BASE}
            name="Layered Analog Poly Pad"
            color="#c4a0e4"
            fx={[
              { id: 'a', name: 'Saturator' },
              { id: 'b', name: 'Multiband Compressor' },
              { id: 'c', name: 'Chorus Ensemble' },
              { id: 'd', name: 'Shimmer Reverb' },
            ]}
          />
        </State>

        <State label="disabled">
          <InstrumentTemplate {...BASE} name="Locked" color="#e4c84a" disabled origin={JackdawBadge} />
        </State>

        <State label="sm size">
          <InstrumentTemplate {...BASE} name="Perc" color="#7ec8a4" size="sm" />
        </State>

        <State label="tile — default">
          <InstrumentTemplate {...BASE} variant="tile" name="Guitar" color="#7eb8d4" origin={JackdawBadge} />
        </State>

        <State label="tile — colour unset">
          <InstrumentTemplate {...BASE} variant="tile" name="Blank" color={null} origin={MineBadge} />
        </State>

        <State label="tile — disabled">
          <InstrumentTemplate {...BASE} variant="tile" name="Locked" color="#e47a7a" disabled />
        </State>

        <State label="tile — pinned (not draggable)">
          <InstrumentTemplate {...BASE} variant="tile" name="Fixed" color="#c4a0e4" draggable={false} />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
