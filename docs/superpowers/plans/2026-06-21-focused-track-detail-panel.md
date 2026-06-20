# FocusedTrackDetailPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a resizable bottom-sheet inspector for the focused track that shows meter + waveform clips + full FX chain + labelled advanced-controls placeholders.

**Architecture:** A `<section>` panel anchored to the bottom of the arrangement, sized by a draggable divider at the top (pointer-captured, persisted in localStorage). Two-column body: left column = always-on stereo meter + TrackLane clip canvas; right column = FxChip chain + four clearly-labelled advanced-slot placeholders (Sidechain, Phase/Polarity, Automation, Routing). All states (`open`, `resizing`, `empty`, `focused`, `closed`) driven by `data-*` attributes only.

**Tech Stack:** React 18, CSS Modules with CSS custom properties (tokens only), `fireEvent` tests via Vitest + Testing Library, Phosphor icons, existing kit components (TrackLane, Meter, FxChip, Panel, Fader, Toggle, ArmButton, MuteSoloToggle).

## Global Constraints

- Tokens only — no hardcoded colors; every color via `var(--*)`.
- CSS Modules — no inline styles except layout math (width, height, left/top from JS calculations).
- `data-*` attributes for state — CSS targets them, no class juggling.
- Tests use `fireEvent`, NOT `userEvent`.
- `tsc --noEmit` + `vitest run` + lint must be green.
- Sizes `sm`/`md` only (default `md`).
- `:focus-visible` only (never bare `:focus`).
- No animation library — CSS for state transitions, rAF/pointer for live drag.
- Resize is functional motion (1:1, always active). Open/close transition is decorative (snaps under `prefers-reduced-motion`).
- localStorage key: `jackdaw.detail.height`. Height clamped: min 120px, max `window.innerHeight * 0.75`.
- Gallery auto-registers via `import.meta.glob` in `registry.ts` — no manual edits.
- Dogfood playground controls built from kit `Toggle` / `Fader`.

---

## File Map

| File | Role |
|------|------|
| `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx` | Component + all sub-components (MixerStrip, ClipCanvas, AdvancedSlots) |
| `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css` | All styles, token-only |
| `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx` | Unit tests |
| `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx` | Gallery demo (StatesGrid + Playground) |
| `src/components/FocusedTrackDetailPanel/index.ts` | Public re-exports |

---

### Task 1: Scaffold files + failing skeleton test

**Files:**
- Create: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx`
- Create: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css`
- Create: `src/components/FocusedTrackDetailPanel/index.ts`
- Create: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  // ClipInfo re-exported from TrackLane; FxPlugin from FxChip
  export interface FocusedTrackDetailPanelProps {
    track: {
      id: string; name: string; color: string; kind: 'audio' | 'folder';
      armed: boolean; muted: boolean; soloed: boolean;
      volumeDb: number; pan: number;
    }
    clips: ClipInfo[]
    plugins: FxPlugin[]
    chainEnabled: boolean
    pxPerBeat: number; bpm: number; numerator: number; denominator: number
    division: Division
    meterValueL?: number; meterValueR?: number
    height: number
    onResize: (height: number) => void
    open: boolean
    onClose: () => void
    onClipMove?: (intent: ClipMoveIntent) => void
    onClipTrimStart?: (intent: ClipTrimIntent) => void
    onClipTrimEnd?: (intent: ClipTrimIntent) => void
    onClipDelete?: (clipId: string) => void
    onToggleChain: (next: boolean) => void
    onTogglePlugin: (id: string, next: boolean) => void
    onReorderPlugin: (from: number, to: number) => void
    onRemovePlugin: (id: string) => void
    onAddPlugin: () => void
    onOpenPlugin: (id: string) => void
    anySoloActive?: boolean
    disabled?: boolean
  }
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'

