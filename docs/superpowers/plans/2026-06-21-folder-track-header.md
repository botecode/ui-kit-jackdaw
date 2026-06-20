# FolderTrackHeader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `FolderTrackHeader` component for Folder tracks — composing `MuteSoloToggle`, `Fader`, `PanKnob`, `FxChip`, and `Meter` — with wider keyline + recessed background, disclosure (collapse/expand stored in localStorage), group fader/pan, and no arm/input.

**Architecture:** Dedicated `FolderTrackHeader` at `src/components/FolderTrackHeader/` with its own `FolderTrack` type grounded in the bridge contract (`TrackInfo.kind='folder'`). The component manages open/closed state internally via localStorage (key: `jackdaw.folder.${track.id}.open`), fires `onToggleCollapse` for any parent that needs to know. Composes existing kit primitives; no duplication of TrackHeader internals.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@phosphor-icons/react`, `vitest`, `@testing-library/react`, `fireEvent` (not userEvent).

## Global Constraints

- Tokens only — no hardcoded colors
- CSS Modules with `data-*` attributes for all state
- `fireEvent`, never `userEvent`, in tests
- `tsc --noEmit` + `vitest run` + lint must be green
- `:focus-visible` only, never `:focus`
- All gallery states verified in 3+ themes including a light one (Compare mode)
- No new CSS variables outside `global.css` tokens
- Auto-registers in gallery via `import.meta.glob` — no manual registry edits
- Dogfood kit controls for playground: `Toggle`, `Fader`

---

### Task 1: Scaffold types + stub

**Files:**
- Create: `src/components/FolderTrackHeader/FolderTrackHeader.tsx`
- Create: `src/components/FolderTrackHeader/FolderTrackHeader.module.css`
- Create: `src/components/FolderTrackHeader/index.ts`

**Interfaces:**
- Produces: `FolderTrack`, `FolderTrackHeaderProps` (consumed by Tasks 2–3)

- [ ] **Step 1: Create stub TSX**

Create `src/components/FolderTrackHeader/FolderTrackHeader.tsx`:

```tsx
// src/components/FolderTrackHeader/FolderTrackHeader.tsx
import type { FxPlugin } from '../FxChip'
import styles from './FolderTrackHeader.module.css'

export type { FxPlugin }

export interface FolderTrack {
  id:           string
  name:         string
  color:        string
  parentId:     string | null
  childCount:   number
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}

export interface FolderTrackHeaderProps {
  track:             FolderTrack
  onRename:          (name: string) => void
  onMute:            () => void
  onSolo:            () => void
  onVolume:          (db: number) => void
  onPan:             (pan: number) => void
  onToggleChain:     (next: boolean) => void
  onTogglePlugin:    (id: string, next: boolean) => void
  onReorder:         (from: number, to: number) => void
  onRemovePlugin:    (id: string) => void
  onAddPlugin:       () => void
  onOpenPlugin:      (id: string) => void
  onSelect:          () => void
  onToggleCollapse?: (collapsed: boolean) => void
  meterLevel?:       number
  meterLevelL?:      number
  meterLevelR?:      number
  anySoloActive?:    boolean
  disabled?:         boolean
  clipping?:         boolean
  showAllMeters?:    boolean
}

export function FolderTrackHeader(_props: FolderTrackHeaderProps) {
  return <div className={styles.root} />
}
```

- [ ] **Step 2: Create CSS stub**

Create `src/components/FolderTrackHeader/FolderTrackHeader.module.css`:

```css
/* src/components/FolderTrackHeader/FolderTrackHeader.module.css */
.root {}
```

- [ ] **Step 3: Create index.ts**

Create `src/components/FolderTrackHeader/index.ts`:

```ts
export { FolderTrackHeader } from './FolderTrackHeader'
export type { FolderTrack, FolderTrackHeaderProps } from './FolderTrackHeader'
export type { FxPlugin } from '../FxChip'
```

- [ ] **Step 4: Verify tsc passes**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/FolderTrackHeader/
git commit -m "chore(FolderTrackHeader): scaffold types + stub"
```

---

### Task 2: Tests → full implementation

**Files:**
- Create: `src/components/FolderTrackHeader/FolderTrackHeader.test.tsx`
- Modify: `src/components/FolderTrackHeader/FolderTrackHeader.tsx` (full implementation)
- Modify: `src/components/FolderTrackHeader/FolderTrackHeader.module.css` (full CSS)

