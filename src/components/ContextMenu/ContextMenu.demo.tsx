// src/components/ContextMenu/ContextMenu.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ContextMenu, useContextMenu } from './ContextMenu'
import type { MenuEntry } from './ContextMenu'

export const meta: DemoMeta = {
  name:  'ContextMenu',
  group: 'Primitives',
  route: '/context-menu',
  order: 9,
}

// ── Shared item sets ──────────────────────────────────────────────────────────

const BASIC_ITEMS: MenuEntry[] = [
  { id: 'cut',    label: 'Cut',    onSelect: () => {} },
  { id: 'copy',   label: 'Copy',   onSelect: () => {} },
  { id: 'paste',  label: 'Paste',  onSelect: () => {} },
  { id: 'delete', label: 'Delete', onSelect: () => {} },
]

const RICH_ITEMS: MenuEntry[] = [
  { id: 'undo',   label: 'Undo',   shortcut: '⌘Z',   onSelect: () => {} },
  { id: 'redo',   label: 'Redo',   shortcut: '⌘⇧Z',  onSelect: () => {} },
  { id: 'sep1',   separator: true },
  { id: 'cut',    label: 'Cut',    shortcut: '⌘X',   onSelect: () => {} },
  { id: 'copy',   label: 'Copy',   shortcut: '⌘C',   onSelect: () => {} },
  { id: 'paste',  label: 'Paste',  shortcut: '⌘V',   onSelect: () => {} },
]

const MIXED_ITEMS: MenuEntry[] = [
  { id: 'rename', label: 'Rename',      onSelect: () => {} },
  { id: 'mute',   label: 'Mute Track',  checked: true,   onSelect: () => {} },
  { id: 'sep1',   separator: true },
  { id: 'lock',   label: 'Lock',        disabled: true,  onSelect: () => {} },
  { id: 'delete', label: 'Delete Track', danger: true,   onSelect: () => {} },
]

// ── Shared button style for demo trigger buttons ──────────────────────────────

const TRIGGER_STYLE: React.CSSProperties = {
  background: 'var(--stage)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--stage-text)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  padding: 'var(--space-1) var(--space-3)',
}

// ── Simple state card: button opens menu at the click position ────────────────

function MenuCard({ label, items }: { label: string; items: MenuEntry[] }) {
  const [state, setState] = useState({ open: false, x: 0, y: 0 })
  return (
    <State label={label}>
      <button
        onClick={(e) => setState({ open: true, x: e.clientX, y: e.clientY })}
        style={TRIGGER_STYLE}
      >
        Open menu
      </button>
      <ContextMenu
        items={items}
        open={state.open}
        x={state.x}
        y={state.y}
        onClose={() => setState(s => ({ ...s, open: false }))}
        aria-label={label}
      />
    </State>
  )
}

// ── Edge-flip card: one axis forced near the viewport edge, the other tracks
//    the actual click so the menu visually appears near the button ──────────────

function EdgeCard({
  label,
  getCoords,
}: {
  label: string
  getCoords: (e: React.MouseEvent<HTMLButtonElement>) => { x: number; y: number }
}) {
  const [state, setState] = useState({ open: false, x: 0, y: 0 })
  return (
    <State label={label}>
      <button
        onClick={(e) => {
          const { x, y } = getCoords(e)
          setState({ open: true, x, y })
        }}
        style={TRIGGER_STYLE}
      >
        Open at edge
      </button>
      <ContextMenu
        items={BASIC_ITEMS}
        open={state.open}
        x={state.x}
        y={state.y}
        onClose={() => setState(s => ({ ...s, open: false }))}
        aria-label={label}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <MenuCard label="Basic"             items={BASIC_ITEMS} />
      <MenuCard label="Shortcuts"         items={RICH_ITEMS}  />
      <MenuCard label="Mixed (sep / disabled / checked / danger)" items={MIXED_ITEMS} />
      <EdgeCard
        label="Near right edge (flips left)"
        getCoords={(e) => ({ x: window.innerWidth - 16, y: e.clientY })}
      />
      <EdgeCard
        label="Near bottom edge (flips up)"
        getCoords={(e) => ({ x: e.clientX, y: window.innerHeight - 16 })}
      />
      <EdgeCard
        label="Near corner (flips both)"
        getCoords={() => ({ x: window.innerWidth - 16, y: window.innerHeight - 16 })}
      />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const menu = useContextMenu()

  const [item1Disabled, setItem1Disabled] = useState(false)
  const [item2Checked,  setItem2Checked]  = useState(false)
  const [item3Danger,   setItem3Danger]   = useState(false)

  const items: MenuEntry[] = [
    { id: 'rename', label: 'Rename',      disabled: item1Disabled, onSelect: () => {} },
    { id: 'mute',   label: 'Mute Track',  checked: item2Checked ? true : undefined, onSelect: () => setItem2Checked(c => !c) },
    { id: 'sep1',   separator: true },
    { id: 'delete', label: 'Delete Track', danger: item3Danger,   onSelect: () => {} },
  ]

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Right-click surface */}
        <div
          {...menu.triggerProps}
          style={{
            width: 240,
            height: 64,
            background: 'var(--stage)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            cursor: 'context-menu',
            userSelect: 'none',
          }}
          role="region"
          aria-label="Right-click surface"
        >
          Right-click anywhere here
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={item1Disabled} onChange={next => setItem1Disabled(next)} size="sm" label="Rename — disabled" />
          <Toggle checked={item2Checked}  onChange={next => setItem2Checked(next)}  size="sm" label="Mute — checked" />
          <Toggle checked={item3Danger}   onChange={next => setItem3Danger(next)}   size="sm" label="Delete — danger" />
        </div>
      </div>

      <ContextMenu
        items={items}
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={menu.onClose}
        aria-label="Track options"
      />
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ContextMenuDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