describe('FocusedTrackDetailPanel — scaffold', () => {
  it('renders without crashing', () => {
    // This will fail until the component exists
    render(<FocusedTrackDetailPanel />)
    expect(document.body).toBeTruthy()
  })
})
```

Run: `cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/focused-track-detail-panel && npx vitest run src/components/FocusedTrackDetailPanel`
Expected: FAIL — "Cannot find module './FocusedTrackDetailPanel'"

- [ ] **Step 2: Create empty component shell**

```tsx
// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx
import styles from './FocusedTrackDetailPanel.module.css'

export function FocusedTrackDetailPanel(_props: Record<string, unknown>) {
  return <div className={styles.root} />
}
```

```css
/* src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css */
.root { }
```

```ts
// src/components/FocusedTrackDetailPanel/index.ts
export { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
export type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/components/FocusedTrackDetailPanel`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/FocusedTrackDetailPanel/
git commit -m "feat(FocusedTrackDetailPanel): scaffold files + passing smoke test"
```

---

### Task 2: Full component implementation

**Files:**
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx` (replace with real impl)
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css`

**Interfaces:**
- Consumes: `TrackLane`, `ClipInfo`, `ClipMoveIntent`, `ClipTrimIntent`, `Division` from `../TrackLane`; `Meter` from `../Meter/Meter`; `FxChip`, `FxPlugin` from `../FxChip`; `Panel` from `../Panel`; `Fader`, `dbScale` from `../Fader`; `ArmButton` from `../ArmButton`; `MuteSoloToggle` from `../MuteSoloToggle`; `PanKnob` from `../PanKnob`
- Produces: `FocusedTrackDetailPanel` with all states, `FocusedTrackDetailPanelProps`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
import type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
import type { ClipInfo } from '../TrackLane'
import type { FxPlugin } from '../FxChip'

const TRACK = {
  id: 't1', name: 'Vocals', color: 'var(--track-color-1)', kind: 'audio' as const,
  armed: false, muted: false, soloed: false, volumeDb: -6, pan: 0,
}

const CLIPS: ClipInfo[] = [
  { clipId: 'c1', start: 0, length: 2, peaks: [0.5, 0.6, 0.4], label: 'Take 1' },
]

const PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Reverb', enabled: true },
]

function makeProps(overrides: Partial<FocusedTrackDetailPanelProps> = {}): FocusedTrackDetailPanelProps {
  return {
    track: TRACK,
    clips: CLIPS,
    plugins: PLUGINS,
    chainEnabled: true,
    pxPerBeat: 80,
    bpm: 120,
    numerator: 4,
    denominator: 4,
    division: '1/4',
    height: 300,
    onResize: vi.fn(),
    open: true,
    onClose: vi.fn(),
    onToggleChain: vi.fn(),
    onTogglePlugin: vi.fn(),
    onReorderPlugin: vi.fn(),
    onRemovePlugin: vi.fn(),
    onAddPlugin: vi.fn(),
    onOpenPlugin: vi.fn(),
    ...overrides,
  }
}

