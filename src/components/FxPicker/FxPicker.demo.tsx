import { useMemo, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { FxPicker, type PluginInfo } from './FxPicker'

export const meta: DemoMeta = {
  name: 'FxPicker',
  group: 'Composites',
  route: '/fx-picker',
  order: 122,
}

// ── Fixture data ────────────────────────────────────────────────────────────────

const PLUGINS: PluginInfo[] = [
  { id: 'proq', name: 'Pro-Q 3', company: 'FabFilter', kind: 'fx', category: 'EQ', format: 'VST3', favorite: true, available: true, recentlyUsed: true },
  { id: 'proc', name: 'Pro-C 2', company: 'FabFilter', kind: 'fx', category: 'Dynamics', format: 'VST3', favorite: false, available: true, recentlyUsed: true },
  { id: 'prol', name: 'Pro-L 2', company: 'FabFilter', kind: 'fx', category: 'Limiter', format: 'VST3', favorite: false, available: true },
  { id: 'valhalla', name: 'ValhallaVintageVerb', company: 'Valhalla DSP', kind: 'fx', category: 'Reverb', format: 'VST3', favorite: true, available: true, recentlyUsed: true },
  { id: 'decapitator', name: 'Decapitator', company: 'Soundtoys', kind: 'fx', category: 'Saturation', format: 'AU', favorite: false, available: true },
  { id: 'echoboy', name: 'EchoBoy', company: 'Soundtoys', kind: 'fx', category: 'Delay', format: 'AU', favorite: false, available: false },
  { id: 'serum', name: 'Serum', company: 'Xfer Records', kind: 'instrument', category: 'Synth', format: 'VST3', favorite: false, available: true, recentlyUsed: true },
  { id: 'omni', name: 'Omnisphere', company: 'Spectrasonics', kind: 'instrument', category: 'Synth', format: 'VST3', favorite: true, available: true },
  { id: 'kontakt', name: 'Kontakt 7', company: 'Native Instruments', kind: 'instrument', category: 'Sampler', format: 'VST3', favorite: false, available: true },
  { id: 'massive', name: 'Massive X', company: 'Native Instruments', kind: 'instrument', category: 'Synth', format: 'VST3', favorite: false, available: false },
  { id: 'diva', name: 'Diva', company: 'u-he', kind: 'instrument', category: 'Synth', format: 'VST3', favorite: false, available: true },
  { id: 'guitarrig', name: 'Guitar Rig 6', company: 'Native Instruments', kind: 'fx', category: 'Amp Sim', format: 'VST3', favorite: false, available: true },
]

const noop = () => {}

// The header search field renders tone="surface" (paper), not the default
// stage well — check any state below in a light theme (Chroma): the typed
// query + placeholder must read as ink on a light recessed field, never
// dark-on-dark in a black box.

// Fixed-size frame so the browser reads as a floating instrument surface,
// not a full-bleed page. The picker fills its host (height: 100%).
function Frame({ children, height = 460 }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{ height, width: '100%', display: 'flex' }}>{children}</div>
  )
}

// ── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default (full list)">
        <Frame>
          <FxPicker plugins={PLUGINS} onAdd={noop} onToggleFavorite={noop} onRescan={noop} onClose={noop} installedCount={243} />
        </Frame>
      </State>

      <State label="A company selected">
        <Frame>
          <FxPicker plugins={PLUGINS} companies={['FabFilter', 'Soundtoys', 'Valhalla DSP']} onAdd={noop} onToggleFavorite={noop} onRescan={noop} />
        </Frame>
      </State>

      <State label="Empty (nothing installed)">
        <Frame>
          <FxPicker plugins={[]} onAdd={noop} onToggleFavorite={noop} onRescan={noop} onClose={noop} />
        </Frame>
      </State>

      <State label="Loading (rescanning)">
        <Frame>
          <FxPicker plugins={PLUGINS} onAdd={noop} onToggleFavorite={noop} onRescan={noop} loading />
        </Frame>
      </State>

      <State label="Small (dense)">
        <Frame>
          <FxPicker plugins={PLUGINS} onAdd={noop} onToggleFavorite={noop} onRescan={noop} size="sm" installedCount={243} />
        </Frame>
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────
// Live, stateful instance — search, filter, sidebar, add + favorite all work.

function PlaygroundDemo() {
  const [plugins, setPlugins] = useState(PLUGINS)
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [log, setLog] = useState<string[]>([])

  const installed = useMemo(() => plugins.length, [plugins])

  function note(line: string) {
    setLog(prev => [line, ...prev].slice(0, 4))
  }

  function rescan() {
    setLoading(true)
    note('Rescanning…')
    // Demo-only fake delay; no timers in the component itself.
    window.setTimeout(() => {
      setLoading(false)
      note('Scan complete')
    }, 1200)
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <Toggle checked={size === 'sm'} onChange={next => setSize(next ? 'sm' : 'md')} size="sm" label="dense (sm)" />
          <Toggle checked={loading} onChange={setLoading} size="sm" label="loading" />
        </div>

        <div style={{ height: 500, width: '100%', display: 'flex' }}>
          <FxPicker
            plugins={plugins}
            loading={loading}
            size={size}
            installedCount={installed}
            onAdd={id => note(`Add → ${plugins.find(p => p.id === id)?.name}`)}
            onRescan={rescan}
            onClose={() => note('Close')}
            onToggleFavorite={(id, next) => {
              setPlugins(prev => prev.map(p => (p.id === id ? { ...p, favorite: next } : p)))
              note(`${next ? 'Favorited' : 'Unfavorited'} → ${plugins.find(p => p.id === id)?.name}`)
            }}
          />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            minHeight: '4em',
          }}
        >
          {log.length === 0 ? 'interactions appear here…' : log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ───────────────────────────────────────────────────────────

export default function FxPickerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
