// src/components/MobileTabBar/MobileTabBar.tsx
import { useRef } from 'react'
import styles from './MobileTabBar.module.css'

// ── Glyph contract ──────────────────────────────────────────────────────────────
// Bespoke audio/app glyphs are custom inline SVG (KIT-LEAD §3) — never the Phosphor
// barrel — so the bottom chrome carries the instrument's own hand-drawn vocabulary.

export type MobileTabGlyph = React.ComponentType<{ size?: number }>

// ── Types ───────────────────────────────────────────────────────────────────────

export interface MobileTab {
  /** Stable identity — the value passed back to onSelect and matched against `active`. */
  id:    string
  /** Visible label under the glyph + the button's accessible name. */
  label: string
  /** Custom inline-SVG glyph drawn in currentColor. */
  icon:  MobileTabGlyph
  /** Surface temporarily unavailable (e.g. Radio offline) — dimmed, not selectable, skipped by roving. */
  disabled?: boolean
}

export interface MobileTabBarProps {
  /** The row of pressable destinations (Compose: Row of pressable items). */
  tabs:      MobileTab[]
  /** id of the current destination — drives the moving lit indicator. */
  active:    string
  /** Fired with the tapped tab's id (the real navigation intent). */
  onSelect:  (id: string) => void
  /** md (default) = comfortable handset bar · sm = compact. */
  size?:     'sm' | 'md'
  /** Landmark name for the bottom navigation. */
  'aria-label'?: string
}

// ── Bespoke glyphs (24×24, currentColor, ~1.75 stroke) ──────────────────────────

/** Record — concentric ring around a solid dot. */
export function RecordGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  )
}

/** Write — a pen nib over the baseline. */
export function WriteGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.25 8.5 13.5h7L12 3.25Z"
        stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"
      />
      <path d="M12 13.5v3.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="9.5" r="1.1" fill="currentColor" />
      <path d="M6 20.25h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

/** Nest — the jackdaw's home: a woven bowl cradling a clutch of eggs. */
export function NestGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12.5c1.6 4 5 6 9 6s7.4-2 9-6"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M5 12.25c2.2-1.1 4.6-1.6 7-1.6s4.8.5 7 1.6"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="9" cy="11.25" r="1.6" fill="currentColor" />
      <circle cx="12.4" cy="10.4" r="1.6" fill="currentColor" />
      <circle cx="15.7" cy="11.25" r="1.6" fill="currentColor" />
    </svg>
  )
}

/** Radio — a broadcast point throwing two transmission arcs. */
export function RadioGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="14" r="2.25" fill="currentColor" />
      <path
        d="M8.1 10.1a5.5 5.5 0 0 0 0 7.8M15.9 10.1a5.5 5.5 0 0 1 0 7.8"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      />
      <path
        d="M5.6 7.6a9 9 0 0 0 0 12.8M18.4 7.6a9 9 0 0 1 0 12.8"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.5"
      />
    </svg>
  )
}

/** The canonical four — Record · Write · Nest · Radio. Exported for the app to drop in. */
export const MOBILE_TABS: MobileTab[] = [
  { id: 'record', label: 'Record', icon: RecordGlyph },
  { id: 'write',  label: 'Write',  icon: WriteGlyph },
  { id: 'nest',   label: 'Nest',   icon: NestGlyph },
  { id: 'radio',  label: 'Radio',  icon: RadioGlyph },
]

// ── Component ─────────────────────────────────────────────────────────────────
// The mobile app's bottom navigation, built as hardware: a recessed warm-cream
// shelf holding a row of pressable destinations, with a single lavender LED pill
// that physically slides to the active tab and blooms behind its glyph. Pressing
// a tab sinks it into the shelf (the pill deepens, the glyph drops 1px) so a tap
// feels like depressing a real button, not tinting a div. The bar reserves the
// device's home-indicator safe area as a bottom inset so it floats clear of the
// handset chin.
//
// Why this isn't a webpage: a web app paints a flat bottom bar with a colored
// underline or a filled icon and calls the active state done. This is the kit's
// recessed-shelf + LED-bloom idiom instead — the same warm surface, hairline
// top-highlight and incandescent lit-on timing every control on the shelf is
// built from — so the active pill reads as a lit hardware button sliding under
// glass, and the whole bar reskins through every theme by swapping tokens, never
// a hardcoded color.
//
// A11y model: a `nav` landmark of relabel-free buttons, current destination marked
// with `aria-current="page"` (the established kit nav pattern — NavRail). NOT an
// ARIA tablist: these switch whole app sections, not panels within a view, so
// tablist/tabpanel would be the wrong (and trap-prone) semantics. Decision recorded
// here per KIT-LEAD §6 (pick the most Chroma-consistent option, state the assumption).

export function MobileTabBar({
  tabs,
  active,
  onSelect,
  size = 'md',
  'aria-label': ariaLabel = 'Primary',
}: MobileTabBarProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const activeIndex = tabs.findIndex(t => t.id === active)

  // Roving focus across the row (focus only — selection stays on click / Enter /
  // Space so arrow-scanning never yanks the app between surfaces). Disabled tabs
  // are skipped. Home/End jump to the ends.
  function focusButton(current: HTMLButtonElement, target: 'next' | 'prev' | 'first' | 'last') {
    const row = listRef.current
    if (!row) return
    const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
    if (buttons.length === 0) return
    const idx = buttons.indexOf(current)
    if (idx === -1) return
    const next =
      target === 'next'  ? buttons[(idx + 1) % buttons.length] :
      target === 'prev'  ? buttons[(idx - 1 + buttons.length) % buttons.length] :
      target === 'first' ? buttons[0] :
                           buttons[buttons.length - 1]
    next?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if      (e.key === 'ArrowRight') { e.preventDefault(); focusButton(e.currentTarget, 'next')  }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); focusButton(e.currentTarget, 'prev')  }
    else if (e.key === 'Home')       { e.preventDefault(); focusButton(e.currentTarget, 'first') }
    else if (e.key === 'End')        { e.preventDefault(); focusButton(e.currentTarget, 'last')  }
  }

  return (
    <nav className={styles.bar} data-size={size} aria-label={ariaLabel}>
      <div
        ref={listRef}
        className={styles.row}
        style={{ '--tab-count': tabs.length } as React.CSSProperties}
      >
        {tabs.map(tab => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              className={styles.item}
              data-active={isActive || undefined}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              disabled={tab.disabled}
              onClick={() => { if (!tab.disabled) onSelect(tab.id) }}
              onKeyDown={handleKeyDown}
            >
              <span className={styles.glyph}>
                <Icon size={size === 'sm' ? 20 : 24} />
              </span>
              <span className={styles.label}>{tab.label}</span>
            </button>
          )
        })}

        {/* Moving lit indicator — rendered last so the active button's :active state
            can deepen the pill via the sibling (~) selector; painted behind via z-index. */}
        <span
          className={styles.indicator}
          data-visible={activeIndex >= 0 || undefined}
          style={{ '--active-index': Math.max(activeIndex, 0) } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className={styles.pill} />
        </span>
      </div>
    </nav>
  )
}