describe('FocusedTrackDetailPanel — structure', () => {
  it('renders panel region with track name heading when open', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByRole('region', { name: /vocals/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /vocals/i })).toBeInTheDocument()
  })

  it('renders close button that calls onClose', () => {
    const onClose = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: /close inspector/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sets data-open when open=true and omits it when open=false', () => {
    const { rerender } = render(<FocusedTrackDetailPanel {...makeProps({ open: true })} />)
    const root = screen.getByRole('region', { name: /vocals/i })
    expect(root).toHaveAttribute('data-open')
    rerender(<FocusedTrackDetailPanel {...makeProps({ open: false })} />)
    expect(root).not.toHaveAttribute('data-open')
  })

  it('renders "empty track" state when clips=[]', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ clips: [] })} />)
    expect(screen.getByText(/no clips/i)).toBeInTheDocument()
  })

  it('renders FxChip with the provided plugins', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    // FxChip renders a button with aria-label="FX chain"
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('always renders Meter (ears-first override for detail panel)', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ meterValueL: -12, meterValueR: -18 })} />)
    expect(screen.getAllByRole('meter').length).toBeGreaterThan(0)
  })

  it('renders divider / resize handle', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByRole('separator', { name: /resize panel/i })).toBeInTheDocument()
  })

  it('calls onResize on pointer drag of divider', () => {
    const onResize = vi.fn()
    render(<FocusedTrackDetailPanel {...makeProps({ onResize, height: 300 })} />)
    const divider = screen.getByRole('separator', { name: /resize panel/i })

    fireEvent.pointerDown(divider, { clientY: 500, pointerId: 1 })
    // pointer move up by 50px → panel grows by 50px → new height = 350
    fireEvent.pointerMove(window, { clientY: 450, pointerId: 1 })
    fireEvent.pointerUp(window, { clientY: 450, pointerId: 1 })

    expect(onResize).toHaveBeenCalled()
    const [newHeight] = onResize.mock.calls[0]
    expect(newHeight).toBeCloseTo(350, 0)
  })

  it('renders advanced slot placeholders for sidechain, phase, automation, routing', () => {
    render(<FocusedTrackDetailPanel {...makeProps()} />)
    expect(screen.getByText(/sidechain/i)).toBeInTheDocument()
    expect(screen.getByText(/phase/i)).toBeInTheDocument()
    expect(screen.getByText(/automation/i)).toBeInTheDocument()
    expect(screen.getByText(/routing/i)).toBeInTheDocument()
  })

  it('renders as disabled with data-disabled', () => {
    render(<FocusedTrackDetailPanel {...makeProps({ disabled: true })} />)
    const root = screen.getByRole('region', { name: /vocals/i })
    expect(root).toHaveAttribute('data-disabled')
  })
})
```

- [ ] **Step 2: Run to verify failures**

Run: `npx vitest run src/components/FocusedTrackDetailPanel`
Expected: All tests FAIL (component doesn't match yet)

- [ ] **Step 3: Implement the full component**

```tsx
// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { TrackLane } from '../TrackLane'
import type { ClipInfo, ClipMoveIntent, ClipTrimIntent } from '../TrackLane'
import type { Division } from '../TimelineGrid'
import { Meter } from '../Meter/Meter'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import { Panel } from '../Panel'
import { Fader, dbScale } from '../Fader'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { PanKnob } from '../PanKnob'
import styles from './FocusedTrackDetailPanel.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const HEIGHT_KEY = 'jackdaw.detail.height'
const HEIGHT_MIN = 120
const HEIGHT_DEFAULT = 280

function getStoredHeight(): number {
  try {
    const v = localStorage.getItem(HEIGHT_KEY)
    if (v) {
      const n = parseInt(v, 10)
      if (Number.isFinite(n)) return Math.max(HEIGHT_MIN, n)
    }
  } catch { /* ignore */ }
  return HEIGHT_DEFAULT
}

