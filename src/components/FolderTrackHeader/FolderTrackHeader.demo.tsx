// src/components/FolderTrackHeader/FolderTrackHeader.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { FolderTrackHeader } from './FolderTrackHeader'
import type { FolderTrack } from './FolderTrackHeader'
import type { FxPlugin } from '../FxChip'

export const meta: DemoMeta = {
  name: 'FolderTrackHeader',
  group: 'Composites',
  route: '/folder-track-header',
  order: 2,
}

const STUB_PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Glue Comp', enabled: true },
  { id: 'p2', name: 'Bus EQ', enabled: true },
]

function makeFolder(overrides: Partial<FolderTrack> = {}): FolderTrack {
  return {
    id: 'f-demo', name: 'Drums Bus', color: 'var(--track-color-2)',
    parentId: null, childCount: 4,
    muted: false, soloed: false,
    volumeDb: 0, pan: 0,
    plugins: STUB_PLUGINS, chainEnabled: true, selected: false,
    ...overrides,
  }
}

const noop   = () => {}
const noopId = (_: string) => {}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  // Seed localStorage so the "folder closed" tile renders closed on mount
  try { localStorage.setItem('jackdaw.folder.f-coll.open', 'false') } catch {}

  return (
    <StatesGrid>
      <State label="expanded (default)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-exp', name: 'Drums Bus' })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
          />
        </div>
      </State>

      <State label="folder closed (disclosure toggled)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-coll', name: 'Strings Bus', color: 'var(--track-color-3)' })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
          />
        </div>
      </State>

      <State label="minimized (compact row)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-min', name: 'Drums Bus', childCount: 4 })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
            minimized
          />
        </div>
      </State>

      <State label="minimized · muted + soloed (M/S glowing)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-min-ms', name: 'Strings Bus', color: 'var(--track-color-3)', muted: true, soloed: true, childCount: 6 })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} anySoloActive
            minimized
          />
        </div>
      </State>

      <State label="minimized · clipping (meter latched)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-min-clip', name: 'Master Bus', color: 'var(--track-color-6)', childCount: 8 })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} clipping meterLevel={2}
            minimized
          />
        </div>
      </State>

      <State label="minimized · selected (focused while collapsed)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-min-sel', name: 'Vocals Bus', color: 'var(--track-color-1)', selected: true, childCount: 3 })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
            minimized
          />
        </div>
      </State>

      <State label="expanded vs minimized">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>normal</div>
            <div style={{ width: 200 }}>
              <FolderTrackHeader
                track={makeFolder({ id: 'f-cmp-exp', name: 'Synths Bus', color: 'var(--track-color-4)', childCount: 5 })}
                onRename={noopId} onMute={noop} onSolo={noop}
                onVolume={noop} onPan={noop}
                onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
                onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
                onSelect={noop}
              />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>minimized</div>
            <div style={{ width: 200 }}>
              <FolderTrackHeader
                track={makeFolder({ id: 'f-cmp-min', name: 'Synths Bus', color: 'var(--track-color-4)', childCount: 5 })}
                onRename={noopId} onMute={noop} onSolo={noop}
                onVolume={noop} onPan={noop}
                onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
                onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
                onSelect={noop}
                minimized
              />
            </div>
          </div>
        </div>
      </State>

      <State label="selected (meter visible)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-sel', name: 'Drums Bus', color: 'var(--track-color-4)', selected: true })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} meterLevel={-6} meterLevelL={-6} meterLevelR={-8}
          />
        </div>
      </State>

      <State label="muted">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-mut', name: 'Synths Bus', color: 'var(--track-color-3)', muted: true })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
          />
        </div>
      </State>

      <State label="soloed">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-sol', name: 'Vocals Bus', color: 'var(--track-color-1)', soloed: true })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} anySoloActive
          />
        </div>
      </State>

      <State label="clipping (meter latched)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-clip', name: 'Master Bus', color: 'var(--track-color-6)' })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} clipping meterLevel={2}
          />
        </div>
      </State>

      <State label="disabled">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-dis', name: 'Perc Bus', color: 'var(--track-color-5)' })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop} disabled
          />
        </div>
      </State>

      <State label="no children (empty folder)">
        <div style={{ width: 220 }}>
          <FolderTrackHeader
            track={makeFolder({ id: 'f-empty', name: 'FX Returns', childCount: 0, plugins: [] })}
            onRename={noopId} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onOpenPlugin={noopId}
            onSelect={noop}
          />
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
  const [name,          setName]          = useState('Drums Bus')
  const [color,         setColor]         = useState('var(--track-color-2)')
  const [muted,         setMuted]         = useState(false)
  const [soloed,        setSoloed]        = useState(false)
  const [selected,      setSelected]      = useState(false)
  const [anySoloActive, setAnySoloActive] = useState(false)
  const [clipping,      setClipping]      = useState(false)
  const [showAllMeters, setShowAllMeters] = useState(false)
  const [minimized,     setMinimized]     = useState(false)
  const [disabled,      setDisabled]      = useState(false)
  const [volumeDb,      setVolumeDb]      = useState(0)
  const [pan,           setPan]           = useState(0)
  const [plugins,       setPlugins]       = useState<FxPlugin[]>(STUB_PLUGINS)
  const [chainEnabled,  setChainEnabled]  = useState(true)
  const [meterLevel,    setMeterLevel]    = useState(-12)

  const track: FolderTrack = {
    id: 'pg-folder', name, color,
    parentId: null, childCount: 4,
    muted, soloed, volumeDb, pan,
    plugins, chainEnabled, selected,
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Live instance */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <FolderTrackHeader
            track={track}
            onRename={setName}
            onMute={() => setMuted(m => !m)}
            onSolo={() => setSoloed(s => !s)}
            onVolume={setVolumeDb}
            onPan={setPan}
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
              setPlugins(ps => [...ps, { id: `p${Date.now()}`, name: 'Limiter', enabled: true }])
            }
            onOpenPlugin={id => console.log('open plugin', id)}
            onSelect={() => setSelected(s => !s)}
            onToggleCollapse={collapsed => console.log('folder-closed:', collapsed)}
            onToggleMinimized={setMinimized}
            anySoloActive={anySoloActive}
            clipping={clipping}
            showAllMeters={showAllMeters}
            minimized={minimized}
            disabled={disabled}
            meterLevel={meterLevel}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={minimized}     onChange={setMinimized}     size="sm" label="minimized" />
          <Toggle checked={muted}         onChange={setMuted}         size="sm" label="muted" />
          <Toggle checked={soloed}        onChange={setSoloed}        size="sm" label="soloed" />
          <Toggle checked={selected}      onChange={setSelected}      size="sm" label="selected" />
          <Toggle checked={clipping}      onChange={setClipping}      size="sm" label="clipping" />
          <Toggle checked={showAllMeters} onChange={setShowAllMeters} size="sm" label="showAllMeters" />
          <Toggle checked={anySoloActive} onChange={setAnySoloActive} size="sm" label="anySoloActive" />
          <Toggle checked={disabled}      onChange={setDisabled}      size="sm" label="disabled" />

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
                  border: color === c.value ? '2px solid var(--accent)' : '1px solid var(--border)',
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

export default function FolderTrackHeaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
