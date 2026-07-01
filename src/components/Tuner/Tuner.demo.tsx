// src/components/Tuner/Tuner.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { Tuner, type TunerMode } from './Tuner'

export const meta: DemoMeta = {
  name: 'Tuner',
  group: 'Composites',
  route: '/tuner',
  order: 93,
}

const NOOP = () => {}

const BASE = {
  mute: false,
  onMuteChange: NOOP,
  referenceHz: 440,
  onReferenceChange: NOOP,
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="in tune — note + needle bloom green">
        <Tuner {...BASE} note="E" octave={2} cents={0} inTune frequency={82.4} />
      </State>
      <State label="flat — left arrow lit, needle low">
        <Tuner {...BASE} note="E" octave={2} cents={-18} frequency={81.6} />
      </State>
      <State label="sharp — right arrow lit, needle high">
        <Tuner {...BASE} note="G" octave={3} cents={30} frequency={199.4} />
      </State>
      <State label="extreme flat — clamped at −50">
        <Tuner {...BASE} note="D" octave={3} cents={-50} frequency={142.6} />
      </State>
      <State label="idle — no signal, still needle">
        <Tuner {...BASE} note={null} />
      </State>
      <State label="muted — tuning silently">
        <Tuner {...BASE} mute note="A" octave={4} cents={-6} frequency={438.5} />
      </State>
      <State label="hz mode — frequency readout">
        <Tuner {...BASE} note="A" octave={4} cents={4} frequency={441.0} mode="hz" onModeChange={NOOP} />
      </State>
      <State label="A = 432 reference">
        <Tuner {...BASE} referenceHz={432} note="A" octave={4} cents={0} inTune frequency={432.0} />
      </State>
      <State label="sm — the compact mini">
        <Tuner {...BASE} note="B" octave={3} cents={-9} frequency={245.6} size="sm" />
      </State>
    </StatesGrid>
  )
}

// Low E (82.41 Hz at A=440) bent by the faked cents offset.
function e2Frequency(cents: number, referenceHz: number): number {
  return 82.41 * Math.pow(2, cents / 1200) * (referenceHz / 440)
}

function PlaygroundDemo() {
  const [cents, setCents] = useState(-12)
  const [signal, setSignal] = useState(true)
  const [mute, setMute] = useState(false)
  const [referenceHz, setReferenceHz] = useState(440)
  const [mode, setMode] = useState<TunerMode>('cents')

  const inTune = Math.abs(cents) <= 3

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <Tuner
          note={signal ? 'E' : null}
          octave={2}
          cents={cents}
          inTune={signal && inTune}
          confidence={signal ? 1 : 0}
          frequency={signal ? e2Frequency(cents, referenceHz) : null}
          mute={mute}
          onMuteChange={setMute}
          referenceHz={referenceHz}
          onReferenceChange={setReferenceHz}
          mode={mode}
          onModeChange={setMode}
        />
        {/* Dogfood: kit Fader bends the string, kit Toggle drops the signal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          <Fader
            value={cents}
            onChange={setCents}
            min={-50}
            max={50}
            step={1}
            orientation="horizontal"
            detent={{ value: 0 }}
            resetValue={0}
            size="sm"
            format={v => `${Math.round(v)}¢`}
            aria-label="Simulated cents offset"
          />
          <Toggle checked={signal} onChange={setSignal} size="sm" label="signal" />
        </div>
      </div>
    </Playground>
  )
}

export default function TunerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
