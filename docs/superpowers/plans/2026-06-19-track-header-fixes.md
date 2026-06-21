# TrackHeader Fixes — Ears-first Meter + Folder Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TrackHeader meters ears-first (hidden unless armed/selected/clipping/show-all) and fix the folder variant (remove input chip, add group pan knob, name room).

**Architecture:** All changes are confined to `TrackHeader.tsx`, `TrackHeader.module.css`, `TrackHeader.test.tsx`, and `TrackHeader.demo.tsx`. Meter visibility is derived from a boolean `showMeter` passed into both `ControlStrip` and `FolderControlStrip`. Folder fixes are structural (conditional chip rendering, new PanKnob in FolderControlStrip) plus a CSS reduction (drop the font-size override that was causing truncation).

**Tech Stack:** React (TSX), CSS Modules, `@phosphor-icons/react`, `@testing-library/react` + `vitest`, `@testing-library/jest-dom`

## Global Constraints

- No new primitives or components — modify only the four TrackHeader files
- Fader and PanKnob always visible in track strip — only Meter hides/shows
- Meter shows when: `track.armed || track.selected || clipping || showAllMeters`
- Folder strip = M/S + group fader + group pan + conditional meter; no Arm, no InputSelect
- Icons from `@phosphor-icons/react` only
- `overflow: hidden` on `.root` must not be removed
- All 20 existing tests stay green (new tests added on top)
- `typecheck` / `test` green before each commit

---

## File Map

| File | Changes |
|---|---|
| `src/components/TrackHeader/TrackHeader.tsx` | Add `clipping`/`showAllMeters` props; derive `showMeter`; conditional Meter; folder loses InputSelect; FolderControlStrip gains `pan`/`color`/`onPan`/`showMeter`/meter props |
| `src/components/TrackHeader/TrackHeader.module.css` | Remove `font-size: var(--text-base)` folder-name override (InputSelect removal frees enough room; keep bold) |
| `src/components/TrackHeader/TrackHeader.test.tsx` | 6 new tests: meter hidden by default, shown when armed/selected/clipping/showAll; folder has pan; folder has no audio input |
| `src/components/TrackHeader/TrackHeader.demo.tsx` | Add `clipping` card; add `showAllMeters`/`clipping` playground toggles; folder demo uses `onPan` |

---