function storeHeight(h: number) {
  try { localStorage.setItem(HEIGHT_KEY, String(h)) } catch { /* ignore */ }
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FocusedTrackDetailPanelProps {
  track: {
    id: string
    name: string
    color: string
    kind: 'audio' | 'folder'
    armed: boolean
    muted: boolean
    soloed: boolean
    volumeDb: number
    pan: number
  }
  clips: ClipInfo[]
  plugins: FxPlugin[]
  chainEnabled: boolean
  pxPerBeat: number
  bpm: number
  numerator: number
  denominator: number
  division: Division
  meterValueL?: number
  meterValueR?: number
  height: number
  onResize: (height: number) => void
  open: boolean
  onClose: () => void
  onClipMove?: (intent: ClipMoveIntent) => void
  onClipTrimStart?: (intent: ClipTrimIntent) => void
  onClipTrimEnd?: (intent: ClipTrimIntent) => void
  onClipDelete?: (clipId: string) => void
  onToggleChain: (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorderPlugin: (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin: () => void
  onOpenPlugin: (id: string) => void
  anySoloActive?: boolean
  disabled?: boolean
}

// ── DB scale singleton ────────────────────────────────────────────────────────

const DB_SCALE = dbScale()

// ── AdvancedSlot ─────────────────────────────────────────────────────────────

interface AdvancedSlotProps { label: string; description: string }

function AdvancedSlot({ label, description }: AdvancedSlotProps) {
  return (
    <div className={styles.advancedSlot} aria-label={label}>
      <span className={styles.slotLabel}>{label}</span>
      <span className={styles.slotDesc}>{description}</span>
    </div>
  )
}

// ── FocusedTrackDetailPanel ───────────────────────────────────────────────────

export function FocusedTrackDetailPanel({
  track,
  clips,
  plugins,
  chainEnabled,
  pxPerBeat,
  bpm,
  numerator,
  denominator,
  division,
  meterValueL,
  meterValueR,
  height,
  onResize,
  open,
  onClose,
  onClipMove,
  onClipTrimStart,
  onClipTrimEnd,
  onClipDelete,
  onToggleChain,
  onTogglePlugin,
  onReorderPlugin,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  anySoloActive = false,
  disabled = false,
}: FocusedTrackDetailPanelProps) {
  const dividerRef = useRef<HTMLDivElement>(null)
  const dragRef    = useRef<{ startY: number; startH: number } | null>(null)
  const [resizing, setResizing] = useState(false)

  // Clip lane height = panel body height minus header (40px) and some padding
  const laneHeight = Math.max(64, height - 40 - 8)

  // ── Divider drag ──────────────────────────────────────────────────────────

  const handleDividerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startH: height }
    setResizing(true)
  }, [disabled, height])

  const handleDividerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dy      = dragRef.current.startY - e.clientY
    const maxH    = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    const newH    = Math.max(HEIGHT_MIN, Math.min(maxH, dragRef.current.startH + dy))
    onResize(newH)
  }, [onResize])

  const handleDividerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dy      = dragRef.current.startY - e.clientY
    const maxH    = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    const newH    = Math.max(HEIGHT_MIN, Math.min(maxH, dragRef.current.startH + dy))
    storeHeight(newH)
    onResize(newH)
    dragRef.current = null
    setResizing(false)
  }, [onResize])

  // Keyboard resize on divider: ArrowUp/Down adjust by 20px
  function handleDividerKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const maxH = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newH = Math.min(maxH, height + 20)
      onResize(newH); storeHeight(newH)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newH = Math.max(HEIGHT_MIN, height - 20)
      onResize(newH); storeHeight(newH)
    }
  }

  return (
    <section
      className={styles.root}
      data-open={open || undefined}
      data-resizing={resizing || undefined}
      data-disabled={disabled || undefined}
      aria-label={`${track.name} inspector`}
      style={{
        '--track-color': track.color,
        '--panel-height': `${height}px`,
      } as CSSProperties}
    >
      {/* ── Resize divider ─────────────────────────────────────────────────── */}
      <div
        ref={dividerRef}
        className={styles.divider}
        role="separator"
        aria-label="Resize panel"
        aria-orientation="horizontal"
        tabIndex={0}
        onPointerDown={handleDividerDown}
        onPointerMove={handleDividerMove}
        onPointerUp={handleDividerUp}
        onPointerCancel={handleDividerUp}
        onKeyDown={handleDividerKey}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.keyline} aria-hidden />
        <h2 className={styles.trackName}>{track.name}</h2>
        <div className={styles.headerControls}>
          <ArmButton
            armed={track.armed}
            onToggle={() => {}}
            size="sm"
            disabled={disabled}
          />
          <MuteSoloToggle
            muted={track.muted}
            soloed={track.soloed}
            onToggleMute={() => {}}
            onToggleSolo={() => {}}
            anySoloActive={anySoloActive}
            size="sm"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close inspector"
          onClick={onClose}
          disabled={disabled}
        >
          <X size={14} weight="bold" aria-hidden />
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Left: Meter + clip lane */}
        <div className={styles.leftCol}>
          <div className={styles.meterWell} aria-label="Level meter">
            <Meter
              valueL={meterValueL ?? -60}
              valueR={meterValueR ?? -60}
              peakHold
              clipLatch
              ballistics
              orientation="vertical"
              size="md"
              aria-label="Level"
            />
          </div>

          <div className={styles.laneArea}>
            {clips.length === 0 ? (
              <div className={styles.emptyLane} aria-label="No clips">
                <span className={styles.emptyMsg}>No clips</span>
              </div>
            ) : (
              <TrackLane
                trackId={track.id}
                clips={clips}
                bpm={bpm}
                numerator={numerator}
                denominator={denominator}
                pxPerBeat={pxPerBeat}
                division={division}
                height={laneHeight}
                selected
                disabled={disabled}
                onClipMove={onClipMove}
                onClipTrimStart={onClipTrimStart}
                onClipTrimEnd={onClipTrimEnd}
                onClipDelete={onClipDelete}
              />
            )}
          </div>

          {/* Volume + Pan strip */}
          <div className={styles.mixerStrip}>
            <Fader
              orientation="vertical"
              scale={DB_SCALE}
              min={-60}
              max={6}
              value={track.volumeDb}
              onChange={() => {}}
              size="sm"
              disabled={disabled}
              aria-label="Volume"
            />
            <PanKnob
              pan={track.pan}
              onChange={() => {}}
              color={track.color}
              size="sm"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Right: FX chain + advanced slots */}
        <div className={styles.rightCol}>
          <Panel title="FX Chain" tone="stage" padding="sm">
            <FxChip
              plugins={plugins}
              chainEnabled={chainEnabled}
              onToggleChain={onToggleChain}
              onTogglePlugin={onTogglePlugin}
              onReorder={onReorderPlugin}
              onRemove={onRemovePlugin}
              onAdd={onAddPlugin}
              onOpenPlugin={onOpenPlugin}
              size="md"
              disabled={disabled}
            />
          </Panel>

          <Panel title="Advanced" tone="outlined" padding="sm">
            <AdvancedSlot
              label="Sidechain"
              description="Route a sidechain source to this track's compressors"
            />
            <AdvancedSlot
              label="Phase / Polarity"
              description="Invert signal polarity per channel"
            />
            <AdvancedSlot
              label="Automation"
              description="Write and read automation lanes for this track"
            />
            <AdvancedSlot
              label="Routing"
              description="Assign this track to an aux send or effect return"
            />
          </Panel>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Write the CSS**

