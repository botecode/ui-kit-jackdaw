// src/components/SendChip/SendChip.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SendChip } from './SendChip'
import type { SendEntry, ReturnEntry } from './SendChip'

export const meta: DemoMeta = {
  name:  'SendChip',
  group: 'Primitives',
  route: '/send-chip',
  order: 9,
}

const noop = () => {}

const RETURNS: ReturnEntry[] = [
  { id: 'reverb', name: 'Reverb'        },
  { id: 'pcomp',  name: 'Parallel Comp' },
  { id: 'room',   name: 'Room'          },
  { id: 'delay',  name: 'Delay'         },
]

const NO_SENDS: SendEntry[] = []

const ONE_SEND: SendEntry[] = [
  { returnId: 'reverb', returnName: 'Reverb', level: 0.8, tap: 'post', pan: 0, color: '#7ec8a4' },
]

const MULTI_SENDS: SendEntry[] = [
  { returnId: 'reverb', returnName: 'Reverb',        level: 0.75, tap: 'post', pan: 0,    color: '#7ec8a4' },
  { returnId: 'pcomp',  returnName: 'Parallel Comp', level: 0.5,  tap: 'pre',  pan: -0.4, color: '#c4a0e4' },
]

const THREE_SENDS: SendEntry[] = [
  { returnId: 'reverb', returnName: 'Reverb',        level: 0.75, tap: 'post', pan: 0,    color: '#7ec8a4' },
  { returnId: 'pcomp',  returnName: 'Parallel Comp', level: 0.5,  tap: 'pre',  pan: -0.4, color: '#c4a0e4' },
  { returnId: 'room',   returnName: 'Room',          level: 0.4,  tap: 'post', pan: 0.2,  color: '#e4c47e' },
]

// Move a send to a new slot — the engine intent behind drag / Alt+Arrow / Move buttons.
function reorder(sends: SendEntry[], returnId: string, toIndex: number): SendEntry[] {
  const from = sends.findIndex(s => s.returnId === returnId)
  if (from < 0 || toIndex === from) return sends
  const next = sends.slice()
  const [moved] = next.splice(from, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const AUTOMATED_SEND: SendEntry[] = [
  { returnId: 'reverb', returnName: 'Reverb', level: 0.6, tap: 'post', pan: 0.3, color: '#7ec8a4', automated: true },
]

// Minimal track strip to host sends in context — mirrors how they'll sit in TrackHeader
function SendStrip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           'var(--space-2)',
      padding:       '4px var(--space-2)',
      background:    'var(--strip-bg)',
      border:        '1px solid var(--border)',
      borderRadius:  'var(--radius)',
      minWidth:      260,
    }}>
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize:   'var(--text-xs)',
        color:      'var(--text-muted)',
        flexShrink: 0,
        minWidth:   44,
      }}>
        Track 1
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

// ── Stateful wrappers for "open" states (popover / picker can't be faked static) ──

function OpenPopoverDemo() {
  const [sends, setSends] = useState<SendEntry[]>(ONE_SEND)
  return (
    <SendChip
      sends={sends}
      returns={RETURNS}
      onAddSend={noop}
      onSetSendLevel={(id, level) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, level } : s))
      }
      onSetSendTap={(id, tap) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, tap } : s))
      }
      onSetSendPan={(id, pan) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, pan } : s))
      }
      onRemoveSend={id => setSends(ps => ps.filter(s => s.returnId !== id))}
    />
  )
}

function OpenPickerDemo() {
  const [sends, setSends] = useState<SendEntry[]>(ONE_SEND)

  function handleAddSend(id: string | 'new') {
    if (id === 'new') return
    const ret = RETURNS.find(r => r.id === id)
    if (!ret || sends.some(s => s.returnId === id)) return
    setSends(ps => [...ps, { returnId: id, returnName: ret.name, level: 0.75, tap: 'post', pan: 0 }])
  }

  return (
    <SendChip
      sends={sends}
      returns={RETURNS}
      onAddSend={handleAddSend}
      onSetSendLevel={(id, level) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, level } : s))
      }
      onSetSendTap={(id, tap) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, tap } : s))
      }
      onSetSendPan={(id, pan) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, pan } : s))
      }
      onRemoveSend={id => setSends(ps => ps.filter(s => s.returnId !== id))}
    />
  )
}

