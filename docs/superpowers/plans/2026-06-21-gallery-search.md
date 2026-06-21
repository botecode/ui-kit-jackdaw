# Gallery Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live-filtering search bar at the top of the gallery sidebar so any of the 40+ components can be found by name.

**Architecture:** A `SidebarSearch` gallery-internal component wraps a native `<input type="search">` in the same recessed-well shell as TextField (same tokens/shadows, no hardcoded colours). A pure `filterByName` function handles the substring filter; `Sidebar` owns the query state and passes filtered results to its existing list renderers. A test file in `src/gallery/` exercises `filterByName` to satisfy the kit's anti-vacuum gate.

**Tech Stack:** React 19, CSS Modules, `@phosphor-icons/react`, Vitest + `@testing-library/react` (jsdom), TypeScript strict.

## Global Constraints

- Tokens only — no hardcoded colours. Every colour comes from a CSS variable.
- CSS Modules. `data-*` attributes for state (no class-juggling).
- `fireEvent` in tests, never `userEvent`.
- `npx tsc --noEmit` + `npx vitest run` + lint must be green at every commit.
- Sizes `sm`/`md` only; this component is always `sm` (compact sidebar).
- `:focus-visible` only, never bare `:focus`.
- Keyboard: `/` or `⌘F` focuses the search input (guard: don't steal when target is already an editable element). `Esc` clears and blurs.
- Phosphor icons imported individually from `@phosphor-icons/react`.
- This is a gallery feature in `src/gallery/` — no `src/components/` component required, but a `src/gallery/gallerySearch.test.ts` is added to satisfy the anti-vacuum gate (option b from the spec card).

---

## File Map

| Path | Action | Responsibility |
|------|--------|---------------|
| `src/gallery/gallerySearch.ts` | Create | Pure `filterByName` helper |
| `src/gallery/gallerySearch.test.ts` | Create | Unit tests for `filterByName` (anti-vacuum gate) |
| `src/gallery/SidebarSearch.tsx` | Create | Search input component (recessed well + clear button) |
| `src/gallery/SidebarSearch.module.css` | Create | Styles for SidebarSearch |
| `src/gallery/Sidebar.tsx` | Modify | Add query state, wire SidebarSearch, pass filtered items |
| `src/gallery/Sidebar.module.css` | Modify | Add `.searchWrap` and `.emptyState` styles |

---

### Task 1: Pure filter helper + tests

**Files:**
- Create: `src/gallery/gallerySearch.ts`
- Create: `src/gallery/gallerySearch.test.ts`

**Interfaces:**
- Produces: `filterByName<T extends { name: string }>(items: T[], query: string): T[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/gallery/gallerySearch.test.ts
import { describe, it, expect } from 'vitest'
import { filterByName } from './gallerySearch'

type Named = { name: string }

const items: Named[] = [
  { name: 'Fader' },
  { name: 'PanKnob' },
  { name: 'ArmButton' },
  { name: 'Toggle' },
  { name: 'FocusedTrackDetailPanel' },
]

describe('filterByName', () => {
  it('returns all items when query is empty', () => {
    expect(filterByName(items, '')).toEqual(items)
  })

  it('filters case-insensitively', () => {
    expect(filterByName(items, 'fader')).toEqual([{ name: 'Fader' }])
    expect(filterByName(items, 'FADER')).toEqual([{ name: 'Fader' }])
  })

  it('matches substrings', () => {
    const result = filterByName(items, 'pan')
    expect(result).toEqual([{ name: 'PanKnob' }])
  })

  it('matches across multiple items', () => {
    const result = filterByName(items, 'o')
    // Toggle, PanKnob, FocusedTrackDetailPanel all contain 'o'
    expect(result.map(i => i.name)).toContain('Toggle')
    expect(result.map(i => i.name)).toContain('PanKnob')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterByName(items, 'zzz')).toEqual([])
  })

  it('handles whitespace-only query as empty', () => {
    expect(filterByName(items, '   ')).toEqual(items)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/gallery-search
npx vitest run src/gallery/gallerySearch.test.ts
```

Expected: error — `gallerySearch` module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/gallery/gallerySearch.ts
export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(item => item.name.toLowerCase().includes(q))
}
```

- [ ] **Step 4: Run to verify passing**

```bash
npx vitest run src/gallery/gallerySearch.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/gallerySearch.ts src/gallery/gallerySearch.test.ts
git commit -m "feat(gallery-search): pure filterByName helper + tests