**Interfaces:**
- Consumes: `FolderTrack`, `FolderTrackHeaderProps` from Task 1
- Produces: verified structure (role=group, M/S, fader, pan, FxChip, no ArmButton, no InputSelect, localStorage collapse)

- [ ] **Step 1: Write failing tests**

Create `src/components/FolderTrackHeader/FolderTrackHeader.test.tsx`:

```tsx
// src/components/FolderTrackHeader/FolderTrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FolderTrackHeader } from './FolderTrackHeader'
import type { FolderTrack } from './FolderTrackHeader'

const BASE_FOLDER: FolderTrack = {
  id: 'f1', name: 'Drums Bus', color: '#7ec8a4',
  parentId: null, childCount: 4,
  muted: false, soloed: false,
  volumeDb: 0, pan: 0,
  plugins: [], chainEnabled: true, selected: false,
}

const noop = () => {}
const BASE_PROPS = {
  track: BASE_FOLDER,
  onRename: noop, onMute: noop, onSolo: noop,
  onVolume: noop, onPan: noop,
  onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
  onRemovePlugin: noop, onAddPlugin: noop, onOpenPlugin: noop, onSelect: noop,
}

beforeEach(() => {
  localStorage.clear()
})

describe('FolderTrackHeader — structure', () => {
  it('renders as role=group with track name as aria-label', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toBeInTheDocument()
  })

  it('carries data-variant="folder"', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-variant', 'folder')
  })

  it('renders FxChip button', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('renders Mute and Solo buttons', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
  })

  it('renders group volume fader (role=slider)', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /group volume/i })).toBeInTheDocument()
  })

  it('does NOT render ArmButton', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
  })

  it('does NOT render audio input selector', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /audio input/i })).not.toBeInTheDocument()
  })

  it('renders PanKnob element with aria-label containing "Pan"', () => {
    const { container } = render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(container.querySelector('[aria-label*="Pan"]')).toBeInTheDocument()
  })

  it('calls onSelect when root group is clicked', () => {
    const onSelect = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group', { name: 'Drums Bus' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('calls onMute when Mute button is clicked', () => {
    const onMute = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onMute={onMute} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onSolo when Solo button is clicked', () => {
    const onSolo = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onSolo).toHaveBeenCalledTimes(1)
  })
})

describe('FolderTrackHeader — data-* states', () => {
  it('has data-selected when track.selected=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, selected: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-selected')
  })

  it('has data-muted when track.muted=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, muted: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-muted')
  })

  it('has data-soloed when track.soloed=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, soloed: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-soloed')
  })

  it('has data-disabled when disabled=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} disabled />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-disabled')
  })
})

describe('FolderTrackHeader — disclosure (collapse)', () => {
  it('renders a disclosure button expanded by default (aria-expanded=true)', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    const btn = screen.getByRole('button', { name: /collapse drums bus/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('disclosure has data-open when expanded', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /collapse drums bus/i })).toHaveAttribute('data-open')
  })

  it('clicking disclosure toggles to collapsed', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    const btn = screen.getByRole('button', { name: /expand drums bus/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).not.toHaveAttribute('data-open')
  })

  it('persists collapsed state to localStorage', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    expect(localStorage.getItem('jackdaw.folder.f1.open')).toBe('false')
  })

  it('persists expanded state to localStorage', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /expand drums bus/i }))
    expect(localStorage.getItem('jackdaw.folder.f1.open')).toBe('true')
  })

  it('reads initial collapsed state from localStorage', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /expand drums bus/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('fires onToggleCollapse with true when collapsing', () => {
    const onToggleCollapse = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onToggleCollapse={onToggleCollapse} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    expect(onToggleCollapse).toHaveBeenCalledWith(true)
  })

  it('fires onToggleCollapse with false when expanding', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    const onToggleCollapse = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onToggleCollapse={onToggleCollapse} />)
    fireEvent.click(screen.getByRole('button', { name: /expand drums bus/i }))
    expect(onToggleCollapse).toHaveBeenCalledWith(false)
  })
})

describe('FolderTrackHeader — name editing', () => {
  it('shows an input with current name on double-click', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    expect(screen.getByRole('textbox', { name: /track name/i })).toHaveValue('Drums Bus')
  })

  it('calls onRename with trimmed value on Enter and exits edit mode', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '  Group Bus  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Group Bus')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call onRename on Escape; restores original name', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Drums Bus')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('falls back to original name when input is empty on Enter', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Drums Bus')
  })
})

describe('FolderTrackHeader — meter visibility (ears-first)', () => {
  it('meter is hidden on a normal unselected track', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('meter appears when track.selected=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, selected: true }} meterLevel={-12} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when clipping=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} clipping meterLevel={2} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when showAllMeters=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} showAllMeters meterLevel={-18} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('fader is always present regardless of meter visibility', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /group volume/i })).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run src/components/FolderTrackHeader/FolderTrackHeader.test.tsx`