// Reorderable row — drag a chip, Alt/Option + ←/→, or the popover's Move left/right.
function ReorderDemo() {
  const [sends, setSends] = useState<SendEntry[]>(THREE_SENDS)
  return (
    <SendChip
      sends={sends}
      returns={RETURNS}
      onAddSend={noop}
      onSetSendLevel={(id, level) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, level } : s))
      }
      onSetSendTap={(id, tap) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, tap } : s))
      }
      onSetSendPan={(id, pan) =>
        setSends(ps => ps.map(s => s.returnId === id ? { ...s, pan } : s))
      }
      onRemoveSend={id => setSends(ps => ps.filter(s => s.returnId !== id))}
      onReorderSend={(id, toIndex) => setSends(ps => reorder(ps, id, toIndex))}
    />
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="no sends (+ Send only)">
        <SendStrip>
          <SendChip
            sends={NO_SENDS}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
          />
        </SendStrip>
      </State>

      <State label="one send — post, 80%, center">
        <SendStrip>
          <SendChip
            sends={ONE_SEND}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
          />
        </SendStrip>
      </State>

      <State label="multiple sends (post center + pre L40)">
        <SendStrip>
          <SendChip
            sends={MULTI_SENDS}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
          />
        </SendStrip>
      </State>

      <State label="level automated (violet dot), pan R30">
        <SendStrip>
          <SendChip
            sends={AUTOMATED_SEND}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
          />
        </SendStrip>
      </State>

      <State label="disabled">
        <SendStrip>
          <SendChip
            sends={ONE_SEND}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
            disabled
          />
        </SendStrip>
      </State>

      <State label="size=sm">
        <SendStrip>
          <SendChip
            sends={MULTI_SENDS}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
            size="sm"
          />
        </SendStrip>
      </State>

      <State label="reorderable — drag, Alt/Option + ←/→, or popover Move">
        <div style={{ paddingBottom: 220 }}>
          <SendStrip>
            <ReorderDemo />
          </SendStrip>
        </div>
      </State>

      <State label="single send — no reorder affordance">
        <SendStrip>
          <SendChip
            sends={ONE_SEND}
            returns={RETURNS}
            onAddSend={noop}
            onSetSendLevel={noop}
            onSetSendTap={noop}
            onSetSendPan={noop}
            onRemoveSend={noop}
            onReorderSend={noop}
          />
        </SendStrip>
      </State>

      {/* Open states need extra height so portaled panels don't clip the grid */}
      <State label="popover open (click a chip to open)">
        <div style={{ paddingBottom: 200 }}>
          <SendStrip>
            <OpenPopoverDemo />
          </SendStrip>
        </div>
      </State>

      <State label="picker menu open (click + Send)">
        <div style={{ paddingBottom: 148 }}>
          <SendStrip>
            <OpenPickerDemo />
          </SendStrip>
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [sends, setSends]       = useState<SendEntry[]>(MULTI_SENDS)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize]         = useState<'sm' | 'md'>('md')

  function handleAddSend(id: string | 'new') {
    if (id === 'new') return
    const ret = RETURNS.find(r => r.id === id)
    if (!ret || sends.some(s => s.returnId === id)) return
    setSends(ps => [...ps, { returnId: id, returnName: ret.name, level: 0.75, tap: 'post', pan: 0 }])
  }

  function handleSetLevel(returnId: string, level: number) {
    setSends(ps => ps.map(s => s.returnId === returnId ? { ...s, level } : s))
  }

  function handleSetTap(returnId: string, tap: 'pre' | 'post') {
    setSends(ps => ps.map(s => s.returnId === returnId ? { ...s, tap } : s))
  }

  function handleSetPan(returnId: string, pan: number) {
    setSends(ps => ps.map(s => s.returnId === returnId ? { ...s, pan } : s))
  }

  function handleRemoveSend(returnId: string) {
    setSends(ps => ps.filter(s => s.returnId !== returnId))
  }

  function handleReorderSend(returnId: string, toIndex: number) {
    setSends(ps => reorder(ps, returnId, toIndex))
  }

  return (
    <Playground>
      <div style={{
        display:    'flex',
        gap:        'var(--space-8)',
        alignItems: 'flex-start',
        flexWrap:   'wrap',
      }}>
        <div style={{ paddingBottom: 200 }}>
          <SendStrip>
            <SendChip
              sends={sends}
              returns={RETURNS}
              onAddSend={handleAddSend}
              onSetSendLevel={handleSetLevel}
              onSetSendTap={handleSetTap}
              onSetSendPan={handleSetPan}
              onRemoveSend={handleRemoveSend}
              onReorderSend={handleReorderSend}
              size={size}
              disabled={disabled}
            />
          </SendStrip>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
          <Toggle
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size=sm"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function SendChipDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
