// src/components/ChannelStrip/ChannelStrip.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ChannelStrip } from './ChannelStrip'
import type { ChannelStripProps } from './ChannelStrip'

export const meta: DemoMeta = {
  name: 'ChannelStrip',
  group: 'Composites',
  route: '/channel-strip',
  order: 70,
}

const noop = () => {}
const noopE = () => {}

const BASE: Omit<ChannelStripProps, 'name' | 'trackId'> = {
  color: '#7ec8a4',
  kind: 'audio',
  armed: false,
  muted: false,
  soloed: false,
  volumeDb: 0,
  pan: 0,
  onArm: noopE,
  onMute: noopE,
  onSolo: noopE,
  onVolume: noop,
  onPan: noop,
}

// ── Interactive playground ────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [armed, setArmed]   = useState(false)
  const [muted, setMuted]   = useState(false)
  const [soloed, setSoloed] = useState(false)
  const [volume, setVolume] = useState(0)
  const [pan, setPan]       = useState(0)
  const [showMeter, setShowMeter] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Toggle checked={armed}     onChange={setArmed}     label="Armed"      size="sm" />
        <Toggle checked={muted}     onChange={setMuted}     label="Muted"      size="sm" />
        <Toggle checked={soloed}    onChange={setSoloed}    label="Soloed"     size="sm" />
        <Toggle checked={showMeter} onChange={setShowMeter} label="Show meter" size="sm" />
      </div>
      <ChannelStrip
        trackId="playground"
        name="Guitar"
        color="#7eb8d4"
        kind="audio"
        armed={armed}
        muted={muted}
        soloed={soloed}
        volumeDb={volume}
        pan={pan}
        showMeter={showMeter}
        meterL={showMeter ? 0.65 : undefined}
        meterR={showMeter ? 0.5 : undefined}
        onArm={e => { e.stopPropagation(); setArmed(v => !v) }}
        onMute={e => { e.stopPropagation(); setMuted(v => !v) }}
        onSolo={e => { e.stopPropagation(); setSoloed(v => !v) }}
        onVolume={setVolume}
        onPan={setPan}
      />
    </div>
  )
}

// ── Demo ──────────────────────────────────────────────────────────────────────

export default function ChannelStripDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <State label="default — audio, 0 dB">
          <ChannelStrip {...BASE} trackId="t1" name="Kick" />
        </State>

        <State label="armed">
          <ChannelStrip {...BASE} trackId="t2" name="Snare" armed color="#e47a7a" />
        </State>

        <State label="muted">
          <ChannelStrip {...BASE} trackId="t3" name="Hi-Hat" muted color="#c4a0e4" />
        </State>

        <State label="soloed">
          <ChannelStrip {...BASE} trackId="t4" name="Bass" soloed color="#e4c84a" />
        </State>

        <State label="selected">
          <ChannelStrip {...BASE} trackId="t5" name="Lead" selected color="#7eb8d4" />
        </State>

        <State label="dimmed (soloed by another)">
          <ChannelStrip {...BASE} trackId="t6" name="Keys" dimmed anySoloActive />
        </State>

        <State label="with meter">
          <ChannelStrip
            {...BASE}
            trackId="t7"
            name="Vox"
            color="#7ec8a4"
            showMeter
            meterL={0.72}
            meterR={0.58}
          />
        </State>

        <State label="folder / group">
          <ChannelStrip
            {...BASE}
            trackId="t8"
            name="Drums"
            kind="folder"
            color="#e8a87c"
            onArm={undefined}
          />
        </State>

        <State label="master strip">
          <ChannelStrip
            {...BASE}
            trackId="master"
            name="Master"
            isMaster
            color="var(--accent)"
            showMeter
            meterL={0.8}
            meterR={0.75}
            onArm={undefined}
          />
        </State>

        <State label="disabled">
          <ChannelStrip {...BASE} trackId="t9" name="Aux" disabled />
        </State>

        <State label="panned left (−0.6)">
          <ChannelStrip {...BASE} trackId="t10" name="Pad L" pan={-0.6} color="#c4a0e4" />
        </State>

        <State label="low volume (−24 dB)">
          <ChannelStrip {...BASE} trackId="t11" name="Room" volumeDb={-24} />
        </State>

        <State label="hot (+3 dB)">
          <ChannelStrip {...BASE} trackId="t12" name="Kick OH" volumeDb={3} color="#e47a7a" />
        </State>

        <State label="floor (−∞)">
          <ChannelStrip {...BASE} trackId="t13" name="FX Rtn" volumeDb={-60} />
        </State>

        <State label="sm size">
          <ChannelStrip {...BASE} trackId="t14" name="Perc" size="sm" />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
