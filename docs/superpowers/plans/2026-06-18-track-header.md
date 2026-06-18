# TrackHeader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assemble the existing kit primitives into a `TrackHeader` composite — a recessed channel strip with editable name, arm, mute/solo, fader, pan, meter, and corner FX+input chips — proving the design system composes into a real product surface.

**Architecture:** Zone-based decomposition: three local sub-components (`TopBar`, `ControlStrip`, `FolderControlStrip`) within one `TrackHeader.tsx` file. The root element uses `container-type: inline-size` for CSS container-query-driven responsive layout. All visual states (armed, muted, soloed, selected) are driven by `data-*` attributes on the root and handled entirely in CSS.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vite, `@phosphor-icons/react` (new), Vitest + @testing-library/react (`fireEvent`, not `userEvent`).

## Global Constraints

- Reuse existing primitives exactly as imported — do NOT reimplement any primitive logic
- `@phosphor-icons/react` is the only new npm dependency allowed
- Token-only CSS — no hard-coded hex or rgba values; use `var(--...)` tokens and `color-mix()` only
- All tests use `fireEvent`, never `userEvent`
- `npx tsc --noEmit` must pass after every task
- `npx vitest run` must pass after every task
- Test command: `npx vitest run src/components/TrackHeader/TrackHeader.test.tsx`
- `role="group"` + `aria-label={track.name}` on root; each primitive keeps its own ARIA

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `@phosphor-icons/react` |
| `src/components/TrackHeader/TrackHeader.tsx` | Create | Component + TopBar + ControlStrip + FolderControlStrip |
| `src/components/TrackHeader/TrackHeader.module.css` | Create | All styles + container queries |
| `src/components/TrackHeader/TrackHeader.test.tsx` | Create | 18 tests across Tasks 1–2 |
| `src/components/TrackHeader/index.ts` | Create | Public exports |
| `src/components/TrackHeader/TrackHeader.demo.tsx` | Create | States grid + playground |
| `src/gallery/planned.ts` | Modify | Remove TrackHeader entry |

---

### Task 1: Package + Full Component Structure + Structural Tests

Installs `@phosphor-icons/react`, creates all files, implements the full component with static name display (no inline editing yet), and covers 9 structural tests.

**Files:**
- Modify: `package.json`
- Create: `src/components/TrackHeader/index.ts`
- Create: `src/components/TrackHeader/TrackHeader.tsx`
- Create: `src/components/TrackHeader/TrackHeader.module.css`
- Create: `src/components/TrackHeader/TrackHeader.test.tsx`

**Interfaces produced (consumed by Task 2):**
```ts
export interface Track {
  id: string; name: string; color: string
  type: 'audio' | 'midi' | 'instrument'
  armed: boolean; muted: boolean; soloed: boolean
  volumeDb: number; pan: number; inputId: string | null
  plugins: FxPlugin[]; chainEnabled: boolean; selected: boolean
}

export interface TrackHeaderProps {
  track: Track
  onRename: (name: string) => void
  onArm: () => void; onMute: () => void; onSolo: () => void
  onVolume: (db: number) => void; onPan: (pan: number) => void
  onSelectInput: (id: string) => void
  onToggleChain: (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder: (from: number, to: number) => void
  onRemovePlugin: (id: string) => void; onAddPlugin: () => void
  onSelect: () => void
  onToggleFolder?: () => void; folderOpen?: boolean
  mode?: 'writer' | 'producer'; variant?: 'track' | 'folder'
  meterLevel?: number; meterLevelL?: number; meterLevelR?: number
  inputOptions: InputSelectOption[]
  anySoloActive?: boolean; disabled?: boolean
}
```

- [ ] **Step 1: Install `@phosphor-icons/react`**

```bash
npm install @phosphor-icons/react
```

Expected: `package.json` and `package-lock.json` updated. No errors.

- [ ] **Step 2: Write the 9 failing tests**

Create `src/components/TrackHeader/TrackHeader.test.tsx`:

