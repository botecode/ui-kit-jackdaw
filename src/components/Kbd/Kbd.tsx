// src/components/Kbd/Kbd.tsx
import styles from './Kbd.module.css'

// ── Platform detection ──────────────────────────────────────────────────────

function detectPlatform(): 'mac' | 'win' {
  if (typeof navigator === 'undefined') return 'mac'
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? 'mac' : 'win'
}

// ── Key-to-glyph maps ───────────────────────────────────────────────────────

const MAC_MAP: Record<string, string> = {
  Meta:       '⌘',
  Shift:      '⇧',
  Alt:        '⌥',
  Control:    '⌃',
  Enter:      '⏎',
  Return:     '⏎',
  Backspace:  '⌫',
  Delete:     '⌦',
  Escape:     '⎋',
  Tab:        '⇥',
  ArrowUp:    '↑',
  ArrowDown:  '↓',
  ArrowLeft:  '←',
  ArrowRight: '→',
  ' ':        'Space',
  Space:      'Space',
}

const WIN_MAP: Record<string, string> = {
  Meta:       'Win',
  Shift:      'Shift',
  Alt:        'Alt',
  Control:    'Ctrl',
  Enter:      'Enter',
  Return:     'Enter',
  Backspace:  'Bksp',
  Delete:     'Del',
  Escape:     'Esc',
  Tab:        'Tab',
  ArrowUp:    '↑',
  ArrowDown:  '↓',
  ArrowLeft:  '←',
  ArrowRight: '→',
  ' ':        'Space',
  Space:      'Space',
}

// Glyph → spoken name for aria-label
const SPOKEN: Record<string, string> = {
  '⌘': 'Command',
  '⇧': 'Shift',
  '⌥': 'Option',
  '⌃': 'Control',
  '⏎': 'Return',
  '⌫': 'Backspace',
  '⌦': 'Delete',
  '⎋': 'Escape',
  '⇥': 'Tab',
  '↑': 'Up',
  '↓': 'Down',
  '←': 'Left',
  '→': 'Right',
}

// ── Binding string parser ────────────────────────────────────────────────────

const MODIFIER_GLYPHS = new Set(['⌘', '⇧', '⌥', '⌃'])

/** Split '⌘⇧Z', 'Ctrl+X', 'Space', 'Backspace' → array of tokens */
function parseBinding(binding: string): string[] {
  if (!binding) return []
  if (binding.includes('+')) return binding.split('+').filter(Boolean)
  const tokens: string[] = []
  let i = 0
  while (i < binding.length) {
    const ch = binding[i]!
    if (MODIFIER_GLYPHS.has(ch)) {
      tokens.push(ch)
      i++
    } else {
      tokens.push(binding.slice(i))
      break
    }
  }
  return tokens.filter(Boolean)
}

// ── Key label resolver ───────────────────────────────────────────────────────

/** Map a raw key name or display token to the platform's display string */
function resolveLabel(key: string, platform: 'mac' | 'win'): string {
  const map = platform === 'mac' ? MAC_MAP : WIN_MAP
  return map[key] ?? (key.length === 1 ? key.toUpperCase() : key)
}

// ── Component ────────────────────────────────────────────────────────────────

export interface KbdProps {
  /** Raw KeyboardEvent.key names, e.g. ['Meta', 'Shift', 'Z'] */
  keys?: string[]
  /** Pre-formatted binding string, e.g. '⌘⇧Z' or 'Ctrl+X' or 'Space' */
  binding?: string
  size?: 'sm' | 'md'
  /** Override platform detection (useful in tests or SSR) */
  platform?: 'mac' | 'win'
}

export function Kbd({ keys, binding, size = 'md', platform }: KbdProps) {
  const plt = platform ?? detectPlatform()

  let caps: string[]
  if (keys !== undefined) {
    caps = keys.map(k => resolveLabel(k, plt))
  } else if (binding !== undefined) {
    caps = parseBinding(binding).map(t => resolveLabel(t, plt))
  } else {
    caps = []
  }

  const spoken = caps.map(c => SPOKEN[c] ?? c).join(' ')

  if (caps.length === 0) {
    return (
      <span
        className={styles.root}
        data-size={size}
        data-unbound
        role="img"
        aria-label="Unbound"
      >
        <span className={styles.unbound} aria-hidden="true">—</span>
      </span>
    )
  }

  return (
    <span className={styles.root} data-size={size} role="img" aria-label={spoken}>
      {caps.map((cap, i) => (
        <kbd key={i} className={styles.cap} aria-hidden="true">{cap}</kbd>
      ))}
    </span>
  )
}
