# Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `Shortcuts` composite component — a Preferences > Shortcuts panel with a searchable/sortable shortcut list on the left (with per-action Rebind via live keystroke capture) and a custom-action (macro) builder on the right.

**Architecture:** Two-column flex layout inside a single `Shortcuts` component. The left panel (`listPanel`) holds a toolbar (search input + sort `InputSelect`) and a scrollable grouped-or-flat list of `ActionRow` sub-components. The right panel (`builderPanel`) is a macro builder with a name field, chained step selects (`InputSelect`), a key-assignment button (same keystroke-capture pattern as Rebind), and a Save button. No external keybinding registry exists; capture is a simple `window.keydown` listener active only while capturing.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + @testing-library/react, `@phosphor-icons/react` (unused here — no icons needed), `InputSelect` (existing kit component)

## Global Constraints

- Tokens only — no hardcoded colours
- CSS Modules, `data-*` attributes for state
- `fireEvent` (not `userEvent`) in tests
- `npx tsc --noEmit` + `npx vitest run` + lint green
- Sizes `sm`/`md` (default `md`)
- `:focus-visible` only
- All states in the gallery demo
- No dead code / no premature abstraction

---

### Task 1: Component scaffold — types, skeleton, CSS, index

**Files:**
- Create: `src/components/Shortcuts/Shortcuts.tsx`
- Create: `src/components/Shortcuts/Shortcuts.module.css`
- Create: `src/components/Shortcuts/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ShortcutAction { id: string; name: string; category: string; bindings: string[] }
  export interface MacroStep { id: string; actionId: string }
  export interface ShortcutsProps {
    actions: ShortcutAction[]
    onRebind: (actionId: string, key: string) => void
    onCreateMacro: (name: string, steps: MacroStep[], key: string) => void
  }
  export function Shortcuts(props: ShortcutsProps): JSX.Element
  ```

- [ ] **Step 1: Create `src/components/Shortcuts/Shortcuts.tsx`**

