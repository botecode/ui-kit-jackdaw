// src/components/Mixer/Mixer.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Mixer } from './Mixer'
import type { MixerChannel, MixerMaster } from './Mixer'

export const meta: DemoMeta = {
  name: 'Mixer',
  group: 'Composites',
  route: '/mixer',
  order: 71,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const MASTER: MixerMaster = {
  name: 'Master',
  muted: false,
  soloed: false,
  volumeDb: 0,
  pan: 0,
  meterL: 0.78,
  meterR: 0.72,
}

const FEW_TRACKS: MixerChannel[] = [
  { trackId: 'k', name: 'Kick',  color: '#e8a87c', kind: 'audio', armed: false, muted: false, soloed: false, volumeDb: 0,    pan: 0 },
  { trackId: 's', name: 'Snare', color: '#e47a7a', kind: 'audio', armed: false, muted: false, soloed: false, volumeDb: -3,   pan: 0.1 },
  { trackId: 'h', name: 'HiHat', color: '#c4a0e4', kind: 'audio', armed: false, muted: false, soloed: false, volumeDb: -6,   pan: -0.3 },
  { trackId: 'b', name: 'Bass',  color: '#7ec8a4', kind: 'audio', armed: false, muted: false, soloed: false, volumeDb: -1.5, pan: 0 },
]

const MANY_TRACKS: MixerChannel[] = [
  { trackId: 'k',  name: 'Kick',    color: '#e8a87c', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: 0,    pan: 0 },
  { trackId: 's',  name: 'Snare',   color: '#e47a7a', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -3,   pan: 0.1 },
  { trackId: 'h',  name: 'HiHat',   color: '#c4a0e4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -6,   pan: -0.3 },
  { trackId: 'oh', name: 'OH',      color: '#c4a0e4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -9,   pan: 0 },
  { trackId: 'dr', name: 'Drums',   color: '#e8a87c', kind: 'folder', armed: false, muted: false, soloed: false, volumeDb: 0,    pan: 0 },
  { trackId: 'b',  name: 'Bass',    color: '#7ec8a4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -1.5, pan: 0 },
  { trackId: 'g',  name: 'Guitar',  color: '#7eb8d4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -4,   pan: -0.5 },
  { trackId: 'gd', name: 'Gtr DI',  color: '#7eb8d4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -8,   pan: 0.5 },
  { trackId: 'v',  name: 'Vox',     color: '#e4c84a', kind: 'audio',  armed: true,  muted: false, soloed: false, volumeDb: -2,   pan: 0, meterL: 0.6, meterR: 0.55 },
  { trackId: 'bv', name: 'BG Vox',  color: '#e4c84a', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -12,  pan: 0.2 },
  { trackId: 'k2', name: 'Keys',    color: '#c4a0e4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -5,   pan: -0.2 },
  { trackId: 'sy', name: 'Synth',   color: '#c4a0e4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -7,   pan: 0.4 },
]

const SOLOED_TRACKS: MixerChannel[] = FEW_TRACKS.map((t, i) =>
  i === 1 ? { ...t, soloed: true } : t
)

const FOLDER_TRACKS: MixerChannel[] = [
  { trackId: 'dr', name: 'Drums',   color: '#e8a87c', kind: 'folder', armed: false, muted: false, soloed: false, volumeDb: 0,  pan: 0 },
  { trackId: 'k',  name: 'Kick',    color: '#e8a87c', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: 0,  pan: 0 },
  { trackId: 's',  name: 'Snare',   color: '#e47a7a', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -3, pan: 0 },
  { trackId: 'st', name: 'Strings', color: '#7eb8d4', kind: 'folder', armed: false, muted: false, soloed: false, volumeDb: -2, pan: 0 },
  { trackId: 'v1', name: 'Vln 1',   color: '#7eb8d4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -4, pan: -0.5 },
  { trackId: 'v2', name: 'Vln 2',   color: '#7eb8d4', kind: 'audio',  armed: false, muted: false, soloed: false, volumeDb: -4, pan: 0.5 },
]

const noop  = () => {}
const noopS = (_id: string, _v: boolean) => {}
const noopV = (_id: string, _db: number) => {}
const noopP = (_id: string, _p: number) => {}

const SHARED = {
  onMute: noopS, onSolo: noopS, onVolume: noopV, onPan: noopP,
  onMasterVolume: noop, onMasterPan: noop, onToggle: noop,
}

// ── Interactive playground ────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open, setOpen]           = useState(true)
  const [showMeters, setShowMeters] = useState(false)
  const [tracks, setTracks]       = useState<MixerChannel[]>(MANY_TRACKS)
  const [master, setMaster]       = useState<MixerMaster>({ ...MASTER })

  function handleMute(trackId: string, muted: boolean) {
    setTracks(prev => prev.map(t => t.trackId === trackId ? { ...t, muted } : t))
  }
  function handleSolo(trackId: string, soloed: boolean) {
    setTracks(prev => prev.map(t => t.trackId === trackId ? { ...t, soloed } : t))
  }
  function handleVolume(trackId: string, db: number) {
    setTracks(prev => prev.map(t => t.trackId === trackId ? { ...t, volumeDb: db } : t))
  }
  function handlePan(trackId: string, p: number) {
    setTracks(prev => prev.map(t => t.trackId === trackId ? { ...t, pan: p } : t))
  }
  function handleArm(trackId: string) {
    setTracks(prev => prev.map(t => t.trackId === trackId ? { ...t, armed: !t.armed } : t))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Toggle checked={open}       onChange={setOpen}       label="Mixer open"   size="sm" />
        <Toggle checked={showMeters} onChange={setShowMeters} label="All meters"   size="sm" />
      </div>
      <Mixer
        tracks={tracks}
        master={master}
        open={open}
        onToggle={setOpen}
        showAllMeters={showMeters}
        onArm={handleArm}
        onMute={handleMute}
        onSolo={handleSolo}
        onVolume={handleVolume}
        onPan={handlePan}
        onMasterMute={v => setMaster(m => ({ ...m, muted: v }))}
        onMasterSolo={v => setMaster(m => ({ ...m, soloed: v }))}
        onMasterVolume={db => setMaster(m => ({ ...m, volumeDb: db }))}
        onMasterPan={p => setMaster(m => ({ ...m, pan: p }))}
      />
    </div>
  )
}

// ── Demo ──────────────────────────────────────────────────────────────────────

export default function MixerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <State label="few channels (open)">
          <Mixer {...SHARED} tracks={FEW_TRACKS} master={MASTER} open />
        </State>

        <State label="closed (hidden)">
          {/* Render a label since the Mixer itself is null when closed */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', padding: '8px 12px' }}>
            Mixer is closed — open prop = false
          </div>
          <Mixer {...SHARED} tracks={FEW_TRACKS} master={MASTER} open={false} />
        </State>

        <State label="channel soloed — others dimmed">
          <Mixer {...SHARED} tracks={SOLOED_TRACKS} master={MASTER} open />
        </State>

        <State label="with folder / group strips">
          <Mixer {...SHARED} tracks={FOLDER_TRACKS} master={MASTER} open />
        </State>

        <State label="many channels (horizontal scroll)">
          <div style={{ width: 480 }}>
            <Mixer {...SHARED} tracks={MANY_TRACKS} master={MASTER} open />
          </div>
        </State>

        <State label="all meters on">
          <Mixer
            {...SHARED}
            tracks={FEW_TRACKS.map(t => ({ ...t, meterL: 0.6, meterR: 0.5 }))}
            master={{ ...MASTER }}
            open
            showAllMeters
          />
        </State>

        <State label="master muted">
          <Mixer {...SHARED} tracks={FEW_TRACKS} master={{ ...MASTER, muted: true }} open />
        </State>

        <State label="disabled">
          <Mixer {...SHARED} tracks={FEW_TRACKS} master={MASTER} open disabled />
        </State>

        <State label="sm size">
          <Mixer {...SHARED} tracks={FEW_TRACKS} master={MASTER} open size="sm" />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
