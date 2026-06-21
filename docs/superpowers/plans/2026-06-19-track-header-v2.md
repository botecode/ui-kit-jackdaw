# TrackHeader v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revise TrackHeader to move ArmButton into the R/M/S cluster in the control strip, give the track name room, and make the folder variant visually unmistakable.

**Architecture:** All changes are confined to `TrackHeader.tsx` and `TrackHeader.module.css` — no new components, no new primitives. The R/M/S cluster is a plain flex column wrapper around the existing `ArmButton` and `MuteSoloToggle` within `ControlStrip`. Folder differentiation is pure CSS via `[data-variant="folder"]` selectors that are already emitted by the component.

**Tech Stack:** React (TSX), CSS Modules, `@phosphor-icons/react`, `@testing-library/react` + `vitest`, `@testing-library/jest-dom`

## Global Constraints

- No new primitives or components — modify only `TrackHeader.tsx`, `TrackHeader.module.css`, `TrackHeader.test.tsx`, and `TrackHeader.demo.tsx`
- Icons from `@phosphor-icons/react` only, at the global `IconContext` weight — no other icon sets
- `overflow: hidden` on `.root` must not be removed (it clips the keyline; dropdown portal is a separate task)
- All 18 existing tests must stay green; add new tests for arm placement + folder
- `typecheck` / `lint` / `test` green before each commit

---

## File Map

| File | Role |
|---|---|
| `src/components/TrackHeader/TrackHeader.tsx` | Remove `ArmButton` from `TopBar`; add `armed` + `onArm` to `ControlStripProps`; wrap `ArmButton` + `MuteSoloToggle` in `rmsCluster`; add `data-section` attrs |
| `src/components/TrackHeader/TrackHeader.module.css` | Add `.rmsCluster`; add `[data-variant="folder"]` keyline/bg/name/glyph rules; update left padding for folder |
| `src/components/TrackHeader/TrackHeader.test.tsx` | Add arm-placement test; add folder `data-variant` test |
| `src/components/TrackHeader/TrackHeader.demo.tsx` | Update StatesGrid + Playground to show R/M/S cluster and folder distinctiveness |

---

