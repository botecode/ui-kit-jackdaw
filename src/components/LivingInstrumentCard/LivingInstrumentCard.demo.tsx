// src/components/LivingInstrumentCard/LivingInstrumentCard.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import type { FxPlugin } from '../FxChip'
import { LivingInstrumentCard } from './LivingInstrumentCard'
import type { LivingInstrumentCardProps } from './LivingInstrumentCard'

export const meta: DemoMeta = {
  name: 'LivingInstrumentCard',
  group: 'Composites',
  route: '/living-instrument-card',
  order: 71,
}

const noop = () => {}
const noopE = () => {}

const FX: FxPlugin[] = [
  { id: 'fx1', name: 'Drive', enabled: true },
  { id: 'fx2', name: 'Sweeten', enabled: true },
]

const INPUT = {
  value: 'in1',
  options: [
    { id: 'in1', label: 'Input 1', inputName: 'Input 1 – ez1073' },
    { id: 'in2', label: 'Input 2' },
  ],
}

const BASE: Omit<LivingInstrumentCardProps, 'trackId' | 'name'> = {
  color: '#7eb8d4',
  input: INPUT,
  fx: FX,
  volumeDb: 0,
  pan: 0,
  armed: false,
  muted: false,
  soloed: false,
  onInputChange: noop,
  onVolumeChange: noop,
  onPanChange: noop,
  onArm: noopE,
  onMute: noopE,
  onSolo: noopE,
}

// ── A simulated breathing signal for the "playing" cards ────────────────────────