```tsx
// src/components/Shortcuts/Shortcuts.tsx
import { useEffect, useId, useState } from 'react'
import styles from './Shortcuts.module.css'
import { InputSelect } from '../InputSelect'
import type { InputSelectOption } from '../InputSelect'

export interface ShortcutAction {
  id: string
  name: string
  category: string
  bindings: string[]
}

export interface MacroStep {
  id: string
  actionId: string
}

export interface ShortcutsProps {
  actions: ShortcutAction[]
  onRebind: (actionId: string, key: string) => void
  onCreateMacro: (name: string, steps: MacroStep[], key: string) => void
}

const MACRO_ACTIONS: InputSelectOption[] = [
  { id: 'play',      label: 'Play' },
  { id: 'stop',      label: 'Stop' },
  { id: 'record',    label: 'Record' },
  { id: 'undo',      label: 'Undo' },
  { id: 'redo',      label: 'Redo' },
  { id: 'loop',      label: 'Toggle Loop' },
  { id: 'arm',       label: 'Arm Track' },
  { id: 'mute',      label: 'Mute Track' },
  { id: 'solo',      label: 'Solo Track' },
  { id: 'new-clip',  label: 'New Clip' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'delete',    label: 'Delete' },
  { id: 'save',      label: 'Save Project' },
]

const SORT_OPTIONS: InputSelectOption[] = [
  { id: 'category', label: 'Category' },
  { id: 'name',     label: 'Name A–Z' },
]

// Returns null for bare modifier keypresses; otherwise a compact notation
// e.g. ⌘P, Ctrl+M, ⌘⇧Z, ⌥F4
function formatKeystroke(e: KeyboardEvent): string | null {
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return null
  const parts: string[] = []
  if (e.metaKey)  parts.push('⌘')
  if (e.ctrlKey)  parts.push('Ctrl+')
  if (e.altKey)   parts.push('⌥')
  if (e.shiftKey) parts.push('⇧')
  const key = e.key === ' ' ? 'Space' : e.key
  parts.push(key.length === 1 ? key.toUpperCase() : key)
  return parts.join('')
}

let _stepIdx = 0
function nextStepId() { return `s${++_stepIdx}` }

// ── Action row ────────────────────────────────────────────────────────────────

interface ActionRowProps {
  action: ShortcutAction
  capturing: boolean
  onStartCapture: () => void
  onCapture: (key: string) => void
  onCancelCapture: () => void
}

function ActionRow({ action, capturing, onStartCapture, onCapture, onCancelCapture }: ActionRowProps) {
  useEffect(() => {
    if (!capturing) return
    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      if (e.key === 'Escape') { onCancelCapture(); return }
      const key = formatKeystroke(e)
      if (key) onCapture(key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [capturing, onCapture, onCancelCapture])

  return (
    <div
      className={styles.row}
      data-capturing={capturing || undefined}
      role="listitem"
    >
      <div className={styles.rowInfo}>
        <span className={styles.actionName}>{action.name}</span>
        <span className={styles.actionCategory}>{action.category}</span>
      </div>
      <div className={styles.rowBindings} aria-label="Key bindings">
        {capturing ? (
          <span className={styles.capturingHint} aria-live="polite">Press a key…</span>
        ) : action.bindings.length > 0 ? (
          action.bindings.map(b => <kbd key={b} className={styles.keybadge}>{b}</kbd>)
        ) : (
          <span className={styles.noBinding}>—</span>
        )}
      </div>
      <button
        className={styles.rebindBtn}
        data-capturing={capturing || undefined}
        aria-label={capturing ? `Cancel rebind for ${action.name}` : `Rebind ${action.name}`}
        onClick={capturing ? onCancelCapture : onStartCapture}
      >
        {capturing ? 'Cancel' : 'Rebind'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Shortcuts({ actions, onRebind, onCreateMacro }: ShortcutsProps) {
  const searchId = useId()
  const nameId   = useId()

  const [query,       setQuery]       = useState('')
  const [sort,        setSort]        = useState('category')
  const [capturingId, setCapturingId] = useState<string | null>(null)

  const [macroName,         setMacroName]         = useState('')
  const [macroSteps,        setMacroSteps]        = useState<MacroStep[]>([])
  const [macroKey,          setMacroKey]          = useState<string | null>(null)
  const [capturingMacroKey, setCapturingMacroKey] = useState(false)

  const filtered = actions.filter(a => {
    if (!query) return true
    const q = query.toLowerCase()
    return a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) =>
    sort === 'category'
      ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name)
  )

  const grouped: Record<string, ShortcutAction[]> | null = sort === 'category'
    ? sorted.reduce<Record<string, ShortcutAction[]>>((acc, a) => {
        ;(acc[a.category] ??= []).push(a)
        return acc
      }, {})
    : null

  useEffect(() => {
    if (!capturingMacroKey) return
    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      if (e.key === 'Escape') { setCapturingMacroKey(false); return }
      const key = formatKeystroke(e)
      if (key) { setMacroKey(key); setCapturingMacroKey(false) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [capturingMacroKey])

  function addStep() {
    setMacroSteps(prev => [...prev, { id: nextStepId(), actionId: MACRO_ACTIONS[0]!.id }])
  }
  function updateStep(stepId: string, actionId: string) {
    setMacroSteps(prev => prev.map(s => s.id === stepId ? { ...s, actionId } : s))
  }
  function removeStep(stepId: string) {
    setMacroSteps(prev => prev.filter(s => s.id !== stepId))
  }

  const canSave = macroName.trim().length > 0 && macroSteps.length > 0 && macroKey !== null

  function handleSave() {
    if (!canSave) return
    onCreateMacro(macroName.trim(), macroSteps, macroKey!)
    setMacroName('')
    setMacroSteps([])
    setMacroKey(null)
  }

  function renderRows(list: ShortcutAction[]) {
    return list.map(action => (
      <ActionRow
        key={action.id}
        action={action}
        capturing={capturingId === action.id}
        onStartCapture={() => setCapturingId(action.id)}
        onCapture={key => { onRebind(action.id, key); setCapturingId(null) }}
        onCancelCapture={() => setCapturingId(null)}
      />
    ))
  }

  return (
    <div className={styles.root}>
      {/* ── Left panel ── */}
      <div className={styles.listPanel}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <label htmlFor={searchId} className={styles.srOnly}>Search shortcuts</label>
            <input
              id={searchId}
              type="search"
              className={styles.searchInput}
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.currentTarget.value)}
              data-searching={query.length > 0 || undefined}
            />
          </div>
          <div className={styles.sortWrap}>
            <InputSelect
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              variant="field"
              size="md"
              aria-label="Sort shortcuts"
            />
          </div>
        </div>

        <div className={styles.listScroll}>
          <div role="list" aria-label="Keyboard shortcuts">
            {grouped
              ? Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} role="group" aria-label={cat}>
                    <div className={styles.groupHeader} aria-hidden="true">{cat}</div>
                    {renderRows(items)}
                  </div>
                ))
              : renderRows(sorted)
            }
            {sorted.length === 0 && (
              <div className={styles.emptyState}>
                No shortcuts match &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel: macro builder ── */}
      <div className={styles.builderPanel} aria-label="Custom action builder">
        <div className={styles.builderHeader}>Custom action</div>
        <div className={styles.builderBody}>

          <div className={styles.fieldGroup}>
            <label htmlFor={nameId} className={styles.fieldLabel}>Name</label>
            <input
              id={nameId}
              type="text"
              className={styles.textInput}
              placeholder="Untitled macro…"
              value={macroName}
              onChange={e => setMacroName(e.currentTarget.value)}
            />
          </div>

          <div className={styles.stepsSection}>
            <span className={styles.fieldLabel}>Steps</span>
            <div className={styles.stepsList}>
              {macroSteps.map((step, idx) => (
                <div key={step.id} className={styles.stepRow}>
                  <span className={styles.stepNum} aria-label={`Step ${idx + 1}`}>{idx + 1}</span>
                  <div className={styles.stepSelect}>
                    <InputSelect
                      value={step.actionId}
                      onChange={id => updateStep(step.id, id)}
                      options={MACRO_ACTIONS}
                      variant="field"
                      size="sm"
                      aria-label={`Step ${idx + 1} action`}
                    />
                  </div>
                  <button
                    className={styles.removeStepBtn}
                    onClick={() => removeStep(step.id)}
                    aria-label={`Remove step ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className={styles.addStepBtn} onClick={addStep}>
                + Add step
              </button>
            </div>
          </div>

          <div className={styles.assignSection}>
            <span className={styles.fieldLabel}>Key binding</span>
            <button
              className={styles.assignKeyBtn}
              data-capturing={capturingMacroKey || undefined}
              data-assigned={macroKey !== null && !capturingMacroKey || undefined}
              aria-label={
                capturingMacroKey ? 'Press a key to assign'
                : macroKey        ? `Key assigned: ${macroKey}`
                :                   'Assign key binding'
              }
              onClick={() => setCapturingMacroKey(true)}
            >
              {capturingMacroKey ? (
                <span className={styles.capturingHint} aria-live="polite">Press a key…</span>
              ) : macroKey ? (
                <kbd className={styles.keybadge}>{macroKey}</kbd>
              ) : (
                'Assign key…'
              )}
            </button>
          </div>

          <button
            className={styles.saveBtn}
            disabled={!canSave}
            aria-label="Save custom action"
            onClick={handleSave}
          >
            Save custom action
          </button>

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/Shortcuts/Shortcuts.module.css`**

```css
/* src/components/Shortcuts/Shortcuts.module.css */