### Task 1: Move ArmButton to R/M/S cluster in ControlStrip

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.tsx`
- Modify: `src/components/TrackHeader/TrackHeader.module.css`
- Test: `src/components/TrackHeader/TrackHeader.test.tsx`

**Interfaces:**
- Consumes: `ArmButton` (already imported), `MuteSoloToggle` (already imported)
- Produces: `ControlStrip` now accepts `armed: boolean` and `onArm: () => void`; `TopBar` no longer accepts `armed` or `onArm`

- [ ] **Step 1: Write failing test for arm placement**

Add this test to `TrackHeader.test.tsx`, inside `describe('TrackHeader — structure', ...)`:

```tsx
it('arm button is in the control strip, not the top bar (track variant)', () => {
  render(<TrackHeader {...BASE_PROPS} />)
  const armBtn = screen.getByRole('button', { name: /arm for recording/i })
  const topBar = document.querySelector('[data-section="topbar"]')
  const strip  = document.querySelector('[data-section="strip"]')
  expect(topBar).not.toContainElement(armBtn)
  expect(strip).toContainElement(armBtn)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|arm button"
```

Expected: FAIL — `[data-section="topbar"]` and `[data-section="strip"]` are `null` because those attrs don't exist yet.

- [ ] **Step 3: Update TrackHeader.tsx**

Replace the entire file with the revised content below. Key changes:
1. Remove `armed` and `onArm` from `TopBarProps`
2. In `TopBar`: change `{variant === 'folder' ? <disclosure> : <ArmButton>}` to `{variant === 'folder' && <disclosure>}` (arm gone from topbar)
3. Add `data-section="topbar"` to TopBar root div
4. Add `armed: boolean` and `onArm: () => void` to `ControlStripProps`
5. Add `data-section="strip"` to ControlStrip root div
6. Wrap `ArmButton` + `MuteSoloToggle` in `<div className={styles.rmsCluster}>` inside ControlStrip
7. Pass `armed={track.armed}` and `onArm={onArm}` from `TrackHeader` to `ControlStrip`

```tsx
// src/components/TrackHeader/TrackHeader.tsx
import { CSSProperties, useState, useRef } from 'react'
import {
  Waveform, PianoKeys, MusicNote, FolderSimple, CaretRight,
} from '@phosphor-icons/react'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import { InputSelect } from '../InputSelect'
import type { InputSelectOption } from '../InputSelect'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import styles from './TrackHeader.module.css'

export type { FxPlugin, InputSelectOption }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Track {
  id:           string
  name:         string
  color:        string
  type:         'audio' | 'midi' | 'instrument'
  armed:        boolean
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  inputId:      string | null
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}

export interface TrackHeaderProps {
  track:           Track
  onRename:        (name: string) => void
  onArm:           () => void
  onMute:          () => void
  onSolo:          () => void
  onVolume:        (db: number) => void
  onPan:           (pan: number) => void
  onSelectInput:   (id: string) => void
  onToggleChain:   (next: boolean) => void
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (from: number, to: number) => void
  onRemovePlugin:  (id: string) => void
  onAddPlugin:     () => void
  onSelect:        () => void
  onToggleFolder?: () => void
  folderOpen?:     boolean
  mode?:           'writer' | 'producer'
  variant?:        'track' | 'folder'
  meterLevel?:     number
  meterLevelL?:    number
  meterLevelR?:    number
  inputOptions:    InputSelectOption[]
  anySoloActive?:  boolean
  disabled?:       boolean
}

// ── Shared scale (module-level to avoid recreating per render) ────────────────

const DB_SCALE = dbScale()

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  name:           string
  type:           'audio' | 'midi' | 'instrument'
  inputId:        string | null
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  mode:           'writer' | 'producer'
  variant:        'track' | 'folder'
  folderOpen:     boolean
  inputOptions:   InputSelectOption[]
  disabled:       boolean
  onSelectInput:  (id: string) => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onToggleFolder: () => void
  onRename:       (name: string) => void
}

function TopBar({
  name, type, inputId, plugins, chainEnabled,
  mode, variant, folderOpen, inputOptions, disabled,
  onSelectInput, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onToggleFolder, onRename,
}: TopBarProps) {
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

  const inputVariant = mode === 'producer' && inputId === null ? 'field' : 'chip'

  const TypeGlyph =
    variant === 'folder' ? FolderSimple
    : type   === 'audio'  ? Waveform
    : type   === 'midi'   ? PianoKeys
    :                       MusicNote

  return (
    <div className={styles.topBar} data-section="topbar">
      <TypeGlyph size={14} className={styles.glyph} aria-hidden />
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
      {variant === 'folder' && (
        <button
          className={styles.disclosure}
          aria-label={folderOpen ? `Collapse ${name}` : `Expand ${name}`}
          aria-expanded={folderOpen}
          data-open={folderOpen || undefined}
          onClick={onToggleFolder}
          disabled={disabled}
        >
          <CaretRight size={12} />
        </button>
      )}
      <div className={styles.cornerChips}>
        <InputSelect
          value={inputId}
          onChange={onSelectInput}
          options={inputOptions}
          variant={inputVariant}
          size="sm"
          disabled={disabled}
          aria-label="Audio input"
        />
        <FxChip
          plugins={plugins}
          chainEnabled={chainEnabled}
          onToggleChain={onToggleChain}
          onTogglePlugin={onTogglePlugin}
          onReorder={onReorder}
          onRemove={onRemovePlugin}
          onAdd={onAddPlugin}
          size="sm"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ── ControlStrip ──────────────────────────────────────────────────────────────

interface ControlStripProps {
  armed:         boolean
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  pan:           number
  color:         string
  meterLevel?:   number
  meterLevelL?:  number
  meterLevelR?:  number
  anySoloActive: boolean
  disabled:      boolean
  onArm:         () => void
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
  onPan:         (pan: number) => void
}

function ControlStrip({
  armed, muted, soloed, volumeDb, pan, color,
  meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onArm, onMute, onSolo, onVolume, onPan,
}: ControlStripProps) {
  return (
    <div className={styles.controlStrip} data-section="strip">
      <div className={styles.rmsCluster}>
        <ArmButton
          armed={armed}
          onToggle={onArm}
          size="sm"
          disabled={disabled}
        />
        <MuteSoloToggle
          muted={muted}
          soloed={soloed}
          onToggleMute={onMute}
          onToggleSolo={onSolo}
          anySoloActive={anySoloActive}
          size="sm"
          disabled={disabled}
        />
      </div>
      <Fader
        orientation="vertical"
        scale={DB_SCALE}
        min={-60}
        max={6}
        value={volumeDb}
        onChange={onVolume}
        size="sm"
        disabled={disabled}
        aria-label="Volume"
      />
      <PanKnob
        pan={pan}
        onChange={onPan}
        color={color}
        size="sm"
        disabled={disabled}
      />
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
    </div>
  )
}

// ── FolderControlStrip ────────────────────────────────────────────────────────

interface FolderControlStripProps {
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  anySoloActive: boolean
  disabled:      boolean
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
}

function FolderControlStrip({
  muted, soloed, volumeDb, anySoloActive, disabled,
  onMute, onSolo, onVolume,
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
    </div>
  )
}

// ── TrackHeader ───────────────────────────────────────────────────────────────

export function TrackHeader({
  track,
  onRename,
  onArm,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onSelectInput,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemovePlugin,
  onAddPlugin,
  onSelect,
  onToggleFolder = () => {},
  folderOpen = false,
  mode = 'writer',
  variant = 'track',
  meterLevel,
  meterLevelL,
  meterLevelR,
  inputOptions,
  anySoloActive = false,
  disabled = false,
}: TrackHeaderProps) {
  return (
    <div
      role="group"
      aria-label={track.name}
      className={styles.root}
      data-variant={variant}
      data-mode={mode}
      data-armed={track.armed || undefined}
      data-muted={track.muted || undefined}
      data-soloed={track.soloed || undefined}
      data-selected={track.selected || undefined}
      data-disabled={disabled || undefined}
      style={{ '--track-color': track.color } as CSSProperties}
      onClick={onSelect}
    >
      <div className={styles.keyline} aria-hidden />
      <TopBar
        name={track.name}
        type={track.type}
        inputId={track.inputId}
        plugins={track.plugins}
        chainEnabled={track.chainEnabled}
        mode={mode}
        variant={variant}
        folderOpen={folderOpen}
        inputOptions={inputOptions}
        disabled={disabled}
        onSelectInput={onSelectInput}
        onToggleChain={onToggleChain}
        onTogglePlugin={onTogglePlugin}
        onReorder={onReorder}
        onRemovePlugin={onRemovePlugin}
        onAddPlugin={onAddPlugin}
        onToggleFolder={onToggleFolder}
        onRename={onRename}
      />
      {variant === 'track' ? (
        <ControlStrip
          armed={track.armed}
          muted={track.muted}
          soloed={track.soloed}
          volumeDb={track.volumeDb}
          pan={track.pan}
          color={track.color}
          meterLevel={meterLevel}
          meterLevelL={meterLevelL}
          meterLevelR={meterLevelR}
          anySoloActive={anySoloActive}
          disabled={disabled}
          onArm={onArm}
          onMute={onMute}
          onSolo={onSolo}
          onVolume={onVolume}
          onPan={onPan}
        />
      ) : (
        <FolderControlStrip
          muted={track.muted}
          soloed={track.soloed}
          volumeDb={track.volumeDb}
          anySoloActive={anySoloActive}
          disabled={disabled}
          onMute={onMute}
          onSolo={onSolo}
          onVolume={onVolume}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add `.rmsCluster` to TrackHeader.module.css**

Add after the `.controlStrip` rule (before `/* ── States ───... */`):

```css
/* ── R/M/S cluster (Arm on top, Mute+Solo below) ─────────────────────────── */

.rmsCluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}
```

- [ ] **Step 5: Run the new test**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|✗|arm button"
```

Expected: `✓ arm button is in the control strip, not the top bar (track variant)`

- [ ] **Step 6: Run the full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass (19+ now, including the new one).

- [ ] **Step 7: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit 2>&1
```

Expected: no output (zero errors).

- [ ] **Step 8: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.tsx \
        src/components/TrackHeader/TrackHeader.module.css \
        src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "feat(TrackHeader): move ArmButton into R/M/S cluster in ControlStrip"
```

---

### Task 2: Folder variant visual distinctiveness

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.module.css`
- Test: `src/components/TrackHeader/TrackHeader.test.tsx`

**Interfaces:**
- Consumes: `[data-variant="folder"]` — already emitted by `TrackHeader` root div (no TSX changes)
- Produces: visual CSS rules for wider keyline (6px), `--stage` background, bolder/larger name, larger glyph

- [ ] **Step 1: Write the folder-distinctiveness test**

Add a new `describe` block at the end of `TrackHeader.test.tsx`:

```tsx
describe('TrackHeader — folder distinctiveness', () => {
  it('root carries data-variant="folder" as the CSS styling hook', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
      />
    )
    expect(screen.getByRole('group', { name: 'Group Bus' })).toHaveAttribute('data-variant', 'folder')
  })
})
```

- [ ] **Step 2: Run to verify it passes immediately**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "folder distinctiveness|FAIL|PASS"
```

Expected: `✓ root carries data-variant="folder" as the CSS styling hook` — this is a green test documenting the CSS contract.

- [ ] **Step 3: Add folder CSS rules to TrackHeader.module.css**

Add these rules after the `/* ── Container queries ─... */` section at the bottom of the file:

```css
/* ── Folder variant ───────────────────────────────────────────────────────── */

/* Recessed container feel: darker bg, wider keyline, bolder name */
.root[data-variant="folder"] {
  background: var(--stage);
}

.root[data-variant="folder"] .keyline {
  width: 6px;
  background: color-mix(in srgb, var(--track-color, var(--accent)) 70%, transparent);
}

.root[data-variant="folder"][data-selected] .keyline {
  background: var(--track-color, var(--accent));
  box-shadow: 0 0 10px color-mix(in srgb, var(--track-color, var(--accent)) 70%, transparent);
}

/* Offset content past the wider 6px keyline */
.root[data-variant="folder"] .topBar,
.root[data-variant="folder"] .controlStrip {
  padding-left: calc(var(--space-3) + 6px);
}

/* Bolder name — heavier weight + slightly larger */
.root[data-variant="folder"] .name,
.root[data-variant="folder"] .nameInput {
  font-weight: var(--weight-bold);
  font-size: var(--text-base);
}

/* Larger glyph for folder variant */
.root[data-variant="folder"] .glyph svg {
  width: 16px;
  height: 16px;
}
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.module.css \
        src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "feat(TrackHeader): folder variant — wider keyline, recessed bg, bolder name"
```

---

### Task 3: Demo updates

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.demo.tsx`

**Interfaces:**
- Consumes: `TrackHeader` with updated structure from Task 1 + Task 2 (no new props needed)
- Produces: gallery StatesGrid that shows the R/M/S cluster clearly and folder cards that are visually distinct from track cards

- [ ] **Step 1: Update TrackHeader.demo.tsx**

Replace the entire file with the content below. Changes:
1. **StatesGrid**: reorder states so a track card and folder card are visually adjacent; add a dedicated `"folder vs track"` State that shows both side-by-side for direct comparison.
2. **StatesGrid armed state**: rename label to `"armed (R/M/S cluster)"` to call out the new layout.
3. **Playground**: no structural changes needed — the existing `variant="folder"` toggle already demonstrates folder vs track; the new CSS will render correctly.

```tsx
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
      <State label="normal">
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
      <State label="armed (R/M/S cluster)">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'MIDI Keys', type: 'midi', armed: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS}
          />
        </div>
      </State>
      <State label="muted + soloed">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Guitar', type: 'instrument', muted: true, soloed: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS} anySoloActive
          />
        </div>
      </State>
      <State label="selected">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Drums', color: 'var(--track-color-2)', selected: true })}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            inputOptions={INPUT_OPTIONS}
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
      <State label="folder · selected">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Drums Bus', color: 'var(--track-color-4)', selected: true })}
            variant="folder" folderOpen={false}
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            onToggleFolder={noop} inputOptions={INPUT_OPTIONS}
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
              track={makeTrack({ name: 'Synth', color: 'var(--track-color-3)' })}
              onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
              onVolume={noop} onPan={noop} onSelectInput={noopId}
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
              onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
              inputOptions={INPUT_OPTIONS}
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
            meterLevel={meterLevel}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={armed}         onChange={(next) => setArmed(next)}         size="sm" label="armed" />
          <Toggle checked={muted}         onChange={(next) => setMuted(next)}         size="sm" label="muted" />
          <Toggle checked={soloed}        onChange={(next) => setSoloed(next)}        size="sm" label="soloed" />
          <Toggle checked={selected}      onChange={(next) => setSelected(next)}      size="sm" label="selected" />
          <Toggle checked={mode === 'producer'} onChange={next => setMode(next ? 'producer' : 'writer')} size="sm" label="mode=producer" />
          <Toggle checked={variant === 'folder'} onChange={next => setVariant(next ? 'folder' : 'track')} size="sm" label="variant=folder" />
          <Toggle checked={folderOpen}    onChange={(next) => setFolderOpen(next)}    size="sm" label="folderOpen" />
          <Toggle checked={anySoloActive} onChange={(next) => setAnySoloActive(next)} size="sm" label="anySoloActive" />
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
```

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 4: Start dev server and verify in browser**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm run dev
```

Open `http://localhost:5273/#/track-header` and verify:
- [ ] Track variant: ArmButton (R) appears in the control strip above M/S, **not** in the TopBar
- [ ] Track name takes the full available width in TopBar; chips are right-aligned
- [ ] Folder cards are visually distinct: darker background, wider left keyline, heavier/larger name text
- [ ] `"folder vs track"` state in StatesGrid shows the contrast clearly
- [ ] Playground: toggling `variant=folder` switches between the two appearances correctly
- [ ] All themes in Compare (`/compare`) look correct — no broken layout or unreadable text
- [ ] Narrow (140px) state: name still readable, chips hide as before

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.demo.tsx
git commit -m "feat(TrackHeader): update demo — folder vs track contrast, R/M/S cluster label"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| ArmButton moved to ControlStrip, R/M/S column (Arm top, M/S below) | Task 1 |
| TopBar (track): `[glyph] [name] [InputSelect] [FxChip]` — no Arm | Task 1 |
| Folder TopBar: `[glyph] [name] [disclosure]` + chips | Task 1 (unchanged) |
| Tab order: name → input → fx → arm → mute → solo → fader → pan → meter | Task 1 (DOM order achieves this naturally) |
| Arm-placement test updated | Task 1 |
| Name `flex: 1` — ellipsizes only when truly tight | Task 1 (already set; no change needed — removing ArmButton frees the space) |
| Folder: wider keyline ~6px | Task 2 |
| Folder: recessed `--stage` background | Task 2 |
| Folder: bolder/larger name + bigger glyph | Task 2 |
| Folder `data-variant="folder"` test | Task 2 |
| Demo states grid shows R/M/S cluster and folder distinction | Task 3 |
| Playground updated | Task 3 |
| Typecheck / lint / test green | Each task |
| No new primitives | ✓ (only wrappers + CSS) |
| `overflow: hidden` kept | ✓ |
| Pan / dropdown portal deferred | ✓ (not touched) |
| Folder has no ArmButton | ✓ (FolderControlStrip unchanged; TopBar folder branch has no ArmButton) |

### Placeholder scan

No TBD, TODO, or vague steps — all steps include complete code.

### Type consistency

- `TopBarProps.onArm` / `TopBarProps.armed` — removed in Task 1; no later task references them on TopBar
- `ControlStripProps.armed: boolean`, `ControlStripProps.onArm: () => void` — added in Task 1; used correctly in the ControlStrip body
- `ArmButton.onToggle` expects `(e: React.MouseEvent<HTMLButtonElement>) => void`; we pass `onArm: () => void` — valid in TypeScript (fewer params than required is always safe)
- CSS class `.rmsCluster` added in Task 1 step 4 and referenced in Task 1 step 3 `<div className={styles.rmsCluster}>` — consistent