```tsx
// src/components/TrackHeader/TrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TrackHeader } from './TrackHeader'
import type { Track } from './TrackHeader'

const BASE_TRACK: Track = {
  id: 't1', name: 'Vocals', color: '#e8a87c', type: 'audio',
  armed: false, muted: false, soloed: false,
  volumeDb: -6, pan: 0, inputId: null,
  plugins: [], chainEnabled: true, selected: false,
}

const noop = () => {}

const BASE_PROPS = {
  track: BASE_TRACK,
  onRename: noop, onArm: noop, onMute: noop, onSolo: noop,
  onVolume: noop, onPan: noop, onSelectInput: noop,
  onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
  onRemovePlugin: noop, onAddPlugin: noop, onSelect: noop,
  inputOptions: [],
}

describe('TrackHeader — structure', () => {
  it('renders track variant with name, ArmButton, M/S buttons and FX chip', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /arm for recording/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('renders folder variant with disclosure button; no ArmButton, no Meter', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Drums' }}
        onToggleFolder={noop}
      />
    )
    expect(screen.getByRole('button', { name: /expand drums/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('calls onArm when ArmButton is clicked', () => {
    const onArm = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onArm={onArm} />)
    fireEvent.click(screen.getByRole('button', { name: /arm for recording/i }))
    expect(onArm).toHaveBeenCalledTimes(1)
  })

  it('calls onMute and onSolo on M/S button clicks', () => {
    const onMute = vi.fn()
    const onSolo = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onMute={onMute} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
    expect(onSolo).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when the root group is clicked', () => {
    const onSelect = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group', { name: 'Vocals' }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onToggleFolder when disclosure button is clicked in folder variant', () => {
    const onToggleFolder = vi.fn()
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Drums' }}
        onToggleFolder={onToggleFolder}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /expand drums/i }))
    expect(onToggleFolder).toHaveBeenCalledTimes(1)
  })

  it('renders InputSelect as field when mode=producer and no input set', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="producer"
        track={{ ...BASE_TRACK, inputId: null }}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'field')
  })

  it('renders InputSelect as chip when mode=producer and input is set', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="producer"
        track={{ ...BASE_TRACK, inputId: 'in-1' }}
        inputOptions={[{ id: 'in-1', label: 'Input 1' }]}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'chip')
  })

  it('renders InputSelect as chip in writer mode regardless of inputId', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="writer"
        track={{ ...BASE_TRACK, inputId: null }}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'chip')
  })
})
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx
```

Expected: FAIL — `Cannot find module './TrackHeader'`

- [ ] **Step 4: Create `src/components/TrackHeader/index.ts`**

```ts
// src/components/TrackHeader/index.ts
export { TrackHeader } from './TrackHeader'
export type { TrackHeaderProps, Track } from './TrackHeader'
```

- [ ] **Step 5: Create `src/components/TrackHeader/TrackHeader.tsx`**

```tsx
// src/components/TrackHeader/TrackHeader.tsx
import { CSSProperties } from 'react'
import {
  Waveform, Piano, MusicNotes, FolderSimple, CaretRight,
} from '@phosphor-icons/react'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter'
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
  armed:          boolean
  inputId:        string | null
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  mode:           'writer' | 'producer'
  variant:        'track' | 'folder'
  folderOpen:     boolean
  inputOptions:   InputSelectOption[]
  disabled:       boolean
  onArm:          () => void
  onSelectInput:  (id: string) => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onToggleFolder: () => void
  onRename:       (name: string) => void  // used in Task 2
}

function TopBar({
  name, type, armed, inputId, plugins, chainEnabled,
  mode, variant, folderOpen, inputOptions, disabled,
  onArm, onSelectInput, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onToggleFolder, onRename: _onRename,
}: TopBarProps) {
  const inputVariant = mode === 'producer' && inputId === null ? 'field' : 'chip'

  const TypeGlyph =
    variant === 'folder' ? FolderSimple
    : type   === 'audio'  ? Waveform
    : type   === 'midi'   ? Piano
    :                       MusicNotes

  return (
    <div className={styles.topBar}>
      <TypeGlyph size={14} className={styles.glyph} aria-hidden />
      <span className={styles.name} tabIndex={0}>
        {name}
      </span>
      {variant === 'folder' ? (
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
      ) : (
        <ArmButton
          armed={armed}
          onToggle={onArm}
          size="sm"
          disabled={disabled}
        />
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
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
  onPan:         (pan: number) => void
}

function ControlStrip({
  muted, soloed, volumeDb, pan, color,
  meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onMute, onSolo, onVolume, onPan,
}: ControlStripProps) {
  return (
    <div className={styles.controlStrip}>
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
    <div className={styles.controlStrip}>
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
        armed={track.armed}
        inputId={track.inputId}
        plugins={track.plugins}
        chainEnabled={track.chainEnabled}
        mode={mode}
        variant={variant}
        folderOpen={folderOpen}
        inputOptions={inputOptions}
        disabled={disabled}
        onArm={onArm}
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

- [ ] **Step 6: Create `src/components/TrackHeader/TrackHeader.module.css`**

```css
/* src/components/TrackHeader/TrackHeader.module.css */