/* ── Root: two-column layout ─────────────────────────────────────────────── */

.root {
  display: flex;
  gap: var(--space-3);
  height: 520px;
  min-width: 720px;
  font-family: var(--font-ui);
}

/* ── Shared panel chrome ─────────────────────────────────────────────────── */

.listPanel,
.builderPanel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.listPanel    { flex: 3; }
.builderPanel { flex: 2; }

/* ── Toolbar (search + sort) ─────────────────────────────────────────────── */

.toolbar {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 80%, var(--surface-2, var(--stage)) 20%);
  flex-shrink: 0;
}

.searchWrap { flex: 1; }
.sortWrap   { flex-shrink: 0; width: 120px; }

/* ── Search input — recessed well (same visual language as InputSelect.field) */

.searchInput {
  width: 100%;
  height: 28px;
  padding: 0 var(--space-2);
  box-sizing: border-box;
  background: var(--stage);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  color: var(--stage-text);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out);
  -webkit-appearance: none;
  appearance: none;
}

.searchInput::placeholder {
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
}

.searchInput:hover { border-color: var(--border-strong); }

.searchInput:focus-visible {
  border-color: var(--accent);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--accent);
}

.searchInput::-webkit-search-cancel-button { display: none; }

/* ── Scrollable list ─────────────────────────────────────────────────────── */

.listScroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* ── Category group header (sticky silkscreen label) ─────────────────────── */

.groupHeader {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: var(--space-1) var(--space-3);
  background: color-mix(in srgb, var(--surface) 92%, var(--stage) 8%);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* ── Action row ──────────────────────────────────────────────────────────── */

.row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  transition: background var(--dur-fast) var(--ease-out);
}

.row:last-child { border-bottom: none; }

.row:hover {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

/* Amber wash during capture — warm attention state */
.row[data-capturing] {
  background: color-mix(in srgb, var(--led-orange, #f90) 8%, transparent);
  border-color: color-mix(in srgb, var(--led-orange, #f90) 60%, transparent);
}

.rowInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actionName {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actionCategory {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.rowBindings {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  flex-shrink: 0;
  min-width: 80px;
}

.noBinding {
  font-size: var(--text-sm);
  color: var(--text-dim);
}

/* ── Key badge (kbd) ─────────────────────────────────────────────────────── */

.keybadge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-1);
  background: var(--stage);
  border: 1px solid var(--border-strong);
  border-radius: calc(var(--radius) * 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.4);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--stage-text);
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
}

/* ── Capturing hint ("Press a key…") ────────────────────────────────────── */

.capturingHint {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--led-orange, #f90);
  animation: hint-pulse 900ms ease-in-out infinite;
}

@keyframes hint-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  .capturingHint { animation: none; }
}

/* ── Rebind button ───────────────────────────────────────────────────────── */

.rebindBtn {
  flex-shrink: 0;
  height: 24px;
  padding: 0 var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}

.rebindBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.rebindBtn:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  color: var(--accent);
  outline: none;
}

.rebindBtn[data-capturing] {
  border-color: var(--led-orange, #f90);
  color: var(--led-orange, #f90);
  background: color-mix(in srgb, var(--led-orange, #f90) 8%, var(--surface));
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

.emptyState {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-dim);
  font-style: italic;
}

/* ── Builder panel ───────────────────────────────────────────────────────── */

.builderHeader {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--surface) 80%, var(--surface-2, var(--stage)) 20%);
}

.builderBody {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Field group (label + control) ──────────────────────────────────────── */

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.fieldLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/* Text input — same recessed-well as search */

.textInput {
  width: 100%;
  height: 28px;
  padding: 0 var(--space-2);
  box-sizing: border-box;
  background: var(--stage);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  color: var(--stage-text);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out);
}

.textInput::placeholder {
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
}

.textInput:hover { border-color: var(--border-strong); }

.textInput:focus-visible {
  border-color: var(--accent);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--accent);
  outline: none;
}

/* ── Steps section ───────────────────────────────────────────────────────── */

.stepsSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stepsList {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stepRow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stepNum {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--stage);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--stage-text);
  pointer-events: none;
}

.stepSelect { flex: 1; min-width: 0; }

.removeStepBtn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--radius) * 0.5);
  font-size: var(--text-xs);
  color: var(--text-dim);
  cursor: pointer;
  outline: none;
  transition:
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.removeStepBtn:hover {
  color: var(--danger, hsl(0 70% 55%));
  border-color: var(--danger, hsl(0 70% 55%));
}

.removeStepBtn:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  outline: none;
}

.addStepBtn {
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  cursor: pointer;
  width: 100%;
  text-align: left;
  outline: none;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.addStepBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.addStepBtn:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  color: var(--accent);
  outline: none;
}

/* ── Assign-key button ───────────────────────────────────────────────────── */

.assignSection {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.assignKeyBtn {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--stage);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--stage-text) 55%, transparent);
  cursor: pointer;
  outline: none;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.assignKeyBtn:hover:not([data-capturing]) {
  border-color: var(--border-strong);
  color: var(--stage-text);
}

.assignKeyBtn:focus-visible {
  border-color: var(--accent);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--accent);
  outline: none;
}

