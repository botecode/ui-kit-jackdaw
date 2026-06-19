// src/components/TrackHeader/TrackHeader.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { TrackHeader } from './TrackHeader'
import type { Track } from './TrackHeader'
import type { InputSelectOption } from '../InputSelect'
import type { FxPlugin } from '../FxChip'

export const meta: DemoMeta = {
  name: 'TrackHeader',
  group: 'Composites',
  route: '/track-header',
  order: 1,
}

const INPUT_OPTIONS: InputSelectOption[] = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
  { id: 'in-3', label: 'Input 3 (Guitar)' },
]

const STUB_PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb', enabled: true },
  { id: 'p2', name: 'Compressor', enabled: false },
]

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1', name: 'Vocals', color: 'var(--track-color-1)', type: 'audio',
    armed: false, muted: false, soloed: false,
    volumeDb: -6, pan: 0, inputId: 'in-1',
    plugins: STUB_PLUGINS, chainEnabled: true, selected: false,
    ...overrides,
  }
}

const noop   = () => {}
const noopId = (_: string) => {}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="normal (no meter)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Vocals', type: 'audio' })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS}
          />
        </div>
      </State>
      <State label="armed (R/M/S cluster + meter)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'MIDI Keys', type: 'midi', armed: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS} meterLevel={-12}
          />
        </div>
      </State>
      <State label="selected (meter visible)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Drums', color: 'var(--track-color-2)', selected: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS} meterLevel={-6}
          />
        </div>
      </State>
      <State label="clipping (meter latched)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Guitar', type: 'instrument', color: 'var(--track-color-6)' })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS} meterLevel={2} clipping
          />
        </div>
      </State>
      <State label="muted + soloed">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Guitar', type: 'instrument', muted: true, soloed: true, selected: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS} anySoloActive meterLevel={-18}
          />
        </div>
      </State>
      <State label="folder vs track">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>track</div>
            <div style={{ width: 200 }}>
              <TrackHeader
                track={makeTrack({ name: 'Synth Pad', color: 'var(--track-color-3)' })}
                onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
                onVolume={noop} onPan={noop} onSelectInput={noopId}
                onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
                onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
                inputOptions={INPUT_OPTIONS}
              />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>folder</div>
            <div style={{ width: 200 }}>
              <TrackHeader
                track={makeTrack({ name: 'Group Bus', color: 'var(--track-color-3)' })}
                variant="folder" folderOpen
                onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
                onVolume={noop} onPan={noop} onSelectInput={noopId}
                onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
                onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
                onToggleFolder={noop} inputOptions={INPUT_OPTIONS}
              />
            </div>
          </div>
        </div>
      </State>
      <State label="folder · selected (meter visible)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Drums Bus', color: 'var(--track-color-4)', selected: true })}
            variant="folder" folderOpen={false}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            onToggleFolder={noop} inputOptions={INPUT_OPTIONS} meterLevel={-8}
          />
        </div>
      </State>
      <State label="writer vs producer (no input)">
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 200 }}>
            <TrackHeader
              track={makeTrack({ name: 'Bass', inputId: null })}
              mode="writer"
              onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
              onVolume={noop} onPan={noop} onSelectInput={noopId}
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
              onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
              inputOptions={INPUT_OPTIONS}
            />
          </div>
          <div style={{ width: 200 }}>
            <TrackHeader
              track={makeTrack({ name: 'Bass', inputId: null })}
              mode="producer"
              onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
              onVolume={noop} onPan={noop} onSelectInput={noopId}
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
              onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
              inputOptions={INPUT_OPTIONS}
            />
          </div>
        </div>
      </State>
      <State label="narrow (140px) vs wide (280px)">
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 140 }}>
            <TrackHeader
              track={makeTrack({ name: 'Synth', color: 'var(--track-color-3)' })}
              onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
              onVolume={noop} onPan={noop} onSelectInput={noopId}
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
              onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
              inputOptions={INPUT_OPTIONS}
            />
          </div>
          <div style={{ width: 280 }}>
            <TrackHeader
              track={makeTrack({ name: 'Synth', color: 'var(--track-color-3)', selected: true })}
              onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
              onVolume={noop} onPan={noop} onSelectInput={noopId}
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
              onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
              inputOptions={INPUT_OPTIONS} meterLevel={-24}
            />
          </div>
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

const TRACK_COLORS = [
  { label: 'Orange', value: 'var(--track-color-1)' },
  { label: 'Green',  value: 'var(--track-color-2)' },
  { label: 'Blue',   value: 'var(--track-color-3)' },
  { label: 'Purple', value: 'var(--track-color-4)' },
  { label: 'Yellow', value: 'var(--track-color-5)' },
  { label: 'Red',    value: 'var(--track-color-6)' },
]