Expected: many failures (component is a stub returning `<div />`)

- [ ] **Step 3: Implement FolderTrackHeader.tsx (full)**

Replace `src/components/FolderTrackHeader/FolderTrackHeader.tsx` with:

```tsx
// src/components/FolderTrackHeader/FolderTrackHeader.tsx
import { CSSProperties, useState, useRef, useEffect } from 'react'
import { FolderSimple, CaretRight } from '@phosphor-icons/react'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import styles from './FolderTrackHeader.module.css'

export type { FxPlugin }

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FolderTrack {
  id:           string
  name:         string
  color:        string
  parentId:     string | null
  childCount:   number
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}

export interface FolderTrackHeaderProps {
  track:             FolderTrack
  onRename:          (name: string) => void
  onMute:            () => void
  onSolo:            () => void
  onVolume:          (db: number) => void
  onPan:             (pan: number) => void
  onToggleChain:     (next: boolean) => void
  onTogglePlugin:    (id: string, next: boolean) => void
  onReorder:         (from: number, to: number) => void
  onRemovePlugin:    (id: string) => void
  onAddPlugin:       () => void
  onOpenPlugin:      (id: string) => void
  onSelect:          () => void
  onToggleCollapse?: (collapsed: boolean) => void
  meterLevel?:       number
  meterLevelL?:      number
  meterLevelR?:      number
  anySoloActive?:    boolean
  disabled?:         boolean
  clipping?:         boolean
  showAllMeters?:    boolean
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const DB_SCALE = dbScale()

function lsKey(id: string) { return `jackdaw.folder.${id}.open` }

function readOpen(id: string): boolean {
  try {
    const val = localStorage.getItem(lsKey(id))
    return val === null ? true : val !== 'false'
  } catch { return true }
}

function writeOpen(id: string, open: boolean) {
  try { localStorage.setItem(lsKey(id), String(open)) } catch {}
}

// ── FolderTopBar ──────────────────────────────────────────────────────────────

interface FolderTopBarProps {
  name:           string
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  open:           boolean
  disabled:       boolean
  onRename:       (name: string) => void
  onToggleOpen:   () => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onOpenPlugin:   (id: string) => void
}

function FolderTopBar({
  name, plugins, chainEnabled, open, disabled,
  onRename, onToggleOpen,
  onToggleChain, onTogglePlugin, onReorder, onRemovePlugin, onAddPlugin, onOpenPlugin,
}: FolderTopBarProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const originalRef = useRef(name)
  const committedRef = useRef(false)

  function startEdit() {
    committedRef.current = false
    originalRef.current = name
    setDraft(name)
    setEditing(true)
  }

  function commit() {
    if (committedRef.current) return
    committedRef.current = true
    const value = draft.trim() || originalRef.current
    onRename(value)
    setEditing(false)
  }

  function cancel() {
    committedRef.current = true
    setEditing(false)
  }

  return (
    <div className={styles.topBar} data-section="topbar">
      <FolderSimple size={16} className={styles.glyph} aria-hidden />
      {editing ? (
        <input
          className={styles.nameInput}
          aria-label="Track name"
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); commit() }
            if (e.key === 'Escape') { e.preventDefault(); cancel() }
          }}
        />
      ) : (
        <span
          className={styles.name}
          tabIndex={0}
          onDoubleClick={startEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit() }
          }}
        >
          {name}
        </span>
      )}
      <button
        className={styles.disclosure}
        aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
        aria-expanded={open}
        data-open={open || undefined}
        onClick={onToggleOpen}
        disabled={disabled}
      >
        <CaretRight size={12} />
      </button>
      <div className={styles.cornerChips}>
        <FxChip
          plugins={plugins}
          chainEnabled={chainEnabled}
          onToggleChain={onToggleChain}
          onTogglePlugin={onTogglePlugin}
          onReorder={onReorder}
          onRemove={onRemovePlugin}
          onAdd={onAddPlugin}
          onOpenPlugin={onOpenPlugin}
          size="sm"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ── FolderControlStrip ────────────────────────────────────────────────────────

interface FolderControlStripProps {
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  pan:           number
  color:         string
  showMeter:     boolean
  meterLevel?:   number
  meterLevelL?:  number
  meterLevelR?:  number
  anySoloActive: boolean
  disabled:      boolean
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
  onPan:         (pan: number) => void
}

function FolderControlStrip({
  muted, soloed, volumeDb, pan, color,
  showMeter, meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onMute, onSolo, onVolume, onPan,
}: FolderControlStripProps) {
  return (
    <div className={styles.controlStrip} data-section="strip">
      <MuteSoloToggle
        muted={muted}
        soloed={soloed}
        onToggleMute={onMute}
        onToggleSolo={onSolo}
        anySoloActive={anySoloActive}
        size="sm"
        disabled={disabled}
      />
      <Fader
        orientation="vertical"
        scale={DB_SCALE}
        min={-60}
        max={6}
        value={volumeDb}
        onChange={onVolume}
        size="sm"
        disabled={disabled}
        aria-label="Group volume"
      />
      <PanKnob
        pan={pan}
        onChange={onPan}
        color={color}
        size="sm"
        disabled={disabled}
      />
      {showMeter && (
        <Meter
          value={meterLevel}
          valueL={meterLevelL}
          valueR={meterLevelR}
          peakHold
          clipLatch
          ballistics
          orientation="vertical"
          size="sm"
          aria-label="Level"
        />
      )}
    </div>
  )
}

// ── FolderTrackHeader ─────────────────────────────────────────────────────────

export function FolderTrackHeader({
  track,
  onRename,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  onSelect,
  onToggleCollapse,
  meterLevel,
  meterLevelL,
  meterLevelR,
  anySoloActive = false,
  disabled = false,
  clipping = false,
  showAllMeters = false,
}: FolderTrackHeaderProps) {
  const [open, setOpen] = useState(() => readOpen(track.id))
  const showMeter = track.selected || clipping || showAllMeters

  useEffect(() => {
    setOpen(readOpen(track.id))
  }, [track.id])

  function handleToggleOpen() {
    const next = !open
    setOpen(next)
    writeOpen(track.id, next)
    onToggleCollapse?.(!next)
  }

  return (
    <div
      role="group"
      aria-label={track.name}
      className={styles.root}
      data-variant="folder"
      data-muted={track.muted || undefined}
      data-soloed={track.soloed || undefined}
      data-selected={track.selected || undefined}
      data-clipping={clipping || undefined}
      data-disabled={disabled || undefined}
      style={{ '--track-color': track.color } as CSSProperties}
      onClick={onSelect}
    >
      <div className={styles.keyline} aria-hidden />
      <FolderTopBar
        name={track.name}
        plugins={track.plugins}
        chainEnabled={track.chainEnabled}
        open={open}
        disabled={disabled}
        onRename={onRename}
        onToggleOpen={handleToggleOpen}
        onToggleChain={onToggleChain}
        onTogglePlugin={onTogglePlugin}
        onReorder={onReorder}
        onRemovePlugin={onRemovePlugin}
        onAddPlugin={onAddPlugin}
        onOpenPlugin={onOpenPlugin}
      />
      <FolderControlStrip
        muted={track.muted}
        soloed={track.soloed}
        volumeDb={track.volumeDb}
        pan={track.pan}
        color={track.color}
        showMeter={showMeter}
        meterLevel={meterLevel}
        meterLevelL={meterLevelL}
        meterLevelR={meterLevelR}
        anySoloActive={anySoloActive}
        disabled={disabled}
        onMute={onMute}
        onSolo={onSolo}
        onVolume={onVolume}
        onPan={onPan}
      />
    </div>
  )
}
```

