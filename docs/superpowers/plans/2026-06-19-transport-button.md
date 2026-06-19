# TransportButton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `TransportButton` — a hardware-family primitive for Play/Pause toggle, Stop, and Pause with a green LED bloom for the playing state, as the base for `TransportBar`.

**Architecture:** Single `<button>` with `data-*` attribute state model (same as `ArmButton` and `MuteSoloToggle`). Phosphor icons imported directly; the play variant swaps the icon in JSX based on the `playing` prop. CSS handles the incandescent LED transitions via `--dur-led-on`/`--dur-led-off` tokens already defined in `global.css`.

**Tech Stack:** React 18, CSS Modules, `@phosphor-icons/react` v2, Vitest + Testing Library.

## Global Constraints

- No new dependencies — `@phosphor-icons/react` is already installed.
- CSS tokens only — no inline color values, no hardcoded px where a token exists.
- `data-playing` MUST be gated on `variant === 'play'` — stop/pause must never receive it.
- No `aria-pressed` on any variant. Label-flip pattern only.
- `prefers-reduced-motion`: `--dur-led-on` and `--dur-led-off` are already zeroed in `global.css` — add no extra rules in the component CSS.
- Sizes: md = 36×36px / 20px icon; sm = 28×28px / 16px icon.
- Gallery: `group: 'Primitives'`, `route: '/transport-button'`, `order: 10`.
- `typecheck` (`npx tsc --noEmit`) and tests (`npx vitest run`) must be green before any commit. No `lint` script exists in this project.

---

### Task 1: TransportButton component, styles, barrel, and tests

**Files:**
- Create: `src/components/TransportButton/TransportButton.tsx`
- Create: `src/components/TransportButton/TransportButton.module.css`
- Create: `src/components/TransportButton/TransportButton.test.tsx`
- Create: `src/components/TransportButton/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface TransportButtonProps {
    variant: 'play' | 'stop' | 'pause'
    playing?: boolean
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
    size?: 'sm' | 'md'
    disabled?: boolean
    'aria-label'?: string
  }
  export function TransportButton(props: TransportButtonProps): JSX.Element
  ```

---

- [ ] **Step 1: Write the test file**

Create `src/components/TransportButton/TransportButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TransportButton } from './TransportButton'

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('TransportButton rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('data-variant reflects prop', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button').getAttribute('data-variant')).toBe('stop')
  })

  it('data-size is "md" by default', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size reflects size prop', () => {
    const { getByRole } = render(
      <TransportButton variant="play" size="sm" onClick={noop} />,
    )
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('no aria-pressed on play variant', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('no aria-pressed on stop variant', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('no aria-pressed on pause variant', () => {
    const { getByRole } = render(<TransportButton variant="pause" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
})

// ─── aria-label ──────────────────────────────────────────────────────────────

describe('TransportButton aria-label', () => {
  const noop = vi.fn()

  it('play variant: default label is "Play" when not playing', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Play')
  })

  it('play variant: default label is "Pause" when playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="play" playing onClick={noop} />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Pause')
  })

  it('stop variant: default label is "Stop"', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Stop')
  })

  it('pause variant: default label is "Pause"', () => {
    const { getByRole } = render(<TransportButton variant="pause" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Pause')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <TransportButton variant="play" onClick={noop} aria-label="Play from cursor" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Play from cursor')
  })
})

// ─── data-playing gating ─────────────────────────────────────────────────────

describe('TransportButton data-playing', () => {
  const noop = vi.fn()

  it('data-playing present when variant=play and playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="play" playing onClick={noop} />,
    )
    expect(getByRole('button')).toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=play and playing=false', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=stop even if playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="stop" playing onClick={noop} />,
    )
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=pause even if playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="pause" playing onClick={noop} />,
    )
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })
})

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('TransportButton interaction', () => {
  it('clicking fires onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(<TransportButton variant="play" onClick={onClick} />)
    fireEvent.click(getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled: clicking does not fire onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <TransportButton variant="play" disabled onClick={onClick} />,
    )
    fireEvent.click(getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npx vitest run src/components/TransportButton/TransportButton.test.tsx --reporter=verbose
```

Expected: all tests fail with "Cannot find module './TransportButton'" or similar. If any pass unexpectedly, stop and investigate.

- [ ] **Step 3: Write the component**

Create `src/components/TransportButton/TransportButton.tsx`:

```tsx
// src/components/TransportButton/TransportButton.tsx
import { Play, Pause, Stop } from '@phosphor-icons/react'
import styles from './TransportButton.module.css'

export interface TransportButtonProps {
  variant: 'play' | 'stop' | 'pause'
  /** Controls icon swap and green LED bloom. Only meaningful for variant="play". */
  playing?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

const DEFAULT_LABELS: Record<string, string> = {
  'play-false': 'Play',
  'play-true':  'Pause',
  'stop':       'Stop',
  'pause':      'Pause',
}

function resolveIcon(variant: TransportButtonProps['variant'], playing: boolean) {
  if (variant === 'play') return playing ? Pause : Play
  if (variant === 'stop') return Stop
  return Pause
}

export function TransportButton({
  variant,
  playing = false,
  onClick,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
}: TransportButtonProps) {
  const labelKey = variant === 'play' ? `play-${playing}` : variant
  const label = ariaLabel ?? DEFAULT_LABELS[labelKey]
  const Icon = resolveIcon(variant, playing)
  const isPlaying = variant === 'play' && playing

  return (
    <button
      className={styles.root}
      data-variant={variant}
      data-size={size}
      data-playing={isPlaying || undefined}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden size={ICON_SIZE[size]} />
    </button>
  )
}
```

- [ ] **Step 4: Write the CSS**

Create `src/components/TransportButton/TransportButton.module.css`:

```css
/* src/components/TransportButton/TransportButton.module.css */

/* ─── Root (recessed well) ───────────────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  outline: none;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;

  background-color: var(--stage);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--border);
  color: var(--text-dim);

  /* Slow decay — incandescent off */
  transition:
    background-color var(--dur-led-off) var(--ease-out),
    box-shadow       var(--dur-led-off) var(--ease-out),
    color            var(--dur-led-off) var(--ease-out);
}

/* ─── Sizes ───────────────────────────────────────────────────────────────────── */

.root[data-size="md"] { width: 36px; height: 36px; }
.root[data-size="sm"] { width: 28px; height: 28px; }

/* ─── Hover ───────────────────────────────────────────────────────────────────── */

.root:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Pressed ─────────────────────────────────────────────────────────────────── */

.root:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
}

/* ─── Playing — green LED bloom (play variant only, gated in TSX) ────────────── */
/*
  Fast attack on in, slow decay on out (the base .root rule handles the out).
  data-playing is set only when variant="play" && playing — never on stop/pause.
*/

.root[data-playing] {
  background-color: color-mix(in srgb, var(--led-green) 18%, var(--stage));
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--led-green),
    0 0 8px 2px color-mix(in srgb, var(--led-green) 35%, transparent);
  color: var(--led-green);
  /* Fast attack */
  transition:
    background-color var(--dur-led-on) var(--ease-out),
    box-shadow       var(--dur-led-on) var(--ease-out),
    color            var(--dur-led-on) var(--ease-out);
}

/* ─── Disabled ────────────────────────────────────────────────────────────────── */

.root:disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Focus ring — per-variant identity color (kit convention) ───────────────── */
/*
  Deliberate, not accidental: ArmButton uses --led-red, MuteSoloToggle uses
  each chip's LED color. Play uses green to match its lit state; stop/pause use
  --accent as the kit-wide interactive fallback.
*/

.root[data-variant="play"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--led-green) 70%, transparent);
  outline-offset: 2px;
}

.root[data-variant="stop"]:focus-visible,
.root[data-variant="pause"]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Write the barrel export**

Create `src/components/TransportButton/index.ts`:

```ts
export { TransportButton } from './TransportButton'
export type { TransportButtonProps } from './TransportButton'
```

- [ ] **Step 6: Run tests — verify they all pass**

```bash
npx vitest run src/components/TransportButton/TransportButton.test.tsx --reporter=verbose
```

Expected: all 16 tests pass. If any fail, fix before continuing.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. If any, fix before committing.

- [ ] **Step 8: Commit**

```bash
git add src/components/TransportButton/
git commit -m "feat(TransportButton): hardware-family play/pause/stop primitive"
```

---

### Task 2: TransportButton demo

**Files:**
- Create: `src/components/TransportButton/TransportButton.demo.tsx`

**Interfaces:**
- Consumes: `TransportButton` from `./TransportButton` (Task 1)
- Consumes: `Checkbox` from `../Checkbox`
- Consumes: `DemoShell` from `../../gallery/ui/DemoShell`
- Consumes: `StatesGrid`, `State` from `../../gallery/ui/StatesGrid`
- Consumes: `Playground` from `../../gallery/ui/Playground`
- Produces: default export registered in gallery at `/transport-button`

---

- [ ] **Step 1: Write the demo file**

Create `src/components/TransportButton/TransportButton.demo.tsx`:

```tsx
// src/components/TransportButton/TransportButton.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { TransportButton } from './TransportButton'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'TransportButton',
  group: 'Primitives',
  route: '/transport-button',
  order: 10,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Play (idle)">
        <TransportButton variant="play" onClick={noop} />
      </State>
      <State label="Playing (lit)">
        <TransportButton variant="play" playing onClick={noop} />
      </State>
      <State label="Stop">
        <TransportButton variant="stop" onClick={noop} />
      </State>
      <State label="Pause">
        <TransportButton variant="pause" onClick={noop} />
      </State>
      <State label="Disabled">
        <TransportButton variant="play" disabled onClick={noop} />
      </State>
      <State label="sm">
        <TransportButton variant="play" size="sm" onClick={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [variant, setVariant] = useState<'play' | 'stop' | 'pause'>('play')
  const [playing, setPlaying] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        {/* Interactive instance — play variant toggles playing on click */}
        <TransportButton
          variant={variant}
          playing={playing}
          disabled={disabled}
          size={size}
          onClick={() => {
            if (variant === 'play') setPlaying(p => !p)
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            variant
            <select
              value={variant}
              onChange={e => {
                setVariant(e.target.value as 'play' | 'stop' | 'pause')
                setPlaying(false)
              }}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="play">play</option>
              <option value="stop">stop</option>
              <option value="pause">pause</option>
            </select>
          </label>
          {variant === 'play' && (
            <Checkbox
              checked={playing}
              onChange={setPlaying}
              size="sm"
              label="playing"
            />
          )}
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36×36px)</option>
              <option value="sm">sm (28×28px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function TransportButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and verify in the gallery**

```bash
npm run dev
```

Open `http://localhost:5173` and navigate to **TransportButton** in the Primitives sidebar. Verify:

- States grid shows 6 cells: Play (idle), Playing (lit — green bloom + Pause icon), Stop, Pause, Disabled, sm.
- Playing (lit) cell has a visible green glow around the button.
- Playground: switching variant to "stop" hides the `playing` checkbox; switching back to "play" shows it.
- Clicking the button when `variant=play` toggles `playing` state (icon + bloom).
- `disabled` checkbox grays out the button and clicking has no effect.
- Reskins correctly across themes in Compare view.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests pass, no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransportButton/TransportButton.demo.tsx
git commit -m "feat(TransportButton): gallery demo — states grid + playground"
```