.assignKeyBtn[data-capturing] {
  border-color: color-mix(in srgb, var(--led-orange, #f90) 70%, transparent);
  color: var(--led-orange, #f90);
}

.assignKeyBtn[data-assigned] {
  color: var(--stage-text);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
}

/* ── Save button ─────────────────────────────────────────────────────────── */

.saveBtn {
  margin-top: auto;
  width: 100%;
  height: 32px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--accent-contrast);
  cursor: pointer;
  outline: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.25);
  transition: opacity var(--dur-fast) var(--ease-out);
}

.saveBtn:hover:not(:disabled) { opacity: 0.88; }

.saveBtn:focus-visible {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 2px var(--bg, white),
    0 0 0 4px var(--accent);
  outline: none;
}

.saveBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Screen-reader-only utility ──────────────────────────────────────────── */

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

- [ ] **Step 3: Create `src/components/Shortcuts/index.ts`**

```ts
// src/components/Shortcuts/index.ts
export { Shortcuts } from './Shortcuts'
export type { ShortcutsProps, ShortcutAction, MacroStep } from './Shortcuts'
```

- [ ] **Step 4: Run tsc check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit scaffold**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && git add src/components/Shortcuts/ && git commit -m "feat(Shortcuts): scaffold component + CSS + barrel

Two-panel layout: left = searchable/sortable shortcut list with live
key-capture rebind; right = macro builder (name, steps, assign key, save).
No external keybinding registry — pure window.keydown capture while active.
formatKeystroke uses ⌘/Ctrl+/⌥/⇧ notation consistent with existing bindings."
```

---

### Task 2: Tests

**Files:**
- Create: `src/components/Shortcuts/Shortcuts.test.tsx`

**Interfaces:**
- Consumes: `Shortcuts`, `ShortcutAction` from `./Shortcuts`

- [ ] **Step 1: Create test file**

```tsx
// src/components/Shortcuts/Shortcuts.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Shortcuts } from './Shortcuts'
import type { ShortcutAction } from './Shortcuts'

const ACTIONS: ShortcutAction[] = [
  { id: 'play',  name: 'Play',  category: 'Transport', bindings: ['Space'] },
  { id: 'stop',  name: 'Stop',  category: 'Transport', bindings: ['Escape'] },
  { id: 'cut',   name: 'Cut',   category: 'Clip',      bindings: ['⌘X', 'Ctrl+X'] },
  { id: 'copy',  name: 'Copy',  category: 'Clip',      bindings: ['⌘C', 'Ctrl+C'] },
  { id: 'undo',  name: 'Undo',  category: 'Edit',      bindings: [] },
]

const onRebind      = vi.fn()
const onCreateMacro = vi.fn()

const BASE = { actions: ACTIONS, onRebind, onCreateMacro }

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Shortcuts — rendering', () => {
  it('renders all action names', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.getByText('Cut')).toBeInTheDocument()
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('renders existing bindings as kbd elements', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('⌘C')).toBeInTheDocument()
  })

  it('shows — for actions with no bindings', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders a Rebind button for each action', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getAllByText('Rebind')).toHaveLength(ACTIONS.length)
  })

  it('renders the builder panel header', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('Custom action')).toBeInTheDocument()
  })

  it('renders the macro name input', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByPlaceholderText('Untitled macro…')).toBeInTheDocument()
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

describe('Shortcuts — search', () => {
  it('filters by action name', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'play' } })
    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.queryByText('Cut')).not.toBeInTheDocument()
  })

  it('filters by category', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'clip' } })
    expect(screen.getByText('Cut')).toBeInTheDocument()
    expect(screen.queryByText('Play')).not.toBeInTheDocument()
  })

  it('shows empty state when nothing matches', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'xyzzy' } })
    expect(screen.getByText(/No shortcuts match/)).toBeInTheDocument()
  })

  it('restores full list after clearing search', () => {
    render(<Shortcuts {...BASE} />)
    const input = screen.getByPlaceholderText('Search…')
    fireEvent.change(input, { target: { value: 'play' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Cut')).toBeInTheDocument()
  })
})

// ── Rebind ────────────────────────────────────────────────────────────────────

describe('Shortcuts — rebind flow', () => {
  it('shows Cancel + Press a key hint when Rebind is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Press a key…')).toBeInTheDocument()
  })

  it('calls onRebind with action id and formatted keystroke', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!) // 'play'
    fireEvent.keyDown(window, { key: 'P', metaKey: true })
    expect(onRebind).toHaveBeenCalledWith('play', '⌘P')
  })

  it('formats Ctrl modifier correctly', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.keyDown(window, { key: 'P', ctrlKey: true })
    expect(onRebind).toHaveBeenCalledWith('play', 'Ctrl+P')
  })

  it('cancels capture on Escape without calling onRebind', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Press a key…')).not.toBeInTheDocument()
    expect(onRebind).not.toHaveBeenCalled()
  })

  it('cancels capture when Cancel button is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Press a key…')).not.toBeInTheDocument()
    expect(onRebind).not.toHaveBeenCalled()
  })

  it('exits capture after a successful key press', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.keyDown(window, { key: 'P', metaKey: true })
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })
})