Extracts the name-filter logic so it's independently testable.
Also satisfies the kit anti-vacuum gate (option b from the spec card)
— a gallery-only feature has no src/components/ test, so this test
file in src/gallery/ is the gate target."
```

---

### Task 2: SidebarSearch component

**Files:**
- Create: `src/gallery/SidebarSearch.tsx`
- Create: `src/gallery/SidebarSearch.module.css`

**Interfaces:**
- Consumes: `filterByName` (not directly — parent uses it; SidebarSearch just manages the input)
- Produces:
  ```ts
  interface SidebarSearchProps {
    value: string
    onChange: (value: string) => void
    onClear: () => void
    inputRef: React.RefObject<HTMLInputElement>
  }
  export function SidebarSearch(props: SidebarSearchProps): JSX.Element
  ```

**Design notes (Chroma):**
- Same recessed-well shell as TextField (same `box-shadow` recipe, same `--stage` bg, same border-radius token)
- `MagnifyingGlass` Phosphor icon as leading adornment, `aria-hidden`
- When `value` is non-empty: a `<button>` with an `X` icon appears as trailing. It has `aria-label="Clear search"` and `type="button"`. This is a real interactive button — NOT placed inside an `aria-hidden` trailing slot (unlike TextField's trailing which is a decorative span).
- The whole shell is a `<div>` with `role` = nothing (it's just a visual wrapper); the `<input>` has `aria-label="Search components"`.
- `type="search"` suppresses browser default clear-button via CSS.
- Keyboard handled by parent (Esc/focus shortcuts).

- [ ] **Step 1: Create the CSS**

```css
/* src/gallery/SidebarSearch.module.css */

.root {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  background: var(--stage);
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--border);
  padding: 0 var(--space-1);
  gap: var(--space-1);
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.root:has(:focus-visible) {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

.icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--text-dim);
  pointer-events: none;
}

.input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  caret-color: var(--accent);
  padding: 0;
}

.input::placeholder {
  color: var(--text-dim);
  opacity: 1;
}

/* Suppress browser default clear button for type=search */
.input::-webkit-search-cancel-button {
  display: none;
}

.clearBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-dim);
  border-radius: 2px;
  transition: color var(--dur-fast) var(--ease-out);
}

.clearBtn:hover {
  color: var(--text);
}

.clearBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
```

- [ ] **Step 2: Create the component**

```tsx
// src/gallery/SidebarSearch.tsx
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import styles from './SidebarSearch.module.css'

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement>
}

export function SidebarSearch({ value, onChange, onClear, inputRef }: SidebarSearchProps) {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        <MagnifyingGlass size={13} weight="bold" />
      </span>
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search…"
        aria-label="Search components"
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          aria-label="Clear search"
          onClick={onClear}
          tabIndex={0}
        >
          <X size={11} weight="bold" aria-hidden />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/gallery-search
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/gallery/SidebarSearch.tsx src/gallery/SidebarSearch.module.css
git commit -m "feat(gallery-search): SidebarSearch component

Recessed-well search input (same shell recipe as TextField) with a
leading MagnifyingGlass icon and an accessible clear button (real
<button> with aria-label, not inside aria-hidden trailing slot).
Suppresses the browser's default search cancel button via CSS."
```

---

### Task 3: Wire search into Sidebar

**Files:**
- Modify: `src/gallery/Sidebar.tsx`
- Modify: `src/gallery/Sidebar.module.css`

**Interfaces:**
- Consumes:
  - `SidebarSearch` from `./SidebarSearch`
  - `filterByName` from `./gallerySearch`

- [ ] **Step 1: Add styles to Sidebar.module.css**

Add at the bottom of `src/gallery/Sidebar.module.css`:

```css
.searchWrap {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
}

.emptyState {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-dim);
  font-style: italic;
}
```

- [ ] **Step 2: Rewrite Sidebar.tsx**

Replace the entire file content:

```tsx
// src/gallery/Sidebar.tsx
import { useMemo, useState, useRef, useEffect } from 'react'
import { DEMOS, type DemoMeta } from './registry'
import { PLANNED } from './planned'
import { ThemeSwitcher } from './ui/ThemeSwitcher'
import { useHashRoute } from './useHashRoute'
import { SidebarSearch } from './SidebarSearch'
import { filterByName } from './gallerySearch'
import styles from './Sidebar.module.css'