function useFakeSignal(active: boolean): { l: number; r: number } | null {
  const [level, setLevel] = useState({ l: -10, r: -12 })
  const phase = useRef(0)
  useEffect(() => {
    if (!active) return
    let raf: number
    let last = 0
    const tick = (t: number) => {
      const dt = last ? t - last : 16
      last = t
      phase.current += dt * 0.004
      const base = -14 + Math.sin(phase.current) * 8
      setLevel({ l: base + Math.sin(phase.current * 1.7) * 3, r: base + Math.cos(phase.current * 1.3) * 3 })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return active ? level : null
}

// ── Interactive playground (dogfooded controls) ─────────────────────────────────

function PlaygroundDemo() {
  const [armed, setArmed]     = useState(false)
  const [muted, setMuted]     = useState(false)
  const [soloed, setSoloed]   = useState(false)
  const [selected, setSelected] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [stereo, setStereo]   = useState(true)
  const [volume, setVolume]   = useState(-6)
  const [pan, setPan]         = useState(0)

  const signal = useFakeSignal(playing)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Toggle checked={armed}    onChange={setArmed}    label="Armed"    size="sm" />
        <Toggle checked={muted}    onChange={setMuted}    label="Muted"    size="sm" />
        <Toggle checked={soloed}   onChange={setSoloed}   label="Soloed"   size="sm" />
        <Toggle checked={selected} onChange={setSelected} label="Now / active" size="sm" />
        <Toggle checked={playing}  onChange={setPlaying}  label="Playing (breathes)" size="sm" />
        <Toggle checked={stereo}   onChange={setStereo}   label="Stereo (two strips)" size="sm" />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <LivingInstrumentCard
          trackId="playground"
          name="Guitar"
          color="#7eb8d4"
          input={INPUT}
          fx={FX}
          volumeDb={volume}
          pan={pan}
          armed={armed}
          muted={muted}
          soloed={soloed}
          selected={selected}
          channels={stereo ? 'stereo' : 'mono'}
          meterL={signal?.l}
          meterR={stereo ? signal?.r : undefined}
          onInputChange={noop}
          onVolumeChange={setVolume}
          onPanChange={setPan}
          onArm={e => { e.stopPropagation(); setArmed(v => !v) }}
          onMute={e => { e.stopPropagation(); setMuted(v => !v) }}
          onSolo={e => { e.stopPropagation(); setSoloed(v => !v) }}
          onSelect={() => setSelected(true)}
        />
      </div>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', maxWidth: 520, lineHeight: 1.5 }}>
        The card body IS the meter and the fader. The strips show only the live signal (dark at rest,
        lit when playing). The thin line across them is the set level — drag the body up/down (or focus
        the line and use the arrow keys) to move it. A stereo track shows two strips (L / R), each
        breathing on its own channel, behind that single set-point line. Pan is the strip at the bottom:
        drag it left/right. Pan is channel balance — it dims the OPPOSITE strip (pan left attenuates the
        right, pan right the left); the strips never move.
      </p>
    </div>
  )
}

// ── Playing cards (own a live signal) ───────────────────────────────────────────

function PlayingCard(props: Omit<LivingInstrumentCardProps, 'meterL' | 'meterR'>) {
  const signal = useFakeSignal(true)
  const mono = props.channels === 'mono'
  return <LivingInstrumentCard {...props} meterL={signal?.l} meterR={mono ? undefined : signal?.r} />
}

// ── Demo ────────────────────────────────────────────────────────────────────────

export default function LivingInstrumentCardDemo() {
  return (
    <DemoShell meta={meta}>
      {/* A row of cards, as the studio view shows them */}
      <section style={{ padding: '8px 0 24px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <PlayingCard {...BASE} trackId="r1" name="Guitar" color="#7eb8d4" selected />
          <PlayingCard {...BASE} trackId="r2" name="Bass" color="#e4c84a" armed />
          <LivingInstrumentCard {...BASE} trackId="r3" name="Keys" color="#c4a0e4" volumeDb={-8} />
          <LivingInstrumentCard {...BASE} trackId="r4" name="Pad" color="#e8a87c" pan={-0.7} volumeDb={-14} muted />
          <LivingInstrumentCard
            {...BASE}
            trackId="rM"
            name="Master"
            isMaster
            color="var(--accent)"
            input={undefined}
            fx={undefined}
            volumeDb={0}
          />
        </div>
      </section>

      <StatesGrid>
        <State label="default — idle, 0 dB">
          <LivingInstrumentCard {...BASE} trackId="t1" name="Guitar" />
        </State>

        <State label="now / active (selected)">
          <LivingInstrumentCard {...BASE} trackId="t2" name="Lead" selected color="#7ec8a4" />
        </State>

        <State label="armed (accent body)">
          <LivingInstrumentCard {...BASE} trackId="t3" name="Vox" armed color="#e47a7a" />
        </State>

        <State label="playing (breathing)">
          <PlayingCard {...BASE} trackId="t4" name="Drums" color="#e8a87c" volumeDb={-4} />
        </State>

        <State label="stereo — two strips (L / R)">
          <PlayingCard {...BASE} trackId="t4s" name="Wide" channels="stereo" color="#7ec8a4" volumeDb={-5} />
        </State>

        <State label="mono — one strip">
          <PlayingCard {...BASE} trackId="t4m" name="Mono" channels="mono" color="#7eb8d4" volumeDb={-5} />
        </State>

        <State label="stereo — at rest (set-point line)">
          <LivingInstrumentCard {...BASE} trackId="t4sr" name="Stereo" channels="stereo" volumeDb={-10} color="#c4a0e4" />
        </State>

        <State label="armed + recording">
          <PlayingCard {...BASE} trackId="t4b" name="Take 3" armed color="#e47a7a" volumeDb={-3} />
        </State>

        <State label="muted">
          <LivingInstrumentCard {...BASE} trackId="t5" name="Hat" muted color="#c4a0e4" />
        </State>

        <State label="soloed">
          <LivingInstrumentCard {...BASE} trackId="t6" name="Snare" soloed color="#e4c84a" />
        </State>

        <State label="pan center — both strips full">
          <PlayingCard {...BASE} trackId="t7c" name="Pad C" pan={0} channels="stereo" color="#7eb8d4" volumeDb={-6} />
        </State>

        <State label="pan left (−0.7) — right strip dimmed">
          <PlayingCard {...BASE} trackId="t7" name="Pad L" pan={-0.7} channels="stereo" color="#7eb8d4" volumeDb={-6} />
        </State>

        <State label="pan right (+0.7) — left strip dimmed">
          <PlayingCard {...BASE} trackId="t8" name="Pad R" pan={0.7} channels="stereo" color="#7eb8d4" volumeDb={-6} />
        </State>

        <State label="low volume (−24 dB)">
          <LivingInstrumentCard {...BASE} trackId="t9" name="Room" volumeDb={-24} />
        </State>

        <State label="hot (+3 dB)">
          <PlayingCard {...BASE} trackId="t10" name="Kick OH" volumeDb={3} color="#e47a7a" />
        </State>

        <State label="floor (−∞)">
          <LivingInstrumentCard {...BASE} trackId="t11" name="FX Rtn" volumeDb={-60} />
        </State>

        <State label="empty FX (no inserts)">
          <LivingInstrumentCard {...BASE} trackId="t12" name="Clean" fx={[]} />
        </State>

        <State label="display-only (no handlers)">
          <LivingInstrumentCard
            trackId="t13"
            name="Bus"
            color="#9aa0a6"
            input={INPUT}
            fx={FX}
            volumeDb={-9}
            pan={0.3}
            armed={false}
            muted={false}
            soloed={false}
          />
        </State>

        <State label="disabled">
          <LivingInstrumentCard {...BASE} trackId="t14" name="Aux" disabled />
        </State>

        <State label="sm size">
          <LivingInstrumentCard {...BASE} trackId="t15" name="Perc" size="sm" volumeDb={-6} />
        </State>

        <State label="master — idle">
          <LivingInstrumentCard
            {...BASE}
            trackId="t16"
            name="Master"
            isMaster
            color="var(--accent)"
            input={undefined}
            fx={undefined}
          />
        </State>

        <State label="master — playing">
          <PlayingCard
            {...BASE}
            trackId="t17"
            name="Master"
            isMaster
            color="var(--accent)"
            input={undefined}
            fx={undefined}
            volumeDb={0}
          />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