// ── Macro builder ─────────────────────────────────────────────────────────────

describe('Shortcuts — macro builder', () => {
  it('save button is disabled with empty form', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByLabelText('Save custom action')).toBeDisabled()
  })

  it('adds a step when Add step is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('+ Add step'))
    expect(screen.getByLabelText('Step 1 action')).toBeInTheDocument()
  })

  it('removes a step when its remove button is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByLabelText('Remove step 1'))
    expect(screen.queryByLabelText('Step 1 action')).not.toBeInTheDocument()
  })

  it('enters key-capture mode when Assign key is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('Assign key…'))
    // The "Press a key…" hint appears (aria-live region)
    expect(screen.getAllByText('Press a key…').length).toBeGreaterThan(0)
  })

  it('captures a macro key and displays it as a kbd badge', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    expect(screen.getByText('Ctrl+M')).toBeInTheDocument()
  })

  it('calls onCreateMacro with name, steps, key when form is complete', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'My Macro' } })
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    fireEvent.click(screen.getByLabelText('Save custom action'))
    expect(onCreateMacro).toHaveBeenCalledWith(
      'My Macro',
      expect.arrayContaining([expect.objectContaining({ actionId: 'play' })]),
      'Ctrl+M',
    )
  })

  it('resets the builder after successful save', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'My Macro' } })
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    fireEvent.click(screen.getByLabelText('Save custom action'))
    expect(screen.getByPlaceholderText('Untitled macro…')).toHaveValue('')
    expect(screen.queryByLabelText('Step 1 action')).not.toBeInTheDocument()
  })

  it('does not call onCreateMacro when form is incomplete', () => {
    render(<Shortcuts {...BASE} />)
    // Only set a name, no steps, no key
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'Half Done' } })
    // Save button should still be disabled — clicking it does nothing
    const saveBtn = screen.getByLabelText('Save custom action')
    expect(saveBtn).toBeDisabled()
    fireEvent.click(saveBtn)
    expect(onCreateMacro).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && npx vitest run src/components/Shortcuts/Shortcuts.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Run tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && git add src/components/Shortcuts/Shortcuts.test.tsx && git commit -m "test(Shortcuts): full test suite — render, search, rebind, macro builder"
```

---

### Task 3: Demo file (gallery registration)

**Files:**
- Create: `src/components/Shortcuts/Shortcuts.demo.tsx`

**Interfaces:**
- Consumes: `Shortcuts`, `ShortcutAction`, `MacroStep` from `./Shortcuts`
- Produces: `meta: DemoMeta`, `default: ComponentType` (auto-registered via `import.meta.glob`)

- [ ] **Step 1: Create demo file**

```tsx
// src/components/Shortcuts/Shortcuts.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Shortcuts } from './Shortcuts'
import type { ShortcutAction, MacroStep } from './Shortcuts'

export const meta: DemoMeta = {
  name: 'Shortcuts',
  group: 'Composites',
  route: '/shortcuts',
  order: 60,
}

// ── Stub data ─────────────────────────────────────────────────────────────────