```css
/* src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css */

/* ─── Root ───────────────────────────────────────────────────────────────────
   The panel occupies a fixed slice at the bottom of the arrangement area.
   Height is controlled via --panel-height set inline.
   data-open drives the open/close height transition (decorative).
   data-resizing freezes cursor during live drag (functional; no transition).
*/

.root {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--surface);
  border-top: 1px solid var(--border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 -4px 16px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  /* Closed state: height 0, contents hidden */
  height: 0;
  transition: height var(--dur-slow, 200ms) var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
}

.root[data-open] {
  height: var(--panel-height, 280px);
}

/* Resize in progress: no height transition (1:1 with pointer — functional motion). */
.root[data-resizing] {
  transition: none;
  cursor: ns-resize;
}

.root[data-disabled] {
  pointer-events: none;
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .root {
    /* Open/close transition is decorative — snap it. */
    transition: none;
  }
  /* Resize pointer tracking is 1:1 (functional), so no rule change needed. */
}

/* ─── Divider (resize handle) ────────────────────────────────────────────────
   A horizontal drag target at the top of the panel. The knurled visual
   runs via background-image (dots) — no extra DOM nodes.
*/

.divider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
  background-color: var(--stage);
  border-bottom: 1px solid var(--border);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  /* Knurl dots — tactile drag affordance */
  background-image:
    radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px);
  background-size: 6px 6px;
  background-position: center center;
}

.divider:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.divider:hover {
  background-color: color-mix(in srgb, var(--accent) 15%, var(--stage));
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

.header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  height: 40px;
  min-height: 40px;
  margin-top: 8px; /* clear the divider */
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  position: relative;
}

.keyline {
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--track-color, var(--accent));
  border-radius: 0 2px 2px 0;
  flex-shrink: 0;
}

.trackName {
  flex: 1;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  margin: 0;
  padding-left: var(--space-3);
  line-height: 1;
}

.headerControls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.closeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius, 4px);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: color var(--dur-base, 120ms), background-color var(--dur-base, 120ms);
}

.closeBtn:hover {
  background-color: color-mix(in srgb, var(--text) 8%, transparent);
  color: var(--text);
}

.closeBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .closeBtn { transition: none; }
}

/* ─── Body ───────────────────────────────────────────────────────────────── */

.body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  gap: var(--space-2);
  padding: var(--space-2);
}

/* ─── Left column: Meter + clip lane + mixer strip ─────────────────────── */

.leftCol {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.meterWell {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--space-1);
  background-color: var(--stage);
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: var(--radius, 4px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.45);
}

.laneArea {
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
  background-color: var(--stage);
  border-radius: var(--radius, 4px);
  border: 1px solid var(--border);
}

.emptyLane {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-4);
}

.emptyMsg {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}

.mixerStrip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  padding: var(--space-1);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius, 4px);
}

/* ─── Right column: FX chain + advanced slots ───────────────────────────── */

.rightCol {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 220px;
  flex-shrink: 0;
  overflow-y: auto;
}

/* ─── Advanced placeholder slots ─────────────────────────────────────────── */

.advancedSlot {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  border: 1px dashed var(--border);
  border-radius: var(--radius, 4px);
  background-color: color-mix(in srgb, var(--stage) 30%, var(--surface));
  margin-bottom: var(--space-1);
}

.slotLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.slotDesc {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: color-mix(in srgb, var(--text-muted) 60%, transparent);
  line-height: var(--leading-sm, 1.3);
}
```

