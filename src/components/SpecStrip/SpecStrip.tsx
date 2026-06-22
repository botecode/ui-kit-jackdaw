// src/components/SpecStrip/SpecStrip.tsx
import styles from './SpecStrip.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SpecItem {
  /** The headline readout — a stat ("100%", "48kHz") or a terse phrase ("peer-to-peer"). */
  value: string
  /** Optional caption beneath the value (e.g. "native audio"). Omit for terse phrases. */
  label?: string
}

export interface SpecStripProps {
  /** The stat / phrase items, left-to-right. */
  items: SpecItem[]
  size?: 'sm' | 'md'
  /** Accessible name for the readout band. Defaults to "Specifications". */
  'aria-label'?: string
}

// ── Component ───────────────────────────────────────────────────────────────────
// A hardware spec plate: a row of terse stats/phrases in mono readout type,
// sunk into a recessed stage well and divided by etched hairlines. Reads like
// the spec etched on the back panel of an instrument.
//
// Why this isn't a webpage: a web "feature row" is flat text separated by dots
// or pipes on a card. This is a recessed readout window — the band sits in the
// stage groove, the stats are Space Mono phosphor on dark, and the dividers are
// etched 1px hairlines revealed through a true-grid gap (so they align into a
// clean spec sheet when the band wraps, never a stray pipe at a row edge). It
// reflows by dropping columns — no clipping, no scrollbar.

export function SpecStrip({ items, size = 'md', 'aria-label': ariaLabel = 'Specifications' }: SpecStripProps) {
  if (items.length === 0) {
    return (
      <div className={styles.root} data-size={size} data-empty>
        <span className={styles.placeholder} aria-hidden="true">—</span>
      </div>
    )
  }

  return (
    <div className={styles.root} data-size={size}>
      <ul className={styles.grid} aria-label={ariaLabel}>
        {items.map((item, i) => (
          <li key={i} className={styles.item} data-phrase={item.label ? undefined : true}>
            <span className={styles.value}>{item.value}</span>
            {item.label && <span className={styles.label}>{item.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