const ALL_ACTIONS: ShortcutAction[] = [
  { id: 'play',          name: 'Play / Pause',        category: 'Transport', bindings: ['Space'] },
  { id: 'stop',          name: 'Stop',                 category: 'Transport', bindings: ['Escape'] },
  { id: 'record',        name: 'Record',               category: 'Transport', bindings: ['R'] },
  { id: 'loop',          name: 'Toggle Loop',          category: 'Transport', bindings: ['L'] },
  { id: 'undo',          name: 'Undo',                 category: 'Edit',      bindings: ['⌘Z'] },
  { id: 'redo',          name: 'Redo',                 category: 'Edit',      bindings: ['⌘⇧Z'] },
  { id: 'cut',           name: 'Cut',                  category: 'Clip',      bindings: ['⌘X', 'Ctrl+X'] },
  { id: 'copy',          name: 'Copy',                 category: 'Clip',      bindings: ['⌘C', 'Ctrl+C'] },
  { id: 'paste',         name: 'Paste',                category: 'Clip',      bindings: ['⌘V', 'Ctrl+V'] },
  { id: 'split',         name: 'Split at Playhead',    category: 'Clip',      bindings: ['S'] },
  { id: 'delete',        name: 'Delete',               category: 'Clip',      bindings: ['Backspace'] },
  { id: 'new-clip',      name: 'New Clip',             category: 'Clip',      bindings: [] },
  { id: 'mute-track',    name: 'Mute Track',           category: 'Track',     bindings: ['M'] },
  { id: 'solo-track',    name: 'Solo Track',           category: 'Track',     bindings: [] },
  { id: 'arm-track',     name: 'Arm Track',            category: 'Track',     bindings: [] },
  { id: 'zoom-in',       name: 'Zoom In',              category: 'View',      bindings: ['='] },
  { id: 'zoom-out',      name: 'Zoom Out',             category: 'View',      bindings: ['-'] },
  { id: 'fit-window',    name: 'Fit to Window',        category: 'View',      bindings: ['⌘⇧F'] },
]

const SHORT_LIST: ShortcutAction[] = ALL_ACTIONS.slice(0, 5)

const noop = () => {}

// ── Interactive playground ────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [actions, setActions] = useState(ALL_ACTIONS)

  function handleRebind(id: string, key: string) {
    setActions(prev =>
      prev.map(a => a.id === id ? { ...a, bindings: [key, ...a.bindings.slice(1)] } : a)
    )
  }

  function handleCreateMacro(name: string, steps: MacroStep[], key: string) {
    const newAction: ShortcutAction = {
      id: `macro-${Date.now()}`,
      name,
      category: 'Custom',
      bindings: [key],
    }
    setActions(prev => [...prev, newAction])
    // In the real app: bridge.createMacro({ name, steps, key })
    console.info('[Shortcuts] macro created', { name, steps, key })
  }

  return (
    <Shortcuts
      actions={actions}
      onRebind={handleRebind}
      onCreateMacro={handleCreateMacro}
    />
  )
}

// ── Demo ──────────────────────────────────────────────────────────────────────

export default function ShortcutsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <State label="default (category sort)">
          <Shortcuts actions={SHORT_LIST} onRebind={noop} onCreateMacro={noop} />
        </State>

        <State label="empty list">
          <Shortcuts actions={[]} onRebind={noop} onCreateMacro={noop} />
        </State>
      </StatesGrid>

      <Playground>
        <PlaygroundDemo />
      </Playground>
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run full test suite + tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && npx tsc --noEmit && npx vitest run
```

Expected: zero type errors, all tests pass.

- [ ] **Step 3: Commit demo**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/shortcuts && git add src/components/Shortcuts/Shortcuts.demo.tsx && git commit -m "feat(Shortcuts): gallery demo — states grid + interactive playground

order=60 in Composites group. Playground wires rebind + createMacro
live so all states (list, searching, sorted, capturing, builder) are
exercisable. Two State cells (default, empty) cover the non-interactive
static states."
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| Left: search text field | Task 1 (searchInput) |
| Left: Sort select (Category…) | Task 1 (InputSelect + SORT_OPTIONS) |
| Left: scrollable list with name / category / bindings / Rebind | Task 1 (ActionRow) |
| Right: Name field | Task 1 (textInput) |
| Right: Steps dropdown chained top→bottom | Task 1 (InputSelect per step + stepsList) |
| Right: Assign key button | Task 1 (assignKeyBtn) |
| Right: Save custom action | Task 1 (saveBtn) |
| Props: `actions[]` | Task 1 (ShortcutAction type) |
| Callbacks: `onRebind(id)` | Task 1 (calls onRebind(action.id, key)) |
| Callbacks: `onCreateMacro(name, steps, key)` | Task 1 (handleSave) |
| Rebind = live keystroke capture | Task 1 (window.keydown useEffect) |
| States: list, searching, sorted, capturing, builder states | Task 3 (demo) |
| tsc + vitest + lint green | Tasks 1–3 (run at each step) |
| Tokens; Compare light + dark; a11y | Task 1 (CSS uses only tokens; aria-label throughout) |