function PlaygroundDemo() {
  const [name,          setName]          = useState('Vocals')
  const [color,         setColor]         = useState('var(--track-color-1)')
  const [type,          setType]          = useState<'audio' | 'midi' | 'instrument'>('audio')
  const [armed,         setArmed]         = useState(false)
  const [muted,         setMuted]         = useState(false)
  const [soloed,        setSoloed]        = useState(false)
  const [selected,      setSelected]      = useState(false)
  const [mode,          setMode]          = useState<'writer' | 'producer'>('writer')
  const [variant,       setVariant]       = useState<'track' | 'folder'>('track')
  const [folderOpen,    setFolderOpen]    = useState(true)
  const [anySoloActive, setAnySoloActive] = useState(false)
  const [clipping,      setClipping]      = useState(false)
  const [showAllMeters, setShowAllMeters] = useState(false)
  const [volumeDb,      setVolumeDb]      = useState(-6)
  const [pan,           setPan]           = useState(0)
  const [inputId,       setInputId]       = useState<string | null>('in-1')
  const [plugins,       setPlugins]       = useState<FxPlugin[]>(STUB_PLUGINS)
  const [chainEnabled,  setChainEnabled]  = useState(true)
  const [meterLevel,    setMeterLevel]    = useState(-18)

  const track: Track = {
    id: 'pg', name, color, type,
    armed, muted, soloed, volumeDb, pan, inputId,
    plugins, chainEnabled, selected,
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Live instance */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <TrackHeader
            track={track}
            onRename={setName}
            onArm={() => setArmed(a => !a)}
            onMute={() => setMuted(m => !m)}
            onSolo={() => setSoloed(s => !s)}
            onVolume={setVolumeDb}
            onPan={setPan}
            onSelectInput={setInputId}
            onToggleChain={setChainEnabled}
            onTogglePlugin={(id, next) =>
              setPlugins(ps => ps.map(p => p.id === id ? { ...p, enabled: next } : p))
            }
            onReorder={(from, to) =>
              setPlugins(ps => {
                const arr = [...ps]
                const [item] = arr.splice(from, 1)
                arr.splice(to, 0, item)
                return arr
              })
            }
            onRemovePlugin={id => setPlugins(ps => ps.filter(p => p.id !== id))}
            onAddPlugin={() =>
              setPlugins(ps => [...ps, { id: `p${Date.now()}`, name: 'EQ', enabled: true }])
            }
            onSelect={() => setSelected(s => !s)}
            onToggleFolder={() => setFolderOpen(o => !o)}
            mode={mode}
            variant={variant}
            folderOpen={folderOpen}
            inputOptions={INPUT_OPTIONS}
            anySoloActive={anySoloActive}
            clipping={clipping}
            showAllMeters={showAllMeters}
            meterLevel={meterLevel}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={armed}          onChange={(next) => setArmed(next)}          size="sm" label="armed" />
          <Toggle checked={muted}          onChange={(next) => setMuted(next)}          size="sm" label="muted" />
          <Toggle checked={soloed}         onChange={(next) => setSoloed(next)}         size="sm" label="soloed" />
          <Toggle checked={selected}       onChange={(next) => setSelected(next)}       size="sm" label="selected" />
          <Toggle checked={clipping}       onChange={(next) => setClipping(next)}       size="sm" label="clipping" />
          <Toggle checked={showAllMeters}  onChange={(next) => setShowAllMeters(next)}  size="sm" label="showAllMeters" />
          <Toggle checked={mode === 'producer'} onChange={next => setMode(next ? 'producer' : 'writer')} size="sm" label="mode=producer" />
          <Toggle checked={variant === 'folder'} onChange={next => setVariant(next ? 'folder' : 'track')} size="sm" label="variant=folder" />
          <Toggle checked={folderOpen}     onChange={(next) => setFolderOpen(next)}     size="sm" label="folderOpen" />
          <Toggle checked={anySoloActive}  onChange={(next) => setAnySoloActive(next)}  size="sm" label="anySoloActive" />
          <Toggle checked={type === 'midi'} onChange={next => setType(next ? 'midi' : 'audio')} size="sm" label="type=midi" />
          <Toggle checked={type === 'instrument'} onChange={next => setType(next ? 'instrument' : 'audio')} size="sm" label="type=instrument" />

          {/* Meter driver */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            meter
            <Fader
              value={meterLevel}
              onChange={setMeterLevel}
              min={-60}
              max={6}
              orientation="horizontal"
              size="sm"
              aria-label="Meter level"
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '5ch', textAlign: 'right' }}>
              {meterLevel.toFixed(0)} dB
            </span>
          </div>

          {/* Color picker */}
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            {TRACK_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                style={{
                  width: 16, height: 16,
                  background: c.value,
                  border: color === c.value
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label={`Color: ${c.label}`}
                aria-pressed={color === c.value}
              />
            ))}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function TrackHeaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