- [ ] **Step 4: Implement FolderTrackHeader.module.css (full)**

Replace `src/components/FolderTrackHeader/FolderTrackHeader.module.css` with:

```css
/* src/components/FolderTrackHeader/FolderTrackHeader.module.css */

/* ── Root ─────────────────────────────────────────────────────────────────── */

.root {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  /* Recessed container feel: ~12% darker than strip-bg */
  background: color-mix(in srgb, var(--strip-bg) 88%, black);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: default;
  transition: box-shadow var(--dur-fast) var(--ease-out);
  user-select: none;
  -webkit-user-select: none;
}

/* ── Keyline — always 6px (folder visual identity) ───────────────────────── */

.keyline {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: color-mix(in srgb, var(--track-color, var(--accent)) 70%, transparent);
  transition:
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
  pointer-events: none;
}

/* ── TopBar ───────────────────────────────────────────────────────────────── */

.topBar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-3) + 6px);
  min-height: 28px;
}

.glyph {
  flex-shrink: 0;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: var(--text);
  padding: 1px 2px;
  border-radius: 2px;
  cursor: default;
}

.name:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.nameInput {
  flex: 1;
  min-width: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: var(--stage-text);
  background: var(--stage);
  border: 1px solid var(--accent);
  border-radius: 2px;
  padding: 1px var(--space-1);
  outline: none;
}

.disclosure {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  border-radius: 2px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  /* Decorative rotation — snaps under prefers-reduced-motion */
  transition:
    color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.disclosure[data-open] {
  transform: rotate(90deg);
}

.disclosure:hover:not(:disabled) {
  color: var(--text);
}

.disclosure:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.cornerChips {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

/* ── ControlStrip ─────────────────────────────────────────────────────────── */

.controlStrip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-2) calc(var(--space-3) + 6px);
}

/* ── States ───────────────────────────────────────────────────────────────── */

/* selected: accent inset ring + full-brightness keyline + bloom */
.root[data-selected] {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent);
}

.root[data-selected] .keyline {
  background: var(--track-color, var(--accent));
  box-shadow: 0 0 10px color-mix(in srgb, var(--track-color, var(--accent)) 70%, transparent);
}

/* muted: dim control strip */
.root[data-muted] .controlStrip {
  opacity: 0.7;
}

/* soloed: warm glow on keyline */
.root[data-soloed] .keyline {
  box-shadow: 0 0 6px var(--led-yellow);
}

/* disabled */
.root[data-disabled] {
  opacity: 0.4;
  pointer-events: none;
}

/* ── Reduced-motion: snap disclosure rotation (decorative) ───────────────── */

@media (prefers-reduced-motion: reduce) {
  .disclosure {
    transition: color var(--dur-fast) var(--ease-out);
  }
}
```