### Task 1: Ears-first meter — clipping + showAllMeters props, conditional Meter render

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.tsx`
- Test: `src/components/TrackHeader/TrackHeader.test.tsx`

**Interfaces:**
- Produces: `TrackHeaderProps` gains `clipping?: boolean` and `showAllMeters?: boolean`; `ControlStripProps` gains `showMeter: boolean`; `FolderControlStripProps` gains `showMeter: boolean` + meter level props

- [ ] **Step 1: Write failing tests for meter visibility**

Add a new `describe` block at the end of `src/components/TrackHeader/TrackHeader.test.tsx`:

```tsx
describe('TrackHeader — meter visibility (ears-first)', () => {
  it('meter is hidden on a normal unselected unarmed track', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('meter appears when track is armed', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, armed: true }} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when track is selected', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, selected: true }} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when clipping=true even if not armed or selected', () => {
    render(<TrackHeader {...BASE_PROPS} clipping />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when showAllMeters=true', () => {
    render(<TrackHeader {...BASE_PROPS} showAllMeters />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('fader and pan are always present regardless of meter visibility', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument()
    // PanKnob does not use an ARIA slider role by default; verify via aria-label on the knob group
    const strip = document.querySelector('[data-section="strip"]')
    expect(strip).toBeInTheDocument()
    // Meter absent, strip still present
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify new tests fail (meter currently always renders)**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "meter|FAIL|PASS" | head -20
```

Expected: `meter is hidden on a normal unselected unarmed track` FAILS (meter exists when it shouldn't).

- [ ] **Step 3: Update TrackHeader.tsx**

Replace the entire file with this content:

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
  /** Track has clipped — shows meter with latched clip indicator even when not armed/selected. */
  clipping?:       boolean
  /** Show meters on all tracks regardless of armed/selected/clipping state. */
  showAllMeters?:  boolean
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
        {variant !== 'folder' && (
          <InputSelect
            value={inputId}
            onChange={onSelectInput}
            options={inputOptions}
            variant={inputVariant}
            size="sm"
            disabled={disabled}
            aria-label="Audio input"
          />
        )}
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
  showMeter:     boolean
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
  showMeter, meterLevel, meterLevelL, meterLevelR,
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
  clipping = false,
  showAllMeters = false,
}: TrackHeaderProps) {
  const showMeter = track.armed || track.selected || clipping || showAllMeters

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
      data-clipping={clipping || undefined}
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
          showMeter={showMeter}
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
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the new tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "meter|FAIL|PASS|✓|✗" | head -20
```

Expected: all 6 new meter-visibility tests pass.

- [ ] **Step 5: Run the full suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: 26 tests pass (20 existing + 6 new), 18 test files.

- [ ] **Step 6: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.tsx \
        src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "feat(TrackHeader): ears-first meter — hidden by default, shown when armed/selected/clipping/showAll"
```

---

### Task 2: Folder fixes — remove InputSelect, add group pan, fix name CSS

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.module.css`
- Test: `src/components/TrackHeader/TrackHeader.test.tsx`

**Interfaces:**
- Consumes: `TrackHeader.tsx` from Task 1 (already has folder InputSelect removed + FolderControlStrip with pan/color/onPan)
- Produces: CSS rule removed (`font-size: var(--text-base)` override); 2 new tests

Note: The TSX changes for folder (removing InputSelect, adding PanKnob) are **already included in the Task 1 TSX file above**. Task 2 handles only the CSS fix and the new tests.

- [ ] **Step 1: Write failing tests for folder pan and no input chip**

Add these two tests inside `describe('TrackHeader — folder distinctiveness', ...)` in `TrackHeader.test.tsx`, after the existing test:

```tsx
  it('folder variant renders a PanKnob (group pan)', () => {
    const { container } = render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
      />
    )
    // PanKnob renders an element with aria-label containing "Pan"
    expect(container.querySelector('[aria-label*="Pan"]')).toBeInTheDocument()
  })

  it('folder variant does not render an audio input selector', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
        inputOptions={[{ id: 'in-1', label: 'Input 1' }]}
      />
    )
    expect(screen.queryByRole('button', { name: /audio input/i })).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run to check which tests fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx --reporter=verbose 2>&1 | grep -E "folder|FAIL|✓|✗" | head -15
```

Expected:
- `folder variant renders a PanKnob` — PASS (Task 1 TSX already added PanKnob to FolderControlStrip)
- `folder variant does not render an audio input selector` — PASS (Task 1 TSX already removed InputSelect from folder)

If both pass already, skip to Step 3 (CSS fix).

- [ ] **Step 3: Remove folder name font-size override from TrackHeader.module.css**

In `src/components/TrackHeader/TrackHeader.module.css`, find the rule:

```css
/* Bolder name — heavier weight + slightly larger */
.root[data-variant="folder"] .name,
.root[data-variant="folder"] .nameInput {
  font-weight: var(--weight-bold);
  font-size: var(--text-base);
}
```

Change it to (drop `font-size`, keep `font-weight`):

```css
/* Bolder name — weight only; InputSelect removal already frees enough horizontal room */
.root[data-variant="folder"] .name,
.root[data-variant="folder"] .nameInput {
  font-weight: var(--weight-bold);
}
```

- [ ] **Step 4: Run the full suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: 28 tests pass, 18 test files.

- [ ] **Step 5: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.module.css \
        src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "fix(TrackHeader): folder — remove InputSelect, add group pan, drop font-size override"
```

---

### Task 3: Demo updates — clipping card, showAllMeters toggle, folder pan

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.demo.tsx`

**Interfaces:**
- Consumes: `TrackHeader` with `clipping`, `showAllMeters`, folder `onPan` from Tasks 1+2

- [ ] **Step 1: Update TrackHeader.demo.tsx**

Replace the entire file with this content:

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
```

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run --reporter=verbose 2>&1 | tail -8
```

Expected: 28 tests pass, 18 files.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit 2>&1
```

Expected: no output.

- [ ] **Step 4: Verify in browser**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm run dev
```

Open `http://localhost:5273/#/track-header` and verify:
- [ ] Normal (unselected, unarmed, not clipping) track: fader + pan visible, **no meter**
- [ ] Armed card: meter appears
- [ ] Selected card: meter appears
- [ ] Clipping card: meter appears with hot/red clip indicator latched
- [ ] Playground: toggling `clipping` or `showAllMeters` reveals meter; toggling armed/selected also reveals meter
- [ ] Folder card: name fits ("Group Bus" not truncated), pan knob visible, no InputSelect chip
- [ ] Folder · selected card: meter appears
- [ ] Check `/compare` across all themes — no black-on-black, no overflow

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/TrackHeader/TrackHeader.demo.tsx
git commit -m "feat(TrackHeader): demo — clipping card, showAllMeters toggle, folder pan"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| Meter hidden by default (unselected, unarmed, not clipping) | Task 1 |
| Meter shows when `armed` | Task 1 |
| Meter shows when `selected` | Task 1 |
| Meter shows when `clipping` | Task 1 |
| Meter shows when `showAllMeters` | Task 1 |
| `clipping?: boolean` prop added | Task 1 |
| `showAllMeters?: boolean` prop added | Task 1 |
| `data-clipping` on root for CSS | Task 1 |
| Fader + PanKnob always visible (never hidden) | Task 1 (Meter is conditionally rendered; Fader/PanKnob are not) |
| Folder meters follow same rule | Task 1 (FolderControlStrip has conditional Meter too) |
| Folder has no InputSelect | Task 1 (TSX) |
| Folder has group PanKnob | Task 1 (TSX) |
| Folder name fits / no truncation | Task 2 (CSS) + Task 1 (InputSelect removed frees room) |
| Tests: meter hidden by default | Task 1 |
| Tests: meter appears armed/selected/clipping/showAll | Task 1 |
| Tests: fader+strip still present when no meter | Task 1 |
| Tests: folder has pan knob | Task 2 |
| Tests: folder has no audio input | Task 2 |
| Demo: clipping card | Task 3 |
| Demo: showAllMeters + clipping playground toggles | Task 3 |
| Demo: folder demo has onPan wired | Task 3 |
| `typecheck` / `test` green | Each task |

### Placeholder scan

No TBD or vague steps — all steps have complete code.

### Type consistency

- `TrackHeaderProps.clipping: boolean` (default `false`) — used as `data-clipping={clipping || undefined}` and in `showMeter` derivation
- `TrackHeaderProps.showAllMeters: boolean` (default `false`) — used in `showMeter` derivation
- `ControlStripProps.showMeter: boolean` — added, consumed by `{showMeter && <Meter .../>}`
- `FolderControlStripProps.showMeter: boolean` — added, consumed identically
- `FolderControlStripProps.pan: number`, `.color: string`, `.onPan: (pan: number) => void` — added, used in `<PanKnob pan={pan} onChange={onPan} color={color} .../>`
- All new props passed through from `TrackHeader` root using existing `track.pan`, `track.color`, and `onPan` which are already on `TrackHeaderProps` ✓
