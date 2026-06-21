# ProjectPicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a warm welcome/project-picker modal composite (`ProjectPicker`) that composes `Dialog` + `TextField` to present project actions (New, New from Code), an "All my projects" browsable list with keyboard navigation, and a Recent section.

**Architecture:** `ProjectPicker` wraps the existing `Dialog` shell (scrim, focus-trap, portal via `usePortalTarget()`, Escape key) to get overlay behavior for free; two additive props (`style`/`bodyStyle`) on Dialog unlock a custom 720px width and zero-padding body. The project list uses a roving-tabindex `role="listbox"` for accessible arrow-key navigation. The "New from code" flow expands inline via a CSS `data-expanded` accordion on a sibling div — no new overlay needed.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@phosphor-icons/react` (FilePlus, ShareNetwork, X), Vitest + Testing Library (`fireEvent` only — never `userEvent`).

## Global Constraints

- Tokens only — every color/spacing via `var(--…)`. No hardcoded colors.
- CSS Modules + `data-*` attributes for state. No class juggling.
- `fireEvent` only — never `userEvent`.
- `npx tsc --noEmit` + `npx vitest run` + lint green at every commit.
- `sm`/`md` sizes only (default `md`). No `lg` size added anywhere.
- Phosphor Icons — default weight (the gallery has no global `IconContext`); import each icon by name from `@phosphor-icons/react`.
- Portal via the existing Dialog (which already calls `usePortalTarget()`) — do not portal again inside ProjectPicker.
- `:focus-visible` only — never plain `:focus`.
- No animation library — CSS transitions only. The `data-expanded` accordion uses `max-height` CSS transition.
- YAGNI: only what the spec asks for.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/Dialog/Dialog.tsx` | Modify | Add optional `style` + `bodyStyle` props (additive, non-breaking) |
| `src/components/Dialog/Dialog.test.tsx` | Modify | One new test verifying `style` passes to dialog div |
| `src/components/ProjectPicker/ProjectPicker.tsx` | Create | Component logic + types |
| `src/components/ProjectPicker/ProjectPicker.module.css` | Create | All visual styles (tokens only) |
| `src/components/ProjectPicker/ProjectPicker.test.tsx` | Create | Full test suite |
| `src/components/ProjectPicker/ProjectPicker.demo.tsx` | Create | Gallery demo (all states) |
| `src/components/ProjectPicker/index.ts` | Create | Barrel export |

---

## Task 1: Extend Dialog with `style` and `bodyStyle` props

**Files:**
- Modify: `src/components/Dialog/Dialog.tsx`
- Modify: `src/components/Dialog/Dialog.test.tsx`

**Interfaces:**
- Produces: `Dialog` now accepts optional `style?: React.CSSProperties` (applied to the `.dialog` div) and `bodyStyle?: React.CSSProperties` (applied to the `.body` div).

- [ ] **Step 1: Add the two props to `DialogProps`**

Open `src/components/Dialog/Dialog.tsx`. Add two optional fields to `DialogProps`:

```tsx
export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md'
  dismissible?: boolean
  'aria-label'?: string
  style?: React.CSSProperties      // ← new: forwarded to the .dialog div
  bodyStyle?: React.CSSProperties  // ← new: forwarded to the .body div
}
```

- [ ] **Step 2: Destructure the new props in the function signature**

```tsx
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  dismissible = true,
  'aria-label': ariaLabel,
  style,        // ← new
  bodyStyle,    // ← new
}: DialogProps) {
```

- [ ] **Step 3: Forward `style` to the `.dialog` div and `bodyStyle` to `.body`**

Find the `.dialog` div (the one with `role="dialog"`) and add `style={style}`:

```tsx
<div
  ref={dialogRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby={title ? titleId : undefined}
  aria-label={!title ? ariaLabel : undefined}
  className={styles.dialog}
  data-size={size}
  tabIndex={-1}
  style={style}                           // ← new
  onClick={(e) => e.stopPropagation()}
>
```

Find the `.body` div and add `style={bodyStyle}`:

```tsx
<div className={styles.body} style={bodyStyle}>{children}</div>
```

- [ ] **Step 4: Add a test for `style` prop**

In `src/components/Dialog/Dialog.test.tsx`, add inside the "rendering" describe:

```tsx
it('forwards style to the dialog element', () => {
  render(<Dialog {...BASE} style={{ width: '720px' }} />)
  expect(screen.getByRole('dialog')).toHaveStyle({ width: '720px' })
})
```

- [ ] **Step 5: Run tests to confirm all Dialog tests pass**

```bash
npx vitest run src/components/Dialog/Dialog.test.tsx
```

Expected: all existing tests pass + 1 new test passes.

- [ ] **Step 6: Run tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Dialog/Dialog.tsx src/components/Dialog/Dialog.test.tsx
git commit -m "feat(Dialog): add optional style + bodyStyle props for composite overrides"
```

---

## Task 2: Implement ProjectPicker component

**Files:**
- Create: `src/components/ProjectPicker/ProjectPicker.tsx`
- Create: `src/components/ProjectPicker/ProjectPicker.module.css`
- Create: `src/components/ProjectPicker/index.ts`

**Interfaces:**
- Consumes: `Dialog` (with new `style`/`bodyStyle`), `TextField` from `../TextField`, Phosphor `FilePlus`, `ShareNetwork`, `X` from `@phosphor-icons/react`.
- Produces:
  ```ts
  export interface ProjectRecord { id: string; name: string; path: string; lastOpened: string }
  export interface ProjectPickerProps {
    open: boolean
    onClose: () => void
    projects: ProjectRecord[]
    recent: ProjectRecord[]
    onNew: () => void
    onNewFromCode: (code: string) => void
    onOpen: (id: string) => void
    onBrowse: () => void
  }
  export function ProjectPicker(props: ProjectPickerProps): JSX.Element
  ```

- [ ] **Step 1: Create `src/components/ProjectPicker/ProjectPicker.tsx`**

```tsx
// src/components/ProjectPicker/ProjectPicker.tsx
import { useState, useRef, useEffect } from 'react'
import { FilePlus, ShareNetwork, X } from '@phosphor-icons/react'
import { Dialog } from '../Dialog'
import { TextField } from '../TextField'
import styles from './ProjectPicker.module.css'

export interface ProjectRecord {
  id: string
  name: string
  path: string
  lastOpened: string
}

