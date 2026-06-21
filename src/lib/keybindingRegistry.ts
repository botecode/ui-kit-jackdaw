// src/lib/keybindingRegistry.ts
// Global keybinding registry. Components register their actions here so they
// appear in the Shortcuts preferences panel and are rebindable at runtime.

export interface KeybindingEntry {
  id: string
  name: string
  category: string
  defaultBindings: string[]
}

const _registered = new Map<string, KeybindingEntry>()
const _overrides   = new Map<string, string[]>()
const _listeners   = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

/** Register a batch of actions. Returns a cleanup function that unregisters them. */
export function registerActions(actions: KeybindingEntry[]): () => void {
  for (const a of actions) _registered.set(a.id, a)
  _notify()
  return () => {
    for (const a of actions) {
      _registered.delete(a.id)
      _overrides.delete(a.id)
    }
    _notify()
  }
}

/** Override the bindings for a single action (user rebind). */
export function rebind(actionId: string, key: string): void {
  _overrides.set(actionId, [key])
  _notify()
}

/** Current bindings for an action (override if set, else defaults). */
export function getBindings(actionId: string): string[] {
  return _overrides.get(actionId) ?? _registered.get(actionId)?.defaultBindings ?? []
}

/** All registered actions with their current (possibly rebound) bindings. */
export function getAllActions(): Array<KeybindingEntry & { bindings: string[] }> {
  return [..._registered.values()].map(a => ({ ...a, bindings: getBindings(a.id) }))
}

/** Subscribe to registry changes. Returns unsubscribe function. */
export function subscribe(fn: () => void): () => void {
  _listeners.add(fn)
  return () => { _listeners.delete(fn) }
}

/** Test-only: clear all registrations and overrides. */
export function clearAll(): void {
  _registered.clear()
  _overrides.clear()
  _notify()
}

// ── Key-event formatting ──────────────────────────────────────────────────────

export interface KeyEvent {
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  key: string
}

/**
 * Format a key event to the compact notation used by this registry
 * (⌘ArrowUp, ⇧Z, Ctrl+M, …). Returns null for bare modifier presses.
 */
export function formatKeyEvent(e: KeyEvent): string | null {
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

/** Returns true if the key event matches any current binding for the action. */
export function matchesAction(actionId: string, e: KeyEvent): boolean {
  const formatted = formatKeyEvent(e)
  if (formatted === null) return false
  return getBindings(actionId).includes(formatted)
}