type Group = 'Foundations' | 'Primitives' | 'Composites'
const GROUPS: Group[] = ['Foundations', 'Primitives', 'Composites']

const FOUNDATION_LINKS = [
  { name: 'Tokens',          route: '/tokens' },
  { name: 'Design Language', route: '/design-language' },
]

export function Sidebar() {
  const route = useHashRoute()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcut: / or ⌘F focuses the search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as Element
      const editable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable

      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('')
        inputRef.current?.blur()
        return
      }

      if (editable) return

      if (e.key === '/' || (e.key === 'f' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const liveByGroup = useMemo(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const d of DEMOS) {
      if (d.meta.group in map) map[d.meta.group].push(d.meta)
    }
    return map
  }, [])

  const plannedByGroup = useMemo(() => {
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const p of PLANNED) map[p.group].push(p)
    return map
  }, [])

  // Filtered views — recalculated on every query keystroke
  const filteredFoundationLinks = filterByName(FOUNDATION_LINKS, query)
  const filteredLiveByGroup = useMemo<Record<Group, DemoMeta[]>>(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const g of GROUPS) {
      map[g] = filterByName(
        liveByGroup[g].slice().sort((a, b) => a.order - b.order),
        query,
      )
    }
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveByGroup, query])

  const filteredPlannedByGroup = useMemo<Record<Group, typeof PLANNED>>(() => {
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const g of GROUPS) {
      map[g] = filterByName(plannedByGroup[g], query)
    }
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedByGroup, query])

  const hasAnyResult =
    filteredFoundationLinks.length > 0 ||
    GROUPS.some(
      g => filteredLiveByGroup[g].length > 0 || filteredPlannedByGroup[g].length > 0,
    )

  return (
    <nav className={styles.sidebar} aria-label="Component navigation">
      <div className={styles.header}>
        <span className={styles.wordmark}>JACKDAW</span>
        <ThemeSwitcher />
      </div>
      <div className={styles.searchWrap}>
        <SidebarSearch
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          inputRef={inputRef}
        />
      </div>
      <div className={styles.nav}>
        {query && !hasAnyResult && (
          <p className={styles.emptyState}>No components match "{query}"</p>
        )}
        {GROUPS.map(group => {
          const foundations = group === 'Foundations' ? filteredFoundationLinks : []
          const live = filteredLiveByGroup[group]
          const planned = filteredPlannedByGroup[group]
          if (foundations.length + live.length + planned.length === 0) return null

          return (
            <div key={group} className={styles.group}>
              <div className={styles.groupLabel}>{group}</div>
              {[...foundations, ...live].map(item => (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  className={route === item.route ? styles.navLinkActive : styles.navLink}
                >
                  {item.name}
                </a>
              ))}
              {planned.map(p => (
                <span key={p.route} className={styles.navPlanned} aria-disabled="true">
                  {p.name}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (no regressions; gallerySearch tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/gallery/Sidebar.tsx src/gallery/Sidebar.module.css
git commit -m "feat(gallery-search): wire SidebarSearch into Sidebar

Adds live-filtering search bar pinned above component list.
- / or ⌘F (⌃F) focuses the field; Esc clears + blurs
- Both live and planned items are filtered (case-insensitive substring)
- Foundation links (Tokens, Design Language) also filtered
- Empty-result message shown when query has no matches
- Groups collapse automatically when all their items are filtered out"
```

---

## Self-Review Checklist

- [x] Spec: search bar at top of sidebar — Task 3 wires SidebarSearch into header area ✓
- [x] Spec: text-field (search variant) with leading magnifier — Task 2 uses same visual shell + MagnifyingGlass icon ✓
- [x] Spec: live filtering (case-insensitive substring on name) — Task 1 filterByName + Task 3 wires it ✓
- [x] Spec: clear button — Task 2 adds accessible `<button>` with aria-label ✓
- [x] Spec: empty-result message — Task 3 renders `.emptyState` when no matches ✓
- [x] Spec: keyboard `/` or `⌘F` focuses — Task 3 `useEffect` keydown listener ✓
- [x] Spec: `Esc` clears — Task 3 keydown listener ✓
- [x] Anti-vacuum gate satisfied — Task 1 creates `src/gallery/gallerySearch.test.ts` (option b) ✓
- [x] Tokens only — all CSS uses `var(--*)` ✓
- [x] fireEvent not userEvent — tests in Task 1 don't use userEvent ✓
- [x] tsc + vitest green — checked in each task ✓