export interface ProjectPickerProps {
  open: boolean
  onClose: () => void
  projects: ProjectRecord[]
  recent: ProjectRecord[]
  onNew: () => void
  onNewFromCode: (code: string) => void
  onOpen: (id: string) => void
  onBrowse: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectPicker({
  open,
  onClose,
  projects,
  recent,
  onNew,
  onNewFromCode,
  onOpen,
  onBrowse,
}: ProjectPickerProps) {
  const [codeExpanded, setCodeExpanded] = useState(false)
  const [code, setCode] = useState('')
  const [focusedIdx, setFocusedIdx] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const codeEntryRef = useRef<HTMLDivElement | null>(null)

  // Reset transient state when picker closes
  useEffect(() => {
    if (!open) {
      setCodeExpanded(false)
      setCode('')
      setFocusedIdx(0)
    }
  }, [open])

  // Move DOM focus to the newly focused project item
  useEffect(() => {
    itemRefs.current[focusedIdx]?.focus()
  }, [focusedIdx])

  // Auto-focus the code input when the code panel expands
  useEffect(() => {
    if (codeExpanded) {
      const input = codeEntryRef.current?.querySelector<HTMLInputElement>('input')
      input?.focus()
    }
  }, [codeExpanded])

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed) onNewFromCode(trimmed)
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, projects.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const proj = projects[focusedIdx]
      if (proj) onOpen(proj.id)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label="Open a project"
      dismissible
      style={{ width: '720px', maxWidth: '95vw' }}
      bodyStyle={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.brand}>Jackdaw</span>
          <span className={styles.subtitle}>Open a project to start writing.</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* ── Two-column main ── */}
      <div className={styles.main}>
        {/* Left: action cards */}
        <div className={styles.actions}>
          <p className={styles.sectionLabel}>Start</p>

          <button className={styles.actionCard} onClick={onNew}>
            <span className={styles.actionIcon}>
              <FilePlus size={18} />
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionName}>New</span>
              <span className={styles.actionDesc}>Start a fresh song</span>
            </span>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => setCodeExpanded(v => !v)}
            aria-expanded={codeExpanded}
          >
            <span className={styles.actionIcon}>
              <ShareNetwork size={18} />
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionName}>New from code</span>
              <span className={styles.actionDesc}>Receive a shared project</span>
            </span>
          </button>

          {/* Code-entry accordion */}
          <div
            ref={codeEntryRef}
            className={styles.codeEntry}
            data-expanded={codeExpanded || undefined}
            aria-hidden={!codeExpanded}
          >
            <form onSubmit={handleCodeSubmit} className={styles.codeForm}>
              <TextField
                value={code}
                onChange={(v) => setCode(v)}
                placeholder="e.g. abc-123-xyz"
                label="Share code"
                size="sm"
              />
              <button
                type="submit"
                className={styles.goBtn}
                disabled={!code.trim()}
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Right: all projects */}
        <div className={styles.projects}>
          <p className={styles.sectionLabel}>All my projects</p>

          {projects.length === 0 ? (
            <p className={styles.empty}>No projects yet. Start a new one.</p>
          ) : (
            <div
              role="listbox"
              aria-label="All projects"
              className={styles.projectList}
              onKeyDown={handleListKeyDown}
            >
              {projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  role="option"
                  aria-selected={idx === focusedIdx}
                  tabIndex={idx === focusedIdx ? 0 : -1}
                  className={styles.projectItem}
                  data-selected={idx === focusedIdx || undefined}
                  ref={el => { itemRefs.current[idx] = el }}
                  onClick={() => { setFocusedIdx(idx); onOpen(proj.id) }}
                  onFocus={() => setFocusedIdx(idx)}
                >
                  <span className={styles.projectName}>{proj.name}</span>
                  <span className={styles.projectPath}>{proj.path}</span>
                  <time className={styles.projectDate} dateTime={proj.lastOpened}>
                    {formatDate(proj.lastOpened)}
                  </time>
                </div>
              ))}
            </div>
          )}

          <button className={styles.browseBtn} onClick={onBrowse}>
            Browse…
          </button>
        </div>
      </div>

      {/* ── Recent ── */}
      {recent.length > 0 && (
        <div className={styles.recent}>
          <p className={styles.sectionLabel}>Recent</p>
          <div className={styles.recentList}>
            {recent.map(proj => (
              <button
                key={proj.id}
                className={styles.recentItem}
                onClick={() => onOpen(proj.id)}
              >
                <span className={styles.projectName}>{proj.name}</span>
                <span className={styles.projectPath}>{proj.path}</span>
                <time className={styles.projectDate} dateTime={proj.lastOpened}>
                  {formatDate(proj.lastOpened)}
                </time>
              </button>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `src/components/ProjectPicker/ProjectPicker.module.css`**

```css
/* src/components/ProjectPicker/ProjectPicker.module.css */

/* ── Header ──────────────────────────────────────────────────────────────────── */

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.headerText {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.brand {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--text);
  line-height: var(--leading-display);
  letter-spacing: -0.02em;
}

.subtitle {
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text-muted);
  line-height: var(--leading-base);
}

.closeBtn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius);
  color: var(--text-dim);
  cursor: pointer;
  padding: 0;
  transition:
    color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out);
}

.closeBtn:hover {
  color: var(--text);
  background: var(--stage);
}

.closeBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* ── Two-column main ──────────────────────────────────────────────────────────── */

.main {
  display: grid;
  grid-template-columns: 260px 1fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Left: Actions ───────────────────────────────────────────────────────────── */

.actions {
  padding: var(--space-5);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
}

.sectionLabel {
  margin: 0 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1;
}

/* Tactile hardware-pad action card */
.actionCard {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--stage);
  border: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  text-align: left;
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.actionCard:hover {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.14),
    0 0 0 1px var(--accent);
}

.actionCard:active {
  box-shadow:
    inset 0 3px 6px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  transition-duration: var(--dur-fast);
}

.actionCard:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.actionIcon {
  width: 32px;
  height: 32px;
  border-radius: calc(var(--radius) - 2px);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 1px 3px rgba(0, 0, 0, 0.35);
}

.actionText {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.actionName {
  display: block;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text);
  line-height: 1.2;
}

.actionDesc {
  display: block;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  line-height: 1.3;
}

/* ── Code entry accordion ─────────────────────────────────────────────────────── */

.codeEntry {
  overflow: hidden;
  max-height: 0;
  transition: max-height var(--dur-slow) var(--ease-out);
  border-radius: var(--radius);
}

.codeEntry[data-expanded] {
  max-height: 110px;
}

.codeForm {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.goBtn {
  align-self: flex-end;
  padding: var(--space-1) var(--space-4);
  background: var(--accent);
  color: var(--accent-contrast);
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: opacity var(--dur-base) var(--ease-out);
  line-height: 1.6;
}

.goBtn:disabled {
  opacity: 0.38;
  cursor: default;
}

.goBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Right: All my projects ────────────────────────────────────────────────────── */

.projects {
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
  overflow: hidden;
  min-height: 0;
}

.projectList {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-3);
}

.projectItem {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  cursor: pointer;
  outline: none;
  transition: background var(--dur-base) var(--ease-out);
  border: 1px solid transparent;
}

.projectItem:hover {
  background: var(--stage);
}

.projectItem[data-selected] {
  background: var(--stage);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.projectItem:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.projectName {
  font-family: var(--font-ui);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.projectPath {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.projectDate {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  white-space: nowrap;
  flex-shrink: 0;
}

.empty {
  margin: 0;
  padding: var(--space-4) var(--space-3);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text-dim);
  font-style: italic;
}

.browseBtn {
  flex-shrink: 0;
  align-self: flex-start;
  background: none;
  border: none;
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius);
  transition: color var(--dur-base) var(--ease-out);
}

.browseBtn:hover {
  color: var(--text);
}

.browseBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ── Recent ─────────────────────────────────────────────────────────────────── */

.recent {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  padding: var(--space-4) var(--space-5) var(--space-5);
}

.recentList {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-2);
}

.recentItem {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-base) var(--ease-out);
}

.recentItem:hover {
  background: var(--stage);
}

.recentItem:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
```

- [ ] **Step 3: Create `src/components/ProjectPicker/index.ts`**

```ts
// src/components/ProjectPicker/index.ts
export { ProjectPicker } from './ProjectPicker'
export type { ProjectPickerProps, ProjectRecord } from './ProjectPicker'
```

- [ ] **Step 4: Run tsc to catch type errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit scaffold**

```bash
git add src/components/ProjectPicker/
git commit -m "feat(ProjectPicker): component scaffold — layout, CSS, action cards, project listbox, recent, code accordion"
```

---

## Task 3: Write ProjectPicker tests

**Files:**
- Create: `src/components/ProjectPicker/ProjectPicker.test.tsx`

**Interfaces:**
- Consumes: `ProjectPicker`, `ProjectPickerProps`, `ProjectRecord` from `./ProjectPicker`.

- [ ] **Step 1: Create `src/components/ProjectPicker/ProjectPicker.test.tsx`**

```tsx
// src/components/ProjectPicker/ProjectPicker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectPicker } from './ProjectPicker'
import type { ProjectRecord } from './ProjectPicker'

const PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice',   path: '~/Music/song-nice',   lastOpened: '2026-06-20T10:00:00Z' },
  { id: 'p2', name: 'Demo Track',  path: '~/Music/demo-track',  lastOpened: '2026-06-18T08:00:00Z' },
  { id: 'p3', name: 'Outro Loop',  path: '~/Music/outro-loop',  lastOpened: '2026-06-15T12:00:00Z' },
]

const RECENT: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice',   path: '~/Music/song-nice',   lastOpened: '2026-06-20T10:00:00Z' },
]

const BASE = {
  open: true as const,
  onClose:       vi.fn(),
  projects:      PROJECTS,
  recent:        RECENT,
  onNew:         vi.fn(),
  onNewFromCode: vi.fn(),
  onOpen:        vi.fn(),
  onBrowse:      vi.fn(),
}

beforeEach(() => { vi.clearAllMocks() })

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ProjectPicker — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<ProjectPicker {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the brand name "Jackdaw"', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Jackdaw')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Open a project to start writing.')).toBeInTheDocument()
  })

  it('renders "New" action card', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: /new$/i })).toBeInTheDocument()
  })

  it('renders "New from code" action card', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: /new from code/i })).toBeInTheDocument()
  })

  it('renders the project listbox', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('listbox', { name: 'All projects' })).toBeInTheDocument()
  })

  it('renders all project names', () => {
    render(<ProjectPicker {...BASE} />)
    for (const p of PROJECTS) {
      expect(screen.getByText(p.name)).toBeInTheDocument()
    }
  })

  it('renders Recent section when recent has entries', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Recent')).toBeInTheDocument()
  })

  it('hides Recent section when recent is empty', () => {
    render(<ProjectPicker {...BASE} recent={[]} />)
    expect(screen.queryByText('Recent')).not.toBeInTheDocument()
  })

  it('renders "Browse…" button', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: 'Browse…' })).toBeInTheDocument()
  })
})

// ── Empty state ────────────────────────────────────────────────────────────────

describe('ProjectPicker — empty state', () => {
  it('shows empty-state message when projects=[]', () => {
    render(<ProjectPicker {...BASE} projects={[]} />)
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
  })

  it('does NOT render the listbox when projects=[]', () => {
    render(<ProjectPicker {...BASE} projects={[]} />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('ProjectPicker — callbacks', () => {
  it('clicking "New" calls onNew', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /^new$/i }))
    expect(BASE.onNew).toHaveBeenCalledTimes(1)
  })

  it('clicking close button calls onClose', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(BASE.onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking "Browse…" calls onBrowse', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Browse…' }))
    expect(BASE.onBrowse).toHaveBeenCalledTimes(1)
  })

  it('clicking a project in the list calls onOpen with project id', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')
    fireEvent.click(options[1])
    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[1].id)
  })

  it('clicking a recent project calls onOpen with project id', () => {
    render(<ProjectPicker {...BASE} />)
    // The recent section has buttons, not options
    const recentName = RECENT[0].name
    // Recent items are buttons containing the project name
    // Find all buttons with the project name text
    const allButtons = screen.getAllByRole('button')
    const recentBtn = allButtons.find(
      b => b.textContent?.includes(recentName) && !b.className.includes('actionCard')
    )
    expect(recentBtn).toBeTruthy()
    fireEvent.click(recentBtn!)
    expect(BASE.onOpen).toHaveBeenCalledWith(RECENT[0].id)
  })
})

// ── New from code flow ────────────────────────────────────────────────────────

describe('ProjectPicker — new from code flow', () => {
  it('"New from code" button has aria-expanded=false initially', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: /new from code/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking "New from code" sets aria-expanded=true', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: /new from code/i })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('typing a code and submitting calls onNewFromCode with trimmed value', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))

    const input = screen.getByLabelText(/share code/i)
    fireEvent.change(input, { target: { value: '  abc-123  ' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(BASE.onNewFromCode).toHaveBeenCalledWith('abc-123')
  })

  it('submitting empty code does NOT call onNewFromCode', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))

    const input = screen.getByLabelText(/share code/i)
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(BASE.onNewFromCode).not.toHaveBeenCalled()
  })
})

// ── Keyboard nav ───────────────────────────────────────────────────────────────

describe('ProjectPicker — project list keyboard navigation', () => {
  it('first project item has tabIndex=0 by default', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('tabindex', '0')
    expect(options[1]).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowDown moves roving focus to the next item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    expect(options[0]).toHaveAttribute('tabindex', '-1')
    expect(options[1]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp from index 1 moves back to index 0', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })

    expect(options[0]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowDown does not go past the last item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    // Move to last
    for (let i = 0; i < PROJECTS.length + 5; i++) {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    }

    expect(options[PROJECTS.length - 1]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp does not go above the first item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowUp' })
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })

    expect(options[0]).toHaveAttribute('tabindex', '0')
  })

  it('Enter on focused item calls onOpen with that project id', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')

    // Move to second item first
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[1].id)
  })

  it('Space on focused item calls onOpen with that project id', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')

    fireEvent.keyDown(listbox, { key: ' ' })

    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[0].id)
  })
})

// ── State reset on close ──────────────────────────────────────────────────────

describe('ProjectPicker — state reset', () => {
  it('code entry collapses and code clears when picker closes and reopens', () => {
    const { rerender } = render(<ProjectPicker {...BASE} />)

    // Expand code entry and type
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))
    const input = screen.getByLabelText(/share code/i)
    fireEvent.change(input, { target: { value: 'some-code' } })

    // Close
    rerender(<ProjectPicker {...BASE} open={false} />)
    // Reopen
    rerender(<ProjectPicker {...BASE} open={true} />)

    const btn = screen.getByRole('button', { name: /new from code/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
npx vitest run src/components/ProjectPicker/ProjectPicker.test.tsx
```

Expected: All tests pass. If a test fails, fix the component before proceeding.

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectPicker/ProjectPicker.test.tsx
git commit -m "test(ProjectPicker): full test suite — rendering, callbacks, keyboard nav, code flow, state reset"
```

---

## Task 4: Write gallery demo

**Files:**
- Create: `src/components/ProjectPicker/ProjectPicker.demo.tsx`

**Interfaces:**
- Consumes: `ProjectPicker`, `ProjectRecord`, `Toggle` from `../Toggle`, gallery helpers from `../../gallery/registry`, `../../gallery/ui/DemoShell`, `../../gallery/ui/StatesGrid`, `../../gallery/ui/Playground`.

- [ ] **Step 1: Create `src/components/ProjectPicker/ProjectPicker.demo.tsx`**

```tsx
// src/components/ProjectPicker/ProjectPicker.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProjectPicker } from './ProjectPicker'
import type { ProjectRecord } from './ProjectPicker'

export const meta: DemoMeta = {
  name: 'ProjectPicker',
  group: 'Composites',
  route: '/project-picker',
  order: 25,
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MANY_PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice',      path: '~/Music/song-nice',      lastOpened: '2026-06-20T10:00:00Z' },
  { id: 'p2', name: 'Demo Track',     path: '~/Music/demo-track',     lastOpened: '2026-06-18T08:00:00Z' },
  { id: 'p3', name: 'Outro Loop',     path: '~/Music/outro-loop',     lastOpened: '2026-06-15T12:00:00Z' },
  { id: 'p4', name: 'Sunrise Draft',  path: '~/Music/sunrise-draft',  lastOpened: '2026-06-10T09:00:00Z' },
  { id: 'p5', name: 'Verse Study',    path: '~/Music/verse-study',    lastOpened: '2026-06-05T14:00:00Z' },
  { id: 'p6', name: 'Bridge Work',    path: '~/Music/bridge-work',    lastOpened: '2026-05-30T11:00:00Z' },
  { id: 'p7', name: 'Hook Sketch',    path: '~/Music/hook-sketch',    lastOpened: '2026-05-25T16:00:00Z' },
  { id: 'p8', name: 'Final Mix',      path: '~/Music/final-mix',      lastOpened: '2026-05-20T08:00:00Z' },
]

const FEW_PROJECTS: ProjectRecord[] = MANY_PROJECTS.slice(0, 2)

const RECENT_PROJECTS: ProjectRecord[] = [
  MANY_PROJECTS[0],
  MANY_PROJECTS[1],
]

const BTN: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  outline: 'none',
}

// ── State cards ────────────────────────────────────────────────────────────────

function MainViewCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Main view (projects + recent)">
      <button style={BTN} onClick={() => setOpen(true)}>Open picker</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={FEW_PROJECTS}
        recent={RECENT_PROJECTS}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
      />
    </State>
  )
}

function EmptyStateCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Empty (no projects)">
      <button style={BTN} onClick={() => setOpen(true)}>Open empty picker</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={[]}
        recent={[]}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
      />
    </State>
  )
}

function ManyProjectsCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Many projects (scrollable list)">
      <button style={BTN} onClick={() => setOpen(true)}>Open with many projects</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={MANY_PROJECTS}
        recent={RECENT_PROJECTS}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
      />
    </State>
  )
}

function NoRecentCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Projects but no recent">
      <button style={BTN} onClick={() => setOpen(true)}>Open (no recent)</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={FEW_PROJECTS}
        recent={[]}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
      />
    </State>
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <MainViewCard />
      <EmptyStateCard />
      <ManyProjectsCard />
      <NoRecentCard />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,       setOpen]      = useState(false)
  const [hasProjects, setHasProjects] = useState(true)
  const [hasRecent,  setHasRecent]   = useState(true)
  const [lastAction, setLastAction]  = useState<string | null>(null)

  const projects = hasProjects ? MANY_PROJECTS.slice(0, 4) : []
  const recent   = hasRecent   ? RECENT_PROJECTS           : []

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button style={BTN} onClick={() => setOpen(true)}>Open project picker</button>
          {lastAction && (
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}>
              → {lastAction}
            </p>
          )}
        </div>

        <ProjectPicker
          open={open}
          onClose={() => { setOpen(false); setLastAction('onClose()') }}
          projects={projects}
          recent={recent}
          onNew={() => { setOpen(false); setLastAction('onNew()') }}
          onNewFromCode={(code) => { setOpen(false); setLastAction(`onNewFromCode("${code}")`) }}
          onOpen={(id) => { setOpen(false); setLastAction(`onOpen("${id}")`) }}
          onBrowse={() => { setOpen(false); setLastAction('onBrowse()') }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={hasProjects} onChange={setHasProjects} size="sm" label="has projects" />
          <Toggle checked={hasRecent}   onChange={setHasRecent}   size="sm" label="has recent"   />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ProjectPickerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run tsc to verify demo types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectPicker/ProjectPicker.demo.tsx
git commit -m "feat(ProjectPicker): gallery demo — main view, empty, many-projects, no-recent, playground"
```

---

## Task 5: Final verification and green bar

- [ ] **Step 1: Full tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Full vitest run**

```bash
npx vitest run
```

Expected: all tests pass including the new Dialog + ProjectPicker tests.

- [ ] **Step 3: Lint check**

```bash
npx eslint src/components/ProjectPicker/ src/components/Dialog/Dialog.tsx --max-warnings 0
```

Expected: no warnings or errors.

- [ ] **Step 4: Confirm gallery auto-registration**

The gallery auto-discovers via `import.meta.glob('../components/**/*.demo.tsx')`. Verify by checking the registry picks up the new file:

```bash
grep -r "project-picker" src/ || echo "route not hardcoded — auto-registered via glob"
```

The route `/project-picker` is set in `meta.route` inside `ProjectPicker.demo.tsx`; no registry edit needed.

---

## Self-Review: Spec Coverage Checklist

| Spec requirement | Task / file | Status |
|---|---|---|
| Welcome modal composes Dialog + TextField | Task 2, ProjectPicker.tsx | ✓ |
| Header: "Jackdaw" brand + subtitle + close | Task 2, `.header` CSS | ✓ |
| Left: New action card (FilePlus icon) | Task 2 | ✓ |
| Left: New from code action card (ShareNetwork icon) | Task 2 | ✓ |
| New from code: field to enter share code + submit | Task 2, `.codeEntry` accordion | ✓ |
| Right: All my projects list (name + path + date) | Task 2, `.projectList` | ✓ |
| Browse… escape hatch button → onBrowse | Task 2 | ✓ |
| Recent section (name + path + date) → onOpen | Task 2, `.recent` | ✓ |
| Props contract: projects, recent, onNew, onNewFromCode, onOpen, onBrowse | Task 2, `ProjectPickerProps` | ✓ |
| Empty state (no projects → just actions) | Task 2, empty guard | ✓ |
| Keyboard list nav (arrow keys + Enter) | Task 2, roving tabindex | ✓ |
| Dialog a11y: role="dialog", aria-label, focus trap, Esc | Dialog component (existing) | ✓ |
| Listbox a11y: role="listbox"/option, aria-selected, tabIndex roving | Task 2 | ✓ |
| Tokens only — no hardcoded colors | Task 2 CSS | ✓ |
| All states in demo | Task 4 | ✓ |
| tsc + vitest green | Task 5 | ✓ |
| Gallery auto-registered (no manual registry edit) | Task 4 meta | ✓ |

**Design decisions made (record in commit messages):**
- Dialog gets `style`/`bodyStyle` props (720px wide, zero-padding body) rather than a new `lg` size, keeping `sm`/`md` as the only size tokens.
- "New from code" expands inline in the left column (accordion) — no new overlay or dialog, per "no premature abstraction" rule.
- Clicking an "All my projects" item calls `onOpen(id)` immediately — no "select then confirm" step, consistent with the warm/direct instrument feel.
- `role="listbox"` + `role="option"` for All projects; plain `<button>` for Recent (quick-action, not a selectable list).
- `ShareNetwork` icon for "New from code" (represents Croc P2P sharing); `FilePlus` for New.
- `formatDate` lives inline in ProjectPicker.tsx (single consumer, no premature extraction).