- [ ] **Step 5: Run tests — verify all pass**

Run: `npx vitest run src/components/FolderTrackHeader/FolderTrackHeader.test.tsx`
Expected: all tests PASS

- [ ] **Step 6: Run full tsc check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/FolderTrackHeader/
git commit -m "feat(FolderTrackHeader): component + CSS + tests green

Dedicated FolderTrackHeader — distinct from TrackHeader — with own FolderTrack
type grounded in bridge contract (kind='folder', childCount, parentId).

Visual identity:
- 6px keyline (vs 3px on track), recessed bg (color-mix strip-bg 88% black)
- Bold name, FolderSimple glyph

Controls: MuteSoloToggle + group Fader (aria-label='Group volume') + PanKnob + FxChip
No arm/input (folder tracks don't record / have no audio input)

Collapse:
- localStorage key: jackdaw.folder.<id>.open (default true=expanded)
- onToggleCollapse?(collapsed) fires so parents can update arrangement view
- disclosure caret rotates 90deg when open; snap under reduced-motion

Meter: ears-first — hidden unless selected/clipping/showAllMeters

State attributes: data-variant='folder' data-muted data-soloed data-selected
data-clipping data-disabled

Decision: collapse state managed internally via localStorage (not parent-controlled).
Rationale: spec says 'UI view state — localStorage'; callback keeps parents informed.
"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/FolderTrackHeader/FolderTrackHeader.demo.tsx`

**Interfaces:**
- Consumes: `FolderTrackHeader`, `FolderTrack`, `FxPlugin` from Task 2

- [ ] **Step 1: Create gallery demo**

Create `src/components/FolderTrackHeader/FolderTrackHeader.demo.tsx`:

```tsx
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

function StatesDemo() {
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

      <State label="collapsed">
        <div style={{ width: 220 }}>
          {/* Seed localStorage so this renders collapsed on mount */}
          {(() => { try { localStorage.setItem('jackdaw.folder.f-coll.open', 'false') } catch {} return null })()}
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
            onToggleCollapse={collapsed => console.log('collapsed:', collapsed)}
            anySoloActive={anySoloActive}
            clipping={clipping}
            showAllMeters={showAllMeters}
            disabled={disabled}
            meterLevel={meterLevel}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={muted}          onChange={setMuted}          size="sm" label="muted" />
          <Toggle checked={soloed}         onChange={setSoloed}         size="sm" label="soloed" />
          <Toggle checked={selected}       onChange={setSelected}       size="sm" label="selected" />
          <Toggle checked={clipping}       onChange={setClipping}       size="sm" label="clipping" />
          <Toggle checked={showAllMeters}  onChange={setShowAllMeters}  size="sm" label="showAllMeters" />
          <Toggle checked={anySoloActive}  onChange={setAnySoloActive}  size="sm" label="anySoloActive" />
          <Toggle checked={disabled}       onChange={setDisabled}       size="sm" label="disabled" />

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

export default function FolderTrackHeaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Verify gallery auto-discovers the demo**

Run: `grep -n "glob" src/gallery/registry.ts`
Expected: line showing `import.meta.glob` covering `*.demo.tsx` — no manual edit needed

- [ ] **Step 3: Run full test + tsc**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS, no type errors

- [ ] **Step 4: Commit**

```bash
git add src/components/FolderTrackHeader/FolderTrackHeader.demo.tsx
git commit -m "feat(FolderTrackHeader): gallery demo — 8 states + interactive playground"
```

---

### Task 4: Verify green bar

**Files:**
- Fix only what's failing

- [ ] **Step 1: Full vitest run (all components)**

Run: `npx vitest run`
Expected: all tests PASS — zero regressions in other components

- [ ] **Step 2: TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/FolderTrackHeader/`
Expected: no errors

- [ ] **Step 4: Fix any issues found**

If failures exist, diagnose and fix the specific issue. Re-run the failing command to confirm green.

- [ ] **Step 5: Commit fixes if any**

```bash
git add src/components/FolderTrackHeader/
git commit -m "fix(FolderTrackHeader): <describe the fix>"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Wider 6px keyline | Task 2 CSS |
| Recessed background (color-mix strip-bg 88% black) | Task 2 CSS |
| Disclosure control (collapse/expand) | Task 2 |
| localStorage persistence for collapse state | Task 2 |
| onToggleCollapse callback | Task 2 |
| Group Fader (aria-label="Group volume") | Task 2 |
| Group PanKnob | Task 2 |
| FxChip (group plugin chain) | Task 2 |
| No ArmButton, no InputSelect | Task 2 (excluded + tested) |
| Meter: summed level, ears-first (selected/clipping/showAllMeters) | Task 2 |
| FolderTrack type: kind='folder', parentId, childCount | Task 2 |
| Callbacks: onMute/onSolo/onVolume/onPan/onRename (bridge contract) | Task 2 |
| data-* attributes: muted/soloed/selected/clipping/disabled | Task 2 |
| Gallery: expanded state | Task 3 |
| Gallery: collapsed state | Task 3 |
| Gallery: with children / without children | Task 3 |
| Gallery: selected (meter visible) | Task 3 |
| Gallery: muted | Task 3 |
| Gallery: soloed | Task 3 |
| Gallery: clipping | Task 3 |
| Gallery: disabled | Task 3 |
| Gallery: playground (all toggles + meter driver + color picker) | Task 3 |
| Tokens only | CSS (color-mix on existing tokens) |
| reduced-motion: disclosure rotation snaps | Task 2 CSS |
| tsc + vitest + lint green | Task 4 |

**Type consistency:** `FolderTrack` and `FolderTrackHeaderProps` defined identically in Task 1 stub → used unchanged in Task 2 full impl → Task 3 demo.

**Placeholder scan:** No TBDs, no "implement later", no vague steps.