/* ── Root ─────────────────────────────────────────────────────────────────── */

.root {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--strip-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: default;
  transition: box-shadow var(--dur-fast) var(--ease-out);
  user-select: none;
  -webkit-user-select: none;
}

/* ── Keyline ──────────────────────────────────────────────────────────────── */

.keyline {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: color-mix(in srgb, var(--track-color, var(--accent)) 40%, transparent);
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
  padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-3) + 3px);
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
  color: var(--text);
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
  padding: var(--space-1) var(--space-2) var(--space-2) calc(var(--space-3) + 3px);
}

/* ── States ───────────────────────────────────────────────────────────────── */

/* selected: accent inset ring + full-brightness keyline */
.root[data-selected] {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent);
}

.root[data-selected] .keyline {
  background: var(--track-color, var(--accent));
  box-shadow: 0 0 8px color-mix(in srgb, var(--track-color, var(--accent)) 60%, transparent);
}

/* armed: faint red wash */
.root[data-armed] {
  background: color-mix(in srgb, var(--led-red) 8%, var(--strip-bg));
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

/* ── Container queries ────────────────────────────────────────────────────── */

/* narrow: < 160px — hide InputSelect chip, keep FxChip */
@container (max-width: 159px) {
  .cornerChips > :first-child {
    display: none;
  }
}
```

- [ ] **Step 7: Run tests — verify all 9 pass**

```bash
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx
```

Expected: 9 passed (9)

- [ ] **Step 8: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json \
  src/components/TrackHeader/index.ts \
  src/components/TrackHeader/TrackHeader.tsx \
  src/components/TrackHeader/TrackHeader.module.css \
  src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "feat(TrackHeader): scaffold — TopBar + ControlStrip + FolderControlStrip + 9 structural tests"
```

---

### Task 2: Name Inline Editing + Remaining Tests

Adds `editing` state to `TopBar` (span ↔ input swap, commit/cancel) and adds 9 more tests covering state data attributes and all name-editing behaviour.

**Files:**
- Modify: `src/components/TrackHeader/TrackHeader.tsx` (update `TopBar` only)
- Modify: `src/components/TrackHeader/TrackHeader.test.tsx` (append 9 tests)

**Consumes from Task 1:** `TopBar` local component, `styles.name`, `styles.nameInput` CSS classes

- [ ] **Step 1: Append the 9 failing tests to `TrackHeader.test.tsx`**

Add this `describe` block at the end of the existing file (after the `'structure'` describe):

```tsx
describe('TrackHeader — states', () => {
  it('has data-selected when track.selected=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, selected: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-selected')
  })

  it('has data-armed when track.armed=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, armed: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-armed')
  })

  it('has data-muted when track.muted=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, muted: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-muted')
  })

  it('has data-soloed when track.soloed=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, soloed: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-soloed')
  })
})

describe('TrackHeader — name editing', () => {
  it('shows an input with current name value on double-click', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Vocals')
  })

  it('calls onRename with trimmed value on Enter and exits edit mode', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '  Lead Vocals  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Lead Vocals')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call onRename on Escape; restores original name', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: 'Changed Name' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Vocals')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onRename with original name when input is empty on Enter', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Vocals')
  })

  it('updates aria-label on root group when track.name prop changes', () => {
    const { rerender } = render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toBeInTheDocument()
    rerender(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, name: 'Lead Vocals' }} />)
    expect(screen.getByRole('group', { name: 'Lead Vocals' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify 4 new state tests pass (editing tests still fail)**

```bash
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx
```

Expected: 13 passed, 5 failed (the name-editing tests fail — `getByText('Vocals')` exists but no dblClick handler yet)

- [ ] **Step 3: Update `TopBar` in `TrackHeader.tsx` to add inline editing**

Replace the entire `TopBar` function with this version (all other code in the file stays unchanged):

```tsx
function TopBar({
  name, type, armed, inputId, plugins, chainEnabled,
  mode, variant, folderOpen, inputOptions, disabled,
  onArm, onSelectInput, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onToggleFolder, onRename,
}: TopBarProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const originalRef = useRef(name)

  function startEdit() {
    originalRef.current = name
    setDraft(name)
    setEditing(true)
  }

  function commit() {
    const value = draft.trim() || originalRef.current
    onRename(value)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  const inputVariant = mode === 'producer' && inputId === null ? 'field' : 'chip'

  const TypeGlyph =
    variant === 'folder' ? FolderSimple
    : type   === 'audio'  ? Waveform
    : type   === 'midi'   ? Piano
    :                       MusicNotes

  return (
    <div className={styles.topBar}>
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
      {variant === 'folder' ? (
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
      ) : (
        <ArmButton
          armed={armed}
          onToggle={onArm}
          size="sm"
          disabled={disabled}
        />
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
```

Also add `useState, useRef` to the React import at the top of the file:

```tsx
import { CSSProperties, useState, useRef } from 'react'
```

- [ ] **Step 4: Run tests — verify all 18 pass**

```bash
npx vitest run src/components/TrackHeader/TrackHeader.test.tsx
```

Expected: 18 passed (18)

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/TrackHeader/TrackHeader.tsx \
        src/components/TrackHeader/TrackHeader.test.tsx
git commit -m "feat(TrackHeader): name inline editing + 9 remaining tests (18 total passing)"
```

---

### Task 3: Demo + planned.ts Cleanup

Creates the states-grid + interactive playground demo and removes `TrackHeader` from `planned.ts`.

**Files:**
- Create: `src/components/TrackHeader/TrackHeader.demo.tsx`
- Modify: `src/gallery/planned.ts`

**Consumes from Tasks 1–2:** `TrackHeader`, `Track`, `InputSelectOption`, `FxPlugin` from `./TrackHeader`

- [ ] **Step 1: Create `src/components/TrackHeader/TrackHeader.demo.tsx`**

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
      <State label="armed">
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
      <State label="folder · open">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Group Bus', color: 'var(--track-color-4)' })}
            variant="folder" folderOpen
            onRename={noopId} onArm={noop} onMute={noop} onSolo={noop}
            onVolume={noop} onPan={noop} onSelectInput={noopId}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop}
            onRemovePlugin={noopId} onAddPlugin={noop} onSelect={noop}
            onToggleFolder={noop} inputOptions={INPUT_OPTIONS}
          />
        </div>
      </State>
      <State label="folder · closed">
        <div style={{ width: 200 }}>
          <TrackHeader
            track={makeTrack({ name: 'Group Bus', color: 'var(--track-color-4)' })}
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
          <Toggle checked={armed}         onChange={setArmed}         size="sm" label="armed" />
          <Toggle checked={muted}         onChange={setMuted}         size="sm" label="muted" />
          <Toggle checked={soloed}        onChange={setSoloed}        size="sm" label="soloed" />
          <Toggle checked={selected}      onChange={setSelected}      size="sm" label="selected" />
          <Toggle checked={mode === 'producer'} onChange={next => setMode(next ? 'producer' : 'writer')} size="sm" label="mode=producer" />
          <Toggle checked={variant === 'folder'} onChange={next => setVariant(next ? 'folder' : 'track')} size="sm" label="variant=folder" />
          <Toggle checked={folderOpen}    onChange={setFolderOpen}    size="sm" label="folderOpen" />
          <Toggle checked={anySoloActive} onChange={setAnySoloActive} size="sm" label="anySoloActive" />
          <Toggle checked={type === 'midi'} onChange={next => setType(next ? 'midi' : 'audio')} size="sm" label="type=midi" />
          <Toggle checked={type === 'instrument'} onChange={next => setType(next ? 'instrument' : 'audio')} size="sm" label="type=instrument" />

          {/* Meter driver — dogfood: Fader drives the Meter in the live header */}
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

- [ ] **Step 2: Remove `TrackHeader` entry from `src/gallery/planned.ts`**

Delete this line from the `PLANNED` array:
```ts
{ name: 'TrackHeader',              group: 'Composites',  route: '/track-header' },
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (no regressions)

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/TrackHeader/TrackHeader.demo.tsx \
        src/gallery/planned.ts
git commit -m "feat(TrackHeader): gallery demo — states grid + interactive playground"
```