- [ ] **Step 5: Update index.ts with full types**

```ts
// src/components/FocusedTrackDetailPanel/index.ts
export { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
export type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/components/FocusedTrackDetailPanel`
Expected: All tests PASS

- [ ] **Step 7: Run tsc**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/components/FocusedTrackDetailPanel/
git commit -m "feat(FocusedTrackDetailPanel): implement component — meter + clips + FX chain + advanced slots, resizable divider"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx`

**Interfaces:**
- Consumes: `FocusedTrackDetailPanel` + all its props; `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery ui; `Toggle`, `Fader` for dogfood controls

- [ ] **Step 1: Write the demo**

```tsx
// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { FocusedTrackDetailPanel } from './FocusedTrackDetailPanel'
import type { FocusedTrackDetailPanelProps } from './FocusedTrackDetailPanel'
import type { ClipInfo } from '../TrackLane'
import type { FxPlugin } from '../FxChip'

export const meta: DemoMeta = {
  name: 'FocusedTrackDetailPanel',
  group: 'Composites',
  route: '/focused-track-detail-panel',
  order: 2,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const TRACK_VOCAL = {
  id: 't1', name: 'Vocals', color: 'var(--track-color-1)', kind: 'audio' as const,
  armed: false, muted: false, soloed: false, volumeDb: -6, pan: 0,
}

const TRACK_DRUM = {
  id: 't2', name: 'Drums', color: 'var(--track-color-2)', kind: 'audio' as const,
  armed: true, muted: false, soloed: false, volumeDb: -3, pan: 0,
}

const CLIPS: ClipInfo[] = [
  { clipId: 'c1', start: 0,   length: 4,   peaks: Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.4) * 0.5 + 0.5), label: 'Take 1' },
  { clipId: 'c2', start: 4.5, length: 2.5, peaks: Array.from({ length: 25 }, (_, i) => Math.cos(i * 0.6) * 0.4 + 0.4), label: 'Fill' },
]

const PLUGINS: FxPlugin[] = [
  { id: 'p1', name: 'Compressor', enabled: true },
  { id: 'p2', name: 'EQ', enabled: true },
  { id: 'p3', name: 'Reverb', enabled: false },
]

const noop   = () => {}
const noopId = (_: string) => {}
const noopFromTo = (_from: number, _to: number) => {}

// ── Shared base props ─────────────────────────────────────────────────────────

const BASE_PROPS: Omit<FocusedTrackDetailPanelProps, 'track' | 'open' | 'height'> = {
  clips: CLIPS, plugins: PLUGINS, chainEnabled: true,
  pxPerBeat: 60, bpm: 120, numerator: 4, denominator: 4, division: '1/4',
  meterValueL: -12, meterValueR: -18,
  onResize: noop, onClose: noop, onClipMove: noop,
  onToggleChain: noop, onTogglePlugin: noopId,
  onReorderPlugin: noopFromTo, onRemovePlugin: noopId,
  onAddPlugin: noop, onOpenPlugin: noopId,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="open — with clips">
        <div style={{ height: 300, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <FocusedTrackDetailPanel
            {...BASE_PROPS}
            track={TRACK_VOCAL}
            open height={300}
          />
        </div>
      </State>

      <State label="open — empty track (no clips)">
        <div style={{ height: 260, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <FocusedTrackDetailPanel
            {...BASE_PROPS}
            clips={[]}
            track={TRACK_DRUM}
            open height={260}
            meterValueL={-6} meterValueR={-4}
          />
        </div>
      </State>

      <State label="open — armed + hot meter">
        <div style={{ height: 280, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <FocusedTrackDetailPanel
            {...BASE_PROPS}
            track={{ ...TRACK_DRUM, armed: true }}
            open height={280}
            meterValueL={2} meterValueR={0}
          />
        </div>
      </State>

      <State label="closed (height=0)">
        <div style={{ height: 40, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
            Panel closed — open=false
          </p>
          <FocusedTrackDetailPanel
            {...BASE_PROPS}
            track={TRACK_VOCAL}
            open={false} height={280}
          />
        </div>
      </State>

      <State label="disabled">
        <div style={{ height: 260, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <FocusedTrackDetailPanel
            {...BASE_PROPS}
            track={TRACK_VOCAL}
            open height={260}
            disabled
          />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,         setOpen]         = useState(true)
  const [height,       setHeight]       = useState(300)
  const [armed,        setArmed]        = useState(false)
  const [muted,        setMuted]        = useState(false)
  const [soloed,       setSoloed]       = useState(false)
  const [chainEnabled, setChainEnabled] = useState(true)
  const [meterL,       setMeterL]       = useState(-12)
  const [meterR,       setMeterR]       = useState(-18)
  const [plugins,      setPlugins]      = useState<FxPlugin[]>(PLUGINS)
  const [clips,        setClips]        = useState<ClipInfo[]>(CLIPS)

  const track = {
    id: 'pg', name: 'Vocals', color: 'var(--track-color-1)', kind: 'audio' as const,
    armed, muted, soloed, volumeDb: -6, pan: 0,
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ width: 640, flexShrink: 0 }}>
          <div style={{ height, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <FocusedTrackDetailPanel
              track={track}
              clips={clips}
              plugins={plugins}
              chainEnabled={chainEnabled}
              pxPerBeat={60} bpm={120} numerator={4} denominator={4} division="1/4"
              meterValueL={meterL} meterValueR={meterR}
              height={height}
              onResize={setHeight}
              open={open}
              onClose={() => setOpen(false)}
              onToggleChain={setChainEnabled}
              onTogglePlugin={(id, next) =>
                setPlugins(ps => ps.map(p => p.id === id ? { ...p, enabled: next } : p))
              }
              onReorderPlugin={(from, to) =>
                setPlugins(ps => {
                  const arr = [...ps]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr
                })
              }
              onRemovePlugin={id => setPlugins(ps => ps.filter(p => p.id !== id))}
              onAddPlugin={() =>
                setPlugins(ps => [...ps, { id: `p${Date.now()}`, name: 'New Plugin', enabled: true }])
              }
              onOpenPlugin={id => console.log('open plugin', id)}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={open}         onChange={setOpen}         size="sm" label="open" />
          <Toggle checked={armed}        onChange={setArmed}        size="sm" label="armed" />
          <Toggle checked={muted}        onChange={setMuted}        size="sm" label="muted" />
          <Toggle checked={soloed}       onChange={setSoloed}       size="sm" label="soloed" />
          <Toggle checked={chainEnabled} onChange={setChainEnabled} size="sm" label="chainEnabled" />
          <Toggle
            checked={clips.length === 0}
            onChange={v => setClips(v ? [] : CLIPS)}
            size="sm"
            label="empty (no clips)"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            meter L
            <Fader value={meterL} onChange={setMeterL} min={-60} max={6} orientation="horizontal" size="sm" aria-label="Meter L" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '5ch', textAlign: 'right' }}>
              {meterL.toFixed(0)} dB
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            meter R
            <Fader value={meterR} onChange={setMeterR} min={-60} max={6} orientation="horizontal" size="sm" aria-label="Meter R" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '5ch', textAlign: 'right' }}>
              {meterR.toFixed(0)} dB
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            height
            <Fader value={height} onChange={h => setHeight(Math.round(h))} min={120} max={600} orientation="horizontal" size="sm" aria-label="Panel height" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', minWidth: '4ch', textAlign: 'right' }}>
              {height}px
            </span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function FocusedTrackDetailPanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run tsc + vitest**

Run: `npx tsc --noEmit && npx vitest run`
Expected: All green

- [ ] **Step 3: Commit**

```bash
git add src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx
git commit -m "feat(FocusedTrackDetailPanel): add gallery demo — all states + playground"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| Bottom-sheet inspector for focused track | Task 2 — panel root with `data-open`, `height` |
| Meter always visible | Task 2 — `<Meter>` in left col, no conditional |
| Waveform clips via TrackLane reuse | Task 2 — `<TrackLane>` in laneArea |
| Full FX chain (FxChip) | Task 2 — `<FxChip>` in right col |
| Resizable via draggable divider | Task 2 — `.divider` with pointer capture |
| Persist height in localStorage | Task 2 — `jackdaw.detail.height` |
| Advanced slots / placeholders | Task 2 — 4 `<AdvancedSlot>` components |
| States: open, resizing, collapsed, empty, focused | Task 2 CSS + Task 3 demo |
| Tokens only | Task 2 CSS — all var(--*) |
| Compare light + dark | Task 3 demo uses DemoShell (gallery provides Compare) |
| Reduced-motion: open/close decorative (snaps), resize functional (no change) | Task 2 CSS `@media` |
| All states in gallery | Task 3 demo |
| tsc + vitest + lint green | Steps throughout |
| Props typed against real contract | Task 2 uses `ClipInfo`, `FxPlugin`, `ClipMoveIntent`, `ClipTrimIntent` from real types |
| Dogfood playground with Toggle + Fader | Task 3 demo |

### Placeholder scan
No TBDs, no "similar to" references, no missing code blocks.

### Type consistency
- `ClipInfo`, `ClipMoveIntent`, `ClipTrimIntent`, `Division` all imported from `../TrackLane` consistently.
- `FxPlugin` imported from `../FxChip` consistently.
- `FocusedTrackDetailPanelProps` defined once in Task 2, re-exported in index.ts.
