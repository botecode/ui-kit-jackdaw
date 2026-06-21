// src/components/Shortcuts/Shortcuts.tsx
import { useEffect, useId, useState } from 'react'
import styles from './Shortcuts.module.css'
import { InputSelect } from '../InputSelect'
import type { InputSelectOption } from '../InputSelect'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns null for bare modifier keypresses; otherwise compact notation
// ⌘P, Ctrl+M, ⌘⇧Z, ⌥F4
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
